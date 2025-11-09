import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateApiKey(): string {
  return `nexa_${randomBytes(32).toString("hex")}`
}

export function validateApiKey(apiKey: string): boolean {
  return /^nexa_[a-f0-9]{64}$/.test(apiKey)
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generateNextAuthSecret(): string {
  return require("crypto").randomBytes(32).toString("hex")
}

export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name]
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value || defaultValue!
}

export function getDatabaseUrl(): string {
  return getEnvVar("DATABASE_URL")
}
