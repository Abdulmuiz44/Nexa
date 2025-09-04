export async function generateContent(prompt: string, tool: any): Promise<string> {
  const fullPrompt = `${prompt}\n\nTool: ${tool.name}\nDescription: ${tool.description}\nURL: ${tool.url}\nKeywords: ${tool.keywords.join(', ')}`

  const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: fullPrompt,
      parameters: { max_new_tokens: 280, temperature: 0.7 }
    }),
  })

  const data = await response.json()
  return data[0]?.generated_text || "Generated content"
}