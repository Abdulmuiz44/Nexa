"use client";

import type React from "react"
import { useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navigation } from "@/components/Navigation"
import Link from "next/link"

function SignUpForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push("/auth/login?message=Account created successfully. Please log in to continue.");
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <Navigation />
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-6">
        <div className="w-full max-w-md border border-gray-200 dark:border-gray-800 rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-gray-600 dark:text-gray-400">Start your AI-powered marketing journey</p>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-black dark:text-white">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                type="text" 
                value={formData.name} 
                onChange={handleChange}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-black dark:text-white">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-black dark:text-white">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                value={formData.password} 
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                required 
                minLength={8} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-black dark:text-white">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                value={formData.confirmPassword} 
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-black dark:text-white"
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-black dark:text-white underline hover:no-underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}
