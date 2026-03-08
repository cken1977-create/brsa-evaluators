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
    // Module 1 — Behavioral Observation Fundamentals
    questions: [
      { q: 'What is the primary role of a BRSA Evaluator?', options: ['Interpret participant behavior and assign meaning', 'Observe behavior and record it exactly as it occurs', 'Score participants based on personal judgment', 'Determine readiness outcomes independently'], correct: 1 },
      { q: 'Which statement best reflects BRSA evaluation doctrine?', options: ['Behavior is recorded as meaning, not action', 'Evaluators may interpret behavior when necessary', 'Behavior is recorded as action, not meaning', 'Interpretation improves evaluation accuracy'], correct: 2 },
      { q: 'An evaluator notices a participant pause before responding. What should they record?', options: ['Subject appeared nervous', 'Subject was unprepared', 'Subject paused for four seconds before responding', 'Subject demonstrated anxiety'], correct: 2 },
      { q: 'What is Protocol Reference BRSA-EV-PR-001 concerned with?', options: ['Scoring criteria', 'Submission procedures', 'Observation techniques', 'Preparation before beginning an evaluation'], correct: 3 },
      { q: 'Which action violates BRSA documentation standards?', options: ['Recording observable actions', 'Recording timing of responses', 'Recording assumed emotions', 'Recording observable responses'], correct: 2 },
      { q: 'Why does BRSA require evaluators to maintain neutrality?', options: ['To reduce evaluation time', 'To ensure consistency, audit integrity, and reliability of the standard', 'To limit the number of evidence events recorded', 'To simplify the scoring process'], correct: 1 },
      { q: 'What does Protocol Reference BRSA-EV-PR-004 govern?', options: ['Preparation', 'Documentation', 'Scoring', 'Submission'], correct: 2 },
      { q: 'An evaluator adjusts a score based on personal sympathy. This violates which protocol?', options: ['BRSA-EV-PR-001', 'BRSA-EV-PR-002', 'BRSA-EV-PR-003', 'BRSA-EV-PR-004'], correct: 3 },
      { q: 'What happens when an evaluator submits incomplete records?', options: ['The system auto-completes missing data', 'Audit integrity is preserved regardless', 'The evaluation process is incomplete and audit integrity is compromised', 'A supervisor is automatically notified'], correct: 2 },
      { q: 'The Evaluator Oath commits evaluators to:', options: ['Pass all participants who show effort', 'Observe without bias, record without interpretation, uphold doctrine with neutrality and precision', 'Prioritize efficiency over documentation accuracy', 'Defer all scoring decisions to senior evaluators'], correct: 1 },
    ],
  },
  {
    // Module 2 — Documentation Protocol and Evidence Integrity
    questions: [
      { q: 'What is the core doctrine of BRSA documentation?', options: ['Documentation reflects evaluator interpretation', 'Documentation reflects observable behavior only', 'Documentation reflects participant self-reporting', 'Documentation reflects program outcomes'], correct: 1 },
      { q: 'Which best describes the purpose of documentation in BRSA evaluation?', options: ['An administrative requirement', 'A summary of evaluator opinions', 'The permanent evaluation record', 'A scoring worksheet'], correct: 2 },
      { q: 'An evaluator writes "subject appeared confused." This violates which doctrine?', options: ['Documentation must be submitted promptly', 'Documentation must reflect observable behavior only', 'Documentation must include timing', 'Documentation must be countersigned'], correct: 1 },
      { q: 'What does Protocol Reference BRSA-EV-PR-006 require?', options: ['Submission procedures', 'Scoring criteria', 'Recording timing and sequence of behavior', 'Preparation before evaluation'], correct: 2 },
      { q: 'Why is timing critical in behavioral documentation?', options: ['It reduces evaluation length', 'It provides critical behavioral context', 'It replaces the need for written records', 'It satisfies administrative requirements only'], correct: 1 },
      { q: 'What does Protocol Reference BRSA-EV-PR-007 govern?', options: ['Evidence submission', 'Scoring consistency', 'Documentation completeness', 'Evaluator preparation'], correct: 2 },
      { q: 'An evaluator leaves required fields incomplete before submission. This violates:', options: ['BRSA-EV-PR-005', 'BRSA-EV-PR-006', 'BRSA-EV-PR-007', 'BRSA-EV-PR-008'], correct: 2 },
      { q: 'What does Protocol Reference BRSA-EV-PR-008 protect?', options: ['Evaluator identity', 'Participant privacy', 'Documentation integrity after submission', 'Scoring reliability'], correct: 2 },
      { q: 'What is the purpose of the chain-of-record in BRSA documentation?', options: ['To track evaluator performance metrics', 'To ensure audit reliability and documentation integrity', 'To reduce submission time', 'To allow post-submission edits'], correct: 1 },
      { q: 'The Module 2 Evaluator Oath commits evaluators to:', options: ['Complete evaluations as quickly as possible', 'Document behavior accurately, preserve evidence integrity, and uphold protocol with neutrality and precision', 'Defer documentation to senior evaluators when uncertain', 'Record participant emotions alongside observable behavior'], correct: 1 },
    ],
  },
  {
    // Module 3 — Protocol Compliance and Evaluation Submission
    questions: [
      { q: 'What is the core doctrine of protocol compliance in BRSA evaluation?', options: ['Evaluators may use judgment when protocol is unclear', 'Evaluators must follow protocol exactly', 'Protocol is guidance not requirement', 'Senior evaluators may modify protocol'], correct: 1 },
      { q: 'What does Protocol Reference BRSA-EV-PR-009 govern?', options: ['Documentation completeness', 'Evaluation authorization', 'Scoring criteria', 'Submission timing'], correct: 1 },
      { q: 'Why must evaluations be authorized before beginning?', options: ['To reduce evaluation time', 'To ensure proper protocol control', 'To notify participants in advance', 'To assign evaluator pairs'], correct: 1 },
      { q: 'An evaluator deviates from the protocol sequence mid-evaluation. This violates:', options: ['BRSA-EV-PR-003', 'BRSA-EV-PR-002', 'BRSA-EV-PR-010', 'BRSA-EV-PR-005'], correct: 1 },
      { q: 'What does Protocol Reference BRSA-EV-PR-010 require?', options: ['Evaluation authorization', 'Documentation verification before submission', 'Scoring adjustment criteria', 'Chain-of-record preservation'], correct: 1 },
      { q: 'Why must evaluators verify documentation before submission?', options: ['To reduce audit workload', 'To prevent documentation errors entering the permanent record', 'To allow scoring adjustments', 'To notify the participant'], correct: 1 },
      { q: 'What does deviation from evaluation protocol introduce?', options: ['Efficiency', 'Inconsistency and compromised reliability', 'Flexibility', 'Evaluator discretion'], correct: 1 },
      { q: 'Which protocol reference governs submission of the evaluation record?', options: ['BRSA-EV-PR-002', 'BRSA-EV-PR-003', 'BRSA-EV-PR-005', 'BRSA-EV-PR-009'], correct: 2 },
      { q: 'An evaluator submits documentation without verification. This violates:', options: ['BRSA-EV-PR-005', 'BRSA-EV-PR-009', 'BRSA-EV-PR-010', 'BRSA-EV-PR-003'], correct: 2 },
      { q: 'The Module 3 Evaluator Oath commits evaluators to:', options: ['Complete evaluations efficiently', 'Follow protocol exactly, preserve evaluation integrity, and submit documentation in accordance with BRSA standards', 'Defer submission decisions to senior evaluators', 'Adjust protocol based on participant circumstances'], correct: 1 },
    ],
  },
  {
    // Module 4 — Evaluation Integrity Violations and Prevention
    questions: [
      { q: 'What is the core doctrine of evaluation integrity?', options: ['Integrity violations are acceptable if minor', 'Evaluation integrity must be preserved at all times', 'Senior evaluators may authorize exceptions', 'Integrity applies only to final submissions'], correct: 1 },
      { q: 'What does Protocol Reference BRSA-EV-PR-011 address?', options: ['Submission timing', 'Documentation violations including interpretation and assumptions', 'Scoring adjustments', 'Evaluator authorization'], correct: 1 },
      { q: 'An evaluator performs an evaluation without authorization. This violates:', options: ['BRSA-EV-PR-008', 'BRSA-EV-PR-011', 'BRSA-EV-PR-009', 'BRSA-EV-PR-005'], correct: 2 },
      { q: 'What does Protocol Reference BRSA-EV-PR-008 prohibit?', options: ['Unauthorized evaluation activity', 'Altering documentation outside protocol', 'Incomplete submission', 'Interpretation in observations'], correct: 1 },
      { q: 'Which of the following is an evaluation integrity violation?', options: ['Recording observable behavior accurately', 'Verifying documentation before submission', 'Altering documentation after submission', 'Submitting evaluation promptly'], correct: 2 },
      { q: 'What does Protocol Reference BRSA-EV-PR-012 require?', options: ['Documentation completeness', 'Reporting suspected integrity violations', 'Evaluation authorization', 'Scoring consistency'], correct: 1 },
      { q: 'Why must evaluators report integrity violations rather than resolve them independently?', options: ['To reduce evaluator workload', 'Reporting protects the integrity of the standard', 'To assign blame appropriately', 'To pause the evaluation program'], correct: 1 },
      { q: 'An evaluator discovers a colleague altered documentation. The correct action is:', options: ['Correct the documentation on their behalf', 'Ignore it if the change seems minor', 'Report the violation according to protocol', 'Discuss it with the participant'], correct: 2 },
      { q: 'What is the consequence of concealing an integrity violation?', options: ['Reduced audit workload', 'Compromised standard reliability and institutional integrity', 'Faster evaluation completion', 'No consequence if undiscovered'], correct: 1 },
      { q: 'The Module 4 Evaluator Oath commits evaluators to:', options: ['Pass all participants who show improvement', 'Preserve evaluation integrity, prevent violations, and uphold BRSA protocol with neutrality and precision', 'Report only major violations to supervisors', 'Adjust scoring to reflect evaluator judgment'], correct: 1 },
    ],
  },
  {
    // Module 5 — Evaluation Practicum and Certification Assessment
    questions: [
      { q: 'What distinguishes Module 5 from Modules 1 through 4?', options: ['It introduces new doctrine', 'It is a demonstration module requiring applied competence not just knowledge', 'It covers advanced scoring techniques', 'It is optional for certification'], correct: 1 },
      { q: 'What is the certification doctrine established in Module 5?', options: ['Certification is awarded based on training hours', 'Certification requires demonstrated protocol competence', 'Certification is automatic after Module 4', 'Certification is granted by supervisor recommendation'], correct: 1 },
      { q: 'During the practicum a subject pauses and adjusts posture before answering. The correct documentation is:', options: ['Subject appeared nervous and uncomfortable', 'Subject paused for four seconds before responding. Subject adjusted posture before answering.', 'Subject demonstrated anxiety during questioning', 'Subject was hesitant and possibly unprepared'], correct: 1 },
      { q: 'What must an evaluator do before submitting a practicum evaluation?', options: ['Consult with a senior evaluator', 'Verify documentation for accuracy and completeness', 'Obtain participant signature', 'Submit immediately after observation'], correct: 1 },
      { q: 'Which protocol reference governs scoring during the practicum?', options: ['BRSA-EV-PR-002', 'BRSA-EV-PR-003', 'BRSA-EV-PR-004', 'BRSA-EV-PR-005'], correct: 2 },
      { q: 'What does full protocol compliance during the practicum demonstrate?', options: ['Evaluator speed and efficiency', 'Readiness for Apprentice Evaluator Certification', 'Advanced scoring ability', 'Independent evaluation authority'], correct: 1 },
      { q: 'An evaluator adjusts a practicum score outside protocol criteria. This disqualifies them because:', options: ['Scoring must be completed quickly', 'Consistency ensures reliability across evaluators', 'Scores must match participant expectations', 'Protocol scoring is optional guidance'], correct: 1 },
      { q: 'What happens after documentation is submitted in the practicum?', options: ['The evaluator requests a review', 'The submission is final and becomes part of the permanent record', 'The participant is notified immediately', 'Scores are averaged with prior attempts'], correct: 1 },
      { q: 'The practicum certification oath refers to which tier?', options: ['Certified Evaluator', 'Senior Evaluator', 'BRSA Apprentice Evaluator', 'Master Evaluator'], correct: 2 },
      { q: 'Achieving Apprentice Evaluator Certification qualifies the evaluator for:', options: ['Immediate Senior Evaluator status', 'Independent evaluations within authorized scope and progression to the Certified Evaluator tier', 'Unrestricted evaluation authority', 'Training and certifying other evaluators'], correct: 1 },
    ],
  },
  {
    // Module 6 — The 12 Evidence Domains
    questions: [
      { q: 'How many evidence domains exist in the BRSA Behavioral Readiness Evaluation Instrument?', options: ['8', '10', '12', '15'], correct: 2 },
      { q: 'Which domain focuses on government-issued identification and legal name consistency?', options: ['Domain 2 — Contact Stability', 'Domain 1 — Identity Verification', 'Domain 3 — Housing Stability', 'Domain 7 — Behavioral Reliability'], correct: 1 },
      { q: 'A participant attends all scheduled sessions for 30 consecutive days. This is recorded under:', options: ['Domain 6 — Compliance Behavior', 'Domain 7 — Behavioral Reliability', 'Domain 5 — Program Engagement', 'Domain 4 — Employment and Economic Activity'], correct: 2 },
      { q: 'Which domain covers emotional management, impulse control, and response to corrective feedback?', options: ['Domain 8 — Social Stability', 'Domain 12 — Forward Readiness Signals', 'Domain 9 — Health and Wellbeing', 'Domain 11 — Self-Regulation'], correct: 3 },
      { q: 'An evaluator records "participant is doing well" after strong program attendance. This violates which doctrine?', options: ['Evaluators record evidence events within domains not outcome summaries', 'Evaluators must record all positive observations', 'Evaluators should summarize trends weekly', 'Evaluators may note progress in domain records'], correct: 0 },
      { q: 'Which domain addresses lease documentation and history of housing changes?', options: ['Domain 4 — Employment and Economic Activity', 'Domain 2 — Contact Stability', 'Domain 3 — Housing Stability', 'Domain 1 — Identity Verification'], correct: 2 },
      { q: 'Goal-setting behavior, long-term thinking, and demonstrated readiness for independence belong to:', options: ['Domain 10 — Skill Development', 'Domain 11 — Self-Regulation', 'Domain 7 — Behavioral Reliability', 'Domain 12 — Forward Readiness Signals'], correct: 3 },
      { q: 'Who computes the readiness score after evidence events are recorded?', options: ['The evaluator based on domain totals', 'The senior evaluator after review', 'The readiness engine using deterministic rules', 'The participant after self-assessment'], correct: 2 },
      { q: 'Which domain covers pro-social behavior, conflict resolution, and mentorship seeking?', options: ['Domain 7 — Behavioral Reliability', 'Domain 8 — Social Stability', 'Domain 5 — Program Engagement', 'Domain 11 — Self-Regulation'], correct: 1 },
      { q: 'The Module 6 Evaluator Oath commits evaluators to:', options: ['Score participants within each domain independently', 'Observe within defined domain boundaries, record evidence accurately, and never exceed evaluation authority', 'Report domain totals to senior evaluators after each session', 'Summarize domain findings in participant-facing reports'], correct: 1 },
    ],
  },
  {
    // Module 7 — Evidence Event Recording and Submission
    questions: [
      { q: 'What is the first step before recording any evidence event?', options: ['Select the evidence domain', 'Confirm participant identity', 'Verify documentation', 'Submit the prior session record'], correct: 1 },
      { q: 'A participant reports a change of address. The correct evidence event domain is:', options: ['Domain 2 — Contact Stability', 'Domain 4 — Employment and Economic Activity', 'Domain 3 — Housing Stability', 'Domain 1 — Identity Verification'], correct: 2 },
      { q: 'What must the evidence event payload reflect?', options: ['Evaluator conclusions about the participant', 'Observable behavior only without interpretation', 'A summary of the session', 'The participant\'s self-reported status'], correct: 1 },
      { q: 'An evaluator records "participant seems unstable" in the evidence payload. This violates:', options: ['Submission protocol', 'Domain selection requirements', 'Evidence payloads must reflect observable behavior not evaluator conclusions', 'Timing documentation requirements'], correct: 2 },
      { q: 'Why must evaluators verify evidence events before submission?', options: ['To allow scoring adjustments', 'To prevent permanent record errors', 'To notify the participant of recorded events', 'To reduce submission volume'], correct: 1 },
      { q: 'What does submitting an evidence event trigger?', options: ['A participant notification', 'A senior evaluator review', 'The readiness computation cycle', 'An automatic domain score update'], correct: 2 },
      { q: 'Which step requires confirming participant identity before proceeding?', options: ['Step 3 — Record the Evidence Event', 'Step 1 — Select the Participant', 'Step 4 — Verify Before Submission', 'Step 2 — Select the Evidence Domain'], correct: 1 },
      { q: 'An evaluator records an evidence event in the wrong domain. This compromises:', options: ['Submission timing', 'Readiness engine reliability', 'Evaluator certification status', 'Participant notification accuracy'], correct: 1 },
      { q: 'What is prohibited after an evidence event has been submitted?', options: ['Viewing the submission record', 'Requesting a domain review', 'Altering the submitted record outside authorized protocol', 'Recording additional evidence events in the same session'], correct: 2 },
      { q: 'The Module 7 Evaluator Oath commits evaluators to:', options: ['Submit evidence events within 24 hours of observation', 'Record evidence accurately, submit completely, and never alter the permanent participant record outside authorized protocol', 'Notify participants of all evidence events recorded', 'Defer evidence submission to senior evaluators for review'], correct: 1 },
    ],
  },
  {
    // Module 8 — Evaluator Ethics, Boundaries, and Certification Maintenance
    questions: [
      { q: 'What is the core doctrine of evaluator authority in BRSA?', options: ['Evaluator authority expands with experience', 'Evaluator authority is bounded by protocol and ethics', 'Senior evaluators have unlimited authority', 'Authority is granted by the organization not BRSA'], correct: 1 },
      { q: 'An evaluator is assigned to evaluate a participant they know personally. The correct action is:', options: ['Proceed but document the relationship', 'Ask a colleague to observe the evaluation', 'Disclose the relationship and recuse from the evaluation', 'Score more strictly to compensate for bias'], correct: 2 },
      { q: 'Why must evaluators disclose conflicts of interest?', options: ['To reduce evaluation caseload', 'Conflicts of interest compromise evaluation neutrality', 'To notify the participant in advance', 'To request reassignment to a different program'], correct: 1 },
      { q: 'Participant information may be shared:', options: ['With colleagues for training purposes', 'With partner organizations upon request', 'Only through authorized channels', 'When the participant gives verbal permission'], correct: 2 },
      { q: 'What does maintaining evaluator certification require?', options: ['Completing one evaluation per month', 'Consistent adherence to process, accurate documentation, disciplined language, and willingness to pause', 'Annual recertification exam only', 'Supervisor approval for each evaluation session'], correct: 1 },
      { q: 'Under what circumstances can BRSA certification be reviewed, paused, or revoked?', options: ['Only after a formal complaint is filed', 'Never once granted', 'If discipline and protocol adherence slips', 'Only at annual review intervals'], correct: 2 },
      { q: 'An evaluator discovers they made a documentation error. The correct action is:', options: ['Correct it quietly without reporting', 'Document the error and report through protocol', 'Delete and resubmit without notation', 'Ask a colleague to correct it on their behalf'], correct: 1 },
      { q: 'What does the BRSA principle of accountability without blame mean?', options: ['Errors are ignored to protect evaluator morale', 'Errors are documented, reviewed, and used to correct the system without assigning personal blame', 'Only participants are held accountable for evaluation outcomes', 'Blame is assigned only to senior evaluators'], correct: 1 },
      { q: 'What remains constant even as people, systems, and rules evolve within BRSA?', options: ['Scoring criteria', 'Evaluator tier structure', 'Integrity', 'Domain definitions'], correct: 2 },
      { q: 'The Final Evaluator Certification Oath commits evaluators to:', options: ['Achieve senior evaluator status within one year', 'Operate within authorized boundaries, protect participant confidentiality, report violations without concealment, and maintain certification through continuous discipline', 'Complete all 8 modules annually for recertification', 'Submit evaluation reports to BRSA Holdings monthly'], correct: 1 },
    ],
  },
];
  

function getQuiz(seq: number) {
  return QUIZ_TEMPLATES[(seq - 1) % QUIZ_TEMPLATES.length];
}

function QuizSection({ module, onSubmit, submitting, result }: {
  module: TrainingModule;
  onSubmit: (score: number) => void;
  submitting: boolean;
  result: AttemptResult | null;
}) {
  const quiz = getQuiz(module.seq);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(quiz.questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qi: number, oi: number) => {
    if (submitted) return;
    setAnswers(a => { const n = [...a]; n[qi] = oi; return n; });
  };

  const handleSubmit = () => {
    const correct = answers.filter((a, i) => a === quiz.questions[i].correct).length;
    const score = Math.round((correct / quiz.questions.length) * 100);
    setSubmitted(true);
    onSubmit(score);
  };

  const handleReset = () => {
    setAnswers(Array(quiz.questions.length).fill(null));
    setSubmitted(false);
  };

  const allAnswered = answers.every(a => a !== null);

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
              if (answers[qi] === oi) cls += ' selected';
              if (submitted) {
                if (oi === q.correct) cls = 'quiz-option correct';
                else if (answers[qi] === oi) cls = 'quiz-option incorrect';
              }
              return (
                <div key={oi} className={cls} onClick={() => handleSelect(qi, oi)}>
                  <span style={{ color: 'var(--slate-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginRight: 10 }}>{String.fromCharCode(65 + oi)}</span>
                  {opt}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {!submitted ? (
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!allAnswered || submitting} style={{ marginTop: 8 }}>
          {submitting ? <><div className="spinner" />Submitting…</> : 'Submit Quiz'}
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
          {result && !result.passed && (
            <button className="btn btn-ghost" onClick={handleReset}>
              <RefreshCw size={14} /> Try Again
            </button>
          )}
          {result?.passed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success-light)', fontWeight: 500 }}>
              <CheckCircle size={18} /> Module passed!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultBanner({ result }: { result: AttemptResult }) {
  if (result.passed) {
    return (
      <div style={{ background: 'rgba(39,174,96,.1)', border: '1px solid rgba(39,174,96,.35)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div className="score-ring passed">{result.score}%</div>
        <div>
          <div style={{ color: 'var(--success-light)', fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}>✓ Module Passed</div>
          <div style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>Score: {result.score}% — passing was {result.passing}%</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: 'rgba(192,57,43,.08)', border: '1px solid rgba(192,57,43,.3)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <div className="score-ring failed">{result.score}%</div>
      <div>
        <div style={{ color: '#e05a4a', fontWeight: 600, fontSize: '1.05rem', marginBottom: 4 }}><XCircle size={16} style={{ display: 'inline', marginRight: 6 }} />Passing score not met</div>
        <div style={{ color: 'var(--slate)', fontSize: '0.875rem' }}>You scored {result.score}% — need {result.passing}% to pass. Review and try again.</div>
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
      const [modules, progressData] = await Promise.all([
        api.getModules(),
        api.getProgress(authEvaluator.evaluator_id),
      ]);
      setAllModules(modules);
      setAllProgress(progressData.progress || []);
      setModule(modules.find(m => m.module_id === moduleId) || null);
      setModuleProgress((progressData.progress || []).find((m: ModuleProgress) => m.module_id === moduleId) || null);
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
        setToast({ msg: 'Module passed! Next module unlocked.', type: 'success' });
        await loadData();
      }
    } catch (err: unknown) {
      setToast({ msg: err instanceof Error ? err.message : 'Submission failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const nextModule = allModules
    .sort((a, b) => a.seq - b.seq)
    .find(m => {
      const p = allProgress.find(p => p.module_id === m.module_id);
      return p && (p.status === 'unlocked' || p.status === 'failed') && m.module_id !== moduleId;
    });

  if (authLoading || loading) {
    return <><Nav /><div className="page-loader"><div className="spinner" style={{ width: 36, height: 36 }} /></div></>;
  }

  if (!module || !moduleProgress) {
    return (
      <><Nav />
        <div className="container" style={{ paddingTop: 60, textAlign: 'center' }}>
          <p style={{ color: 'var(--slate)' }}>Module not found.</p>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => router.push('/dashboard')}>Back to Dashboard</button>
        </div>
      </>
    );
  }

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
                <span style={{ color: 'var(--slate-dim)', fontSize: '0.8rem' }}>Passing: {module.passing_score}%</span>
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
                      <iframe src={module.video_url} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen title={module.title} />
                    </div>
                  </div>
                )}

                <div className="card" style={{ marginBottom: 32 }}>
                  <h3 style={{ marginBottom: 12 }}>About This Module</h3>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.7 }}>{module.description}</p>
                  {moduleProgress.score !== null && moduleProgress.score !== undefined && (
                    <>
                      <hr className="divider" />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div className={`score-ring ${isPassed ? 'passed' : 'failed'}`} style={{ width: 64, height: 64, fontSize: '1.1rem' }}>{moduleProgress.score}%</div>
                        <div>
                          <div style={{ color: 'var(--white)', fontWeight: 500, marginBottom: 4 }}>Your best score</div>
                          <div style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>{isPassed ? 'You have passed this module.' : `Need ${module.passing_score}% to pass.`}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {result && <div style={{ marginBottom: 32 }}><ResultBanner result={result} /></div>}

                <div className="card" style={{ marginBottom: 32 }}>
                  <QuizSection module={module} onSubmit={handleSubmit} submitting={submitting} result={result} />
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

                {result?.passed && !nextModule && (
                  <button className="btn btn-primary" onClick={() => router.push('/dashboard')} style={{ width: '100%' }}>
                    <Award size={16} /> Back to Dashboard
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
            }
