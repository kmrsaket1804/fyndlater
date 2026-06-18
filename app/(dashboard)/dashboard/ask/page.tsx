import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AskFayeChat } from '@/components/dashboard/ask-faye/ask-faye-chat';

function AskFayeFallback() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  );
}

export default function AskFayePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<AskFayeFallback />}>
        <AskFayeChat />
      </Suspense>
    </div>
  );
}
