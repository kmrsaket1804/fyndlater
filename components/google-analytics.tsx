'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const pathname = usePathname();
  const isWebapp = pathname.startsWith('/dashboard');

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || isWebapp) return;
    window.gtag?.('config', GA_MEASUREMENT_ID, { page_path: pathname });
  }, [pathname, isWebapp]);

  if (!GA_MEASUREMENT_ID || isWebapp) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
