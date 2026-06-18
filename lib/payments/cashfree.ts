import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { redirect } from 'next/navigation';
import { Team, User } from '@/lib/db/schema';
import { updateTeamSubscription } from '@/lib/db/queries';
import { getPlan, type PlanId } from './plans';

let cashfreeClient: Cashfree | undefined;

function getCashfreeEnvironment() {
  return process.env.CASHFREE_ENVIRONMENT === 'production'
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;
}

export function getCashfree() {
  if (!cashfreeClient) {
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      throw new Error('Cashfree credentials are not configured');
    }

    cashfreeClient = new Cashfree(getCashfreeEnvironment(), appId, secretKey);
  }

  return cashfreeClient;
}

export function isCashfreeConfigured() {
  return Boolean(
    process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY
  );
}

function getBaseUrl() {
  return process.env.BASE_URL || 'http://localhost:3000';
}

function buildOrderId(teamId: number, planId: PlanId) {
  return `fyndlater_${teamId}_${planId}_${Date.now()}`;
}

export async function createCashfreeOrder({
  team,
  user,
  planId,
}: {
  team: Team;
  user: User;
  planId: PlanId;
}) {
  const plan = getPlan(planId);
  if (!plan || plan.amountInr <= 0) {
    throw new Error('Invalid paid plan selected');
  }

  const orderId = buildOrderId(team.id, planId);
  const cashfree = getCashfree();

  const response = await cashfree.PGCreateOrder({
    order_id: orderId,
    order_amount: plan.amountInr,
    order_currency: 'INR',
    customer_details: {
      customer_id: `team_${team.id}`,
      customer_email: user.email,
      customer_phone: '9999999999',
      customer_name: user.name || user.email,
    },
    order_meta: {
      return_url: `${getBaseUrl()}/checkout/success?order_id={order_id}`,
      notify_url: `${getBaseUrl()}/api/cashfree/webhook`,
    },
    order_note: `FyndLater ${plan.displayName} subscription`,
  });

  const data = response.data;
  if (!data.payment_session_id) {
    throw new Error('Failed to create Cashfree payment session');
  }

  return {
    orderId,
    paymentSessionId: data.payment_session_id,
    plan,
  };
}

export async function createCashfreeCheckout({
  team,
  user,
  planId,
}: {
  team: Team | null;
  user: User | null;
  planId: string;
}) {
  if (!team || !user) {
    redirect(`/login?mode=signup&redirect=checkout&planId=${planId}`);
  }

  const plan = getPlan(planId);
  if (!plan) {
    redirect('/pricing');
  }

  if (plan.amountInr === 0) {
    redirect('/dashboard');
  }

  const order = await createCashfreeOrder({ team, user, planId: plan.id });
  redirect(
    `/checkout?session_id=${encodeURIComponent(order.paymentSessionId)}&plan=${plan.id}`
  );
}

export async function verifyCashfreeOrder(orderId: string) {
  const cashfree = getCashfree();
  const response = await cashfree.PGFetchOrder(orderId);
  return response.data;
}

export async function handleCashfreePaymentSuccess({
  orderId,
  teamId,
  planName,
}: {
  orderId: string;
  teamId: number;
  planName: string;
}) {
  await updateTeamSubscription(teamId, {
    stripeSubscriptionId: orderId,
    stripeProductId: 'cashfree',
    planName,
    subscriptionStatus: 'active',
  });
}

export async function handleCashfreeWebhook(payload: {
  type?: string;
  data?: {
    order?: {
      order_id?: string;
      order_tags?: { team_id?: string; plan_id?: string };
    };
    payment?: {
      payment_status?: string;
    };
  };
}) {
  const paymentStatus = payload.data?.payment?.payment_status;
  const orderId = payload.data?.order?.order_id;

  if (!orderId || paymentStatus !== 'SUCCESS') {
    return;
  }

  await verifyCashfreeOrder(orderId);
  const teamId = extractTeamIdFromOrderId(orderId);
  const planId = extractPlanIdFromOrderId(orderId);
  const plan = planId ? getPlan(planId) : undefined;

  if (!teamId) {
    console.error('Could not resolve team from Cashfree order:', orderId);
    return;
  }

  await handleCashfreePaymentSuccess({
    orderId,
    teamId,
    planName: plan?.displayName || 'Pro',
  });
}

function extractTeamIdFromOrderId(orderId: string) {
  const match = orderId.match(/^fyndlater_(\d+)_/);
  return match ? Number(match[1]) : null;
}

function extractPlanIdFromOrderId(orderId: string) {
  const match = orderId.match(/^fyndlater_\d+_(free|pro)_/);
  return match ? (match[1] as PlanId) : null;
}

export async function getCashfreeOrderTeam(orderId: string) {
  const teamId = extractTeamIdFromOrderId(orderId);
  if (!teamId) {
    return null;
  }

  const order = await verifyCashfreeOrder(orderId);
  if (order.order_status !== 'PAID') {
    return null;
  }

  return { teamId, order };
}
