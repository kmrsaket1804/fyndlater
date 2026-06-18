export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { LoginPortal } from '../login-portal';

function LoginFallback() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-white">
      <p className="text-sm text-gray-500">Loading login...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPortal />
    </Suspense>
  );
}
