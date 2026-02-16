'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { currencies } from '@/i18n/config';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  group: any;
  shareCode: string;
  expense?: any;
}

type SplitMethod = 'equal' | 'percentage' | 'shares' | 'exact' | 'itemized';

export function ExpenseModal({ isOpen, onClose, onSaved, group, shareCode, expense }: ExpenseModalProps) {
  const t = useTranslations('expense');
  const tCommon = useTranslations('common');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(group?.baseCurrency || 'USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [paidById, setPaidById] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splits, setSplits] = useState<Record<string, { percentage?: number; shares?: number; amount?: number }>>({});
  const [items, setItems] = useState<Array<{ name: string; amount: string; memberIds: string[] }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form when editing
  useEffect(() => {
    if (expense) {
      setDescription(expense.description);
      setAmount(expense.amount.toString());
      setCurrency(expense.currency);
      setDate(new Date(expense.date).toISOString().split('T')[0]);
      setCategoryId(expense.category?._id || '');
      setPaidById(expense.paidBy?._id || '');
      setSplitMethod(expense.splitMethod);
      
      const memberIds = expense.splits?.map((s: any) => s.member?._id) || [];
      setSelectedMembers(memberIds);
      
      const splitData: Record<string, any> = {};
      expense.splits?.forEach((s: any) => {
        if (s.member?._id) {
          splitData[s.member._id] = {
            percentage: s.percentage,
            shares: s.shares,
            amount: s.amount,
          };
        }
      });
      setSplits(splitData);

      if (expense.items) {
        setItems(expense.items.map((item: any) => ({
          name: item.name,
          amount: item.amount.toString(),
          memberIds: item.memberIds.map((id: any) => id.toString()),
        })));
      }
    } else {
      resetForm();
    }
  }, [expense, group]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCurrency(group?.baseCurrency || 'USD');
    setDate(new Date().toISOString().split('T')[0]);
    setCategoryId('');
    setPaidById(group?.members?.[0]?._id || '');
    setSplitMethod('equal');
    setSelectedMembers(group?.members?.map((m: any) => m._id) || []);
    setSplits({});
    setItems([{ name: '', amount: '', memberIds: [] }]);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError(t('errors.invalidAmount'));
      return;
    }

    // Validate splits based on method
    if (splitMethod === 'percentage') {
      const total = Object.values(splits).reduce((sum, s) => sum + (s.percentage || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        setError(t('percentageMustBe100'));
        return;
      }
    }

    setIsLoading(true);

    try {
      const expenseData = {
        description,
        amount: numAmount,
        currency,
        date,
        categoryId: categoryId || undefined,
        paidById,
        splitMethod,
        splits: selectedMembers.map((memberId) => ({
          memberId,
          ...(splitMethod === 'percentage' && { percentage: splits[memberId]?.percentage || 0 }),
          ...(splitMethod === 'shares' && { shares: splits[memberId]?.shares || 1 }),
          ...(splitMethod === 'exact' && { amount: splits[memberId]?.amount || 0 }),
        })),
        ...(splitMethod === 'itemized' && {
          items: items.filter(item => item.name && item.amount).map(item => ({
            name: item.name,
            amount: parseFloat(item.amount),
            memberIds: item.memberIds,
          })),
        }),
      };

      if (expense) {
        await api.updateExpense(shareCode, expense.id, expenseData);
      } else {
        await api.createExpense(shareCode, expenseData);
      }

      onSaved();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    setSelectedMembers(group.members.map((m: any) => m._id));
  };

  const updateSplit = (memberId: string, field: string, value: number) => {
    setSplits((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value },
    }));
  };

  const addItem = () => {
    setItems([...items, { name: '', amount: '', memberIds: [] }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const toggleItemMember = (index: number, memberId: string) => {
    const updated = [...items];
    const memberIds = updated[index].memberIds;
    updated[index].memberIds = memberIds.includes(memberId)
      ? memberIds.filter((id) => id !== memberId)
      : [...memberIds, memberId];
    setItems(updated);
  };

  if (!isOpen) return null;

  const splitMethods: { id: SplitMethod; label: string; description: string }[] = [
    { id: 'equal', label: t('methods.equal'), description: t('equalDescription') },
    { id: 'percentage', label: t('methods.percentage'), description: t('percentageDescription') },
    { id: 'shares', label: t('methods.shares'), description: t('sharesDescription') },
    { id: 'exact', label: t('methods.exact'), description: t('exactDescription') },
    { id: 'itemized', label: t('methods.itemized'), description: t('itemizedDescription') },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-surface-900 border border-surface-700 rounded-2xl shadow-2xl my-8 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-800">
          <h2 className="text-xl font-display font-semibold">
            {expense ? t('edit') : t('create')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-surface-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="label">{t('description')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              className="input"
              required
            />
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('amount')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">{t('currency')}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="select"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('date')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label">{t('category')}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="select"
              >
                <option value="">Select category</option>
                {group.categories?.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="label">{t('paidBy')}</label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="select"
              required
            >
              {group.members?.map((member: any) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Split Method */}
          <div>
            <label className="label">{t('splitMethod')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {splitMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSplitMethod(method.id)}
                  className={cn(
                    'p-3 rounded-xl border text-sm font-medium transition-all text-left',
                    splitMethod === method.id
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-surface-700 hover:border-surface-600'
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Split Configuration */}
          {splitMethod !== 'itemized' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">{t('splitAmong')}</label>
                <button
                  type="button"
                  onClick={selectAllMembers}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  {t('selectAll')}
                </button>
              </div>
              <div className="space-y-2">
                {group.members?.map((member: any) => (
                  <div
                    key={member._id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      selectedMembers.includes(member._id)
                        ? 'border-primary-500/30 bg-primary-500/5'
                        : 'border-surface-700'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMember(member._id)}
                      className={cn(
                        'w-6 h-6 rounded-md border flex items-center justify-center transition-all',
                        selectedMembers.includes(member._id)
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-surface-600'
                      )}
                    >
                      {selectedMembers.includes(member._id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <span className="flex-1">{member.name}</span>
                    
                    {splitMethod === 'percentage' && selectedMembers.includes(member._id) && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={splits[member._id]?.percentage || ''}
                          onChange={(e) => updateSplit(member._id, 'percentage', parseFloat(e.target.value) || 0)}
                          className="input w-20 text-sm py-2"
                          placeholder="0"
                        />
                        <span className="text-surface-400">%</span>
                      </div>
                    )}
                    
                    {splitMethod === 'shares' && selectedMembers.includes(member._id) && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={splits[member._id]?.shares || 1}
                          onChange={(e) => updateSplit(member._id, 'shares', parseFloat(e.target.value) || 1)}
                          className="input w-20 text-sm py-2"
                        />
                        <span className="text-surface-400 text-sm">shares</span>
                      </div>
                    )}
                    
                    {splitMethod === 'exact' && selectedMembers.includes(member._id) && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={splits[member._id]?.amount || ''}
                          onChange={(e) => updateSplit(member._id, 'amount', parseFloat(e.target.value) || 0)}
                          className="input w-24 text-sm py-2"
                          placeholder="0.00"
                        />
                        <span className="text-surface-400">{currency}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {splitMethod === 'percentage' && (
                <p className={cn(
                  'text-sm mt-2',
                  Math.abs(Object.values(splits).reduce((sum, s) => sum + (s.percentage || 0), 0) - 100) < 0.01
                    ? 'text-primary-400'
                    : 'text-red-400'
                )}>
                  {t('percentageTotal', { total: Object.values(splits).reduce((sum, s) => sum + (s.percentage || 0), 0).toFixed(1) })}
                </p>
              )}
            </div>
          )}

          {/* Itemized Split */}
          {splitMethod === 'itemized' && (
            <div>
              <label className="label">{t('itemizedDescription')}</label>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 bg-surface-800/50 rounded-xl space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder={t('itemName')}
                        className="input flex-1"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount}
                        onChange={(e) => updateItem(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="input w-28"
                      />
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-surface-400 mb-2">{t('assignTo')}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.members?.map((member: any) => (
                          <button
                            key={member._id}
                            type="button"
                            onClick={() => toggleItemMember(index, member._id)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-sm transition-all',
                              item.memberIds.includes(member._id)
                                ? 'bg-primary-500 text-white'
                                : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
                            )}
                          >
                            {member.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-3 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
              >
                <Plus className="w-4 h-4" />
                {t('addItem')}
              </button>
            </div>
          )}

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
              {isLoading ? t('saving') : tCommon('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
