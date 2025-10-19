import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { supabaseServer } from "@/src/lib/supabaseServer"
import { generateApiKey } from "@/lib/utils"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Try to find an existing user by email
        const { data: existingUser, error } = await supabaseServer
          .from('users')
          .select('id, email, name, avatar_url, subscription_tier, api_key')
          .eq('email', user.email!)
          .single()

        // If there's an error that's not the expected "no rows" case, abort sign-in
        const isNoRowsError = !!(error && /no rows|not found|0 rows/i.test(error.message || ''))
        if (error && !isNoRowsError) {
          console.error('Sign-in user lookup error:', error)
          return false
        }

        let dbUser = existingUser

        // If user doesn't exist, attempt a safe upsert (handles concurrent inserts)
        if (!dbUser) {
          const apiKey = generateApiKey()
          // Use upsert with onConflict on email to avoid TOCTOU races.
          // Request the returning representation so we get the authoritative row when possible.
          const upsertPayload = {
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            api_key: apiKey,
            password_hash: 'oauth',
          }

          const { data: upsertData, error: upsertError } = await supabaseServer
            .from('users')
            .upsert(upsertPayload, { onConflict: 'email' })
            .select('id, email, name, avatar_url, subscription_tier, api_key')
            .single()

          if (upsertError) {
            console.error('Sign-in upsert error:', upsertError)
            return false
          }

          // If upsert returned a row, use it; otherwise re-query to get authoritative row
          if (upsertData) {
            dbUser = upsertData
          } else {
            const { data: fetched, error: fetchError } = await supabaseServer
              .from('users')
              .select('id, email, name, avatar_url, subscription_tier, api_key')
              .eq('email', user.email!)
              .single()

            if (fetchError || !fetched) {
              console.error('Sign-in post-upsert fetch error:', fetchError)
              return false
            }

            dbUser = fetched
          }
        }

        // Require an api_key from the authoritative DB row before allowing sign-in
        if (!dbUser || !dbUser.api_key) {
          console.error('Sign-in aborted: missing api_key on user', { email: user.email })
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      try {
        // On first sign in, `user` is present (provider profile). Lookup authoritative DB user
        if (user) {
          const email = (user as any).email as string | undefined
          if (email) {
            const { data: dbUser, error } = await supabaseServer
              .from('users')
              .select('id, api_key, subscription_tier')
              .eq('email', email)
              .single()

            if (error || !dbUser) {
              console.error('JWT callback DB lookup failed:', error)
            } else {
              token.subscriptionTier = dbUser.subscription_tier
              token.apiKey = dbUser.api_key
              token.sub = dbUser.id
            }
          }
        }

        // For subsequent requests, if token is missing critical fields, refresh from DB using sub
        if (!token.apiKey && token.sub) {
          const { data: dbUser, error } = await supabaseServer
            .from('users')
            .select('id, api_key, subscription_tier')
            .eq('id', token.sub as string)
            .single()

          if (!error && dbUser) {
            token.subscriptionTier = dbUser.subscription_tier
            token.apiKey = dbUser.api_key
          }
        }
      } catch (err) {
        console.error('JWT callback error:', err)
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        // Ensure session.user exists
        ;(session.user as any).id = token.sub!
        ;(session.user as any).subscriptionTier = token.subscriptionTier as string
        ;(session.user as any).apiKey = token.apiKey as string
      }
      return session
    },
  },
  pages: {
  signIn: "/auth/signin",
  newUser: "/auth/signup",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || require("crypto").randomBytes(32).toString("hex"),
}
