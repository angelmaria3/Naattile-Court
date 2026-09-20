import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { witness_name, witness_personality, complaint_text } = await req.json()

  const prompt = `You are ${witness_name}, a witness character in a Kerala courtroom comedy: ${witness_personality}.

The case: ${complaint_text}

Give a ONE-LINE witness statement in character, funny and short (under 25 words). Respond with ONLY the statement text, no JSON, no quotes, no preamble.`

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }]
    })
  })

  const data = await response.json()
  const statement = data.choices[0].message.content.trim()

  return new Response(JSON.stringify({ statement }), {
    headers: { "Content-Type": "application/json" }
  })
})