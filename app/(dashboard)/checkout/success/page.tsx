import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { GradientButton } from '@/components/landing/gradient-button';
import {
  getCashfreeOrderTeam,
  handleCashfreePaymentSuccess,
} from '@/lib/payments/cashfree';
import { getPlan, type PlanId } from '@/lib/payments/plans';

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id: orderId } = await searchParams;
  let success = false;
  let planName = 'Pro';

  if (orderId) {
    try {
      const result = await getCashfreeOrderTeam(orderId);
      if (result) {
        const planMatch = orderId.match(/^fyndlater_\d+_(free|pro)_/);
        const planId = planMatch ? (planMatch[1] as PlanId) : null;
        const plan = planId ? getPlan(planId) : undefined;
        planName = plan?.displayName || 'Pro';

        await handleCashfreePaymentSuccess({
          orderId,
          teamId: result.teamId,
          planName,
        });
        success = true;
      }
    } catch (error) {
      console.error('Checkout success verification failed:', error);
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-md mx-auto text-center">
        {success ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              You&apos;re on {planName}!
            </h1>
            <p className="mt-3 text-gray-600">
              Payment confirmed. Head to your dashboard to start saving with
              Faye.
            </p>
            <div className="mt-8">
              <GradientButton href="/dashboard" size="lg">
                Go to dashboard
              </GradientButton>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">
              Payment processing
            </h1>
            <p className="mt-3 text-gray-600">
              We&apos;re confirming your payment. This may take a moment.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <GradientButton href="/dashboard" size="lg">
                Go to dashboard
              </GradientButton>
              <Link
                href="/pricing"
                className="text-sm text-violet-600 hover:underline"
              >
                Back to pricing
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
