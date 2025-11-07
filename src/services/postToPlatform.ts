import { supabaseServer } from '@/src/lib/supabaseServer'
import { TwitterApi } from 'twitter-api-v2'
import Snoowrap from 'snoowrap'

export type SocialPlatform = 'twitter' | 'reddit'

export interface PostInput {
  platform: SocialPlatform
  userId: string
  content: string
  mediaUrl?: string | null
}

export interface PostResponse {
  success: boolean
  platformPostId?: string
  platformPostUrl?: string
  error?: string
}

async function getUserToken(userId: string, platform: SocialPlatform): Promise<{
  access_token: string
  refresh_token?: string | null
  expires_at?: string | null
}> {
  const { data, error } = await supabaseServer
    .from('user_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('platform', platform)
    .maybeSingle()

  if (error || !data) {
    throw new Error('OAuth token not found for platform')
  }

  return data
}

async function persistToken(userId: string, platform: SocialPlatform, updates: Partial<{ access_token: string; refresh_token: string; expires_at: string }>) {
  await supabaseServer
    .from('user_tokens')
    .update(updates)
    .eq('user_id', userId)
    .eq('platform', platform)
}

async function ensureTwitterClient(userId: string): Promise<TwitterApi> {
  const token = await getUserToken(userId, 'twitter')
  const now = Date.now()
  const expiresAt = token.expires_at ? new Date(token.expires_at).getTime() : undefined

  // If token is near expiry and refresh token exists, refresh
  if (expiresAt && token.refresh_token && expiresAt - now < 60_000) {
    const appClient = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID as string,
      clientSecret: process.env.TWITTER_CLIENT_SECRET as string,
    })
    const refreshed = await appClient.refreshOAuth2Token(token.refresh_token)
    await persistToken(userId, 'twitter', {
      access_token: refreshed.accessToken,
      refresh_token: refreshed.refreshToken,
      expires_at: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
    })
    return refreshed.client
  }

  return new TwitterApi(token.access_token)
}

async function ensureRedditClient(userId: string): Promise<Snoowrap> {
  const token = await getUserToken(userId, 'reddit')
  const client = new Snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT || 'nexa-app/1.0 by nexa',
    clientId: process.env.REDDIT_CLIENT_ID as string,
    clientSecret: process.env.REDDIT_CLIENT_SECRET as string,
    refreshToken: token.refresh_token || undefined,
    accessToken: token.access_token,
  })
  return client
}

export async function post_to_platform({ platform, userId, content, mediaUrl }: PostInput): Promise<PostResponse> {
  try {
    if (platform === 'twitter') {
      const client = await ensureTwitterClient(userId)
      const res = await client.v2.tweet({ text: content })
      const id = res.data?.id
      return {
        success: true,
        platformPostId: id,
        platformPostUrl: id ? `https://x.com/i/web/status/${id}` : undefined,
      }
    }

    if (platform === 'reddit') {
      const reddit = await ensureRedditClient(userId)

      // Default to posting to user profile (u_username) if no subreddit provided
      // Optionally, you may store a preferred subreddit in connected_accounts.meta
      const { data: acct } = await supabaseServer
        .from('connected_accounts')
        .select('username')
        .eq('user_id', userId)
        .eq('platform', 'reddit')
        .maybeSingle()

      const profileSub = acct?.username ? `u_${acct.username}` : undefined
      const title = content.slice(0, 280)
      const submission = await reddit.submitSelfpost({
        subredditName: profileSub || 'u_undefined',
        title,
        text: content,
      })

      return {
        success: true,
        platformPostId: submission.id,
        platformPostUrl: submission.url,
      }
    }

    throw new Error('Unsupported platform')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to post'
    return { success: false, error: msg }
  }
}