import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from '@/src/lib/supabaseAdmin';
import { supabaseServer } from '@/src/lib/supabaseServer';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use supabaseAdmin for authoritative user lookup
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !user) {
            return null;
          }

          // Allow users in onboarding, onboarding_complete, or active states
          if (user.status && !['active', 'onboarding', 'onboarding_complete'].includes(user.status)) {
            return null;
          }

          // Verify password hash
          const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar_url,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;

        // Fetch additional user info for the token on first sign-in
        try {
          const { data: dbUser } = await supabaseAdmin
            .from('users')
            .select('plan, subscription_status, api_key, status')
            .eq('id', user.id)
            .single();

          if (dbUser) {
            token.subscriptionTier = dbUser.plan;
            token.subscriptionStatus = dbUser.subscription_status;
            token.apiKey = dbUser.api_key;
            token.userStatus = dbUser.status;
          }
        } catch (err) {
          console.error('JWT fetch error:', err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).subscriptionTier = token.subscriptionTier as string;
        (session.user as any).subscriptionStatus = token.subscriptionStatus as string;
        (session.user as any).apiKey = token.apiKey as string;
        (session.user as any).status = token.userStatus as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-key-change-in-production",
};


export default authOptions;
