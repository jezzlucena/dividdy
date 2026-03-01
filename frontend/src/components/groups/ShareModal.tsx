'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Copy, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
}

export function ShareModal({ isOpen, onClose, url }: ShareModalProps) {
  const t = useTranslations('shareModal');
  const tCommon = useTranslations('common');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <h2 className="text-xl font-display font-semibold">{t('title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-surface-400">{t('scanQR')}</p>
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG
                value={url}
                size={200}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
              />
            </div>
          </div>

          {/* Copy URL */}
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="input flex-1 text-sm truncate"
            />
            <button
              onClick={handleCopyLink}
              className="btn-primary text-sm shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  {tCommon('copied')}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {t('copyLink')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
