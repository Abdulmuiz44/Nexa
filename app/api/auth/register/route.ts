import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import bcrypt from 'bcryptjs';
import { generateApiKey } from '@/lib/utils';
import { FlutterwavePayment } from '@/src/payments/flutterwave';

const planPrices: { [key: string]: number } = {
    growth: 49,
    scale: 149,
    enterprise: 499,
};

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: existingUser } = await supabaseServer.from('users').select('id').eq('email', email).single();
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const api_key = generateApiKey();

    const { data: newUser, error: insertError } = await supabaseServer.from('users').insert({
      name,
      email,
      password_hash,
      api_key,
      status: 'onboarding',
    }).select().single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
