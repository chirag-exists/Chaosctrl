const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/api/health'),
  experiments: () => request('/api/experiments'),
  runExperiment: (id, params) =>
    request(`/api/experiments/${id}/run`, {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  runs: () => request('/api/runs'),
  getRun: (runId) => request(`/api/runs/${runId}`),
  abortAll: () => request('/api/abort', { method: 'POST' }),
};
