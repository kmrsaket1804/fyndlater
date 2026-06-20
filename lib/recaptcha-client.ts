'use client';

import { recaptchaSiteKey } from '@/lib/config';

let loadPromise: Promise<void> | null = null;

function loadRecaptchaScript() {
  if (!recaptchaSiteKey) {
    return Promise.resolve();
  }

  if (typeof window !== 'undefined' && window.grecaptcha?.execute) {
    return Promise.resolve();
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Failed to load reCAPTCHA script'));
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

export async function executeRecaptcha(
  action: string
): Promise<string | null> {
  if (!recaptchaSiteKey) {
    return null;
  }

  await loadRecaptchaScript();

  return new Promise((resolve, reject) => {
    window.grecaptcha!.ready(async () => {
      try {
        const token = await window.grecaptcha!.execute(recaptchaSiteKey, {
          action,
        });
        resolve(token);
      } catch (error) {
        reject(error);
      }
    });
  });
}

export function isRecaptchaConfigured() {
  return Boolean(recaptchaSiteKey);
}
