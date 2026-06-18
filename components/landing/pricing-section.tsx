import Link from 'next/link';
import { Check, Crown, Gift } from 'lucide-react';
import { GradientButton } from './gradient-button';
import { plans } from '@/lib/payments/plans';
import { formatInrPrice } from '@/lib/products';

const planIcons = {
  free: Gift,
  pro: Crown,
} as const;

const paidPlans = [plans.free, plans.pro];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Start with Faye today.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Try it free, upgrade when you&apos;re ready to save more.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            All prices in <strong>INR (₹)</strong>.{' '}
            <Link
              href="/services"
              className="text-violet-600 hover:text-violet-700 font-medium"
            >
              View products &amp; services →
            </Link>
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {paidPlans.map((plan) => {
            const Icon = planIcons[plan.id];
            return (
              <div
                key={plan.id}
                className="relative rounded-3xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8"
              >
                {plan.popular && (
                  <span className="absolute -top-3 right-6 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white">
                    Most popular
                  </span>
                )}
                <div
                  className={`w-12 h-12 rounded-2xl ${
                    plan.id === 'free' ? 'bg-violet-100' : 'bg-pink-100'
                  } flex items-center justify-center mb-4`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      plan.id === 'free' ? 'text-violet-600' : 'text-pink-600'
                    }`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {plan.displayName}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {plan.description}
                </p>
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {formatInrPrice(plan.amountInr)}
                  {plan.amountInr > 0 && (
                    <span className="text-base font-normal text-gray-500">
                      {' '}
                      / month
                    </span>
                  )}
                </p>
                <ul className="mt-5 space-y-2">
                  {plan.features.slice(0, 3).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start text-sm text-gray-600"
                    >
                      <Check className="h-4 w-4 text-violet-500 mr-2 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <GradientButton href="/login?mode=signup" size="lg">
            Start saving with Faye
          </GradientButton>
          <Link
            href="/pricing"
            className="text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            See full pricing →
          </Link>
        </div>
      </div>
    </section>
  );
}
