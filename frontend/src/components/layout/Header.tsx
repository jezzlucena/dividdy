'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { usePathname, useRouter } from 'next/navigation';

export function Header() {
  const t = useTranslations('header');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <img src="/logo.svg" alt="Dividdy" className="w-9 h-9 shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow rounded-xl" />
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg leading-tight">Dividdy</span>
              <span className="text-xs text-surface-500 leading-tight hidden sm:block">{t('tagline')}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative group">
              <button className="btn-ghost px-3 py-2 text-sm">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{localeNames[locale as Locale]}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-surface-800 border border-surface-700 rounded-xl shadow-xl py-1 min-w-[140px]">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => switchLocale(loc)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-surface-700 transition-colors ${
                        locale === loc ? 'text-primary-400' : 'text-surface-200'
                      }`}
                    >
                      {localeNames[loc]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
