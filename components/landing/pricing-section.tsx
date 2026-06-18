import { Crown, Gift } from 'lucide-react';
import { GradientButton } from './gradient-button';

const plans = [
  {
    name: 'Free Trial',
    description: 'Save your first items and try natural-language search.',
    icon: Gift,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    badge: null,
  },
  {
    name: 'Pro',
    description:
      'For people who save a lot and actually want to find things later.',
    icon: Crown,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    badge: 'Most popular',
  },
];

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
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-3xl bg-white border border-gray-100 shadow-sm p-6 sm:p-8"
            >
              {plan.badge && (
                <span className="absolute -top-3 right-6 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white">
                  {plan.badge}
                </span>
              )}
              <div
                className={`w-12 h-12 rounded-2xl ${plan.iconBg} flex items-center justify-center mb-4`}
              >
                <plan.icon className={`w-6 h-6 ${plan.iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {plan.name}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                {plan.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <GradientButton href="/login?mode=signup" size="lg">
            Start saving with Faye
          </GradientButton>
        </div>
      </div>
    </section>
  );
}
