'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const GA_PUBLIC_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA_WEBAPP_ID = process.env.NEXT_PUBLIC_GA_WEBAPP_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export function GoogleAnalytics() {
  const pathname = usePathname();
  const isWebapp = pathname.startsWith('/dashboard');

  const activeId = isWebapp ? GA_WEBAPP_ID : GA_PUBLIC_ID;

  useEffect(() => {
    if (!activeId) return;
    window.gtag?.('config', activeId, { page_path: pathname });
  }, [pathname, activeId]);

  return (
    <>
      {activeId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${activeId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${GA_PUBLIC_ID ? `gtag('config', '${GA_PUBLIC_ID}');` : ''}
              ${GA_WEBAPP_ID ? `gtag('config', '${GA_WEBAPP_ID}');` : ''}
            `}
          </Script>
        </>
      )}
      {CLARITY_ID && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}
    </>
  );
}
