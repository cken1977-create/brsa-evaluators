'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, ModuleProgress } from '@/lib/api';
import Nav from '@/components/Nav';
import Toast from '@/components/Toast';
import { Lock, CheckCircle, ChevronRight, Award, BookOpen, RefreshCw, AlertCircle, Play } from 'lucide-react';

function statusBadge(status: ModuleProgress['status']) {
  const map = {
    locked:   { label: 'Locked',      cls: 'badge-locked',    icon: <Lock size={10} /> },
    unlocked: { label: 'Available',   cls: 'badge-available', icon: <Play size={10} /> },
    passed:   { label: 'Passed',      cls: 'badge-passed',    icon: <CheckCircle size={10} /> },
    failed:   { label: 'Retry',       cls: 'badge-failed',    icon: <RefreshCw size={10} /> },
  };
  const m = map[status] ?? { label: status, cls: 'badge-locked', icon: <BookOpen size={10} /> };
  return <span className={`badge ${m.cls}`}>{m.icon} {m.label}</span>;
}

function ModuleCard({ mod, onClick }: { mod: ModuleProgress; onClick: () => void }) {
  const clickable = mod.status !== 'locked';
  return (
    <div
      className={`module-card ${clickable ? 'clickable' : ''} ${mod.status === 'passed' ? 'passed' : ''} ${mod.status === 'locked' ? 'locked' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="module-seq">Module {mod.seq.toString().padStart(2, '0')}</div>
          <div className="module-title">{mod.title}</div>
          {mod.score !== null && mod.score !== undefined && (
            <div style={{ fontSize: '0.82rem', color: 'var(--slate)', marginTop: 8 }}>
              Best score: <span style={{ color: mod.status === 'passed' ? 'var(--success-light)' : '#e05a4a', fontWeight: 600 }}>{mod.score}%</span>
            </div>
          )}
          {mod.attempts > 0 && (
            <div style={{ fontSize: '0.78rem', color: 'var(--slate-dim)', marginTop: 4 }}>
              {mod.attempts} attempt{mod.attempts !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, flexShrink: 0 }}>
          {statusBadge(mod.status)}
          {clickable && <ChevronRight size={16} color="var(--slate-dim)" />}
        </div>
      </div>
      {mod.score !== null && mod.score !== undefined && (
        <div style={{ marginTop: 16 }}>
          <div className="progress-bar">
            <div className={`progress-fill ${mod.status === 'passed' ? 'complete' : ''}`} style={{ width: `${Math.min(mod.score, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { evaluator: authEvaluator, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [modules, setModules] = useState<ModuleProgress[]>([]);
  const [certified, setCertified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!authEvaluator) return;
    try {
      const data = await api.getProgress(authEvaluator.evaluator_id);
      setModules(data.progress || []);
      // check if all modules passed
      const allPassed = (data.progress || []).length > 0 && (data.progress || []).every(m => m.status === 'passed');
      setCertified(allPassed);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to load progress', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [authEvaluator]);

  useEffect(() => {
    if (authLoading) return;
    if (!authEvaluator) { router.replace('/login'); return; }
    fetchProgress();
  }, [authEvaluator, authLoading, fetchProgress, router]);

  if (authLoading || loading) {
    return (
      <>
        <Nav />
        <div className="page-loader">
          <div className="spinner" style={{ width: 36, height: 36 }} />
          <p style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>Loading your training dashboard…</p>
        </div>
      </>
    );
  }

  const passedCount = modules.filter(m => m.status === 'passed').length;
  const totalCount = modules.length;
  const overallPct = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const nextModule = modules.find(m => m.status === 'unlocked' || m.status === 'failed');

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <Nav />
      <main style={{ paddingBottom: 80 }}>
        {/* Hero strip */}
        <div style={{ background: 'linear-gradient(180deg, var(--navy-mid) 0%, var(--navy) 100%)', borderBottom: '1px solid var(--navy-light)', padding: '48px 0 40px' }}>
          <div className="container">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '.2em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: 10 }}>Training Dashboard</p>
            <h1 style={{ marginBottom: 8 }}>Welcome, {authEvaluator?.full_name?.split(' ')[0]}</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, maxWidth: 560, marginTop: 24 }}>
              {[
                { label: 'Modules Passed', value: `${passedCount} / ${totalCount}` },
                { label: 'Overall Progress', value: `${overallPct}%` },
                { label: 'Status', value: certified ? 'Certified' : 'In Training', highlight: certified },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--navy)', border: '1px solid var(--navy-light)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-dim)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', color: s.highlight ? 'var(--success-light)' : 'var(--gold)', fontWeight: 500 }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, maxWidth: 560 }}>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className={`progress-fill ${certified ? 'complete' : ''}`} style={{ width: `${overallPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 40 }}>
          {/* Cert banner */}
          {certified && (
            <div className="cert-banner" style={{ marginBottom: 32 }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Award size={40} color="var(--success-light)" style={{ margin: '0 auto 12px' }} />
                <h2 style={{ color: 'var(--white)', marginBottom: 8 }}>Certification Achieved</h2>
                <p style={{ color: 'var(--success-light)', fontSize: '0.9rem', fontWeight: 500 }}>
                  {authEvaluator?.full_name} · BRSA Certified Evaluator
                </p>
                <div style={{ marginTop: 20 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--slate)', letterSpacing: '.1em' }}>
                    CERT ID: BRSA-{authEvaluator?.evaluator_id?.slice(5, 13).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next action */}
          {!certified && nextModule && (
            <div style={{ background: 'rgba(200,168,75,.06)', border: '1px solid rgba(200,168,75,.25)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertCircle size={20} color="var(--gold)" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>Continue Training</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>{nextModule.title} is ready</div>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => router.push(`/module/${nextModule.module_id}`)}>
                Start Module <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Module list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 8, color: 'var(--white)' }}>Training Modules</h2>
            {modules.sort((a, b) => a.seq - b.seq).map(mod => (
              <ModuleCard key={mod.module_id} mod={mod} onClick={() => router.push(`/module/${mod.module_id}`)} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
