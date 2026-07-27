type EventParams = Record<string, string | number | boolean | undefined>;

const WEBAPP_GA_ID = process.env.NEXT_PUBLIC_GA_WEBAPP_MEASUREMENT_ID;

export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === 'undefined') return;

  if (WEBAPP_GA_ID) {
    window.gtag?.('event', name, {
      send_to: WEBAPP_GA_ID,
      ...params,
    });
  }

  window.clarity?.('event', name);
}
