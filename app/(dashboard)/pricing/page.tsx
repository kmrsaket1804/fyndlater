import { Check, Crown, Gift } from 'lucide-react';
import { plans } from '@/lib/payments/plans';
import { checkoutAction } from '@/lib/payments/actions';
import { SubmitButton } from './submit-button';

const planIcons = {
  free: Gift,
  pro: Crown,
} as const;

export const dynamic = 'force-dynamic';

export default function PricingPage() {
  const paidPlans = [plans.free, plans.pro];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Start with Faye today.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Try it free, upgrade when you&apos;re ready to save more. All prices
          in INR (₹).
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {paidPlans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>
    </main>
  );
}

function PricingCard({
  plan,
}: {
  plan: (typeof plans)[keyof typeof plans];
}) {
  const Icon = planIcons[plan.id];

  return (
    <div className="relative rounded-3xl bg-white border border-gray-100 shadow-sm p-8">
      {plan.popular && (
        <span className="absolute -top-3 right-6 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white">
          Most popular
        </span>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-violet-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {plan.displayName}
        </h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
      <p className="text-4xl font-bold text-gray-900 mb-6">
        {plan.amountInr === 0 ? (
          'Free'
        ) : (
          <>
            ₹{plan.amountInr}{' '}
            <span className="text-lg font-normal text-gray-500">
              / {plan.interval}
            </span>
          </>
        )}
      </p>
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className="h-5 w-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      {plan.amountInr > 0 ? (
        <form action={checkoutAction}>
          <input type="hidden" name="planId" value={plan.id} />
          <SubmitButton label="Upgrade with Cashfree" />
        </form>
      ) : (
        <SubmitButton href="/login?mode=signup" label="Start free" />
      )}
    </div>
  );
}
