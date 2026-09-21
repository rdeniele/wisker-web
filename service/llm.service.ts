/**
 * LLM provider layer with automatic fallback.
 *
 * Chat / vision completions go to each configured provider in order
 * (AI_PROVIDER_ORDER, default "together,gemini"). If a provider fails (out of
 * budget, rate-limited, down) the request moves on to the next one, so a spent
 * Together AI balance doesn't take the app down.
 *
 * Both providers speak the OpenAI chat-completions format; Gemini via its
 * OpenAI-compatible endpoint. Embeddings are NOT handled here: vectors from
 * different models can't be mixed in the same pgvector index.
 *
 * Env:
 *   TOGETHER_API_KEY, TOGETHER_AI_MODEL, TOGETHER_AI_VISION_MODEL
 *   GEMINI_API_KEY, GEMINI_MODEL, GEMINI_VISION_MODEL, GEMINI_REASONING_EFFORT
 *   AI_PROVIDER_ORDER  e.g. "together,gemini" (default) or "gemini,together"
 */

import { AIProcessingError } from "@/lib/errors";

export type LLMProviderName = "together" | "gemini";

export interface LLMContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | LLMContentPart[];
}

export interface LLMRequestOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  /** "vision" picks the multimodal model for each provider. Default "text". */
  purpose?: "text" | "vision";
  /**
   * Together-only settings. The sampling knobs and stop tokens are specific to
   * the open models Together hosts and are rejected or meaningless elsewhere,
   * so they are never sent to Gemini.
   */
  together?: {
    model?: string;
    topK?: number;
    repetitionPenalty?: number;
    stop?: string[];
  };
}

interface ProviderConfig {
  name: LLMProviderName;
  baseURL: string;
  apiKey: string;
  model: string;
}

const REQUEST_TIMEOUT_MS = 120_000;
const RETRY_BASE_DELAY_MS = 1000;
// Retries per provider: keep it short when there is another provider to fall
// back to, be patient when this is the last option.
const RETRIES_WHEN_FALLBACK_AVAILABLE = 1;
const RETRIES_WHEN_LAST_PROVIDER = 3;
// 401/402/403 mean "this key/account can't be used right now" (bad key, no
// credit, spend limit). Skip the provider for a while instead of paying a
// failed round-trip on every request.
const UNUSABLE_STATUSES = new Set([401, 402, 403]);
const UNUSABLE_COOLDOWN_MS = 10 * 60 * 1000;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_INLINE_IMAGE_BYTES = 15 * 1024 * 1024;

const GENERIC_UNAVAILABLE =
  "The AI service is temporarily unavailable. Please try again in a few minutes.";

/** Per-instance memory of providers that recently refused us (402 etc.). */
const cooldownUntil: Partial<Record<LLMProviderName, number>> = {};

class ProviderRequestError extends Error {
  constructor(
    public provider: LLMProviderName,
    /** HTTP status, or null for network errors / timeouts / empty replies. */
    public status: number | null,
    message: string,
    public retryable: boolean,
  ) {
    super(message);
    this.name = "ProviderRequestError";
  }
}

function getProviders(
  purpose: "text" | "vision",
  togetherModel?: string,
): ProviderConfig[] {
  const together: ProviderConfig = {
    name: "together",
    baseURL: process.env.TOGETHER_BASE_URL || "https://api.together.xyz/v1",
    apiKey: process.env.TOGETHER_API_KEY || "",
    model:
      togetherModel ||
      (purpose === "vision"
        ? process.env.TOGETHER_AI_VISION_MODEL || "Qwen/Qwen3.5-9B"
        : process.env.TOGETHER_AI_MODEL ||
          "meta-llama/Llama-3.3-70B-Instruct-Turbo"),
  };

  const geminiText = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const gemini: ProviderConfig = {
    name: "gemini",
    baseURL:
      process.env.GEMINI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: process.env.GEMINI_API_KEY || "",
    model:
      purpose === "vision"
        ? process.env.GEMINI_VISION_MODEL || geminiText
        : geminiText,
  };

  const byName = { together, gemini };
  const order = (process.env.AI_PROVIDER_ORDER || "together,gemini")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is LLMProviderName => s in byName);

  return [...new Set(order)].map((n) => byName[n]).filter((p) => p.apiKey);
}

/** Pull a readable message out of Together ({error:{...}}) or Gemini ([{error:{...}}]) bodies. */
function extractErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body);
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    const message = first?.error?.message ?? first?.message;
    if (typeof message === "string" && message) return message;
  } catch {
    // not JSON
  }
  return body.slice(0, 200) || "Unknown error";
}

/** Gemini's OpenAI endpoint wants inline base64 images; fetch remote ones ourselves. */
async function inlineRemoteImages(
  messages: LLMMessage[],
): Promise<LLMMessage[]> {
  return Promise.all(
    messages.map(async (message) => {
      if (typeof message.content === "string") return message;

      const parts = await Promise.all(
        message.content.map(async (part) => {
          const url = part.image_url?.url;
          if (part.type !== "image_url" || !url || !/^https?:\/\//i.test(url)) {
            return part;
          }
          try {
            const res = await fetch(url, {
              signal: AbortSignal.timeout(30_000),
            });
            if (!res.ok) return part;
            const bytes = Buffer.from(await res.arrayBuffer());
            if (bytes.length > MAX_INLINE_IMAGE_BYTES) return part;
            const mime =
              res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
            return {
              ...part,
              image_url: {
                url: `data:${mime};base64,${bytes.toString("base64")}`,
              },
            };
          } catch {
            return part;
          }
        }),
      );
      return { ...message, content: parts };
    }),
  );
}

async function requestOnce(
  provider: ProviderConfig,
  messages: LLMMessage[],
  options: LLMRequestOptions,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: provider.model,
    messages:
      provider.name === "gemini" ? await inlineRemoteImages(messages) : messages,
    max_tokens: options.maxTokens ?? 2000,
    temperature: options.temperature ?? 0.7,
  };
  if (options.topP !== undefined) body.top_p = options.topP;

  if (provider.name === "together") {
    const t = options.together;
    if (t?.topK !== undefined) body.top_k = t.topK;
    if (t?.repetitionPenalty !== undefined) {
      body.repetition_penalty = t.repetitionPenalty;
    }
    if (t?.stop) body.stop = t.stop;
  } else {
    // Gemini 3 models always think; keep it light so thinking tokens don't
    // eat the max_tokens budget and truncate the JSON we ask for.
    // Set GEMINI_REASONING_EFFORT="" to omit the parameter entirely.
    const effort = process.env.GEMINI_REASONING_EFFORT ?? "low";
    if (effort) body.reasoning_effort = effort;
  }

  let res: Response;
  try {
    res = await fetch(`${provider.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new ProviderRequestError(
      provider.name,
      null,
      error instanceof Error ? error.message : "Network error",
      true,
    );
  }

  if (!res.ok) {
    throw new ProviderRequestError(
      provider.name,
      res.status,
      extractErrorMessage(await res.text()),
      RETRYABLE_STATUSES.has(res.status),
    );
  }

  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new ProviderRequestError(
      provider.name,
      null,
      `Empty response from ${provider.name}`,
      false,
    );
  }
  return content;
}

async function requestWithRetry(
  provider: ProviderConfig,
  messages: LLMMessage[],
  options: LLMRequestOptions,
  maxRetries: number,
): Promise<string> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await requestOnce(provider, messages, options);
    } catch (error) {
      const retryable = error instanceof ProviderRequestError && error.retryable;
      if (!retryable || attempt >= maxRetries) throw error;

      const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
      console.warn(
        `[llm] ${provider.name} ${(error as ProviderRequestError).status ?? "network"} error. Retrying in ${delay}ms (${attempt + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/** What we tell the end user. Never leak billing details from a provider. */
function toUserMessage(error: ProviderRequestError): string {
  if (error.status !== null && UNUSABLE_STATUSES.has(error.status)) {
    return GENERIC_UNAVAILABLE;
  }
  if (error.status === 429 || error.status === 503) {
    return GENERIC_UNAVAILABLE;
  }
  if (error.message.includes("tokens") && error.message.includes("must be <=")) {
    return "Your note content is too large for AI processing. Please try with fewer notes or shorter content.";
  }
  return error.message || "Failed to process request with AI service";
}

export const llmService = {
  /** True when at least one provider has an API key. */
  isConfigured(): boolean {
    return getProviders("text").length > 0;
  },

  /**
   * Run a chat completion, falling back across providers.
   * @returns the assistant message text
   */
  async chat(
    messages: LLMMessage[],
    options: LLMRequestOptions = {},
  ): Promise<string> {
    const purpose = options.purpose ?? "text";
    const configured = getProviders(purpose, options.together?.model);

    if (configured.length === 0) {
      throw new AIProcessingError(
        "AI service is not configured. Set TOGETHER_API_KEY or GEMINI_API_KEY.",
      );
    }

    // Skip providers that recently refused us, unless that leaves nothing to
    // try (credit may have been topped up since).
    const now = Date.now();
    let active = configured.filter((p) => (cooldownUntil[p.name] ?? 0) <= now);
    if (active.length === 0) active = configured;

    let lastError: ProviderRequestError | undefined;

    for (let i = 0; i < active.length; i++) {
      const provider = active[i];
      const isLast = i === active.length - 1;

      try {
        const content = await requestWithRetry(
          provider,
          messages,
          options,
          isLast ? RETRIES_WHEN_LAST_PROVIDER : RETRIES_WHEN_FALLBACK_AVAILABLE,
        );
        delete cooldownUntil[provider.name];
        if (provider !== configured[0]) {
          console.warn(`[llm] served by fallback provider: ${provider.name}`);
        }
        return content;
      } catch (error) {
        const err =
          error instanceof ProviderRequestError
            ? error
            : new ProviderRequestError(
                provider.name,
                null,
                error instanceof Error ? error.message : "Unknown error",
                false,
              );
        lastError = err;

        console.warn(
          `[llm] ${provider.name} failed (${err.status ?? "no status"}): ${err.message}` +
            (isLast ? "" : ` -> falling back to ${active[i + 1].name}`),
        );

        if (err.status !== null && UNUSABLE_STATUSES.has(err.status)) {
          cooldownUntil[provider.name] = Date.now() + UNUSABLE_COOLDOWN_MS;
        }
      }
    }

    throw new AIProcessingError(toUserMessage(lastError!), lastError);
  },

  /** Forget provider cooldowns (e.g. right after topping up credits). */
  resetCooldowns(): void {
    for (const key of Object.keys(cooldownUntil) as LLMProviderName[]) {
      delete cooldownUntil[key];
    }
  },
};
