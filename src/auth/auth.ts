import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { compare } from "bcryptjs"
import { supabase } from "@/src/lib/db"
import { generateApiKey } from "@/lib/utils"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          return null
        }

        const isValid = await compare(credentials.password, user.password_hash)

        if (!isValid) {
          return null
        }

        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date() })
          .eq('id', user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
          subscriptionTier: user.subscription_tier,
          apiKey: user.api_key,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email!)
          .single()

        if (!existingUser) {
          const apiKey = generateApiKey()
          await supabase.from('users').insert({
            email: user.email,
            name: user.name,
            avatar_url: user.image,
            api_key: apiKey,
            password_hash: 'oauth',
          })
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.subscriptionTier = user.subscriptionTier
        token.apiKey = user.apiKey
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.apiKey = token.apiKey as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || require("crypto").randomBytes(32).toString("hex"),
}