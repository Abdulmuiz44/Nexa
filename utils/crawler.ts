export async function crawlContext(url: string, sciraKey?: string): Promise<string> {
  // Try Scira first
  try {
    const res = await fetch("https://api.scira.ai/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sciraKey}`,
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: `Summarize key aspects of this website: ${url}` }
        ]
      })
    })
    const data = await res.json()
    if (data.content) return data.content
  } catch (err) {
    console.error("Scira API error:", err)
  }

  // Fallback basic scraping
  try {
    const resp = await fetch(url)
    const html = await resp.text()
    const match = html.match(/<p[^>]*>(.*?)<\/p>/g)
    const text = match ? match.slice(0, 5).join(" ") : ""
    return text.replace(/<[^>]+>/g, "")
  } catch (e) {
    console.error("Scrape fallback failed:", e)
    return ""
  }
}
