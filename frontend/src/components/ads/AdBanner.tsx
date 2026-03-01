'use client';

import { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ slot, format = 'auto', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);
  const [adFailed, setAdFailed] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isConfigured = clientId && !clientId.includes('XXXX');

  useEffect(() => {
    if (isLoaded.current || !isConfigured) return;

    const initAd = () => {
      try {
        if (typeof window !== 'undefined' && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      } catch (err) {
        console.error('AdSense error:', err);
        setAdFailed(true);
      }
    };

    if (typeof window !== 'undefined' && window.adsbygoogle) {
      initAd();
    }
  }, [isConfigured]);

  // Observe the ad slot: if AdSense fills it, it gets a height; if it
  // stays empty or gets data-ad-status="unfilled", collapse the space.
  useEffect(() => {
    if (!isConfigured || adFailed) return;

    const ins = insRef.current;
    if (!ins) return;

    const checkFilled = () => {
      const status = ins.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        setAdFailed(true);
        return;
      }
      if (ins.offsetHeight === 0) {
        setAdFailed(true);
      }
    };

    // Give the ad network time to respond, then check
    const timer = setTimeout(checkFilled, 3000);

    // Also watch for attribute changes (AdSense sets data-ad-status)
    const observer = new MutationObserver(() => {
      const status = ins.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        setAdFailed(true);
      }
    });
    observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [isConfigured, adFailed]);

  if (!isConfigured || adFailed) {
    return null;
  }

  return (
    <div ref={adRef} className={`w-full py-4 ${className}`}>
      <div className="container mx-auto px-4">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

// Separate component to load the AdSense script once
export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isConfigured = clientId && !clientId.includes('XXXX');

  if (!isConfigured) {
    return null;
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    ></script>
  );
}
