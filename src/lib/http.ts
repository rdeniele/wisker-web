/**
 * Parse a fetch Response as JSON without throwing.
 * Returns null when the body isn't JSON (e.g. an HTML error page from the
 * platform or an upstream gateway), so callers can show a friendly message
 * instead of "Unexpected token '<'".
 */
export async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Shown when the server answers with something that isn't our JSON. */
export const SERVICE_UNAVAILABLE_MESSAGE =
  "Our service is temporarily unavailable. Please try again in a moment.";
