'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import Link from 'next/link';
import Toast from '@/components/Toast';

export default function RegisterPage() {
  const { login, evaluator } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', organization: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (evaluator) router.replace('/dashboard');
  }, [evaluator, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      const newEvaluator = await api.createEvaluator({
  full_name: form.name.trim(),
  email: form.email.trim().toLowerCase(),
});
      const stored = localStorage.getItem('brsa_known_evaluators');
      const known: Record<string, string> = stored ? JSON.parse(stored) : {};
      known[form.email.trim().toLowerCase()] = newEvaluator.evaluator_id;
known[form.email.trim().toLowerCase() + '_name'] = form.name.trim();
localStorage.setItem('brsa_known_evaluators', JSON.stringify(known));
      login(newEvaluator);
      setToast({ msg: 'Account created! Welcome to the BRSA Training Portal.', type: 'success' });
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Registration failed', type: 'error' });
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
          <div style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '.2em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: 12 }}>
                Behavioral Readiness Standards Authority
              </p>
              <h1 style={{ fontSize: '2.2rem', marginBottom: 8 }}>Create Account</h1>
              <p style={{ fontSize: '0.9rem' }}>Register to begin your evaluator certification training.</p>
            </div>
            <div className="card">
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" name="name" placeholder="Dr. Jane Smith" value={form.name} onChange={handleChange} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" name="email" type="email" placeholder="jane.smith@org.edu" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Organization</label>
                  <input className="form-input" name="organization" placeholder="Your institution or organization" value={form.organization} onChange={handleChange} />
                </div>
                <div style={{ background: 'var(--navy)', border: '1px solid var(--navy-light)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--slate)', lineHeight: 1.6 }}>
                    By registering, you agree to complete all 8 required training modules and uphold BRSA evaluation standards. Your progress and certification status are recorded in the BRSA registry.
                  </p>
                </div>
                <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                  {loading ? <><div className="spinner" />Creating account…</> : 'Create Account & Begin Training'}
                </button>
              </form>
              <div className="gold-rule"><span>or</span></div>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--slate)' }}>
                Already registered? <Link href="/login" style={{ fontWeight: 500 }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
      }
