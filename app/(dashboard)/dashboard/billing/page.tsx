'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { plans } from '@/lib/payments/plans';
import useSWR from 'swr';
import { TeamDataWithMembers } from '@/lib/db/schema';
import { GradientButton } from '@/components/landing/gradient-button';
import { Check } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BillingPage() {
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const planName = team?.planName || 'Free Trial';
  const isPro = planName.toLowerCase().includes('pro');
  const savesUsed = 42;
  const savesLimit = isPro ? 100 : 25;
  const usagePercent = Math.min((savesUsed / savesLimit) * 100, 100);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your plan and subscription.
        </p>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xl font-semibold text-gray-900">{planName}</p>
              <p className="text-sm text-gray-500">
                {team?.subscriptionStatus === 'active'
                  ? 'Billed monthly'
                  : team?.subscriptionStatus === 'trialing'
                    ? 'Trial period'
                    : 'No active subscription'}
              </p>
            </div>
            {!isPro && (
              <GradientButton href="/pricing">Upgrade to Pro</GradientButton>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Saves this month</span>
              <span className="font-medium text-gray-900">
                {savesUsed} / {savesLimit}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {isPro && (
            <form action={customerPortalAction}>
              <Button type="submit" variant="outline">
                Manage subscription
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Compare plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {Object.values(plans).map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-gray-100 p-5"
              >
                <p className="font-semibold text-gray-900">{plan.displayName}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {plan.amountInr === 0 ? 'Free' : `₹${plan.amountInr}`}
                  {plan.amountInr > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      /mo
                    </span>
                  )}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check className="h-4 w-4 shrink-0 text-violet-500 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link
            href="/pricing"
            className="mt-4 inline-block text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            View full pricing →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
