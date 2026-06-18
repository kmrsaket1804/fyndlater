import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center', className)}>
      <span className="text-xl font-bold tracking-tight">
        <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
          Fynd
        </span>
        <span className="text-gray-900">Later</span>
      </span>
    </Link>
  );
}
