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
    if (!Deno.env.get("ANTHROPIC_API_KEY")) {
      return json({ error: "ANTHROPIC_API_KEY secret is not set on this project" }, 500)
    }

    const { witness_name, witness_personality, side, complaint_text, defense_text, evidence } =
      await req.json()

    const sideLabel = side === "plaintiff" ? "complainant's" : "defendant's"

    const user = `You were called by the ${sideLabel} side, so your statement should support that side.
Character note: ${witness_personality || witness_name}

CASE FACTS
Complaint: ${complaint_text}
Defendant's defense: ${defense_text || "not given yet"}
Evidence on record: ${(evidence && evidence.length) ? evidence.join(" | ") : "none yet"}

Mention a specific detail from the complaint (the actual item or event), not generic talk.
Return JSON: {"statement": "..."}`

    const obj = await askJSON(
      witnessSystem(witness_name),
      user,
      (o) => typeof o?.statement === "string" && looksValid(o.statement),
    )

    // If the model fails validation 3 times, use a hand-written Malayalam line instead of garbage
    const statement =
      obj?.statement ?? FALLBACK_WITNESS[witness_name] ?? FALLBACK_WITNESS["Ammachi"]

    return json({ statement })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})