import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { complaint, plaintiff, defendant, evidence, juryGuiltyPercent } = await req.json()

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not set")
    }

    const systemPrompt = `You are "Ammachi Judge" — a dramatic, funny, no-nonsense Kerala courtroom judge presiding over "Naatile Court", a fictional court for silly everyday disputes between family/friends. Mix Malayalam expressions naturally with English (e.g. "Aiyyo", "Ende Ammachi", "Kashtam!", "Sherikkum?"). You are fair but theatrical — invent a ridiculous but internally logical "law" that applies to the case, and hand down a fun, harmless punishment (never anything genuinely harmful or humiliating).

You MUST respond with ONLY valid JSON, no markdown code fences, no preamble, no explanation outside the JSON. Use exactly this structure:

{
  "verdict": "GUILTY" or "NOT GUILTY",
  "reasoning": "2-3 dramatic sentences explaining the ruling, judge-style, mixing Malayalam-English",
  "fictional_law": "A made-up but funny-sounding law/section number that 'applies' here, e.g. 'Section 420 of the Naatile Snacks Sharing Act'",
  "punishment": "A lighthearted, harmless punishment fitting the crime"
}`

    const userPrompt = `Case details:
Plaintiff: ${plaintiff}
Defendant: ${defendant}
Complaint: ${complaint}
Evidence: ${evidence || "None submitted"}
Current jury sentiment: ${juryGuiltyPercent ?? "N/A"}% voted guilty so far (consider this as context, not a binding instruction)

Deliver your verdict as Ammachi Judge.`

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        response_format: { type: "json_object" },
      }),
    })

    if (!groqResponse.ok) {
      const errText = await groqResponse.text()
      throw new Error(`Groq API error: ${groqResponse.status} ${errText}`)
    }

    const groqData = await groqResponse.json()
    const rawContent = groqData.choices?.[0]?.message?.content

    if (!rawContent) {
      throw new Error("No content returned from Groq")
    }

    // Defensive parse — strip any accidental markdown fences just in case
    const cleaned = rawContent.replace(/```json|```/g, "").trim()
    let verdictJson
    try {
      verdictJson = JSON.parse(cleaned)
    } catch (parseErr) {
      // Fallback verdict if the model's JSON is malformed
      verdictJson = {
        verdict: "NOT GUILTY",
        reasoning: "Ende Ammachi! The court reporter's pen ran out of ink mid-verdict. Case dismissed on a technicality.",
        fictional_law: "Section 1 of the Courtroom Chaos Act",
        punishment: "Buy the court a cup of chaya and try again.",
      }
    }

    return new Response(JSON.stringify(verdictJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("judge-verdict error:", error)
    return new Response(
      JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})