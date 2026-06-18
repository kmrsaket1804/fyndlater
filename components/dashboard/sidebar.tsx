'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageCircle,
  Bookmark,
  FolderOpen,
  Search,
  CreditCard,
  Settings,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from '@/components/landing/logo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home', exact: true },
  { href: '/dashboard/ask', icon: MessageCircle, label: 'Ask Faye' },
  { href: '/dashboard/saves', icon: Bookmark, label: 'All Saves' },
  { href: '/dashboard/collections', icon: FolderOpen, label: 'Collections' },
  { href: '/dashboard/searches', icon: Search, label: 'Saved Searches' },
  { href: '/dashboard/billing', icon: CreditCard, label: 'Billing' },
  {
    href: '/dashboard/general',
    icon: Settings,
    label: 'Settings',
    match: ['/dashboard/general', '/dashboard/security', '/dashboard/activity'],
  },
];

type DashboardSidebarProps = {
  user?: User;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onMobileToggle: () => void;
};

export function DashboardSidebar({
  user,
  mobileOpen,
  onMobileClose,
  onMobileToggle,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
        <Logo />
        <button
          type="button"
          onClick={onMobileToggle}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-50"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={onMobileClose}
          aria-label="Close menu"
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-[#faf9fc] transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="hidden lg:flex px-5 pt-6 pb-4">
          <Logo />
        </div>

        <nav className="flex-1 space-y-1 px-3 pt-4 lg:pt-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : item.match
                ? item.match.some(
                    (path) =>
                      pathname === path || pathname.startsWith(`${path}/`)
                  )
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-violet-100/80 text-violet-700'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 p-4">
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-lg">
                ✨
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Faye</p>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                  Faye is here to help you find anything you&apos;ve saved.
                </p>
                <Link
                  href="/dashboard/ask"
                  className="mt-2 inline-block text-xs font-medium text-violet-600 hover:text-violet-700"
                >
                  Chat now →
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {displayName}
              </p>
              <p className="truncate text-xs text-gray-500">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          </div>
        </div>
      </aside>
    </>
  );
}
