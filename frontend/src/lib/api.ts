const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface CreateGroupData {
  name: string;
  baseCurrency: string;
  members: string[];
}

interface CreateExpenseData {
  description: string;
  amount: number;
  currency: string;
  date: string;
  categoryId?: string;
  paidById: string;
  splitMethod: 'equal' | 'percentage' | 'shares' | 'exact' | 'itemized';
  splits: Array<{
    memberId: string;
    amount?: number;
    percentage?: number;
    shares?: number;
  }>;
  items?: Array<{
    name: string;
    amount: number;
    memberIds: string[];
  }>;
}

interface UpdateGroupData {
  name?: string;
  baseCurrency?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Groups
  createGroup: (data: CreateGroupData) =>
    fetchApi<{ shareCode: string; group: any }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getGroup: (shareCode: string) =>
    fetchApi<any>(`/api/groups/${shareCode}`),

  updateGroup: (shareCode: string, data: UpdateGroupData) =>
    fetchApi<any>(`/api/groups/${shareCode}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGroup: (shareCode: string) =>
    fetchApi<void>(`/api/groups/${shareCode}`, {
      method: 'DELETE',
    }),

  // Members
  addMember: (shareCode: string, name: string) =>
    fetchApi<any>(`/api/groups/${shareCode}/members`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  removeMember: (shareCode: string, memberId: string) =>
    fetchApi<void>(`/api/groups/${shareCode}/members/${memberId}`, {
      method: 'DELETE',
    }),

  // Expenses
  getExpenses: (shareCode: string) =>
    fetchApi<any[]>(`/api/groups/${shareCode}/expenses`),

  createExpense: (shareCode: string, data: CreateExpenseData) =>
    fetchApi<any>(`/api/groups/${shareCode}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateExpense: (shareCode: string, expenseId: string, data: CreateExpenseData) =>
    fetchApi<any>(`/api/groups/${shareCode}/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExpense: (shareCode: string, expenseId: string) =>
    fetchApi<void>(`/api/groups/${shareCode}/expenses/${expenseId}`, {
      method: 'DELETE',
    }),

  // Balances & Settlements
  getBalances: (shareCode: string) =>
    fetchApi<any>(`/api/groups/${shareCode}/balances`),

  getSettlements: (shareCode: string) =>
    fetchApi<{ baseCurrency: string; settlements: any[] }>(`/api/groups/${shareCode}/settlements`),

  // Categories
  createCategory: (shareCode: string, name: string, icon?: string) =>
    fetchApi<any>(`/api/groups/${shareCode}/categories`, {
      method: 'POST',
      body: JSON.stringify({ name, icon }),
    }),

  // Exchange Rates
  getExchangeRates: (base?: string) =>
    fetchApi<any>(`/api/exchange-rates${base ? `?base=${base}` : ''}`),
};
