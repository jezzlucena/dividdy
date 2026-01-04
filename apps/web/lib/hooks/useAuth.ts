'use client';

import type { User } from '@dividdy/shared-types';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useCallback, useEffect, useState } from 'react';

import { api } from '../api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const userData = await api.getMe();
      setUser(userData);
    } catch {
      // Try to refresh token
      try {
        await api.refreshToken();
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        api.setToken(null);
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login({ email, password });
    setUser(response.user);
    router.push('/dashboard');
  }, [router]);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const response = await api.register({ email, password, name });
    setUser(response.user);
    router.push('/dashboard');
  }, [router]);

  const sendMagicLink = useCallback(async (email: string) => {
    await api.sendMagicLink({ email });
  }, []);

  const verifyMagicLink = useCallback(async (token: string) => {
    const response = await api.verifyMagicLink(token);
    setUser(response.user);
    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    router.push('/');
  }, [router]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    sendMagicLink,
    verifyMagicLink,
    logout,
    refreshUser,
  };
}

export { AuthContext };

