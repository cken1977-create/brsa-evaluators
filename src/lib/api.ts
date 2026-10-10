const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://legacyline-core-production.up.railway.app';

export interface TrainingModule {
  module_id: string;
  title: string;
  description: string;
  video_url: string | null;
  seq: number;
  passing_score: number;
}

export interface ModuleProgress {
  module_id: string;
  title: string;
  seq: number;
  status: 'locked' | 'unlocked' | 'passed' | 'failed';
  score: number | null;
  attempts: number;
  unlocked_at: string | null;
  completed_at: string | null;
}

export interface Evaluator {
  evaluator_id: string;
  full_name: string;
  email: string;
  status: string;
  certified: boolean;
  certified_at: string | null;
  created_at: string;
  organization: string;
  credential_id?: string | null;
  has_password?: boolean;
}

export interface Session {
  token: string;
  expires_in: number;
  evaluator: Evaluator;
}

/** A knowledge-check question. The correct answer is never sent to the browser. */
export interface QuizQuestion {
  question_id: string;
  prompt: string;
  choices: string[];
}

export interface EvaluatorProgress {
  evaluator_id: string;
  total: number;
  progress: ModuleProgress[];
}

export interface AttemptResult {
  evaluator_id: string;
  module_id: string;
  score: number;
  correct: number;
  total: number;
  passing: number;
  passed: boolean;
  status: string;
  certified: boolean;
  credential_id: string | null;
}

export const TOKEN_KEY = 'brsa_evaluator_token';

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    if (res.status === 401 && token && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('brsa:unauthorized'));
    }
    throw new ApiError(err.error || err.message || `HTTP ${res.status}`, res.status, err.code);
  }
  return res.json();
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  getModules: () => apiFetch<TrainingModule[]>('/training/modules'),

  register: (data: { full_name: string; email: string; organization: string; password: string }) =>
    apiFetch<Session>('/evaluators', post(data)),

  login: (email: string, password: string) => apiFetch<Session>('/evaluators/login', post({ email, password })),

  requestMagicLink: (email: string) =>
    apiFetch<{ sent: boolean; message: string }>('/evaluators/magic-link', post({ email, portal_origin: window.location.origin })),

  verifyMagicLink: (token: string) => apiFetch<Session>('/evaluators/magic-link/verify', post({ token })),

  me: () => apiFetch<Evaluator>('/evaluators/me'),

  setPassword: (password: string) => apiFetch<{ ok: boolean }>('/evaluators/me/password', post({ password })),

  getProgress: (evaluatorId: string) => apiFetch<EvaluatorProgress>(`/evaluators/${evaluatorId}/progress`),

  getQuestions: (moduleId: string) =>
    apiFetch<{ module_id: string; total: number; questions: QuizQuestion[] }>(`/training/modules/${moduleId}/questions`),

  /** Answers only (question_id -> chosen index). The server grades; no score is sent. */
  submitAttempt: (evaluatorId: string, moduleId: string, answers: Record<string, number>) =>
    apiFetch<AttemptResult>(`/evaluators/${evaluatorId}/progress/${moduleId}/attempt`, post({ answers })),
};
