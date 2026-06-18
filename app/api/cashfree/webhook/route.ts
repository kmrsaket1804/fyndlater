import { NextRequest, NextResponse } from 'next/server';
import {
  getCashfreeOrderTeam,
  handleCashfreePaymentSuccess,
  verifyCashfreeOrder,
} from '@/lib/payments/cashfree';
import { getPlan, type PlanId } from '@/lib/payments/plans';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const orderId = payload?.data?.order?.order_id as string | undefined;
    const paymentStatus = payload?.data?.payment?.payment_status as
      | string
      | undefined;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    if (paymentStatus === 'SUCCESS') {
      await verifyCashfreeOrder(orderId);
      const teamMatch = orderId.match(/^fyndlater_(\d+)_/);
      const planMatch = orderId.match(/^fyndlater_\d+_(free|pro)_/);
      const teamId = teamMatch ? Number(teamMatch[1]) : null;
      const planId = planMatch ? (planMatch[1] as PlanId) : null;
      const plan = planId ? getPlan(planId) : undefined;

      if (teamId) {
        await handleCashfreePaymentSuccess({
          orderId,
          teamId,
          planName: plan?.displayName || 'Pro',
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('order_id');
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
  }

  try {
    const result = await getCashfreeOrderTeam(orderId);
    return NextResponse.json({ success: Boolean(result), result });
  } catch (error) {
    console.error('Cashfree verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
