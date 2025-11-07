import { supabaseServer } from '@/src/lib/supabaseServer'

// Constants per requirements
export const CREDIT_VALUE_USD = 0.10
export const TOKENS_PER_CREDIT = 100_000
export const MODEL_COST_PER_MILLION = 0.39
export const MINIMUM_PURCHASE_CREDITS = 50

export function round4(n: number) {
  return Math.round(n * 10_000) / 10_000
}

export function tokensToCredits(tokens: number) {
  return round4(tokens / TOKENS_PER_CREDIT)
}

export function creditsToUSD(credits: number) {
  return Math.round(credits * CREDIT_VALUE_USD * 100) / 100
}

export function costPerCreditUSD(tokensPerCredit = TOKENS_PER_CREDIT, modelCostPerMillion = MODEL_COST_PER_MILLION) {
  return Math.round(((modelCostPerMillion * (tokensPerCredit / 1_000_000)) + Number.EPSILON) * 1000) / 1000
}

export function profitCalc(tokensPerCredit = TOKENS_PER_CREDIT, modelCostPerMillion = MODEL_COST_PER_MILLION) {
  const cost_per_credit = costPerCreditUSD(tokensPerCredit, modelCostPerMillion) // e.g., 0.039
  const profit_per_credit = Math.round((CREDIT_VALUE_USD - cost_per_credit) * 1000) / 1000
  const profit_margin = Math.round(((profit_per_credit / CREDIT_VALUE_USD) * 100) * 10) / 10
  return { cost_per_credit, profit_per_credit, profit_margin }
}

export async function getCreditBalance(userId: string) {
  const { data, error } = await supabaseServer
    .from('credits_wallet')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return Number(data?.balance ?? 0)
}

export async function ensureWallet(userId: string) {
  await supabaseServer.rpc('ensure_user_wallet', { p_user_id: userId })
}

export async function addCredits(userId: string, amountCredits: number, description = 'credit_top_up', referenceId: string | null = null, metadata: any = {}) {
  const { data, error } = await supabaseServer.rpc('add_credits', {
    p_user_id: userId,
    p_amount: round4(amountCredits),
    p_description: description,
    p_reference: referenceId,
    p_metadata: metadata,
  })
  if (error) throw error
  return Number(data)
}

export async function spendCredits(userId: string, amountCredits: number, description = 'openai_usage', referenceId: string | null = null, metadata: any = {}) {
  const { data, error } = await supabaseServer.rpc('spend_credits', {
    p_user_id: userId,
    p_amount: round4(amountCredits),
    p_description: description,
    p_reference: referenceId,
    p_metadata: metadata,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return { success: !!row?.success, new_balance: Number(row?.new_balance ?? 0) }
}

export async function recordOpenAIUsage(userId: string, usage: { total_tokens?: number, prompt_tokens?: number, completion_tokens?: number }, meta: Record<string, any> = {}) {
  const total = Number(usage?.total_tokens || 0)
  if (!total || total <= 0) return { deducted: 0, balance: await getCreditBalance(userId) }
  const credits = tokensToCredits(total)
  const res = await spendCredits(userId, credits, 'openai_usage', null, { ...meta, total_tokens: total })
  return { deducted: credits, balance: res.new_balance, success: res.success }
}
