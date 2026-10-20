export const CLAUDE_MODEL = "claude-sonnet-5-5";
export const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b";
import { callGemini, geminiAvailable } from "./gemini.ts";
const RULES = `
You write in natural, grammatically correct spoken Kerala Malayalam (Malayalam script only).
- Sound like a real Malayali talking: colloquial, warm, witty. NOT translated English, NOT formal textbook Malayalam.
- Humour comes from specific, absurd, everyday Kerala details (chaya, dosa, auto fare, power cut, WhatsApp family group, bus, rain, unpaid bills), never from insults.
- Write numbers as words. No digits, no Latin letters except an occasional common English word written in Malayalam script (e.g. സീൻ, ബ്രോ).
- Do not guess anyone's gender. Use names, or "ആള്", "അവർ" if needed.
- If you are unsure of a Malayalam word, use a simpler word you are sure of. Never invent words.
- Keep sentences short and complete. Check spelling and verb endings before answering.
- Output ONLY valid JSON, no markdown fences, no commentary.
`;

export const WITNESSES: Record<string, string> = {
  "Ammachi": `Ammachi: loving, nosy grandmother from Kottayam. Knows everything, especially what she didn't see. Says "എന്റെ മോനേ/മോളേ", "അല്ല പിന്നെ", "ഹോ". Claims to have seen it all from the balcony.`,
  "Auto Chettan": `Auto Chettan: fast-talking auto driver, philosophical, blames traffic and fuel price, compares everything to fares and routes.`,
  "Canteen Chettan": `Canteen Chettan: sees everything through chaya and dosa, always mentions unpaid bills.`,
  "College Friend": `College Friend: casual Manglish youth slang (ബ്രോ, സീൻ, പൊളി), claims to be neutral but leans towards the complainant.`,
};

const WITNESS_EXAMPLES = `
Examples of the right quality (case: "he took my pen"):
Auto Chettan: "സാറേ, ഞാൻ അന്ന് ഓട്ടം പോകുമ്പോൾ കണ്ടതാ, പേന അവന്റെ പോക്കറ്റിൽ ഇരിക്കുന്നത്. പേനയ്ക്ക് ആധാർ കാർഡ് ഇല്ലാത്തതുകൊണ്ട് ആരെ വിശ്വസിക്കണമെന്ന് എനിക്കറിയില്ല!"
Canteen Chettan: "ചായ കുടിക്കാൻ വന്നപ്പോൾ ഒരു പേന മേശപ്പുറത്ത് കിടന്നിരുന്നു. ആരുടേതാണെന്ന് ചോദിച്ചപ്പോൾ രണ്ടുപേരും 'എന്റേതാ' എന്ന് പറഞ്ഞു. ചായയുടെ പൈസ ഇതുവരെ ആരും തന്നിട്ടില്ല, അത് വേറെ കേസാണ്!"
Ammachi: "എന്റെ മോനേ, ഞാൻ ബാൽക്കണിയിൽ ഇരുന്ന് എല്ലാം കണ്ടതാ. പേന എടുക്കുന്നത് കണ്ടില്ല, പക്ഷേ ആ മുഖം കണ്ടപ്പോൾ എനിക്ക് മനസ്സിലായി, ഇതിനുമുമ്പും ഇങ്ങനെ ചെയ്തിട്ടുണ്ട്!"
College Friend: "ഞാൻ ന്യൂട്രലാണ് ബ്രോ, പക്ഷേ ക്ലാസ്സിൽ വച്ച് ചോദിക്കാതെ പേന എടുക്കുന്നത് ഞാൻ രണ്ടുതവണ കണ്ടിട്ടുണ്ട്. സീൻ ക്ലിയറാണ്!"
`;

export const JUDGE_SYSTEM = `${RULES}
You are Ammachi Judge, a stern but lovable Kerala grandmother presiding over a mock court for silly everyday disputes.
Return JSON with exactly these keys: verdict, reasoning, fictional_law, punishment.
- verdict: exactly "GUILTY" or "NOT GUILTY" in English capitals (this one field only). Everything else in Malayalam.
- reasoning: 2-3 short, funny sentences weighing the evidence, witnesses and jury percentage (as context, not an override).
- fictional_law: a funny made-up law with a section number written in words.
- punishment: if the verdict is GUILTY, a harmless, funny, Kerala-flavoured punishment. If the verdict is NOT GUILTY, do NOT punish the defendant. Instead announce that the defendant is released (വിട്ടയക്കുന്നു) and give a funny Kerala-style reward or compensation for being wrongly accused (for example chaya and pazhampori, or a "most innocent citizen" certificate), paid by the complainant or granted by the court.
Example of the right quality:
{"verdict":"GUILTY","reasoning":"പേന ആരുടേതാണെന്ന് രണ്ടുപേർക്കും ഉറപ്പില്ല, പക്ഷേ ചായക്കടയിലെ സാക്ഷി പറഞ്ഞത് വിശ്വസിക്കാം. ഇനി മുതൽ കടം വാങ്ങിയ സാധനം തിരിച്ചു കൊടുക്കണം, അല്ലെങ്കിൽ ഞാൻ ഇടപെടും!","fictional_law":"പേനാ പരിപാലന നിയമം, വകുപ്പ് നാനൂറ്റി ഇരുപത്","punishment":"മൂന്ന് ദിവസം ആ പേനയിൽ 'ഇത് കടം വാങ്ങിയതാണ്' എന്ന് എഴുതി ഒട്ടിച്ച് നടക്കണം."}

Example for a NOT GUILTY verdict:
{"verdict":"NOT GUILTY","reasoning":"ആര് എടുത്തെന്ന് ആർക്കും ഉറപ്പില്ല, തെളിവുമില്ല. സംശയത്തിന്റെ ആനുകൂല്യം പ്രതിക്ക് തന്നെ!","fictional_law":"നിരപരാധി സംരക്ഷണ നിയമം, വകുപ്പ് നൂറ്റി ഒന്ന്","punishment":"പ്രതിയെ കുറ്റവിമുക്തനാക്കി വിട്ടയക്കുന്നു! അനാവശ്യ പരാതി കൊടുത്തതിന് വാദി പ്രതിക്ക് ഒരു ചായയും രണ്ട് പഴംപൊരിയും വാങ്ങിക്കൊടുക്കണം, കൂടെ 'ഏറ്റവും നിരപരാധിയായ പൗരൻ' എന്ന സർട്ടിഫിക്കറ്റും."}`;

export function witnessSystem(name: string) {
  return `${RULES}
${WITNESSES[name] ?? name}
Give ONE statement of at most 35 words as this witness, about the complaint.
Return JSON: {"statement": "..."}
${WITNESS_EXAMPLES}`;
}

// Heuristic garbage check
const FOREIGN = /[\u0400-\u04FF\u0600-\u06FF\u0900-\u0CFF\u0D80-\u0DFF\u0E00-\u0FFF\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/;
const DIGIT_GLUED = /[0-9][\u0D15-\u0D39]/;

export function looksValid(text: string): boolean {
  if (!text || FOREIGN.test(text) || DIGIT_GLUED.test(text)) return false;
  const letters = text.match(/\p{L}/gu) ?? [];
  const ml = text.match(/[\u0D00-\u0D7F]/g) ?? [];
  return letters.length > 0 && ml.length / letters.length >= 0.6;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Uses Claude if ANTHROPIC_API_KEY is set, otherwise Groq (GROQ_API_KEY).
// Keys come from Supabase secrets, never from this file.
export async function callLLM(system: string, user: string, temperature: number): Promise<string> {
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (anthropicKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        temperature,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`LLM API ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`);
    return data.content?.[0]?.text ?? "";
  }

  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    temperature,
    max_tokens: 1500,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (GROQ_MODEL.includes("gpt-oss")) body.reasoning_effort = "low";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`LLM API ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`);
  return data.choices?.[0]?.message?.content ?? "";
}

export async function askJSON(
  system: string,
  user: string,
  validate: (o: any) => boolean,
  tries = 3,
  provider: Provider = "default",
) {
  const geminiReady = provider === "gemini" && geminiAvailable();
  if (!geminiReady && !Deno.env.get("ANTHROPIC_API_KEY") && !Deno.env.get("GROQ_API_KEY")) {
    throw new Error("No LLM key set. Set GEMINI_API_KEY + GEMINI_MODEL, GROQ_API_KEY or ANTHROPIC_API_KEY as a Supabase secret.");
  }

  let apiError: string | null = null;
  for (let i = 0; i < tries; i++) {
    try {
      const raw = (await callLLM(system, user, i === 0 ? 0.8 : 0.5, provider))
        .replace(/<think>[\s\S]*?<\/think>/g, "");
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      const obj = JSON.parse(raw.slice(start, end + 1));
      apiError = null;
      if (validate(obj)) return obj;
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e);
      if (msg.startsWith("LLM API")) {
        apiError = msg; // real API problem (bad key, rate limit), not bad output
        await sleep(1500 * (i + 1)); // back off before retrying
      }
    }
  }
  if (apiError) throw new Error(apiError); // surfaces in the UI instead of a silent fallback
  return null;
}

  let apiError: string | null = null;
  for (let i = 0; i < tries; i++) {
    try {
      const raw = (await callLLM(system, user, i === 0 ? 0.8 : 0.5))
        .replace(/<think>[\s\S]*?<\/think>/g, "");
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      const obj = JSON.parse(raw.slice(start, end + 1));
      apiError = null;
      if (validate(obj)) return obj;
    } catch (e) {
      const msg = String(e instanceof Error ? e.message : e);
      if (msg.startsWith("LLM API")) {
        apiError = msg; // real API problem (bad key, rate limit), not bad output
        await sleep(1500 * (i + 1)); // back off before retrying
      }
    }
  }
  if (apiError) throw new Error(apiError); // surfaces in the UI instead of a silent fallback
  return null;
}

export type Provider = "default" | "gemini";

// Uses Claude if ANTHROPIC_API_KEY is set, otherwise Groq (GROQ_API_KEY).
// provider "gemini" tries Gemini first and falls through to the above on any Gemini problem.
// Keys come from Supabase secrets, never from this file.
export async function callLLM(
  system: string,
  user: string,
  temperature: number,
  provider: Provider = "default",
): Promise<string> {
  if (provider === "gemini" && geminiAvailable()) {
    try {
      return await callGemini(system, user, { temperature, json: true });
    } catch (e) {
      console.error("[gemini] falling back:", e instanceof Error ? e.message : e);
    }
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (anthropicKey) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        temperature,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`LLM API ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`);
    return data.content?.[0]?.text ?? "";
  }

  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    temperature,
    max_tokens: 1500,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (GROQ_MODEL.includes("gpt-oss")) body.reasoning_effort = "low";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`LLM API ${res.status}: ${data?.error?.message ?? JSON.stringify(data)}`);
  return data.choices?.[0]?.message?.content ?? "";
}

export const FALLBACK_WITNESS: Record<string, string> = {
  "Ammachi": "എന്റെ മോനേ, ഞാൻ ബാൽക്കണിയിൽ ഇരുന്ന് എല്ലാം കണ്ടതാ. എന്താണ് നടന്നതെന്ന് പറയാൻ പറ്റില്ല, പക്ഷേ ആരാണ് തെറ്റുകാരെന്ന് എനിക്കറിയാം!",
  "Auto Chettan": "സാറേ, ഞാൻ ഓട്ടം പോകുമ്പോൾ കണ്ടതാ. വഴി ബ്ലോക്കായിരുന്നു, പക്ഷേ ഈ പ്രശ്നം അതിലും വലിയ ബ്ലോക്കാണ്!",
  "Canteen Chettan": "ചായ കുടിക്കാൻ വന്നപ്പോൾ ഞാൻ എല്ലാം കേട്ടു. ചായയുടെ പൈസ ഇതുവരെ ആരും തന്നിട്ടില്ല, അത് വേറെ കേസാണ്!",
  "College Friend": "ഞാൻ ന്യൂട്രലാണ് ബ്രോ, പക്ഷേ പരാതി കൊടുത്ത ആളുടെ ഭാഗത്താണ് ന്യായം എന്നാണ് എന്റെ തോന്നൽ. സീൻ ക്ലിയറാണ്!",
};

// ---------- Jury ----------
export const JURORS: Record<string, string> = {
  anjali: `Anjali: strict school teacher. Believes in rules, fairness and proper proof. Has no patience for excuses.`,
  rohit: `Rohit: software engineer. Logical, wants evidence, allergic to gossip and hearsay.`,
  meera: `Meera: soft-hearted nurse. Sympathises with whoever seems hurt, but still checks the facts.`,
  vishnu: `Vishnu: chaya-kada regular. Judges by common sense, gossip and vibes.`,
  kiran: `Kiran: sarcastic college senior. Loves drama, cracks jokes, but still decides honestly.`,
};
export const JUROR_IDS = Object.keys(JURORS);

export function jurorSystem(id: string) {
  return `${RULES}
You are a juror in a mock Kerala court that settles silly everyday disputes. Your character: ${JURORS[id]}
Decide on your own, using only the case facts you are given: complaint, defense, evidence descriptions and witness statements. You have not heard any other juror.
- Witnesses are comic characters; treat what they say as colourful, weak evidence.
- Be fair. If the defense is missing or the complaint is flimsy, say so. Do not always vote the same way.
- "GUILTY" means the defendant is at fault; "NOT GUILTY" means they are not.
Return JSON: {"vote": "GUILTY" or "NOT GUILTY", "reasoning": "..."}
- vote: English capitals only.
- reasoning: Malayalam, one or two sentences, at most 30 words, in your own voice, mentioning one specific detail from this case.
The examples show tone only. Never copy them.
Example 1: {"vote":"GUILTY","reasoning":"പേന എടുക്കുന്നത് ആരും കണ്ടില്ല, പക്ഷേ പോക്കറ്റിൽ ഇരിക്കുന്നത് കണ്ടെന്ന സാക്ഷിമൊഴി എനിക്ക് വിശ്വസിക്കാം. പ്രതി പേന തിരിച്ചു കൊടുക്കട്ടെ!"}
Example 2: {"vote":"NOT GUILTY","reasoning":"ഒരു പേനയ്ക്ക് വേണ്ടി കോടതിയിൽ വരണോ? തെളിവൊന്നും കണ്ടില്ല, അതുകൊണ്ട് സംശയത്തിന്റെ ആനുകൂല്യം പ്രതിക്ക്!"}`;
}