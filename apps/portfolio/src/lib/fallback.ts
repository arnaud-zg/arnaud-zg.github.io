// A source is down: use its saved data, and say so. With STRICT_DATA=1 (the deploy) the build
// stops instead, so the site already online stays rather than going back to old numbers.
export function fallback<T>(source: string, error: unknown, saved: T): T {
  const reason = error instanceof Error ? error.message : String(error);
  if (process.env.STRICT_DATA === "1") throw new Error(`[${source}] no live data: ${reason}`);
  console.warn(`[${source}] using saved data: ${reason}`);
  return saved;
}
