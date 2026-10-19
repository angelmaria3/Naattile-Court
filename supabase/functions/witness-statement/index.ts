// supabase/functions/witness-statement/index.ts
// Generates one short witness statement in natural spoken Malayalam.
// Flow: ask Groq -> check the Malayalam -> retry once with the reason -> fall back to a
// hand-written Malayalam template. Real API/config errors are returned as errors
// (so the page alert shows them) instead of being hidden behind fake statements.

const MODEL = "openai/gpt-oss-120b"
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  })

/* ───────────── Malayalam quality guard ───────────── */

const FOREIGN_SCRIPT =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Cyrillic}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Thai}\p{Script=Devanagari}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Bengali}]/u

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

export function checkMalayalam(
  text: string,
  ignoreNames: string[] = [],
  limits = { min: 20, max: 260, minWords: 4 },
): string | null {
  let t = text.trim()
  for (const name of ignoreNames) {
    if (name && name.trim()) t = t.replace(new RegExp(escapeRegExp(name.trim()), "gi"), "")
  }
  t = t.trim()

  if (t.length < limits.min) return "too short"
  if (t.length > limits.max) return "too long"
  if (FOREIGN_SCRIPT.test(t)) return "contains a non-Malayalam script"
  if (/[{}\[\]`<>]|statement\s*:|verdict\s*:/i.test(t)) return "contains formatting or labels"

  const ml = (t.match(/[\u0D00-\u0D7F]/g) ?? []).length
  const latin = (t.match(/[A-Za-z]/g) ?? []).length
  if (ml < 10) return "not written in Malayalam script"
  if (latin / (ml + latin) > 0.15) return "too much English / Manglish"

  if (t.split(/\s+/).filter(Boolean).length < limits.minWords) return "too few words"

  // garbled script: a dependent vowel sign / virama at the start of a word, or two signs in a row
  if (/(^|\s)[\u0D3E-\u0D4D\u0D57\u0D62\u0D63]/.test(t)) return "garbled Malayalam (word starts with a vowel sign)"
  if (/[\u0D3E-\u0D4D]{2,}/.test(t)) return "garbled Malayalam (stacked vowel signs)"

  // repetition loops
  const counts = new Map<string, number>()
  for (const w of t.split(/[\s.,!?;:"'()\-–—]+/).filter((w) => w.length >= 2)) {
    counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  for (const n of counts.values()) if (n >= 4) return "repeats the same word too often"
  if (/(.{6,}?)\1{2,}/u.test(t)) return "repeats a phrase"

  return null
}

function cleanStatement(raw: string): string {
  return raw
    .normalize("NFC")
    .trim()
    .replace(/^(statement|witness statement|answer)\s*:\s*/i, "")
    .replace(/^["'“”‘’「」`]+|["'“”‘’「」`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/* ───────────── Personas & fallback templates ───────────── */

type Persona = { voice: string; side: "plaintiff" | "defendant" }

const PERSONAS: Record<string, Persona> = {
  Ammachi: {
    side: "plaintiff",
    voice:
      "An elderly Kerala grandmother (അമ്മച്ചി) who watches the whole street from her balcony. Nosy, dramatic, affectionate and scolding. Calls youngsters 'മോനേ' or 'മോളേ'. Loves to say how things were done in her days.",
  },
  "College Friend": {
    side: "plaintiff",
    voice:
      "A college friend of the complainant. Casual, youthful campus Malayalam ('അളിയാ', 'സത്യം പറഞ്ഞാൽ'), pretends to be neutral but clearly backs the complainant.",
  },
  "Auto Chettan": {
    side: "defendant",
    voice:
      "A talkative auto-rickshaw driver (ഓട്ടോ ചേട്ടൻ) with an opinion on everything. Calls people 'സാറേ'. Jokes about his meter running and about dropping people home.",
  },
  "Canteen Chettan": {
    side: "defendant",
    voice:
      "The college canteen chettan (കാന്റീൻ ചേട്ടൻ). Practical, a bit grumpy, thinks in chaya, dosa and unpaid bills. Heard the shouting but his dosa burnt in the middle of it.",
  },
}

export const TEMPLATES: Record<string, string[]> = {
  Ammachi: [
    "ഞാൻ ബാൽക്കണിയിൽ നിന്ന് എല്ലാം കണ്ടതാ മോനേ. ഇത്രേം ചെറിയ കാര്യത്തിന് കോടതി വരെ എത്തേണ്ടി വന്നല്ലോ!",
    "എന്റെ കാലത്താണെങ്കിൽ ഒരു ചെരിപ്പെടുത്ത് ഒറ്റയടിക്ക് തീർത്തേനെ. ഇപ്പോഴത്തെ പിള്ളേർക്ക് എല്ലാത്തിനും കോടതി വേണം.",
    "ഞാൻ ഒന്നും കണ്ടില്ല, പക്ഷേ ആരാ തെറ്റുകാരെന്ന് എനിക്ക് നന്നായിട്ടറിയാം.",
    "വാദി പറയുന്നതിൽ കാര്യമുണ്ട് ജഡ്ജീ, ഈ പിള്ളേരെ എനിക്ക് ചെറുപ്പം മുതലേ അറിയാം.",
  ],
  "College Friend": [
    "സത്യം പറഞ്ഞാൽ രണ്ടുപേരും കുറച്ച് ഓവറാണ്, പക്ഷേ ഇത്തവണ വാദിയുടെ ഭാഗത്താണ് ന്യായം.",
    "ഞാൻ അവിടെ ഉണ്ടായിരുന്നില്ല, പക്ഷേ ഇത് കേട്ടപ്പോൾ തന്നെ ആരാ ചെയ്തതെന്ന് മനസ്സിലായി.",
    "ഞാൻ ആരുടെയും പക്ഷം പിടിക്കുന്നില്ല. പക്ഷേ നിർബന്ധിച്ചാൽ വാദിയുടെ കൂടെ നിൽക്കും.",
    "അളിയാ, ഇതൊക്കെ ഇവിടെ പതിവാണ്. പക്ഷേ ഇത്തവണ പ്രതി കുറച്ച് കടന്നുപോയി.",
  ],
  "Auto Chettan": [
    "അന്ന് ഞാനാണ് പ്രതിയെ വീട്ടിൽ കൊണ്ടുവിട്ടത്. നല്ല സാധു മനുഷ്യൻ, ഒരു ഈച്ചയെ പോലും ഉപദ്രവിക്കില്ല.",
    "ഇത് വെറുമൊരു തെറ്റിദ്ധാരണയാണ് സാറേ. ഒരു മാപ്പ് പറഞ്ഞാൽ തീരുന്ന കാര്യമേയുള്ളൂ.",
    "ഇപ്പോഴത്തെ ആളുകൾക്ക് ചെറിയ കാര്യത്തിനും വഴക്കാണ്. പാവം പ്രതിയെ കുടുക്കുകയാണ്.",
    "മീറ്റർ ഓടിക്കൊണ്ടിരിക്കുകയാണ് സാറേ, പെട്ടെന്ന് വിധി പറഞ്ഞാൽ എല്ലാവർക്കും വീട്ടിൽ പോകാം.",
  ],
  "Canteen Chettan": [
    "അവര് കൗണ്ടറിന്റെ അടുത്ത് നിന്ന് വഴക്കിട്ടതാ. പ്രതി വളരെ മര്യാദയോടെയാണ് സംസാരിച്ചത്.",
    "രണ്ടുപേരും എനിക്ക് ചായയുടെ കാശ് തരാനുണ്ട്. പക്ഷേ പ്രതി ഇന്നലെ പകുതി തന്നു.",
    "ഒച്ചപ്പാട് കേട്ടതേയുള്ളൂ, അതിനിടയിൽ എന്റെ ദോശ കരിഞ്ഞുപോയി. പ്രതി കുറ്റം ചെയ്യില്ലെന്നാണ് എന്റെ തോന്നൽ.",
    "പ്രതി സ്വന്തം ഊണ് സംരക്ഷിക്കുകയായിരുന്നു സാറേ, അതിൽ എന്താ തെറ്റ്?",
  ],
}

export const GENERIC_TEMPLATES: Record<"plaintiff" | "defendant", string[]> = {
  plaintiff: [
    "ഇവിടെ നടന്നതൊക്കെ ഞാൻ കണ്ടതാണ്. വാദി പറയുന്നതിൽ കാര്യമുണ്ട്, ജഡ്ജീ.",
    "ഇത്ര ചെറിയ കാര്യം കോടതിയിൽ എത്തിയത് കഷ്ടമാണ്, പക്ഷേ വാദിക്ക് ന്യായമുണ്ട്.",
  ],
  defendant: [
    "ഇവിടെ നടന്നതൊക്കെ ഞാൻ കണ്ടതാണ്. പ്രതി ഒരു തെറ്റും ചെയ്തിട്ടില്ല, ജഡ്ജീ.",
    "ഇതൊരു തെറ്റിദ്ധാരണ മാത്രമാണ് സാറേ. പാവം പ്രതിയെ വെറുതെ കുടുക്കുകയാണ്.",
  ],
}

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function templateStatement(witnessName: string, side: "plaintiff" | "defendant"): string {
  return pick(TEMPLATES[witnessName] ?? GENERIC_TEMPLATES[side])
}

/* ───────────── Prompt ───────────── */

const SYSTEM_PROMPT = `You write short courtroom witness statements in natural spoken Malayalam for a comic app about everyday Kerala disputes (a missing pen, a stolen porotta, a phone charger).

RULES
1. Output ONLY the statement, in Malayalam script. No English, no Manglish (Malayalam written in English letters), no quotation marks, no labels, no explanation.
2. Use everyday spoken Kerala Malayalam, the way a real person would say it aloud in court. Short sentences. Avoid bookish or Sanskritised words and avoid word-for-word translation from English.
3. 1 to 2 sentences, 12 to 35 words.
4. Mention one specific thing from the case facts (the actual object or event), so it is clearly about THIS case. Write any person's name in Malayalam script.
5. The humour must come from the witness's personality and ordinary Kerala life (chaya, auto, canteen, balcony gossip). Never use random or absurd words. Every sentence must make sense on its own.
6. Do not guess anyone's gender. Use the person's name, or 'വാദി' / 'പ്രതി', instead of he/she.

STYLE EXAMPLES (a different case; do not copy them)
- ഞാൻ ബാൽക്കണിയിൽ നിന്ന് എല്ലാം കണ്ടതാ മോനേ. ഇത്രേം ചെറിയ കാര്യത്തിന് കോടതി വരെ എത്തേണ്ടി വന്നല്ലോ!
- രണ്ടുപേരും എനിക്ക് ചായയുടെ കാശ് തരാനുണ്ട്. പക്ഷേ പ്രതി ഇന്നലെ പകുതി തന്നു.
- മീറ്റർ ഓടിക്കൊണ്ടിരിക്കുകയാണ് സാറേ, പെട്ടെന്ന് വിധി പറഞ്ഞാൽ എല്ലാവർക്കും വീട്ടിൽ പോകാം.`

function buildUserPrompt(p: {
  name: string
  voice: string
  side: "plaintiff" | "defendant"
  complaint: string
  defense: string
  evidence: string[]
  plaintiff: string
  defendant: string
}): string {
  const sideText =
    p.side === "plaintiff"
      ? "You were called by the complainant (വാദി), so your statement should support the complainant."
      : "You were called by the defendant (പ്രതി), so your statement should support the defendant."
  return `WITNESS: ${p.name}
CHARACTER: ${p.voice}
${sideText}

CASE FACTS
Complainant (വാദി): ${p.plaintiff || "not given"}
Defendant (പ്രതി): ${p.defendant || "not given"}
Complaint: ${p.complaint}
Defendant's defence: ${p.defense || "not given yet"}
Evidence on record: ${p.evidence.length ? p.evidence.join(" | ") : "none yet"}

Write the witness statement now.`
}

async function askGroq(
  apiKey: string,
  messages: { role: string; content: string }[],
  temperature: number,
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      temperature,
      max_tokens: 1000,
      reasoning_effort: "low",
      messages,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Groq error: ${data?.error?.message || JSON.stringify(data)}`)
  return String(data?.choices?.[0]?.message?.content ?? "")
}

/* ───────────── Handler ───────────── */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  try {
    const apiKey = Deno.env.get("GROQ_API_KEY")
    if (!apiKey) return json({ error: "GROQ_API_KEY secret is not set on this project" }, 500)

    const body = await req.json()
    const witnessName: string = String(body.witness_name ?? "")
    const persona = PERSONAS[witnessName]
    const side: "plaintiff" | "defendant" =
      body.side === "defendant" || body.side === "plaintiff" ? body.side : persona?.side ?? "plaintiff"

    const names = [String(body.plaintiff ?? ""), String(body.defendant ?? "")]
    const userPrompt = buildUserPrompt({
      name: witnessName || "Witness",
      voice: persona?.voice ?? String(body.witness_personality ?? "A local witness with a strong opinion."),
      side,
      complaint: String(body.complaint_text ?? ""),
      defense: String(body.defense_text ?? ""),
      evidence: Array.isArray(body.evidence) ? body.evidence.map(String) : [],
      plaintiff: names[0],
      defendant: names[1],
    })

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]

    let reason: string | null = null
    for (let attempt = 0; attempt < 2; attempt++) {
      const retryNote =
        attempt === 0
          ? []
          : [{
            role: "user",
            content:
              `Your previous answer was rejected because it was ${reason}. Write it again: natural spoken Malayalam in Malayalam script only, 12 to 35 words, no English letters.`,
          }]
      const raw = await askGroq(apiKey, [...messages, ...retryNote], attempt === 0 ? 0.8 : 0.5)
      const statement = cleanStatement(raw)
      reason = checkMalayalam(statement, names)
      if (!reason) return json({ statement, source: "ai" })
    }

    return json({ statement: templateStatement(witnessName, side), source: "template", reason })
  } catch (err) {
    return json({ error: String(err instanceof Error ? err.message : err) }, 502)
  }
})