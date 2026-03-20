const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export const api = {
  async getTemplates() {
    const res = await fetch(`${API_BASE}/api/experiments/templates`);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
  },

  async getWorkflows() {
    const res = await fetch(`${API_BASE}/api/experiments`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },

  async getWorkflowRuns() {
    const res = await fetch(`${API_BASE}/api/experiments/runs`);
    if (!res.ok) throw new Error('Failed to fetch runs');
    return res.json();
  },

  async runWorkflow(workflowID) {
    const res = await fetch(`${API_BASE}/api/experiments/${workflowID}/run`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger workflow');
    return res.json();
  },

  async abortAll(runIDs) {
    const body = runIDs ? JSON.stringify({ runIDs }) : undefined;
    const res = await fetch(`${API_BASE}/api/experiments/abort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    if (!res.ok) throw new Error('Failed to abort runs');
    return res.json();
  },
};
