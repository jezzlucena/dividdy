'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(74,222,128,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px]" />

      {/* Pulse rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary-500/10"
            style={{
              width: `${300 + i * 200}px`,
              height: `${300 + i * 200}px`,
              animation: `pulseRing 4s ease-out ${i * 1.3}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary-400/30"
          style={{
            left: `${5 + (i * 47) % 90}%`,
            top: `${10 + (i * 31) % 80}%`,
            animation: `floatParticle ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite alternate`,
          }}
        />
      ))}

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-400/30 to-transparent"
        style={{ animation: 'scanLine 4s linear infinite' }}
      />
    </div>
  );
}

function GlitchText() {
  const t = useTranslations('notFound');

  return (
    <div className="relative select-none">
      <h1
        className="text-[8rem] md:text-[12rem] font-display font-bold leading-none tracking-tighter text-transparent"
        style={{
          WebkitTextStroke: '2px rgba(74, 222, 128, 0.3)',
        }}
      >
        {t('code')}
      </h1>

      {/* Glitch layer 1 */}
      <h1
        className="absolute inset-0 text-[8rem] md:text-[12rem] font-display font-bold leading-none tracking-tighter text-primary-400/70"
        style={{ animation: 'glitch1 3s ease-in-out infinite' }}
        aria-hidden="true"
      >
        {t('code')}
      </h1>

      {/* Glitch layer 2 */}
      <h1
        className="absolute inset-0 text-[8rem] md:text-[12rem] font-display font-bold leading-none tracking-tighter text-accent-400/50"
        style={{ animation: 'glitch2 3s ease-in-out infinite' }}
        aria-hidden="true"
      >
        {t('code')}
      </h1>

      {/* Static noise overlay */}
      <div
        className="absolute inset-0"
        style={{ animation: 'staticNoise 0.2s steps(10) infinite' }}
      >
        <div className="w-full h-full opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />
      </div>
    </div>
  );
}

function DataStream({ side }: { side: 'left' | 'right' }) {
  const chars = '01';
  const streams = [...Array(4)].map((_, i) => ({
    chars: [...Array(12)].map(() => chars[Math.floor(Math.random() * chars.length)]).join('\n'),
    delay: i * 0.7,
    duration: 3 + (i % 3),
  }));

  return (
    <div
      className={`absolute top-0 bottom-0 ${side === 'left' ? 'left-4 md:left-12' : 'right-4 md:right-12'} flex gap-3 opacity-[0.08] pointer-events-none`}
    >
      {streams.map((stream, i) => (
        <div
          key={i}
          className="text-primary-400 text-xs font-mono whitespace-pre leading-5"
          style={{
            animation: `dataStream ${stream.duration}s linear ${stream.delay}s infinite`,
          }}
        >
          {stream.chars}
        </div>
      ))}
    </div>
  );
}

export default function NotFound() {
  const t = useTranslations('notFound');
  const locale = useLocale();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-surface-950">
      <style>{`
        @keyframes glitch1 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(20% 0 60% 0); transform: translate(-4px, -2px); }
          40% { clip-path: inset(60% 0 0 0); transform: translate(4px, 2px); }
          60% { clip-path: inset(40% 0 20% 0); transform: translate(-2px, 1px); }
          80% { clip-path: inset(0 0 80% 0); transform: translate(2px, -1px); }
        }
        @keyframes glitch2 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(60% 0 0 0); transform: translate(4px, 2px); }
          40% { clip-path: inset(0 0 60% 0); transform: translate(-4px, -2px); }
          60% { clip-path: inset(0 0 40% 0); transform: translate(2px, -1px); }
          80% { clip-path: inset(80% 0 0 0); transform: translate(-2px, 1px); }
        }
        @keyframes scanLine {
          0% { top: -2%; }
          100% { top: 102%; }
        }
        @keyframes pulseRing {
          0% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        @keyframes floatParticle {
          0% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          100% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        @keyframes dataStream {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes staticNoise {
          0% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -5%); }
          20% { transform: translate(-10%, 5%); }
          30% { transform: translate(5%, -10%); }
          40% { transform: translate(-5%, 15%); }
          50% { transform: translate(-10%, 5%); }
          60% { transform: translate(15%, 0); }
          70% { transform: translate(0, 10%); }
          80% { transform: translate(-15%, 0); }
          90% { transform: translate(10%, 5%); }
          100% { transform: translate(5%, 0); }
        }
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      <GridBackground />
      <DataStream side="left" />
      <DataStream side="right" />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-8 animate-fade-in">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-sm font-mono text-red-400 tracking-widest uppercase">
            {t('status')}
          </span>
        </div>

        {/* Glitchy 404 */}
        <GlitchText />

        {/* Subtitle */}
        <h2 className="text-2xl md:text-3xl font-display font-semibold mt-6 mb-4 animate-slide-up text-surface-100">
          {t('title')}
        </h2>

        {/* Description */}
        <p
          className="text-surface-400 max-w-md mb-10 animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          {t('description')}
        </p>

        {/* Return button */}
        <Link
          href={`/${locale}`}
          className="group relative animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div
            className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity"
            style={{ animation: 'borderGlow 2s ease-in-out infinite' }}
          />
          <div className="relative btn-primary px-8 py-4 text-base">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            {t('returnHome')}
          </div>
        </Link>

        {/* Hex coordinates */}
        <p
          className="mt-12 text-xs font-mono text-surface-600 tracking-wider animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          {t('coordinates')}
        </p>
      </div>
    </div>
  );
}
