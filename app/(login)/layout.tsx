import Link from 'next/link';
import { Logo } from '@/components/landing/logo';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-white">
      <header className="absolute top-0 left-0 right-0 z-10 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
