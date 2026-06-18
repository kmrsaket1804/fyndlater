'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { plans } from '@/lib/payments/plans';

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: '_self' | '_blank' | '_top' | '_modal';
      }) => Promise<void>;
    };
  }
}

export function CashfreeCheckout() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const planId = searchParams.get('plan');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const plan = planId ? plans[planId as keyof typeof plans] : null;
  const mode =
    process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'production'
      ? 'production'
      : 'sandbox';

  useEffect(() => {
    if (!sessionId) {
      setError('Missing payment session. Please try again from pricing.');
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = async () => {
      try {
        if (!window.Cashfree) {
          throw new Error('Cashfree SDK failed to load');
        }

        const cashfree = window.Cashfree({ mode });
        await cashfree.checkout({
          paymentSessionId: sessionId,
          redirectTarget: '_self',
        });
      } catch (checkoutError) {
        console.error(checkoutError);
        setError('Unable to open checkout. Please try again.');
        setLoading(false);
      }
    };
    script.onerror = () => {
      setError('Failed to load payment SDK.');
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [sessionId, mode]);

  if (!sessionId) {
    return (
      <div className="text-center">
        <p className="text-gray-600">{error}</p>
        <Link
          href="/pricing"
          className="mt-4 inline-block text-violet-600 hover:underline text-sm"
        >
          Back to pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md mx-auto">
      {plan && (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Upgrading to</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {plan.displayName}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ₹{plan.amountInr}
            <span className="text-sm font-normal text-gray-500"> / month</span>
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          <p>Opening secure checkout...</p>
        </div>
      ) : (
        <div>
          <p className="text-red-600 text-sm">{error}</p>
          <Link
            href="/pricing"
            className="mt-4 inline-block text-violet-600 hover:underline text-sm"
          >
            Back to pricing
          </Link>
        </div>
      )}
    </div>
  );
}
