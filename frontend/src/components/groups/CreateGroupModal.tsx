'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus, Trash2 } from 'lucide-react';
import { currencies } from '@/i18n/config';
import { api } from '@/lib/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (shareCode: string) => void;
}

export function CreateGroupModal({ isOpen, onClose, onCreated }: CreateGroupModalProps) {
  const t = useTranslations('createGroup');
  const tCommon = useTranslations('common');
  const [groupName, setGroupName] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [members, setMembers] = useState(['', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    setMembers([...members, '']);
  };

  const removeMember = (index: number) => {
    if (members.length > 2) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, value: string) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validMembers = members.filter(m => m.trim());
    if (validMembers.length < 2) {
      setError(t('minMembers'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.createGroup({
        name: groupName,
        baseCurrency,
        members: validMembers,
      });

      onCreated(response.shareCode);
      onClose();
      
      // Reset form
      setGroupName('');
      setBaseCurrency('USD');
      setMembers(['', '']);
    } catch (err) {
      setError('Failed to create group. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
      <div className="relative w-full max-w-lg bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl animate-scale-in">
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="label">{t('groupName')}</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('groupNamePlaceholder')}
              className="input"
              required
            />
          </div>

          {/* Base Currency */}
          <div>
            <label className="label">{t('baseCurrency')}</label>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="select"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Members */}
          <div>
            <label className="label">{t('initialMembers')}</label>
            <div className="space-y-3">
              {members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => updateMember(index, e.target.value)}
                    placeholder={t('memberPlaceholder')}
                    className="input flex-1"
                  />
                  {members.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="p-3 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addMember}
              className="mt-3 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('addMember')}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              {tCommon('cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? t('creating') : t('create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
