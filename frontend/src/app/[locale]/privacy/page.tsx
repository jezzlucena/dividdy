'use client';

import { useTranslations } from 'next-intl';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPage() {
  const t = useTranslations('privacy');

  const sections = [
    'informationWeCollect',
    'howWeUse',
    'dataStorage',
    'thirdParty',
    'yourRights',
    'changes',
    'contact',
  ] as const;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 animate-slide-up">
              {t('title')}
            </h1>
            <p className="text-surface-400 mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {t('lastUpdated')}
            </p>

            <div className="space-y-10">
              <p className="text-surface-300 leading-relaxed animate-fade-in">
                {t('intro')}
              </p>

              {sections.map((section, index) => (
                <section
                  key={section}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(index + 1) * 0.05}s` }}
                >
                  <h2 className="text-xl font-semibold mb-3">
                    {t(`sections.${section}.title`)}
                  </h2>
                  <p className="text-surface-400 leading-relaxed">
                    {t(`sections.${section}.content`)}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
