'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard/general', label: 'General' },
  { href: '/dashboard/security', label: 'Security' },
  { href: '/dashboard/activity', label: 'Activity' },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            pathname === link.href
              ? 'bg-violet-100 text-violet-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
