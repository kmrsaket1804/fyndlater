import { Suspense } from 'react';
import { CashfreeCheckout } from '@/components/payments/cashfree-checkout';

export default function CheckoutPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Complete your upgrade
        </h1>
        <Suspense
          fallback={
            <p className="text-center text-gray-500">Loading checkout...</p>
          }
        >
          <CashfreeCheckout />
        </Suspense>
      </div>
    </main>
  );
}
