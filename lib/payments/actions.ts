'use server';

import { redirect } from 'next/navigation';
import { createCashfreeCheckout } from './cashfree';
import { withTeam } from '@/lib/auth/middleware';
import { getUser } from '@/lib/db/queries';

export const checkoutAction = withTeam(async (formData, team) => {
  const planId = formData.get('planId') as string;
  const user = await getUser();
  const { redirectTo } = await createCashfreeCheckout({ team, user, planId });
  redirect(redirectTo);
});

export async function customerPortalAction() {
  redirect('/pricing');
}
