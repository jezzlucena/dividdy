export interface Member {
  _id: string;
  name: string;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  icon?: string;
}

export interface Group {
  id: string;
  name: string;
  shareCode: string;
  baseCurrency: string;
  members: Member[];
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Split {
  member: Member | null;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface Item {
  name: string;
  amount: number;
  memberIds: string[];
}

export type SplitMethod = 'equal' | 'percentage' | 'shares' | 'exact' | 'itemized';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category: Category | null;
  paidBy: Member | null;
  splitMethod: SplitMethod;
  splits: Split[];
  items?: Item[];
  createdAt: string;
}

export interface MemberBalance {
  member: {
    id: string;
    name: string;
  };
  paid: number;
  owes: number;
  net: number;
}

export interface BalancesResponse {
  baseCurrency: string;
  totalExpenses: number;
  balances: MemberBalance[];
}

export interface Settlement {
  from: {
    id: string;
    name: string;
  };
  to: {
    id: string;
    name: string;
  };
  amount: number;
}

export interface SettlementsResponse {
  baseCurrency: string;
  settlements: Settlement[];
}

export interface ExchangeRatesResponse {
  base: string;
  rates: Record<string, number>;
  updatedAt: string;
}
