import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import {
  createCashfreeOrder,
  isCashfreeConfigured,
} from '@/lib/payments/cashfree';
import { getPlan, type PlanId } from '@/lib/payments/plans';

export async function POST(request: NextRequest) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json(
      { error: 'Cashfree is not configured' },
      { status: 503 }
    );
  }

  const user = await getUser();
  const team = await getTeamForUser();

  if (!user || !team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const planId = body.planId as PlanId;
  const plan = getPlan(planId);

  if (!plan || plan.amountInr <= 0) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  try {
    const order = await createCashfreeOrder({ team, user, planId: plan.id });
    return NextResponse.json({
      paymentSessionId: order.paymentSessionId,
      orderId: order.orderId,
      plan: order.plan,
    });
  } catch (error) {
    console.error('Cashfree order creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
