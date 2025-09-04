export async function postToX(content: string) {
  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.X_BEARER_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text: content })
  })
  return res.json()
}