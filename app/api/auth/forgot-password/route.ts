import { NextResponse } from 'next/server';
import { supabaseServer } from '@/src/lib/supabaseServer';
import crypto from 'crypto';
import { transporter, mailOptions } from '@/lib/nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // Don't reveal that the user doesn't exist
      return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        password_reset_token: passwordResetToken,
        password_reset_token_expires_at: passwordResetTokenExpiresAt,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user with reset token:', updateError);
      return NextResponse.json({ error: 'Failed to generate reset token' }, { status: 500 });
    }

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    try {
      await transporter.sendMail({
        ...mailOptions,
        to: email,
        subject: 'Reset Your Password',
        text: `Click here to reset your password: ${resetUrl}`,
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'If an account with this email exists, a password reset link has been sent.' });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
