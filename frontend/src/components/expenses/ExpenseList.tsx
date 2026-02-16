'use client';

import { useTranslations } from 'next-intl';
import { Receipt, Edit2, Trash2, Plus } from 'lucide-react';
import { formatCurrency, formatDate, generateAvatarColor, getInitials } from '@/lib/utils';

interface ExpenseListProps {
  expenses: any[];
  group: any;
  onEdit: (expense: any) => void;
  onDelete: (expenseId: string) => void;
  onAddNew: () => void;
}

export function ExpenseList({ expenses, group, onEdit, onDelete, onAddNew }: ExpenseListProps) {
  const t = useTranslations('group');
  const tExpense = useTranslations('expense');

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="w-12 h-12 text-surface-600 mx-auto mb-4" />
        <p className="text-xl font-medium mb-2">{t('noExpenses')}</p>
        <p className="text-surface-400 mb-6">{t('noExpensesDescription')}</p>
        <button onClick={onAddNew} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('addExpense')}
        </button>
      </div>
    );
  }

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups: Record<string, any[]>, expense) => {
    const date = new Date(expense.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedExpenses).map(([date, dateExpenses]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-surface-400 mb-3">
            {formatDate(date)}
          </h3>
          <div className="space-y-3">
            {dateExpenses.map((expense: any) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                group={group}
                onEdit={() => onEdit(expense)}
                onDelete={() => onDelete(expense.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ExpenseCardProps {
  expense: any;
  group: any;
  onEdit: () => void;
  onDelete: () => void;
}

function ExpenseCard({ expense, group, onEdit, onDelete }: ExpenseCardProps) {
  const t = useTranslations('expense');
  
  const payer = expense.paidBy;
  const splitCount = expense.splits?.length || 0;

  return (
    <div className="card group/card hover:border-surface-600 transition-all">
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center text-2xl flex-shrink-0">
          {expense.category?.icon || '📦'}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium truncate">{expense.description}</h4>
              <p className="text-sm text-surface-400">
                {payer?.name || 'Unknown'} · {splitCount} {splitCount === 1 ? 'person' : 'people'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
              {expense.currency !== group.baseCurrency && (
                <p className="text-xs text-surface-500">{expense.currency}</p>
              )}
            </div>
          </div>

          {/* Split info */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex -space-x-2">
              {expense.splits?.slice(0, 4).map((split: any, index: number) => (
                <div
                  key={index}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-surface-900 ${generateAvatarColor(split.member?.name || 'U')}`}
                  title={split.member?.name}
                >
                  {getInitials(split.member?.name || 'U')}
                </div>
              ))}
              {splitCount > 4 && (
                <div className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-xs font-medium border-2 border-surface-900">
                  +{splitCount - 4}
                </div>
              )}
            </div>
            <span className="text-xs text-surface-500 capitalize">
              {t(`methods.${expense.splitMethod}`)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-surface-700 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-surface-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
