'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

export function PurchaseEvent({
  plan,
  value,
  currency,
}: {
  plan: string;
  value: number;
  currency: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent('purchase', { plan, value, currency });
  }, [plan, value, currency]);

  return null;
}
