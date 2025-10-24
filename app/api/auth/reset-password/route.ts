import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const { data: user } = await supabaseServer
      .from('users')
      .select('id, password_reset_token_expires_at')
      .eq('password_reset_token', hashedToken)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(user.password_reset_token_expires_at);

    if (now > expiresAt) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        password_hash,
        password_reset_token: null,
        password_reset_token_expires_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error resetting password:', updateError);
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password has been reset successfully.' });

  } catch (error: unknown) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }, { status: 500 });
  }
}
