'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';
import Toast from '@/components/Toast';

export default function LoginPage() {
  const { login, evaluator } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (evaluator) router.replace('/dashboard');
  }, [evaluator, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const stored = localStorage.getItem('brsa_known_evaluators');
      const known: Record<string, string> = stored ? JSON.parse(stored) : {};
      const evaluatorId = known[email.toLowerCase()];
      if (!evaluatorId) {
        setToast({ msg: 'No account found for that email. Please register first.', type: 'error' });
        setLoading(false);
        return;
      }
      const progress = await api.getProgress(evaluatorId);
// Build evaluator object from stored data + progress response
const stored = JSON.parse(localStorage.getItem('brsa_known_evaluators') || '{}');
login({
  evaluator_id: evaluatorId,
  full_name: '',
  email: email.toLowerCase(),
  status: 'active',
  certified: false,
  certified_at: null,
  created_at: '',
});
      router.push('/dashboard');
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Login failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--navy-light)' }}>
          <div className="nav-brand">
            <div className="nav-brand-mark">BRSA</div>
            <span>Evaluator Portal</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 440 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '.2em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: 12 }}>
                Behavioral Readiness Standards Authority
              </p>
              <h1 style={{ fontSize: '2.2rem', marginBottom: 8 }}>Evaluator Sign In</h1>
              <p style={{ fontSize: '0.9rem' }}>Access your training dashboard and certification progress.</p>
            </div>
            <div className="card">
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@organization.org"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                  {loading ? <><div className="spinner" />Signing in…</> : 'Sign In'}
                </button>
              </form>
              <div className="gold-rule"><span>or</span></div>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--slate)' }}>
                New evaluator? <Link href="/register" style={{ fontWeight: 500 }}>Create an account</Link>
              </p>
            </div>
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.8rem', color: 'var(--slate-dim)' }}>
              Authorized use only · BRSA Holdings, Inc.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
