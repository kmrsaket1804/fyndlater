'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { User } from '@/lib/db/schema';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardRightPanel } from '@/components/dashboard/right-panel';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const showRightPanel = pathname === '/dashboard';

  return (
    <div className="flex min-h-screen bg-white">
      <DashboardSidebar
        user={user}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onMobileToggle={() => setMobileOpen((open) => !open)}
      />

      <div className="flex flex-1 min-w-0 pt-14 lg:pt-0">
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
        {showRightPanel && <DashboardRightPanel />}
      </div>
    </div>
  );
}
