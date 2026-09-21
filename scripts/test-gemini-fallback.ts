/**
 * Live smoke test for the Gemini fallback. Run after adding GEMINI_API_KEY:
 *
 *   npx tsx scripts/test-gemini-fallback.ts
 *
 * 1. Gemini alone  - text completion + JSON output + vision (real API call)
 * 2. Fallback      - Together is given a deliberately invalid key, so it
 *                    answers 401 and the request must be served by Gemini.
 *                    This costs nothing on Together.
 */
import { config } from "dotenv";

config();

// 1x1 red PNG
const RED_PIXEL =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not found in .env");
    process.exit(1);
  }

  const realTogetherKey = process.env.TOGETHER_API_KEY;
  const { llmService } = await import("../service/llm.service");

  let failed = false;
  const step = async (name: string, fn: () => Promise<string>) => {
    try {
      const out = await fn();
      console.log(`PASS  ${name}\n      -> ${out.replace(/\s+/g, " ").slice(0, 140)}`);
    } catch (error) {
      failed = true;
      console.log(
        `FAIL  ${name}\n      -> ${error instanceof Error ? error.message : error}`,
      );
      const cause = (error as { details?: { message?: string } })?.details;
      if (cause?.message) console.log(`      cause: ${cause.message}`);
    }
  };

  // ---- 1. Gemini alone ----
  process.env.AI_PROVIDER_ORDER = "gemini";
  console.log(
    `Model: ${process.env.GEMINI_MODEL || "gemini-3.8-flash (default)"}\n`,
  );

  await step("Gemini text completion", () =>
    llmService.chat(
      [{ role: "user", content: "Reply with exactly: Gemini is working" }],
      { maxTokens: 200, temperature: 0.1 },
    ),
  );

  await step("Gemini returns parseable JSON (what quizzes/flashcards need)", async () => {
    const out = await llmService.chat(
      [
        {
          role: "system",
          content:
            'Return only JSON: {"cards":[{"id":"card1","front":"...","back":"..."}]}',
        },
        { role: "user", content: "Make 2 flashcards about photosynthesis." },
      ],
      { maxTokens: 1500, temperature: 0.5, topP: 0.7 },
    );
    const start = out.indexOf("{");
    const end = out.lastIndexOf("}");
    JSON.parse(out.slice(start, end + 1));
    return out;
  });

  await step("Gemini vision (inline base64 image)", () =>
    llmService.chat(
      [
        {
          role: "user",
          content: [
            { type: "text", text: "What colour is this image? One word." },
            {
              type: "image_url",
              image_url: { url: `data:image/png;base64,${RED_PIXEL}` },
            },
          ],
        },
      ],
      { maxTokens: 200, temperature: 0.1, purpose: "vision" },
    ),
  );

  // ---- 2. Fallback path ----
  process.env.AI_PROVIDER_ORDER = "together,gemini";
  process.env.TOGETHER_API_KEY = "invalid-key-to-force-fallback";
  llmService.resetCooldowns();

  await step("Together fails (401) -> automatically served by Gemini", () =>
    llmService.chat(
      [{ role: "user", content: "Reply with exactly: fallback works" }],
      { maxTokens: 200, temperature: 0.1 },
    ),
  );

  if (realTogetherKey) process.env.TOGETHER_API_KEY = realTogetherKey;
  console.log(
    failed
      ? "\nSome checks failed. See the messages above (and the [llm] warnings)."
      : "\nAll good: Gemini works and the fallback kicks in.",
  );
  process.exit(failed ? 1 : 0);
}

main();
