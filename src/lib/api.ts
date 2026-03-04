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
  status: 'locked' | 'available' | 'in_progress' | 'passed' | 'failed';
  attempts: number;
  best_score: number | null;
  passing_score: number;
  unlocked_at: string | null;
  passed_at: string | null;
}

export interface Evaluator {
  evaluator_id: string;
  name: string;
  email: string;
  organization?: string;
  certified: boolean;
  certified_at: string | null;
  created_at: string;
}

export interface EvaluatorProgress {
  evaluator: Evaluator;
  modules: ModuleProgress[];
  overall_progress: number;
  certified: boolean;
}

export interface AttemptResult {
  module_id: string;
  score: number;
  passed: boolean;
  next_module_unlocked: string | null;
  certified: boolean;
  message: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getModules: () => apiFetch<TrainingModule[]>('/training/modules'),

  createEvaluator: (data: { full_name: string; email: string; organization?: string }) =>
    apiFetch<Evaluator>('/evaluators', { method: 'POST', body: JSON.stringify(data) }),

  getProgress: (evaluatorId: string) =>
    apiFetch<EvaluatorProgress>(`/evaluators/${evaluatorId}/progress`),

  submitAttempt: (evaluatorId: string, moduleId: string, score: number) =>
    apiFetch<AttemptResult>(`/evaluators/${evaluatorId}/progress/${moduleId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ score }),
    }),
};
