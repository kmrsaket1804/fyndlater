import { checkoutAction } from '@/lib/payments/actions';
import { Check, Crown, Gift } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

export const dynamic = 'force-dynamic';

const planMeta: Record<
  string,
  { displayName: string; icon: typeof Gift; features: string[]; popular?: boolean }
> = {
  Base: {
    displayName: 'Free Trial',
    icon: Gift,
    features: [
      'Save your first items via Faye',
      'Natural-language search',
      'Smart collections & auto-tagging',
    ],
  },
  Plus: {
    displayName: 'Pro',
    icon: Crown,
    features: [
      'Unlimited saves',
      'Priority retrieval',
      'Advanced collections',
      'Early access to new features',
    ],
    popular: true,
  },
};

export default async function PricingPage() {
  let prices: Awaited<ReturnType<typeof getStripePrices>> = [];
  let products: Awaited<ReturnType<typeof getStripeProducts>> = [];

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      [prices, products] = await Promise.all([
        getStripePrices(),
        getStripeProducts(),
      ]);
    } catch (error) {
      console.error('Failed to load Stripe pricing:', error);
    }
  }

  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Start with Faye today.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Try it free, upgrade when you&apos;re ready to save more.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <PricingCard
          name={basePlan?.name || 'Base'}
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          priceId={basePrice?.id}
        />
        <PricingCard
          name={plusPlan?.name || 'Plus'}
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          priceId={plusPrice?.id}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  priceId,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  priceId?: string;
}) {
  const meta = planMeta[name] || {
    displayName: name,
    icon: Gift,
    features: [],
  };
  const Icon = meta.icon;

  return (
    <div className="relative rounded-3xl bg-white border border-gray-100 shadow-sm p-8">
      {meta.popular && (
        <span className="absolute -top-3 right-6 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white">
          Most popular
        </span>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-violet-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          {meta.displayName}
        </h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        {trialDays} day free trial included
      </p>
      <p className="text-4xl font-bold text-gray-900 mb-6">
        ${price / 100}{' '}
        <span className="text-lg font-normal text-gray-500">
          / {interval}
        </span>
      </p>
      <ul className="space-y-3 mb-8">
        {meta.features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className="h-5 w-5 text-violet-500 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton />
      </form>
    </div>
  );
}
