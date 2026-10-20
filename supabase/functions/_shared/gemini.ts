// Thin Gemini client for Malayalam generation. Key and model come from Supabase secrets
// (GEMINI_API_KEY, GEMINI_MODEL). Nothing here ever reaches the browser.

const BASE = "https://generativelanguage.googleapis.com/v1beta";
const QUOTA_COOLDOWN_MS = 60_000;
const CONFIG_COOLDOWN_MS = 30_000;

// Best-effort, per function instance: after a quota/config failure, skip Gemini briefly
// so every click isn't a doomed extra request.
let cooldownUntil = 0;

export type GeminiErrorKind = "quota" | "transient" | "config" | "blocked" | "empty";

export class GeminiError extends Error {
  kind: GeminiErrorKind;
  constructor(message: string, kind: GeminiErrorKind) {
    super(message);
    this.kind = kind;
  }
}

export function geminiAvailable(): boolean {
  return Boolean(Deno.env.get("GEMINI_API_KEY") && Deno.env.get("GEMINI_MODEL")) &&
    Date.now() >= cooldownUntil;
}

export async function callGemini(
  system: string,
  user: string,
  opts: { temperature?: number; json?: boolean; maxOutputTokens?: number; timeoutMs?: number } = {},
): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  const rawModel = Deno.env.get("GEMINI_MODEL");
  if (!key || !rawModel) throw new GeminiError("GEMINI_API_KEY or GEMINI_MODEL is not set", "config");
  if (Date.now() < cooldownUntil) throw new GeminiError("Gemini is cooling down after an earlier failure", "quota");
  const model = rawModel.replace(/^models\//, "");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 15_000);

  let status = 0;
  let data: any = {};
  try {
    const res = await fetch(`${BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.8,
          // generous: reasoning models spend part of this budget on hidden thinking
          maxOutputTokens: opts.maxOutputTokens ?? 2048,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
      signal: controller.signal,
    });
    status = res.status;
    data = await res.json().catch(() => ({}));
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === "AbortError";
    throw new GeminiError(aborted ? "Gemini timed out" : `Gemini network error: ${String(e)}`, "transient");
  } finally {
    clearTimeout(timer);
  }

  if (status === 429 || data?.error?.status === "RESOURCE_EXHAUSTED") {
    cooldownUntil = Date.now() + QUOTA_COOLDOWN_MS;
    throw new GeminiError("Gemini quota or rate limit reached", "quota");
  }
  if (status >= 500) throw new GeminiError(`Gemini server error ${status}`, "transient");
  if (status >= 400) {
    cooldownUntil = Date.now() + CONFIG_COOLDOWN_MS;
    throw new GeminiError(
      `Gemini ${status}: ${String(data?.error?.message ?? "request rejected").slice(0, 200)}`,
      "config",
    );
  }
  if (data?.promptFeedback?.blockReason) {
    throw new GeminiError(`Gemini blocked the prompt (${data.promptFeedback.blockReason})`, "blocked");
  }

  const cand = data?.candidates?.[0];
  const text = (cand?.content?.parts ?? [])
    .filter((p: any) => !p?.thought)
    .map((p: any) => p?.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new GeminiError(
      `Gemini returned no text (${cand?.finishReason ?? "unknown"})`,
      cand?.finishReason === "SAFETY" ? "blocked" : "empty",
    );
  }
  return text;
}