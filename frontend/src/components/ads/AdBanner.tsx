'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

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
  const isLoaded = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isConfigured = clientId && !clientId.includes('XXXX');

  useEffect(() => {
    // Only initialize ads once and only when configured
    if (isLoaded.current || !isConfigured) return;

    const initAd = () => {
      try {
        if (typeof window !== 'undefined' && adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isLoaded.current = true;
        }
      } catch (err) {
        console.error('AdSense error:', err);
      }
    };

    // If adsbygoogle is already loaded, initialize immediately
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      initAd();
    }
    // Otherwise wait for it to load (handled by onLoad in Script)
  }, [isConfigured]);

  if (!isConfigured) {
    // Show placeholder in development/when not configured
    return (
      <div className={`w-full py-4 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="bg-surface-800/30 border border-dashed border-surface-700 rounded-xl h-24 flex items-center justify-center text-surface-500 text-sm">
            Ad Space
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={adRef} className={`w-full py-4 ${className}`}>
      <div className="container mx-auto px-4">
        <ins
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
    <Script
      id="adsbygoogle-init"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
