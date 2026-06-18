'use client';

import useSWR from 'swr';
import { User } from '@/lib/db/schema';
import { DashboardHomeContent } from '@/components/dashboard/home-content';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardHomePage() {
  const { data: user } = useSWR<User>('/api/user', fetcher);

  return <DashboardHomeContent user={user} />;
}
