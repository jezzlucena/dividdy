'use client';

import type { Expense, CreateExpenseRequest, PaginatedResponse } from '@dividdy/shared-types';
import useSWR from 'swr';

import { api } from '../api';

export function useExpenses(groupId: string, page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Expense>>(
    groupId ? `expenses-${groupId}-${page}-${limit}` : null,
    () => api.getExpenses(groupId, page, limit),
    {
      revalidateOnFocus: false,
    }
  );

  const createExpense = async (expenseData: CreateExpenseRequest) => {
    const newExpense = await api.createExpense(groupId, expenseData);
    mutate();
    return newExpense;
  };

  const deleteExpense = async (expenseId: string) => {
    await api.deleteExpense(expenseId);
    mutate();
  };

  return {
    expenses: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    createExpense,
    deleteExpense,
    refresh: mutate,
  };
}

export function useExpense(groupId: string, expenseId: string) {
  const { data, error, isLoading, mutate } = useSWR<Expense>(
    groupId && expenseId ? `expense-${expenseId}` : null,
    () => api.getExpense(groupId, expenseId),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    expense: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

