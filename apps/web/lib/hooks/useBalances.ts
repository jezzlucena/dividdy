'use client';

import type { GroupBalances, CreateSettlementRequest, Settlement, PaginatedResponse } from '@dividdy/shared-types';
import useSWR from 'swr';

import { api } from '../api';

export function useBalances(groupId: string) {
  const { data, error, isLoading, mutate } = useSWR<GroupBalances>(
    groupId ? `balances-${groupId}` : null,
    () => api.getBalances(groupId),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    balances: data?.balances || [],
    simplifiedDebts: data?.simplifiedDebts || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

export function useSettlements(groupId: string, page = 1, limit = 20) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Settlement>>(
    groupId ? `settlements-${groupId}-${page}-${limit}` : null,
    () => api.getSettlements(groupId, page, limit),
    {
      revalidateOnFocus: false,
    }
  );

  const createSettlement = async (settlementData: CreateSettlementRequest) => {
    const newSettlement = await api.createSettlement(groupId, settlementData);
    mutate();
    return newSettlement;
  };

  return {
    settlements: data?.data || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    createSettlement,
    refresh: mutate,
  };
}

