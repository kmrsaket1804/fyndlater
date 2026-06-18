'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SubmitButtonInner({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 transition-all disabled:opacity-50"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          Loading...
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function SubmitButton({
  label = 'Start saving with Faye',
  href,
}: {
  label?: string;
  href?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        className="w-full inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 transition-all"
      >
        {label}
      </Link>
    );
  }

  return <SubmitButtonInner label={label} />;
}
