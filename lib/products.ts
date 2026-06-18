import { plans } from '@/lib/payments/plans';

export const serviceDescription =
  'FyndLater is a SaaS AI memory assistant. Users save reels, posts, links, and screenshots via Faye on Instagram; content is organized into smart collections and retrieved later using natural-language search through the FyndLater web app.';

export const products = [
  {
    id: 'free-trial',
    name: 'FyndLater Free Trial',
    type: 'Digital subscription (trial)',
    description:
      'Try saving items via Faye, natural-language search, and smart collections for 7 days at no charge.',
    priceInr: plans.free.amountInr,
    billing: 'Free for 7 days, then upgrade optional',
    currency: 'INR',
  },
  {
    id: 'pro',
    name: 'FyndLater Pro',
    type: 'Digital subscription',
    description:
      'Unlimited saves, priority retrieval, advanced collections, and early access to new features.',
    priceInr: plans.pro.amountInr,
    billing: 'Billed monthly in advance',
    currency: 'INR',
  },
] as const;

export function formatInrPrice(amount: number) {
  if (amount === 0) return 'Free';
  return `₹${amount.toLocaleString('en-IN')}`;
}
