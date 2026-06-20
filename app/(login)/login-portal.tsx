'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RecaptchaNotice } from '@/components/recaptcha-notice';
import { executeRecaptcha } from '@/lib/recaptcha-client';
import { Loader2, Shield, Sparkles } from 'lucide-react';
import { authenticate } from './auth-actions';
import { ActionState } from '@/lib/auth/middleware';
import { cn } from '@/lib/utils';

type AuthMode = 'signin' | 'signup';

export function LoginPortal({
  initialMode = 'signin',
}: {
  initialMode?: AuthMode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryMode = searchParams.get('mode');
  const [mode, setMode] = useState<AuthMode>(
    queryMode === 'signup' ? 'signup' : initialMode
  );

  const redirect = searchParams.get('redirect');
  const planId = searchParams.get('planId');

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    authenticate,
    { error: '' }
  );
  const [captchaError, setCaptchaError] = useState('');

  useEffect(() => {
    if (queryMode === 'signup') setMode('signup');
    if (queryMode === 'signin') setMode('signin');
  }, [queryMode]);

  useEffect(() => {
    if (state?.redirectTo) {
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [state?.redirectTo, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCaptchaError('');

    const formData = new FormData(event.currentTarget);

    try {
      const token = await executeRecaptcha(
        mode === 'signin' ? 'login' : 'signup'
      );
      if (token) {
        formData.set('recaptchaToken', token);
      }
    } catch {
      setCaptchaError('reCAPTCHA failed to load. Please refresh and try again.');
      return;
    }

    formAction(formData);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', nextMode);
    router.replace(`/login?${params.toString()}`);
  }

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Meet Faye
          </div>
          <h1 className="mt-8 text-4xl xl:text-5xl font-bold leading-tight">
            Your AI memory for everything you save.
          </h1>
          <p className="mt-5 text-lg text-white/85 max-w-md leading-relaxed">
            Send reels, posts, links, and ideas to Faye on Instagram. Find them
            later with a simple question.
          </p>
        </div>

        <div className="relative space-y-4">
          <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 p-5 max-w-md">
            <p className="text-sm text-white/90 leading-relaxed">
              &ldquo;Find that packaging reel I saved&rdquo; → Faye retrieves it
              instantly.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/75">
            <Shield className="w-4 h-4" />
            <span>Secure login · Built by Bazaarlytics</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 sm:px-6 py-24 lg:py-12">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {mode === 'signin'
                ? 'Sign in to manage your saves and subscription.'
                : 'Start saving with Faye in minutes.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-gray-100 mb-8">
            {(['signin', 'signup'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchMode(tab)}
                className={cn(
                  'rounded-full py-2.5 text-sm font-medium transition-all',
                  mode === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {tab === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <input type="hidden" name="mode" value={mode} />
            <input type="hidden" name="redirect" value={redirect || ''} />
            <input type="hidden" name="planId" value={planId || ''} />

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={255}
                placeholder="you@example.com"
                className="mt-1.5 rounded-xl h-11"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                placeholder="At least 8 characters"
                className="mt-1.5 rounded-xl h-11"
              />
            </div>

            {(state?.error || captchaError) && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {captchaError || state?.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full h-11 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </>
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-violet-600 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-violet-600 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="mt-3">
            <RecaptchaNotice />
          </div>
        </div>
      </div>
    </div>
  );
}
