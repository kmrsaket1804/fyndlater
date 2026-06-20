'use client';

import { isRecaptchaConfigured } from '@/lib/recaptcha-client';

export function RecaptchaNotice() {
  if (!isRecaptchaConfigured()) {
    return null;
  }

  return (
    <p className="text-[11px] text-gray-400 leading-relaxed">
      This site is protected by reCAPTCHA and the Google{' '}
      <a
        href="https://policies.google.com/privacy"
        className="underline hover:text-gray-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        Privacy Policy
      </a>{' '}
      and{' '}
      <a
        href="https://policies.google.com/terms"
        className="underline hover:text-gray-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        Terms of Service
      </a>{' '}
      apply.
    </p>
  );
}
