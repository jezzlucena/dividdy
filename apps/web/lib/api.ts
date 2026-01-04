import type {
  AuthResponse,
  CreateExpenseRequest,
  CreateGroupRequest,
  CreateSettlementRequest,
  Group,
  GroupBalances,
  LoginRequest,
  MagicLinkRequest,
  MessageResponse,
  PaginatedResponse,
  UpdateGroupRequest,
  UpdateUserRequest,
  User,
  CreateUserRequest,
  Expense,
  Settlement,
  Category,
  CreateCategoryRequest,
  Comment,
  CreateCommentRequest,
  GroupMember,
  AddMemberRequest,
} from '@dividdy/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(data: CreateUserRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(response.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response;
  }

  async sendMagicLink(data: MagicLinkRequest): Promise<MessageResponse> {
    return this.request<MessageResponse>('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    this.setToken(response.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    this.setToken(response.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    return response;
  }

  async logout(): Promise<void> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    } finally {
      this.setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
      }
    }
  }

  // Users
  async getMe(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateMe(data: UpdateUserRequest): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Groups
  async getGroups(): Promise<Group[]> {
    return this.request<Group[]>('/groups');
  }

  async createGroup(data: CreateGroupRequest): Promise<Group> {
    return this.request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGroup(id: string): Promise<Group> {
    return this.request<Group>(`/groups/${id}`);
  }

  async updateGroup(id: string, data: UpdateGroupRequest): Promise<Group> {
    return this.request<Group>(`/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteGroup(id: string): Promise<MessageResponse> {
    return this.request<MessageResponse>(`/groups/${id}`, {
      method: 'DELETE',
    });
  }

  async joinGroup(inviteCode: string): Promise<Group> {
    return this.request<Group>(`/groups/join/${inviteCode}`, {
      method: 'POST',
    });
  }

  async regenerateInvite(id: string): Promise<{ inviteCode: string }> {
    return this.request<{ inviteCode: string }>(`/groups/${id}/regenerate-invite`, {
      method: 'POST',
    });
  }

  // Members
  async getMembers(groupId: string): Promise<GroupMember[]> {
    return this.request<GroupMember[]>(`/groups/${groupId}/members`);
  }

  async addMember(groupId: string, data: AddMemberRequest): Promise<GroupMember> {
    return this.request<GroupMember>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeMember(groupId: string, userId: string): Promise<MessageResponse> {
    return this.request<MessageResponse>(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Expenses
  async getExpenses(groupId: string, page = 1, limit = 20): Promise<PaginatedResponse<Expense>> {
    return this.request<PaginatedResponse<Expense>>(
      `/groups/${groupId}/expenses?page=${page}&limit=${limit}`
    );
  }

  async createExpense(groupId: string, data: CreateExpenseRequest): Promise<Expense> {
    return this.request<Expense>(`/groups/${groupId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getExpense(groupId: string, expenseId: string): Promise<Expense> {
    return this.request<Expense>(`/groups/${groupId}/expenses/${expenseId}`);
  }

  async deleteExpense(expenseId: string): Promise<MessageResponse> {
    return this.request<MessageResponse>(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // Settlements
  async getSettlements(groupId: string, page = 1, limit = 20): Promise<PaginatedResponse<Settlement>> {
    return this.request<PaginatedResponse<Settlement>>(
      `/groups/${groupId}/settlements?page=${page}&limit=${limit}`
    );
  }

  async createSettlement(groupId: string, data: CreateSettlementRequest): Promise<Settlement> {
    return this.request<Settlement>(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Balances
  async getBalances(groupId: string): Promise<GroupBalances> {
    return this.request<GroupBalances>(`/groups/${groupId}/balances`);
  }

  // Categories
  async getCategories(groupId: string): Promise<Category[]> {
    return this.request<Category[]>(`/groups/${groupId}/categories`);
  }

  async createCategory(groupId: string, data: CreateCategoryRequest): Promise<Category> {
    return this.request<Category>(`/groups/${groupId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Comments
  async getComments(expenseId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/expenses/${expenseId}/comments`);
  }

  async createComment(expenseId: string, data: CreateCommentRequest): Promise<Comment> {
    return this.request<Comment>(`/expenses/${expenseId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Receipt upload (special case with FormData)
  async uploadReceipt(expenseId: string, file: File): Promise<{ filePath: string }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}/receipt`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }
}

export const api = new ApiClient();

