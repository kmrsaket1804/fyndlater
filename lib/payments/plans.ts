export type PlanId = 'free' | 'pro';

export type Plan = {
  id: PlanId;
  name: string;
  displayName: string;
  description: string;
  amountInr: number;
  interval: 'month';
  trialDays: number;
  features: string[];
  popular?: boolean;
};

export const plans: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free Trial',
    displayName: 'Free Trial',
    description: 'Save your first items and try natural-language search.',
    amountInr: 0,
    interval: 'month',
    trialDays: 7,
    features: [
      'Save your first items via Faye',
      'Natural-language search',
      'Smart collections & auto-tagging',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    displayName: 'Pro',
    description:
      'For people who save a lot and actually want to find things later.',
    amountInr: 499,
    interval: 'month',
    trialDays: 7,
    features: [
      'Unlimited saves',
      'Priority retrieval',
      'Advanced collections',
      'Early access to new features',
    ],
    popular: true,
  },
};

export function getPlan(planId: string): Plan | undefined {
  return plans[planId as PlanId];
}
