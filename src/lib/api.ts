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
  passing: number;
  passed: boolean;
  status: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.error || err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getModules: () => apiFetch<TrainingModule[]>('/training/modules'),

  createEvaluator: (data: { full_name: string; email: string; organization: string }) =>
    apiFetch<Evaluator>('/evaluators', { method: 'POST', body: JSON.stringify(data) }),

  lookupByEmail: (email: string) =>
    apiFetch<Evaluator>(`/evaluators/lookup?email=${encodeURIComponent(email)}`),
  
  getProgress: (evaluatorId: string) =>
    apiFetch<EvaluatorProgress>(`/evaluators/${evaluatorId}/progress`),

  submitAttempt: (evaluatorId: string, moduleId: string, score: number) =>
    apiFetch<AttemptResult>(`/evaluators/${evaluatorId}/progress/${moduleId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    }),
};
