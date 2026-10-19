import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { askJSON, jurorSystem, looksValid, JUROR_IDS } from "../_shared/malayalam.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

const list = (a?: string[]) => (a && a.length ? a.map((x) => `- ${x}`).join("\n") : "- none")

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  try {
    const {
      juror_id, plaintiff, defendant, complaint_text, defense_text,
      plaintiff_evidence, defendant_evidence, witnesses,
    } = await req.json()

    if (!JUROR_IDS.includes(juror_id)) return json({ error: "Unknown juror" }, 400)

    const user = `CASE
Plaintiff (complainant): ${plaintiff}
Defendant: ${defendant}

Complaint: ${complaint_text}
Defense: ${defense_text || "No defense statement was given."}

Plaintiff's evidence:
${list(plaintiff_evidence)}

Defendant's evidence:
${list(defendant_evidence)}

Witness statements:
${list(witnesses)}

Give your independent vote.`

    const obj = await askJSON(
      jurorSystem(juror_id),
      user,
      (o) => /^(NOT )?GUILTY$/i.test(String(o?.vote).trim()) && looksValid(o?.reasoning),
    )

    if (!obj) return json({ error: "Juror could not produce a valid vote. Please retry." }, 502)

    const guilty = !/^NOT/i.test(String(obj.vote).trim())
    return json({ vote: guilty ? "guilty" : "not_guilty", reasoning: obj.reasoning })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500)
  }
})