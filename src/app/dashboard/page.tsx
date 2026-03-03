'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, EvaluatorProgress, ModuleProgress } from '@/lib/api';
import Nav from '@/components/Nav';
import Toast from '@/components/Toast';
import { Lock, CheckCircle, ChevronRight, Award, BookOpen, RefreshCw, AlertCircle, Play } from 'lucide-react';

function statusBadge(status: ModuleProgress['status']) {
  const map = {
    locked:      { label: 'Locked',      cls: 'badge-locked',    icon: <Lock size={10} /> },
    available:   { label: 'Available',   cls: 'badge-available', icon: <Play size={10} /> },
    in_progress: { label: 'In Progress', cls: 'badge-progress',  icon: <BookOpen size={10} /> },
    passed:      { label: 'Passed',      cls: 'badge-passed',    icon: <CheckCircle size={10} /> },
    failed:      { label: 'Retry',       cls: 'badge-failed',    icon: <RefreshCw size={10} /> },
  };
  const m = map[status];
  return <span className={`badge ${m.cls}`}>{m.icon} {m.label}</span>;
}

function CertBanner({ evaluator }: { evaluator: EvaluatorProgress['evaluator'] }) {
  return (
    <div className="cert-banner" style={{ marginBottom: 32 }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Award size={40} color="var(--success-light)" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ color: 'var(--white)', marginBottom: 8 }}>Certification Achieved</h2>
        <p style={{ color: 'var(--success-light)', fontSize: '0.9rem', fontWeight: 500 }}>
          {evaluator.name} · BRSA Certified Evaluator
        </p>
        {evaluator.certified_at && (
          <p style={{ color: 'var(--slate)', fontSize: '0.8rem', marginTop: 8 }}>
            Certified on {new Date(evaluator.certified_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
        <div style={{ marginTop: 20 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--slate)', letterSpacing: '.1em' }}>
            CERT ID: BRSA-{evaluator.evaluator_id?.slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
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
          {mod.best_score !== null && (
            <div style={{ fontSize: '0.82rem', color: 'var(--slate)', marginTop: 8 }}>
              Best score: <span style={{ color: mod.status === 'passed' ? 'var(--success-light)' : '#e05a4a', fontWeight: 600 }}>{mod.best_score}%</span>
              <span style={{ color: 'var(--slate-dim)', marginLeft: 6 }}>· passing: {mod.passing_score}%</span>
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
      {mod.best_score !== null && (
        <div style={{ marginTop: 16 }}>
          <div className="progress-bar">
            <div className={`progress-fill ${mod.status === 'passed' ? 'complete' : ''}`} style={{ width: `${Math.min(mod.best_score, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { evaluator: authEvaluator, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState<EvaluatorProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!authEvaluator) return;
    try {
      const data = await api.getProgress(authEvaluator.evaluator_id);
      setProgress(data);
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

  if (!progress) return null;

  const { evaluator, modules, overall_progress, certified } = progress;
  const passedCount = modules.filter(m => m.status === 'passed').length;
  const availableModules = modules.filter(m => m.status === 'available' || m.status === 'failed' || m.status === 'in_progress');

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <Nav />
      <main style={{ paddingBottom: 80 }}>
        <div style={{ background: 'linear-gradient(180deg, var(--navy-mid) 0%, var(--navy) 100%)', borderBottom: '1px solid var(--navy-light)', padding: '48px 0 40px' }}>
          <div className="container">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '.2em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: 10 }}>Training Dashboard</p>
            <h1 style={{ marginBottom: 8 }}>Welcome, {evaluator.name.split(' ')[0]}</h1>
            {evaluator.organization && <p style={{ color: 'var(--slate)', fontSize: '0.9rem', marginBottom: 24 }}>{evaluator.organization}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, maxWidth: 560 }}>
              {[
                { label: 'Modules Passed', value: `${passedCount} / ${modules.length}` },
                { label: 'Overall Progress', value: `${overall_progress ?? Math.round((passedCount / modules.length) * 100)}%` },
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
                <div className={`progress-fill ${certified ? 'complete' : ''}`} style={{ width: `${overall_progress ?? Math.round((passedCount / modules.length) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 40 }}>
          {certified && <CertBanner evaluator={evaluator} />}
          {!certified && availableModules.length > 0 && (
            <div style={{ background: 'rgba(200,168,75,.06)', border: '1px solid rgba(200,168,75,.25)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertCircle size={20} color="var(--gold)" />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9rem' }}>Continue Training</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>{availableModules[0].title} is ready to attempt</div>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => router.push(`/module/${availableModules[0].module_id}`)}>
                Start Module <ChevronRight size={14} />
              </button>
            </div>
          )}
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
