'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-surface-800 bg-surface-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Dividdy" className="w-8 h-8 rounded-lg" />
            <div>
              <span className="font-display font-semibold">Dividdy</span>
              <p className="text-xs text-surface-500">{t('tagline')}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-surface-400">
            <Link href={`/${locale}/privacy`} className="hover:text-surface-200 transition-colors">
              {t('links.privacy')}
            </Link>
            <Link href={`/${locale}/terms`} className="hover:text-surface-200 transition-colors">
              {t('links.terms')}
            </Link>
          </div>

          <p className="text-sm text-surface-500">
            {t('copyright', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}
