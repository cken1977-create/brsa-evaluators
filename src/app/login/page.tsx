'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';
import Link from 'next/link';
import Toast from '@/components/Toast';

export default function LoginPage() {
  const { login, evaluator } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (evaluator) router.replace('/dashboard');
  }, [evaluator, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const session = await api.login(email.trim().toLowerCase(), password);
      login(session);
      router.push('/dashboard');
    } catch (err: unknown) {
      const code = err instanceof ApiError ? err.code : undefined;
      if (code === 'use_magic_link') {
        setToast({ msg: 'Your account was created before passwords. Use “Email me a sign-in link” below, then set a password.', type: 'info' });
      } else if (err instanceof ApiError && err.status === 429) {
        setToast({ msg: 'Too many sign-in attempts. Please wait a few minutes.', type: 'error' });
      } else {
        setToast({ msg: 'Invalid email or password.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setToast({ msg: 'Enter your email address first.', type: 'info' });
      return;
    }
    setLoading(true);
    try {
      await api.requestMagicLink(email.trim().toLowerCase());
      setLinkSent(true);
    } catch {
      setToast({ msg: 'Could not send a link right now. Please try again shortly.', type: 'error' });
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
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    className="form-input"
                    type="email"
                    placeholder="you@organization.org"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    className="form-input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                  {loading ? <><div className="spinner" />Signing in…</> : 'Sign In'}
                </button>
              </form>
              <div className="gold-rule"><span>or</span></div>
              {linkSent ? (
                <p role="status" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--success-light)', marginBottom: 16 }}>
                  If an evaluator account exists for that email, a sign-in link is on its way. It works once and expires in 20 minutes.
                </p>
              ) : (
                <button className="btn btn-ghost btn-full" type="button" onClick={handleMagicLink} disabled={loading} style={{ marginBottom: 16 }}>
                  Email me a sign-in link
                </button>
              )}
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
