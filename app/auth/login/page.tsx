"use client"

import type React from "react"
import { useState, Suspense, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation } from "@/components/Navigation"
import Link from "next/link"

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

function LoginComponent() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      router.push('/chat');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid credentials")
      } else {
        // Decide destination based on onboarding status
        try {
          const res = await fetch('/api/onboarding', { method: 'GET' })
          if (res.ok) {
            const data = await res.json()
            if (data?.status === 'onboarding_complete' || data?.status === 'active' || data?.status === 'agent_active') {
              router.replace('/chat')
            } else {
              router.replace('/onboarding')
            }
          } else {
            // Fallback to chat if status check fails
            router.replace('/chat')
          }
        } catch {
          router.replace('/chat')
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-6">
        <div className="w-full max-w-md border border-gray-200 dark:border-gray-800 rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Sign In</h1>
            <p className="text-gray-600 dark:text-gray-400">Access your AI Growth Agent dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-green-600 dark:text-green-400 text-sm">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black dark:text-white">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-black dark:text-white">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-black dark:text-white underline hover:no-underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginComponent />
    </Suspense>
  )
}
