'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import {
  Receipt,
  Scale,
  Banknote,
  Settings,
  Plus,
  Share2,
  Check,
  Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { ExpenseModal } from '@/components/expenses/ExpenseModal';
import { ShareModal } from '@/components/groups/ShareModal';
import { AdBanner } from '@/components/ads/AdBanner';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

type Tab = 'expenses' | 'balances' | 'settle' | 'settings';

export default function GroupPage() {
  const t = useTranslations('group');
  const tCommon = useTranslations('common');
  const params = useParams();
  const shareCode = params.shareCode as string;

  const [group, setGroup] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [balances, setBalances] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [shareCode]);

  const loadGroupData = async () => {
    try {
      setIsLoading(true);
      const [groupData, expensesData, balancesData] = await Promise.all([
        api.getGroup(shareCode),
        api.getExpenses(shareCode),
        api.getBalances(shareCode),
      ]);
      setGroup(groupData);
      setExpenses(expensesData);
      setBalances(balancesData);
    } catch (err) {
      setError('Failed to load group data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpenseCreated = () => {
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
    loadGroupData();
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    // Optimistically remove from UI immediately
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    
    try {
      await api.deleteExpense(shareCode, expenseId);
      // Reload to get updated balances
      const [expensesData, balancesData] = await Promise.all([
        api.getExpenses(shareCode),
        api.getBalances(shareCode),
      ]);
      setExpenses(expensesData);
      setBalances(balancesData);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      // Reload data to restore state on error
      loadGroupData();
    }
  };

  const tabs = [
    { id: 'expenses' as Tab, label: t('expenses'), icon: Receipt },
    { id: 'balances' as Tab, label: t('balances'), icon: Scale },
    { id: 'settle' as Tab, label: t('settle'), icon: Banknote },
    { id: 'settings' as Tab, label: t('settings'), icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Group not found'}</p>
            <Link href="/" className="btn-primary">
              {tCommon('back')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-950">
      <Header />

      <main className="flex-1">
        {/* Group Header */}
        <div className="bg-surface-900/50 border-b border-surface-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold">
                  {group.name}
                </h1>
                <p className="text-surface-400 text-sm mt-1">
                  {group.members.length} {tCommon('members')} · {group.baseCurrency}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="btn-secondary text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  {tCommon('share')}
                </button>
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setIsExpenseModalOpen(true);
                  }}
                  className="btn-primary text-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t('addExpense')}
                </button>
              </div>
            </div>

            {/* Stats */}
            {balances && (
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="card bg-surface-800/50 p-4">
                  <p className="text-surface-400 text-sm">{t('totalExpenses')}</p>
                  <p className="text-2xl font-semibold mt-1">
                    {formatCurrency(balances.totalExpenses, group.baseCurrency)}
                  </p>
                </div>
                <div className="card bg-surface-800/50 p-4">
                  <p className="text-surface-400 text-sm">{tCommon('members')}</p>
                  <p className="text-2xl font-semibold mt-1">
                    {group.members.length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-surface-800 sticky top-16 bg-surface-950/95 backdrop-blur-sm z-10">
          <div className="container mx-auto px-4">
            <nav className="flex gap-1 -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-surface-400 hover:text-surface-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="container mx-auto px-4 py-6">
          {activeTab === 'expenses' && (
            <ExpenseList
              expenses={expenses}
              group={group}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
              onAddNew={() => {
                setEditingExpense(null);
                setIsExpenseModalOpen(true);
              }}
            />
          )}

          {activeTab === 'balances' && (
            <BalancesView
              group={group}
              balances={balances}
            />
          )}

          {activeTab === 'settle' && (
            <SettlementView
              shareCode={shareCode}
              group={group}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              group={group}
              shareCode={shareCode}
              onUpdate={loadGroupData}
            />
          )}
        </div>

        <AdBanner slot="group-bottom" />
      </main>

      <Footer />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSaved={handleExpenseCreated}
        group={group}
        shareCode={shareCode}
        expense={editingExpense}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </div>
  );
}

// Balances View Component
function BalancesView({ group, balances }: { group: any; balances: any }) {
  const t = useTranslations('balances');

  if (!balances || balances.balances.length === 0) {
    return (
      <div className="text-center py-12">
        <Scale className="w-12 h-12 text-surface-600 mx-auto mb-4" />
        <p className="text-surface-400">{t('allSettled')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold">{t('title')}</h2>
        <p className="text-sm text-surface-400">{t('subtitle')}</p>
      </div>

      <div className="grid gap-3">
        {balances.balances.map((balance: any) => (
          <div
            key={balance.member.id}
            className="card flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-white ${
                balance.net > 0 ? 'bg-primary-500' : balance.net < 0 ? 'bg-red-500' : 'bg-surface-600'
              }`}>
                {balance.member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{balance.member.name}</p>
                <p className="text-sm text-surface-400">
                  {balance.net > 0 ? t('isOwed') : balance.net < 0 ? t('owes') : t('settled')}
                </p>
              </div>
            </div>
            <div className={`text-right ${
              balance.net > 0 ? 'text-primary-400' : balance.net < 0 ? 'text-red-400' : 'text-surface-400'
            }`}>
              <p className="font-semibold text-lg">
                {balance.net > 0 ? '+' : ''}{formatCurrency(balance.net, group.baseCurrency)}
              </p>
              <p className="text-xs text-surface-500">
                {t('netBalance')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Settlement View Component
function SettlementView({ shareCode, group }: { shareCode: string; group: any }) {
  const t = useTranslations('settlement');
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettlements();
  }, [shareCode]);

  const loadSettlements = async () => {
    try {
      const data = await api.getSettlements(shareCode);
      setSettlements(data.settlements || []);
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="text-center py-12">
        <Check className="w-12 h-12 text-primary-500 mx-auto mb-4" />
        <p className="text-xl font-medium">{t('noSettlementsNeeded')}</p>
        <p className="text-surface-400 mt-1">{t('noSettlementsDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-display font-semibold">{t('title')}</h2>
      </div>

      <p className="text-sm text-surface-400 mb-4">
        {t('minimizedTransactions')}
      </p>

      <div className="grid gap-3">
        {settlements.map((settlement, index) => (
          <div
            key={index}
            className="card flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center font-medium text-red-400">
                {settlement.from.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">
                  {settlement.from.name} <span className="text-surface-400">{t('pays')}</span> {settlement.to.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">
                {formatCurrency(settlement.amount, group.baseCurrency)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Settings View Component
function SettingsView({ group, shareCode, onUpdate }: { group: any; shareCode: string; onUpdate: () => void }) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const [name, setName] = useState(group.name);
  const [newMember, setNewMember] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateGroup = async () => {
    if (!name.trim()) return;
    setIsUpdating(true);
    try {
      await api.updateGroup(shareCode, { name });
      onUpdate();
    } catch (err) {
      console.error('Failed to update group:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.trim()) return;
    try {
      await api.addMember(shareCode, newMember);
      setNewMember('');
      onUpdate();
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.removeMember(shareCode, memberId);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Group Info */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('groupInfo')}</h3>
        <div className="space-y-4">
          <div>
            <label className="label">{t('groupName')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input flex-1"
              />
              <button
                onClick={handleUpdateGroup}
                disabled={isUpdating || name === group.name}
                className="btn-primary"
              >
                {tCommon('save')}
              </button>
            </div>
          </div>
          <div>
            <label className="label">{t('baseCurrency')}</label>
            <p className="text-surface-300">{group.baseCurrency}</p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('members')}</h3>
        <div className="space-y-3 mb-4">
          {group.members.map((member: any) => (
            <div
              key={member._id}
              className="flex items-center justify-between p-3 bg-surface-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center font-medium text-primary-400 text-sm">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span>{member.name}</span>
              </div>
              <button
                onClick={() => handleRemoveMember(member._id)}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                {t('removeMember')}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            placeholder={t('addMember')}
            className="input flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
          />
          <button
            onClick={handleAddMember}
            disabled={!newMember.trim()}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
