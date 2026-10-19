import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { askJSON, JUDGE_SYSTEM, looksValid } from "../_shared/malayalam.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })

  try {
    

    const { complaint, plaintiff, defendant, evidence, juryGuiltyPercent } = await req.json()

    const user = `CASE
${complaint}

Plaintiff: ${plaintiff}
Defendant: ${defendant}

Evidence and witness statements:
${evidence || "Oral arguments only"}

Jury guilty percentage (context only, not an override): ${juryGuiltyPercent ?? 50}

Weigh both sides fairly and mention at least one specific detail from the case in your reasoning.`

    const obj = await askJSON(
      JUDGE_SYSTEM,
      user,
      (o) =>
        /^(NOT )?GUILTY$/i.test(String(o?.verdict).trim()) &&
        looksValid(o.reasoning) &&
        looksValid(o.punishment) &&
        looksValid(o.fictional_law),
    )

    // No valid verdict after retries: the frontend sees a non-OK response and uses its local Malayalam fallback
    if (!obj) return json({ error: "Judge could not produce a valid verdict" }, 502)

    return json({
      verdict: String(obj.verdict).trim().toUpperCase(),
      reasoning: obj.reasoning,
      fictional_law: obj.fictional_law,
      punishment: obj.punishment,
    })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})