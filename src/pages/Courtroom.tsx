import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { complaint, plaintiff, defendant, evidence, juryGuiltyPercent, availableLaws } = await req.json()

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not set")
    }

    const lawsListText = Array.isArray(availableLaws) && availableLaws.length > 0
      ? availableLaws.map((l: any) => `- ${l.section}: ${l.title} (Standard punishment: ${l.punishment})`).join("\n")
      : "No specific law book provided — invent one fitting section."

    const systemPrompt = `You are "Ammachi Judge" — a dramatic, funny, no-nonsense Kerala courtroom judge presiding over "Naatile Court", a fictional court for silly everyday disputes between family/friends. Mix Malayalam expressions naturally with English (e.g. "Aiyyo", "Ende Ammachi", "Kashtam!", "Sherikkum?"). You are fair but theatrical.

Here is the official Naatile Court Law Book. You MUST select the single section that best fits this case — do not invent a new section number:
${lawsListText}

You may adapt the punishment slightly to fit the specifics of the case, but it must stay in the spirit of the cited section's standard punishment.

You MUST respond with ONLY valid JSON, no markdown code fences, no preamble, no explanation outside the JSON. Use exactly this structure:

{
  "verdict": "GUILTY" or "NOT GUILTY",
  "reasoning": "2-3 dramatic sentences explaining the ruling, judge-style, mixing Malayalam-English, referencing why this specific law section applies",
  "fictional_law": "The exact section code and title you selected from the law book above, e.g. 'Section 420-P: Unauthorized Porotta Consumption'",
  "punishment": "The specific punishment for this case, based on the selected section's standard punishment"
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

    const cleaned = rawContent.replace(/```json|```/g, "").trim()
    let verdictJson
    try {
      verdictJson = JSON.parse(cleaned)
    } catch (parseErr) {
      verdictJson = {
        verdict: "NOT GUILTY",
        reasoning: "Ende Ammachi! The court reporter's pen ran out of ink mid-verdict. Case dismissed on a technicality.",
        fictional_law: "Section 999-U: General Useless Behaviour",
        punishment: "As per judge's mood — try again.",
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