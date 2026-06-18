import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GradientButton } from '@/components/landing/gradient-button';

type ComingSoonProps = {
  title: string;
  description: string;
  backHref?: string;
};

export function ComingSoon({
  title,
  description,
  backHref = '/dashboard',
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-pink-100 text-3xl">
        ✨
      </div>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 leading-relaxed">
        {description}
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <GradientButton href="/dashboard/ask">Ask Faye</GradientButton>
      </div>
    </div>
  );
}
