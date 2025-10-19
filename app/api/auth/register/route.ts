import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import bcrypt from 'bcryptjs';
import { generateApiKey } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { name, email, password, country } = await req.json();

    if (!name || !email || !password || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const api_key = generateApiKey();

    const { error: insertError } = await supabaseServer.from('users').insert({
      name,
      email,
      password_hash,
      country,
      api_key,
    });

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'User created successfully' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
