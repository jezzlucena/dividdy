'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Receipt, 
  Calculator, 
  ArrowRight, 
  Globe,
  Sparkles,
  Zap,
  Shield
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';
import { AdBanner } from '@/components/ads/AdBanner';

export default function HomePage() {
  const t = useTranslations('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const features = [
    {
      icon: Users,
      title: t('features.groups.title'),
      description: t('features.groups.description'),
    },
    {
      icon: Receipt,
      title: t('features.expenses.title'),
      description: t('features.expenses.description'),
    },
    {
      icon: Calculator,
      title: t('features.settlement.title'),
      description: t('features.settlement.description'),
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: t('benefits.instant.title'),
      description: t('benefits.instant.description'),
    },
    {
      icon: Shield,
      title: t('benefits.noSignup.title'),
      description: t('benefits.noSignup.description'),
    },
    {
      icon: Globe,
      title: t('benefits.multiCurrency.title'),
      description: t('benefits.multiCurrency.description'),
    },
  ];

  const handleGroupCreated = (shareCode: string) => {
    router.push(`/group/${shareCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-950/50 via-surface-950 to-accent-950/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[128px]" />
          
          <div className="relative container mx-auto px-4 py-24 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-sm font-medium mb-8 animate-fade-in">
                <Sparkles className="w-4 h-4" />
                {t('hero.badge')}
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
                {t('hero.title.line1')}
                <span className="text-gradient"> {t('hero.title.highlight')}</span>
                <br />
                {t('hero.title.line2')}
              </h1>
              
              <p className="text-lg md:text-xl text-surface-400 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {t('hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary text-lg px-8 py-4 group"
                >
                  {t('hero.cta')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Ad Banner */}
        <AdBanner slot="hero-bottom" />

        {/* Features Section */}
        <section className="py-20 md:py-28 bg-surface-900/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('features.title')}
              </h2>
              <p className="text-surface-400 text-lg max-w-2xl mx-auto">
                {t('features.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="card group hover:border-primary-500/30 hover:bg-surface-800/50 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-14 h-14 bg-primary-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-500/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-surface-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('benefits.title')}
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-6 rounded-xl bg-surface-900/30 border border-surface-800"
                >
                  <div className="w-10 h-10 bg-accent-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-sm text-surface-400">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad Banner */}
        <AdBanner slot="content-bottom" />

        {/* CTA Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center card bg-gradient-to-br from-primary-950/50 to-accent-950/30 border-primary-500/20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-surface-400 text-lg mb-8">
                {t('cta.subtitle')}
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary text-lg px-8 py-4"
              >
                {t('cta.button')}
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleGroupCreated}
      />
    </div>
  );
}
