'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Evaluator } from './api';

interface AuthState {
  evaluator: Evaluator | null;
  isLoading: boolean;
}

interface AuthContext extends AuthState {
  login: (evaluator: Evaluator) => void;
  logout: () => void;
}

const AuthCtx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ evaluator: null, isLoading: true });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('brsa_evaluator');
      if (stored) {
        setState({ evaluator: JSON.parse(stored), isLoading: false });
      } else {
        setState({ evaluator: null, isLoading: false });
      }
    } catch {
      setState({ evaluator: null, isLoading: false });
    }
  }, []);

  const login = useCallback((evaluator: Evaluator) => {
    localStorage.setItem('brsa_evaluator', JSON.stringify(evaluator));
    setState({ evaluator, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('brsa_evaluator');
    setState({ evaluator: null, isLoading: false });
  }, []);

  return <AuthCtx.Provider value={{ ...state, login, logout }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
