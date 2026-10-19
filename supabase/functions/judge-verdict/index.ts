// supabase/functions/judge-verdict/index.ts
// Request  : { complaint, plaintiff, defendant, evidence (string or string[]), juryGuiltyPercent }
// Response : { verdict: "GUILTY" | "NOT GUILTY", reasoning, fictional_law, punishment, source }
// The verdict field stays an English enum because the page decides colours from it.
// Everything else is natural spoken Malayalam. Poor AI output is retried once, then replaced
// by a hand-written Malayalam template. API/config errors are returned as errors.

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
  ignoreNames: string[],
  limits: { min: number; max: number; minWords: number },
): string | null {
  let t = text.trim()
  for (const name of ignoreNames) {
    if (name && name.trim()) t = t.replace(new RegExp(escapeRegExp(name.trim()), "gi"), "")
  }
  t = t.trim()

  if (t.length < limits.min) return "too short"
  if (t.length > limits.max) return "too long"
  if (FOREIGN_SCRIPT.test(t)) return "contains a non-Malayalam script"
  if (/[{}\[\]`<>]/.test(t)) return "contains formatting characters"

  const ml = (t.match(/[\u0D00-\u0D7F]/g) ?? []).length
  const latin = (t.match(/[A-Za-z]/g) ?? []).length
  if (ml < 10) return "not written in Malayalam script"
  if (latin / (ml + latin) > 0.15) return "too much English / Manglish"

  if (t.split(/\s+/).filter(Boolean).length < limits.minWords) return "too few words"

  if (/(^|\s)[\u0D3E-\u0D4D\u0D57\u0D62\u0D63]/.test(t)) return "garbled Malayalam (word starts with a vowel sign)"
  if (/[\u0D3E-\u0D4D]{2,}/.test(t)) return "garbled Malayalam (stacked vowel signs)"

  const counts = new Map<string, number>()
  for (const w of t.split(/[\s.,!?;:"'()\-–—]+/).filter((w) => w.length >= 2)) {
    counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  for (const n of counts.values()) if (n >= 4) return "repeats the same word too often"
  if (/(.{6,}?)\1{2,}/u.test(t)) return "repeats a phrase"

  return null
}

/* ───────────── Types, fallback templates ───────────── */

export type Verdict = {
  verdict: "GUILTY" | "NOT GUILTY"
  reasoning: string
  fictional_law: string
  punishment: string
}

type Names = { plaintiff: string; defendant: string }

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function templateVerdict(guilty: boolean, guiltyPct: number, n: Names): Verdict {
  const notGuiltyPct = 100 - guiltyPct
  if (guilty) {
    return {
      verdict: "GUILTY",
      reasoning: pick([
        `ഇരുഭാഗവും കേട്ടു, തെളിവുകളും നോക്കി. ജൂറിയിലെ ${guiltyPct}% പേരും ${n.defendant} കുറ്റം ചെയ്തെന്ന് വോട്ട് ചെയ്തു. ഇനി ഒഴിഞ്ഞുമാറാൻ നോക്കണ്ട, ഈ കോടതി അത് സമ്മതിക്കില്ല!`,
        `${n.plaintiff} പറഞ്ഞതിൽ കാര്യമുണ്ടെന്ന് കോടതിക്ക് ബോധ്യപ്പെട്ടു. ${n.defendant}-ന്റെ ന്യായീകരണം കേട്ടപ്പോൾ ചിരി വന്നെങ്കിലും ജൂറിയുടെ ${guiltyPct}% വോട്ട് അവഗണിക്കാൻ പറ്റില്ല.`,
      ]),
      fictional_law: "വകുപ്പ് 420-പി — അനുവാദമില്ലാതെ എടുക്കൽ നിരോധന നിയമം",
      punishment: `${n.defendant} ${n.plaintiff}-നോട് മാപ്പ് പറയണം, രണ്ട് ചൂടുള്ള പൊറോട്ടയും ഒരു സ്പെഷ്യൽ ചായയും വാങ്ങിക്കൊടുക്കുകയും വേണം.`,
    }
  }
  return {
    verdict: "NOT GUILTY",
    reasoning: pick([
      `ഇരുഭാഗവും വിശദമായി കേട്ടു. ${n.defendant} കുറ്റം ചെയ്തെന്ന് ഉറപ്പിക്കാൻ മാത്രമുള്ള തെളിവ് കോടതിക്ക് കിട്ടിയില്ല. ജൂറിയിലെ ${notGuiltyPct}% പേരും പ്രതിയുടെ ഭാഗത്താണ്.`,
      `${n.plaintiff}-ന്റെ വിഷമം കോടതിക്ക് മനസ്സിലായി, പക്ഷേ തെളിവ് പോരാ. ചെറിയ കാര്യം വലുതാക്കി കോടതിയിൽ കൊണ്ടുവരരുതെന്ന് ഓർമ്മിപ്പിക്കുന്നു.`,
    ]),
    fictional_law: "വകുപ്പ് 101-സി — അനാവശ്യ വീട്ടുനാടക നിവാരണ നിയമം",
    punishment: `${n.plaintiff} ${n.defendant}-ന് ഒരു ഗ്ലാസ് തണുത്ത നാരങ്ങാവെള്ളം വാങ്ങിക്കൊടുക്കണം, ഇനി ഇത്തരം ചെറിയ കാര്യങ്ങൾ കോടതിയിൽ കൊണ്ടുവരില്ലെന്ന് വാക്ക് നൽകുകയും വേണം.`,
  }
}

/* ───────────── Prompt ───────────── */

export const SYSTEM_PROMPT = `You are Hon. Ammachi Judge, a veteran village-court judge in Kerala presiding over a comic mock court called നാട്ടിലെ COURT. You settle small everyday disputes. You are stern but kind, and funny the way an experienced Malayali elder is funny: dry, affectionate, drawing on ordinary Kerala life (chaya, parippuvada, porotta, auto rickshaws, family WhatsApp groups, bus seats, the Onam sadya).

LANGUAGE
- Write in natural spoken Malayalam, in Malayalam script only. No Manglish, no English words except the verdict enum.
- Short, clear sentences a real person would say aloud. Avoid bookish or Sanskritised words and avoid word-for-word translation from English.
- Write the names of people in Malayalam script.
- Do not guess anyone's gender. Use names, or 'വാദി' / 'പ്രതി'. Never use gendered words such as കുറ്റക്കാരൻ / കുറ്റക്കാരി; say things like "കുറ്റം ചെയ്തു" instead.
- Humour must come from the facts of THIS case and from ordinary Kerala life. Never use random or absurd words. Every sentence must make sense on its own. Be gentle: no jokes about religion, caste, gender, looks or family.

OUTPUT
Return ONLY one JSON object, no markdown, with exactly these keys:
{
  "verdict": "GUILTY" or "NOT GUILTY"   (English, uppercase),
  "reasoning": 2 to 3 short sentences, about 30 to 60 words. Refer to specific facts from this case (the complaint, the defence, evidence or witnesses) and make clear why the verdict follows,
  "fictional_law": "വകുപ്പ് <number>-<one Malayalam letter> — <funny Act name in Malayalam>",
  "punishment": one specific, doable, funny punishment sentence, at most 30 words
}

CONSISTENCY
- reasoning, fictional_law and punishment must all agree with the verdict.
- GUILTY: the punishment is for the defendant (for example buying something, apologising, doing a chore).
- NOT GUILTY: no punishment for the defendant; give a light, funny instruction to the complainant or to both.
- The jury percentage is the share of jurors who voted guilty. Weigh it, but decide on the facts. If you go against the majority, say so in one clause.

EXAMPLE (a different case)
{"verdict":"GUILTY","reasoning":"ഫ്രിഡ്ജിൽ വെച്ച ബിരിയാണി ചോദിക്കാതെ എടുത്ത് കഴിച്ചെന്ന് പ്രതി തന്നെ സമ്മതിച്ചു. 'വിശന്നപ്പോൾ എടുത്തതാ' എന്നത് ഒരു ന്യായമല്ല, വിശപ്പ് എല്ലാവർക്കും ഉണ്ട്. അതുകൊണ്ട് ജൂറിയുടെ അഭിപ്രായത്തോട് കോടതിയും യോജിക്കുന്നു.","fictional_law":"വകുപ്പ് 420-ബി — ചോദിക്കാതെ ബിരിയാണി എടുക്കൽ നിരോധന നിയമം","punishment":"പ്രതി വാദിക്ക് ഒരു പ്ലേറ്റ് ബിരിയാണി വാങ്ങിക്കൊടുക്കുകയും ഗ്രൂപ്പിൽ പരസ്യമായി മാപ്പ് പറയുകയും വേണം."}`

/* ───────────── Parse + validate ───────────── */

export function parseVerdict(raw: string, names: string[]): { value?: Verdict; reason?: string } {
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start < 0 || end <= start) return { reason: "not valid JSON" }

  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(raw.slice(start, end + 1))
  } catch {
    return { reason: "not valid JSON" }
  }

  const v = String(obj.verdict ?? "").toUpperCase().replace(/_/g, " ")
  const verdict: Verdict["verdict"] | null = v.includes("NOT") ? "NOT GUILTY" : v.includes("GUILTY") ? "GUILTY" : null
  if (!verdict) return { reason: "verdict was not GUILTY or NOT GUILTY" }

  const norm = (x: unknown) => String(x ?? "").normalize("NFC").replace(/\s+/g, " ").trim()
  const reasoning = norm(obj.reasoning)
  const fictional_law = norm(obj.fictional_law)
  const punishment = norm(obj.punishment)

  const r = checkMalayalam(reasoning, names, { min: 40, max: 480, minWords: 8 })
  if (r) return { reason: `reasoning was ${r}` }
  const l = checkMalayalam(fictional_law, names, { min: 10, max: 150, minWords: 3 })
  if (l) return { reason: `fictional_law was ${l}` }
  if (!fictional_law.startsWith("വകുപ്പ്")) return { reason: "fictional_law did not start with 'വകുപ്പ്'" }
  const p = checkMalayalam(punishment, names, { min: 15, max: 280, minWords: 4 })
  if (p) return { reason: `punishment was ${p}` }

  // reasoning must not contradict the verdict
  const saysNotGuilty = /കുറ്റക്കാര(ല്ല|ൻ അല്ല)|കുറ്റം ചെയ്തിട്ടില്ല|കുറ്റവിമുക്ത/.test(reasoning)
  const saysGuilty = /കുറ്റം ചെയ്തു|കുറ്റം തെളിഞ്ഞു/.test(reasoning)
  if (verdict === "GUILTY" && saysNotGuilty && !saysGuilty) return { reason: "reasoning contradicts a GUILTY verdict" }
  if (verdict === "NOT GUILTY" && saysGuilty && !saysNotGuilty) return { reason: "reasoning contradicts a NOT GUILTY verdict" }

  return { value: { verdict, reasoning, fictional_law, punishment } }
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
      max_tokens: 1500,
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
    const plaintiff = String(body.plaintiff ?? "").trim() || "വാദി"
    const defendant = String(body.defendant ?? "").trim() || "പ്രതി"
    const evidence = Array.isArray(body.evidence) ? body.evidence.join("\n") : String(body.evidence ?? "")
    const pctRaw = Number(body.juryGuiltyPercent)
    const guiltyPct = Number.isFinite(pctRaw) ? Math.min(100, Math.max(0, Math.round(pctRaw))) : 50
    const names = [plaintiff, defendant]

    const userPrompt = `CASE
Complainant (വാദി): ${plaintiff}
Defendant (പ്രതി): ${defendant}

Statements:
${String(body.complaint ?? "")}

Evidence and witness statements:
${evidence || "Oral arguments only"}

Jury: ${guiltyPct}% of the jurors voted GUILTY.

Give your judgment now as the JSON object.`

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]

    let reason: string | undefined
    for (let attempt = 0; attempt < 2; attempt++) {
      const retryNote = attempt === 0
        ? []
        : [{
          role: "user",
          content:
            `Your previous answer was rejected because ${reason}. Return the JSON object again, fixing that. Natural spoken Malayalam in Malayalam script, consistent with the verdict.`,
        }]
      const raw = await askGroq(apiKey, [...messages, ...retryNote], attempt === 0 ? 0.8 : 0.5)
      const parsed = parseVerdict(raw, names)
      if (parsed.value) return json({ ...parsed.value, source: "ai" })
      reason = parsed.reason
    }

    return json({ ...templateVerdict(guiltyPct >= 50, guiltyPct, { plaintiff, defendant }), source: "template", reason })
  } catch (err) {
    return json({ error: String(err instanceof Error ? err.message : err) }, 502)
  }
})