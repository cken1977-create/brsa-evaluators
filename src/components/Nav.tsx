'use client';

import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Award } from 'lucide-react';

export default function Nav() {
  const { evaluator, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="nav">
      <div className="nav-brand" style={{ cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
        <div className="nav-brand-mark">BRSA</div>
        <span>Evaluator Portal</span>
      </div>
      {evaluator && (
        <div className="row gap-md">
          {evaluator.certified && (
            <div className="row gap-sm" style={{ color: 'var(--success-light)', fontSize: '0.875rem', fontWeight: 500 }}>
              <Award size={16} />
              <span>Certified</span>
            </div>
          )}
          <span style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>{evaluator.full_name}</span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
