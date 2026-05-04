'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { getToken, setToken, getStoredUser, setStoredUser, clearAuth } from '@/lib/auth';
import { login as apiLogin, register as apiRegister } from '@/lib/api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, isAdmin: false, loading: true,
  login: async () => {}, register: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = getToken();
    const u = getStoredUser();
    if (t && u) { setTokenState(t); setUser(u as User); }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password);
    setToken(res.token);
    setStoredUser(res.user);
    setTokenState(res.token);
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiRegister(name, email, password);
    setToken(res.token);
    setStoredUser(res.user);
    setTokenState(res.token);
    setUser(res.user);
  }

  function logout() {
    clearAuth();
    setTokenState(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isAdmin: user?.role === 'admin', loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
