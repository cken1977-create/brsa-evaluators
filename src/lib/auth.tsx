'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, Evaluator, Session, TOKEN_KEY } from './api';

interface AuthState {
  evaluator: Evaluator | null;
  isLoading: boolean;
}

interface AuthContext extends AuthState {
  login: (session: Session) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext | null>(null);
const LEGACY_KEY = 'brsa_evaluator'; // pre-lockdown email-lookup "session" (no token): discarded

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ evaluator: null, isLoading: true });

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_KEY);
    setState({ evaluator: null, isLoading: false });
  }, []);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setState({ evaluator: null, isLoading: false });
      return;
    }
    try {
      const me = await api.me();
      setState({ evaluator: me, isLoading: false });
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    localStorage.removeItem(LEGACY_KEY);
    refresh();
    const onUnauthorized = () => logout();
    window.addEventListener('brsa:unauthorized', onUnauthorized);
    return () => window.removeEventListener('brsa:unauthorized', onUnauthorized);
  }, [refresh, logout]);

  const login = useCallback((session: Session) => {
    localStorage.setItem(TOKEN_KEY, session.token);
    setState({ evaluator: session.evaluator, isLoading: false });
  }, []);

  return <AuthCtx.Provider value={{ ...state, login, logout, refresh }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
