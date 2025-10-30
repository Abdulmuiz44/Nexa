import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseServer } from "@/src/lib/supabaseServer"
import { generateApiKey } from "@/lib/utils"
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("credentials", credentials);
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { data: user, error } = await supabaseServer
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        console.log("user", user);

        if (error || !user) {
          return null;
        }

        if (user.status !== 'active' && user.status !== 'onboarding') {
          return null;
        }

        if (!user.password_hash) {
          return null; // Or handle users who signed up with OAuth differently
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash || '');

        console.log("isValid", isValid);

        if (isValid) {
          return { id: user.id, name: user.name, email: user.email, image: user.avatar_url };
        } else {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      try {
        // On first sign in, `user` is present (provider profile). Lookup authoritative DB user
        if (user) {
          const email = (user as any).email as string | undefined
          if (email) {
            const { data: dbUser, error } = await supabaseServer
              .from('users')
              .select('id, api_key, plan, subscription_status')
              .eq('email', email)
              .single()

            if (error || !dbUser) {
              console.error('JWT callback DB lookup failed:', error)
            } else {
              token.subscriptionTier = dbUser.plan
              token.subscriptionStatus = dbUser.subscription_status
              token.apiKey = dbUser.api_key
              token.sub = dbUser.id
            }
          }
        }

        // For subsequent requests, if token is missing critical fields, refresh from DB using sub
        if (!token.apiKey && token.sub) {
          const { data: dbUser, error } = await supabaseServer
            .from('users')
            .select('id, api_key, plan, subscription_status')
            .eq('id', token.sub as string)
            .single()

          if (!error && dbUser) {
            token.subscriptionTier = dbUser.plan
            token.subscriptionStatus = dbUser.subscription_status
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
        ;(session.user as any).subscriptionStatus = token.subscriptionStatus as string
        ;(session.user as any).apiKey = token.apiKey as string
      }
      return session
    },
  },
  pages: {
  signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
}
