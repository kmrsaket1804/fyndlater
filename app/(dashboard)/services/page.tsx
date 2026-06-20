import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Crown, Gift } from 'lucide-react';
import { Footer } from '@/components/landing/footer';
import { GradientButton } from '@/components/landing/gradient-button';
import { company } from '@/lib/company';
import { formatInrPrice, products, serviceDescription } from '@/lib/products';
import { plans } from '@/lib/payments/plans';

export const metadata: Metadata = {
  title: 'Products & Services — FyndLater',
  description:
    'FyndLater products and subscription pricing in INR. AI memory assistant for saving and finding content.',
};

const planIcons = {
  free: Gift,
  pro: Crown,
} as const;

export default function ServicesPage() {
  return (
    <>
      <div className="bg-gradient-to-b from-violet-50/50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="text-sm font-medium text-violet-600 mb-3">
            Products &amp; Services
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            What we offer
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {serviceDescription}
          </p>
          <p className="mt-3 text-sm text-gray-500">
            All prices are listed in <strong>Indian Rupees (INR)</strong>.
            Payments processed via Cashfree.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Subscription plans
        </h2>
        <p className="text-gray-600 mb-10">
          Digital SaaS subscriptions for individuals. Billed in INR.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          {Object.values(plans).map((plan) => {
            const Icon = planIcons[plan.id];
            const product = products.find((p) =>
              plan.id === 'free' ? p.id === 'free-trial' : p.id === plan.id
            );

            return (
              <div
                key={plan.id}
                className="rounded-3xl border border-gray-100 bg-white shadow-sm p-8"
              >
                {plan.popular && (
                  <span className="inline-block mb-4 text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {plan.displayName}
                    </h3>
                    <p className="text-xs text-gray-500">{product?.type}</p>
                  </div>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-1">
                  {formatInrPrice(plan.amountInr)}
                  {plan.amountInr > 0 && (
                    <span className="text-lg font-normal text-gray-500">
                      {' '}
                      / month
                    </span>
                  )}
                </p>
                <p className="text-sm text-violet-600 font-medium mb-4">
                  Currency: INR (₹)
                </p>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-violet-500 mr-2 mt-0.5 shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <GradientButton
                  href={plan.amountInr > 0 ? '/pricing' : '/login?mode=signup'}
                >
                  {plan.amountInr > 0 ? 'Subscribe' : 'Start free trial'}
                </GradientButton>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-2xl border border-gray-100 bg-gray-50/50 p-8 max-w-4xl">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Product catalogue
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 pr-4 font-medium">Product</th>
                  <th className="py-3 pr-4 font-medium">Type</th>
                  <th className="py-3 pr-4 font-medium">Price (INR)</th>
                  <th className="py-3 font-medium">Billing</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="py-3 pr-4">{product.type}</td>
                    <td className="py-3 pr-4">
                      {formatInrPrice(product.priceInr)}
                      {product.priceInr > 0 ? ' / month' : ''}
                    </td>
                    <td className="py-3">{product.billing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-sm text-gray-500 max-w-4xl">
          <p>
            <strong className="text-gray-700">{company.legalName}</strong>
            <br />
            {company.officeAddress}
            <br />
            Email:{' '}
            <a
              href={`mailto:${company.email}`}
              className="text-violet-600 hover:text-violet-700"
            >
              {company.email}
            </a>{' '}
            · Phone: {company.phone}
          </p>
          <p className="mt-4">
            See also:{' '}
            <Link href="/terms" className="text-violet-600 hover:text-violet-700">
              Terms &amp; Conditions
            </Link>
            ,{' '}
            <Link href="/privacy" className="text-violet-600 hover:text-violet-700">
              Privacy Policy
            </Link>
            ,{' '}
            <Link href="/refunds" className="text-violet-600 hover:text-violet-700">
              Refunds &amp; Cancellations
            </Link>
            ,{' '}
            <Link href="/contact" className="text-violet-600 hover:text-violet-700">
              Contact Us
            </Link>
            .
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
