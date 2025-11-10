"use client"

import type React from "react"
import { useState, Suspense, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Sign In to Nexa</CardTitle>
          <CardDescription>Access your AI Growth Agent dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert variant="default">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/auth/signup" className="underline">Sign up</Link>
          </div>
        </CardContent>
      </Card>
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