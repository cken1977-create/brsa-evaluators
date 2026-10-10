'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function MagicLinkPage() {
  const { login } = useAuth();
  const router = useRouter();
  const ran = useRef(false);
  const [state, setState] = useState<'verifying' | 'set-password' | 'error'>('verifying');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    // Drop the token from the address bar/history right away.
    window.history.replaceState(null, '', window.location.pathname);
    if (!token) { setState('error'); return; }
    api.verifyMagicLink(token)
      .then(session => {
        login(session);
        if (session.evaluator.has_password) router.replace('/dashboard');
        else setState('set-password');
      })
      .catch(() => setState('error'));
  }, [login, router]);

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 10) { setMsg('Password must be at least 10 characters.'); return; }
    setBusy(true);
    try {
      await api.setPassword(password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : 'Could not save password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        {state === 'verifying' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div className="spinner" /> Signing you in…</div>
        )}
        {state === 'error' && (
          <>
            <h1 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Link expired</h1>
            <p style={{ marginBottom: 20 }}>This sign-in link is invalid, already used, or older than 20 minutes.</p>
            <Link className="btn btn-primary btn-full" href="/login">Request a new link</Link>
          </>
        )}
        {state === 'set-password' && (
          <form onSubmit={savePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h1 style={{ fontSize: '1.6rem' }}>Set a password</h1>
            <p style={{ fontSize: '0.9rem' }}>You&rsquo;re signed in. Set a password so you can sign in directly next time.</p>
            <div className="form-group">
              <label className="form-label" htmlFor="pw">New password (10+ characters)</label>
              <input id="pw" className="form-input" type="password" autoComplete="new-password" minLength={10} value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
            </div>
            {msg && <p role="alert" style={{ color: '#e05a4a', fontSize: '0.85rem' }}>{msg}</p>}
            <button className="btn btn-primary btn-full" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
            <button className="btn btn-ghost btn-full" type="button" onClick={() => router.replace('/dashboard')}>Skip for now</button>
          </form>
        )}
      </div>
    </div>
  );
}
