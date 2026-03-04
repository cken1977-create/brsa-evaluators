'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, TrainingModule, ModuleProgress, AttemptResult } from '@/lib/api';
import Nav from '@/components/Nav';
import Toast from '@/components/Toast';
import { ArrowLeft, CheckCircle, XCircle, Award, Lock, Play, RefreshCw, ChevronRight } from 'lucide-react';

const QUIZ_TEMPLATES = [
  {
    questions: [
      { q: 'What is the primary purpose of BRSA evaluation standards?', options: ['To rank evaluators by performance', 'To establish consistent behavioral readiness criteria', 'To reduce evaluation time', 'To certify organizations only'], correct: 1 },
      { q: 'Which of the following best describes "behavioral readiness"?', options: ['Physical fitness of participants', 'Cognitive and procedural preparedness for defined roles', 'Documentation compliance only', 'Training hours completed'], correct: 1 },
      { q: 'An evaluator\'s primary responsibility when assessing participants is to:', options: ['Pass as many participants as possible', 'Apply objective, standardized criteria without bias', 'Defer all decisions to supervisors', 'Focus exclusively on written assessments'], correct: 1 },
    ],
  },
  {
    questions: [
      { q: 'Evaluator impartiality requires that assessments be conducted:', options: ['Based on personal relationships', 'Without prior knowledge of the participant', 'Using consistent criteria regardless of evaluator-participant relationship', 'Only with senior oversight present'], correct: 2 },
      { q: 'Which practice BEST supports evaluator impartiality?', options: ['Sharing preliminary scores with colleagues', 'Documenting all observations contemporaneously', 'Adjusting criteria based on context', 'Conducting assessments in pairs only'], correct: 1 },
      { q: 'When an evaluator has a conflict of interest, they should:', options: ['Proceed but document the conflict', 'Recuse themselves and notify their coordinator', 'Have a colleague observe', 'Score more strictly to compensate'], correct: 1 },
    ],
  },
];

function getQuizForModule(seq: number) {
  return QUIZ_TEMPLATES[(seq - 1) % QUIZ_TEMPLATES.length];
}

interface QuizState {
  answers: (number | null)[];
  submitted: boolean;
  score: number | null;
}

function QuizSection({ module, onSubmit, submitting, result }: { module: TrainingModule; onSubmit: (score: number) => void; submitting: boolean; result: AttemptResult | null; disabled: boolean; }) {
  const quiz = getQuizForModule(module.seq);
  const [state, setState] = useState<QuizState>({ answers: Array(quiz.questions.length).fill(null), submitted: false, score: null });
  const allAnswered = state.answers.every(a => a !== null);

  const handleSelect = (qi: number, oi: number) => {
    if (state.submitted) return;
    setState(s => { const answers = [...s.answers]; answers[qi] = oi; return { ...s, answers }; });
  };

  const handleSubmit = () => {
    const correct = state.answers.filter((a, i) => a === quiz.questions[i].correct).length;
    const score = Math.round((correct / quiz.questions.length) * 100);
    setState(s => ({ ...s, submitted: true, score }));
    onSubmit(score);
  };

  const handleReset = () => setState({ answers: Array(quiz.questions.length).fill(null), submitted: false, score: null });

  return (
    <div>
      <h3 style={{ marginBottom: 24, color: 'var(--white)' }}>Knowledge Check</h3>
      {quiz.questions.map((q, qi) => (
        <div key={qi} style={{ marginBottom: 28 }}>
          <p style={{ color: 'var(--white)', fontWeight: 500, marginBottom: 14, lineHeight: 1.5 }}>
            <span style={{ color: 'var(--gold-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginRight: 8 }}>Q{qi + 1}</span>
            {q.q}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((opt, oi) => {
              let cls = 'quiz-option';
              if (state.answers[qi] === oi) cls += ' selected';
              if (state.submitted) {
                if (oi === q.correct) cls = 'quiz-option correct';
                else if (state.answers[qi] === oi && oi !== q.correct) cls = 'quiz-option incorrect';
              }
              return <div key={oi} className={cls} onClick={() => handleSelect(qi, oi)}><span style={{ color: 'var(--slate-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginRight: 10 }}>{String.fromCharCode(65 + oi)}</span>{opt}</div>;
            })}
          </div>
        </div>
      ))}
      {!state.submitted ? (
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!allAnswered || submitting} style={{ marginTop: 8 }}>
          {submitting ? <><div className="spinner" />Submitting…</> : 'Submit Quiz'}
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {result && !result.passed && <button className="btn btn-ghost" onClick={handleReset}><RefreshCw size={14} /> Try Again</button>}
          {result?.passed && <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success-light)', fontWeight: 500 }}><CheckCircle size={18} /> Module passed!</div>}
        </div>
      )}
    </div>
  );
}

function ResultBanner({ result, passingScore }: { result: AttemptResult; passingScore: number }) {
  if (result.passed) {
    return (
      <div style={{ background: 'rgba(39,174,96,.1)', border: '1px solid rgba(39,174,96,.35)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div className="score-ring passed">{result.score}%</div>
        <div>
          <div style={{ color: 'var(--success-light)', fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>✓ Module Passed</div>
          <div style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>
  {result.passed ? `Score: ${result.score}% — module complete.` : `Score: ${result.score}% — need ${result.passing}% to pass.`}
</div>
          {result.certified && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', marginTop: 8, fontWeight: 600 }}><Award size={16} /> BRSA Certification Awarded!</div>}
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.3)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div className="score-ring failed">{result.score}%</div>
      <div>
        <div style={{ color: '#e05a4a', fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}><XCircle size={16} style={{ display: 'inline', marginRight: 6 }} />Passing score not met</div>
        <div style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>You scored {result.score}% — passing is {passingScore}%. Review the material and try again.</div>
      </div>
    </div>
  );
}

export default function ModulePage() {
  const params = useParams();
  const moduleId = params?.moduleId as string;
  const { evaluator: authEvaluator, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress | null>(null);
  const [allModules, setAllModules] = useState<TrainingModule[]>([]);
  const [allProgress, setAllProgress] = useState<ModuleProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadData = useCallback(async () => {
    if (!authEvaluator) return;
    try {
      const [modules, progressData] = await Promise.all([api.getModules(), api.getProgress(authEvaluator.evaluator_id)]);
      setAllModules(modules);
      setAllProgress(progressData.modules);
      setModule(modules.find(m => m.module_id === moduleId) || null);
      setModuleProgress(progressData.modules.find(m => m.module_id === moduleId) || null);
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Failed to load module', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [authEvaluator, moduleId]);

  useEffect(() => {
    if (authLoading) return;
    if (!authEvaluator) { router.replace('/login'); return; }
    loadData();
  }, [authEvaluator, authLoading, loadData, router]);

  const handleSubmit = async (score: number) => {
    if (!authEvaluator || !module) return;
    setSubmitting(true);
    try {
      const res = await api.submitAttempt(authEvaluator.evaluator_id, module.module_id, score);
      setResult(res);
      if (res.passed) {
        setToast({ msg: res.certified ? '🎉 You are now a certified BRSA Evaluator!' : res.message, type: 'success' });
        await loadData();
      }
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Submission failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const nextModule = allModules.sort((a, b) => a.seq - b.seq).find(m => {
    const p = allProgress.find(p => p.module_id === m.module_id);
    return p && (p.status === 'available' || p.status === 'failed') && m.module_id !== moduleId;
  });

  if (authLoading || loading) return <><Nav /><div className="page-loader"><div className="spinner" style={{ width: 36, height: 36 }} /></div></>;
  if (!module || !moduleProgress) return <><Nav /><div className="container" style={{ paddingTop: 60, textAlign: 'center' }}><p style={{ color: 'var(--slate)' }}>Module not found.</p><button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button></div></>;

  const isLocked = moduleProgress.status === 'locked';
  const isPassed = moduleProgress.status === 'passed';

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <Nav />
      <main style={{ paddingBottom: 80 }}>
        <div style={{ borderBottom: '1px solid var(--navy-light)', padding: '16px 0' }}>
          <div className="container">
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')}><ArrowLeft size={14} /> Dashboard</button>
          </div>
        </div>
        <div className="container" style={{ paddingTop: 40 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ marginBottom: 32 }}>
              <div className="module-seq">Module {moduleProgress.seq.toString().padStart(2, '0')} of {allModules.length}</div>
              <h1 style={{ marginBottom: 12 }}>{module.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {isLocked && <span className="badge badge-locked"><Lock size={10} /> Locked</span>}
                {isPassed && <span className="badge badge-passed"><CheckCircle size={10} /> Passed</span>}
                {!isLocked && !isPassed && <span className="badge badge-available"><Play size={10} /> Available</span>}
                <span style={{ color: 'var(--slate-dim)', fontSize: '0.8rem' }}>Passing score: {module.passing_score}%</span>
                {moduleProgress.attempts > 0 && <span style={{ color: 'var(--slate-dim)', fontSize: '0.8rem' }}>· {moduleProgress.attempts} attempt{moduleProgress.attempts !== 1 ? 's' : ''}</span>}
              </div>
            </div>

            {isLocked && (
              <div style={{ background: 'var(--navy-mid)', border: '1px solid var(--navy-light)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center' }}>
                <Lock size={32} color="var(--slate-dim)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ color: 'var(--slate)', marginBottom: 8 }}>Module Locked</h3>
                <p style={{ fontSize: '0.875rem' }}>Complete the previous module to unlock this one.</p>
              </div>
            )}

            {!isLocked && (
              <>
                {module.video_url && (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ background: '#000', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '16/9', border: '1px solid var(--navy-light)' }}>
                      <iframe src={module.video_url} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={module.title} />
                    </div>
                  </div>
                )}
                <div className="card" style={{ marginBottom: 32 }}>
                  <h3 style={{ marginBottom: 12 }}>About This Module</h3>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{module.description}</p>
                  {moduleProgress.best_score !== null && (
                    <>
                      <hr className="divider" />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div className={`score-ring ${isPassed ? 'passed' : 'failed'}`} style={{ width: 64, height: 64, fontSize: '1.1rem' }}>{moduleProgress.best_score}%</div>
                        <div>
                          <div style={{ color: 'var(--white)', fontWeight: 500, marginBottom: 4 }}>Your best score</div>
                          <div style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>{isPassed ? 'You have passed this module.' : `Need ${module.passing_score}% to pass.`}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {result && <div style={{ marginBottom: 32 }}><ResultBanner result={result} passingScore={module.passing_score} /></div>}
                <div className="card" style={{ marginBottom: 32 }}>
                  <QuizSection module={module} onSubmit={handleSubmit} submitting={submitting} result={result} disabled={false} />
                </div>
                {result?.passed && nextModule && (
                  <div style={{ background: 'rgba(200,168,75,.06)', border: '1px solid rgba(200,168,75,.25)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: 4 }}>Next: {nextModule.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>Module {nextModule.seq} is now unlocked</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => router.push(`/module/${nextModule.module_id}`)}>Continue <ChevronRight size={14} /></button>
                  </div>
                )}
                {result?.certified && (
                  <button className="btn btn-primary" onClick={() => router.push('/dashboard')} style={{ width: '100%' }}><Award size={16} /> View My Certification</button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
      }
