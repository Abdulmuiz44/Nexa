import { supabaseServer } from '@/src/lib/supabaseServer'

export async function deductCredits(userId: string, amount: number) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('User not found')
  }

  if (data.credits < amount) {
    throw new Error('Insufficient credits')
  }

  const { error: updateError } = await supabaseServer
    .from('users')
    .update({ credits: data.credits - amount })
    .eq('id', userId)

  if (updateError) {
    throw new Error('Failed to deduct credits')
  }

  return true
}

export async function addCredits(userId: string, amount: number) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('User not found')
  }

  const { error: updateError } = await supabaseServer
    .from('users')
    .update({ credits: data.credits + amount })
    .eq('id', userId)

  if (updateError) {
    throw new Error('Failed to add credits')
  }

  return true
}

export async function getCreditBalance(userId: string) {
  const { data, error } = await supabaseServer
    .from('users')
    .select('credits')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('User not found')
  }

  return data.credits
}
