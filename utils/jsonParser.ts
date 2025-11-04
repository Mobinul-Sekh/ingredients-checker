export function safeParseJSON(str: any, fallback = []) {
  if (typeof str !== "string") return fallback;

  try {
    return JSON.parse(str);
  } catch (e) {
    // Attempt to clean up common issues like trailing commas
    try {
      const cleaned = str
        // Remove trailing commas before } or ]
        .replace(/,\s*([}\]])/g, '$1')
        // Remove newlines before closing braces
        .replace(/\n\s*([}\]])/g, '$1');
      return JSON.parse(cleaned);
    } catch {
      console.warn("Unrecoverable JSON parse error:", e);
      return fallback;
    }
  }
}