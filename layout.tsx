import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/app/providers"
import { initializeDatabase } from "@/lib/db"

// ✅ Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Nexa - AI Growth Agent",
  description: "Autonomous AI agent for marketing and growth",
  generator: "v0.app",
}

// ✅ Initialize database only on the server
if (typeof window === "undefined") {
  try {
    initializeDatabase()
  } catch (err) {
    console.error("Database initialization failed:", err)
  }
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
