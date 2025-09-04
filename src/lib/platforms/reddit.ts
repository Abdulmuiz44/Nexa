export async function postToReddit(subreddit: string, title: string, content: string) {
  const auth = btoa(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`)
  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  const token = await tokenRes.json()

  const res = await fetch(`https://oauth.reddit.com/r/${subreddit}/api/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `title=${encodeURIComponent(title)}&text=${encodeURIComponent(content)}&kind=self`
  })
  return res.json()
}