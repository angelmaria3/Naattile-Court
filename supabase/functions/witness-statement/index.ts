import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { askJSON, witnessSystem, looksValid, FALLBACK_WITNESS } from "../_shared/malayalam.ts"

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
    const {
      witness_name, witness_personality, side, plaintiff, defendant,
      complaint_text, defense_text, evidence,
    } = await req.json()

    const sideLabel = side === "defendant" ? "defendant's" : "complainant's"

    const user = `You were called by the ${sideLabel} side, so lean towards that side.
Character note: ${witness_personality || witness_name}

CASE FACTS
Complainant: ${plaintiff || "the complainant"}
Defendant: ${defendant || "the defendant"}
Complaint: ${complaint_text}
Defense: ${defense_text || "not given yet"}
Evidence: ${Array.isArray(evidence) && evidence.length ? evidence.join(" | ") : "none yet"}

Mention the actual item or event from the complaint by its correct Malayalam name, and use the people's names written in Malayalam script.
Return JSON: {"statement": "..."}`

    const obj = await askJSON(
      witnessSystem(witness_name),
      user,
      (o) => typeof o?.statement === "string" && o.statement.length <= 400 && looksValid(o.statement),
    )

    const statement = obj?.statement ?? FALLBACK_WITNESS[witness_name] ?? FALLBACK_WITNESS["Ammachi"]
    return json({ statement, source: obj ? "ai" : "template" })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502)
  }
})