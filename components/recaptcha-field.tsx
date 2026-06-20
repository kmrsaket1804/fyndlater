'use client';

import { useCallback, useEffect, useRef } from 'react';
import Script from 'next/script';
import { recaptchaSiteKey } from '@/lib/config';

export function RecaptchaField() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  const renderWidget = useCallback(() => {
    if (!recaptchaSiteKey || !containerRef.current || !window.grecaptcha) {
      return;
    }

    if (widgetIdRef.current !== null) {
      return;
    }

    widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
      sitekey: recaptchaSiteKey,
      callback: (token) => {
        if (tokenInputRef.current) {
          tokenInputRef.current.value = token;
        }
      },
      'expired-callback': () => {
        if (tokenInputRef.current) {
          tokenInputRef.current.value = '';
        }
      },
    });
  }, []);

  useEffect(() => {
    if (window.grecaptcha) {
      window.grecaptcha.ready(renderWidget);
    }
  }, [renderWidget]);

  if (!recaptchaSiteKey) {
    return null;
  }

  return (
    <>
      <input
        ref={tokenInputRef}
        type="hidden"
        name="recaptchaToken"
        defaultValue=""
      />
      <div ref={containerRef} className="min-h-[78px]" />
      <Script
        src="https://www.google.com/recaptcha/api.js"
        strategy="lazyOnload"
        onLoad={() => window.grecaptcha?.ready(renderWidget)}
      />
    </>
  );
}
