'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { evaluator, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (evaluator) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [evaluator, isLoading, router]);

  return (
    <div className="page-loader">
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <p style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>Loading…</p>
    </div>
  );
}
