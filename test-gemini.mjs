const key = process.env.GEMINI_API_KEY
const base = 'https://generativelanguage.googleapis.com/v1beta'
const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': key }

const list = await (await fetch(`${base}/models`, { headers })).json()
console.log(
  (list.models ?? [])
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => m.name.replace('models/', ''))
)

const model = process.env.GEMINI_MODEL
if (model) {
  const prompt = `You are Ammachi, a 70-year-old Kerala grandmother testifying as a witness in a comic village court. Case: "അവൻ എന്റെ പെൻസിൽ എടുത്തു" (He took my pencil). Give your testimony in at most two sentences of colloquial, grammatically correct Malayalam script, in a gossipy, dramatic voice. Output only the testimony.`
  const res = await fetch(`${base}/models/${model}:generateContent`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 },
    }),
  })
  const data = await res.json()
  console.log(res.status, data.candidates?.[0]?.content?.parts?.[0]?.text ?? data)
}