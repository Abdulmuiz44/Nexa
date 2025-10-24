import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FlutterwavePayment } from '@/src/payments/flutterwave';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, amount } = await req.json();

    if (!planId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const flutterwave = new FlutterwavePayment();
    const paymentData = {
      amount,
      currency: 'USD',
      email: session.user.email!,
      name: session.user.name || 'User',
      campaignId: session.user.id, // Using user id
      planId,
    };

    const paymentResult = await flutterwave.initializePayment(paymentData);

    if (paymentResult.status === 'success') {
      return NextResponse.json({ success: true, paymentLink: paymentResult.data?.link });
    } else {
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
