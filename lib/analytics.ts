type EventParams = Record<string, string | number | boolean | undefined>;

const WEBAPP_GA_ID = process.env.NEXT_PUBLIC_GA_WEBAPP_MEASUREMENT_ID;

export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === 'undefined' || !WEBAPP_GA_ID) return;
  window.gtag?.('event', name, {
    send_to: WEBAPP_GA_ID,
    ...params,
  });
}
