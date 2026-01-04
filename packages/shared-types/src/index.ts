// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

// Group Types
export type GroupRole = 'admin' | 'member';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  createdAt: Date;
}

export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  role: GroupRole;
  joinedAt: Date;
  user: UserProfile;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
}

// Category Types
export interface Category {
  id: string;
  groupId: string;
  name: string;
  icon: string | null;
  color: string | null;
}

// Expense Types
export type SplitType = 'equal' | 'percentage' | 'shares' | 'exact';

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  percentage: number | null;
  shares: number | null;
  user: UserProfile;
}

export interface Expense {
  id: string;
  groupId: string;
  paidById: string;
  categoryId: string | null;
  amount: number;
  description: string;
  date: Date;
  splitType: SplitType;
  createdAt: Date;
  paidBy: UserProfile;
  category: Category | null;
  splits: ExpenseSplit[];
}

export interface Receipt {
  id: string;
  expenseId: string;
  filePath: string;
  mimeType: string;
}

export interface Comment {
  id: string;
  expenseId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: UserProfile;
}

export interface ExpenseWithDetails extends Expense {
  receipt: Receipt | null;
  comments: Comment[];
}

// Settlement Types
export interface Settlement {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  settledAt: Date;
  payer: UserProfile;
  receiver: UserProfile;
}

// Balance Types
export interface Balance {
  userId: string;
  user: UserProfile;
  balance: number; // Positive means they are owed money, negative means they owe money
}

export interface SimplifiedDebt {
  from: UserProfile;
  to: UserProfile;
  amount: number;
}

export interface GroupBalances {
  groupId: string;
  balances: Balance[];
  simplifiedDebts: SimplifiedDebt[];
}

// API Request Types
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface VerifyMagicLinkRequest {
  token: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatarUrl?: string | null;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  currency?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string | null;
  currency?: string;
}

export interface AddMemberRequest {
  email: string;
  role?: GroupRole;
}

export interface CreateCategoryRequest {
  name: string;
  icon?: string;
  color?: string;
}

export interface ExpenseSplitInput {
  userId: string;
  amount?: number;
  percentage?: number;
  shares?: number;
}

export interface CreateExpenseRequest {
  amount: number;
  description: string;
  date?: string;
  categoryId?: string;
  splitType: SplitType;
  splits: ExpenseSplitInput[];
}

export interface UpdateExpenseRequest {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string | null;
  splitType?: SplitType;
  splits?: ExpenseSplitInput[];
}

export interface CreateSettlementRequest {
  receiverId: string;
  amount: number;
}

export interface CreateCommentRequest {
  content: string;
}

// API Response Types
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface MessageResponse {
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

