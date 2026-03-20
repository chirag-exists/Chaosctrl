/**
 * LitmusChaos service.
 *
 * When LITMUS_ENDPOINT is set the service communicates with the real
 * LitmusChaos GraphQL API.  Otherwise it falls back to a built-in mock
 * that simulates the full experiment lifecycle so the dashboard is fully
 * functional without a running cluster.
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { buildWorkflowManifest } = require('../data/experiments');

// ─── Constants ──────────────────────────────────────────────────────────────
const MOCK_FAILURE_RATE = 0.1; // 10 % chance an experiment ends in 'failed'
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = (10 * 60 * 1000) / POLL_INTERVAL_MS; // 10-minute timeout
const runs = new Map(); // runId → RunRecord

function createRun(experimentId, experimentName) {
  const run = {
    id: uuidv4(),
    experimentId,
    experimentName,
    status: 'pending',  // pending | running | completed | failed | aborted
    progress: 0,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    workflowRunId: null,
    workflowId: null,
  };
  runs.set(run.id, run);
  return run;
}

function getRun(runId) {
  return runs.get(runId) || null;
}

function getAllRuns() {
  return Array.from(runs.values()).sort(
    (a, b) => new Date(b.startedAt) - new Date(a.startedAt)
  );
}

function updateRun(runId, updates) {
  const run = runs.get(runId);
  if (!run) return null;
  Object.assign(run, updates, { updatedAt: new Date().toISOString() });
  return run;
}

// ─── Mock simulation ────────────────────────────────────────────────────────

function simulateRun(runId, durationSeconds) {
  const totalMs = durationSeconds * 1000;
  const tickMs = 1000;
  let elapsed = 0;

  updateRun(runId, { status: 'running', progress: 0 });

  const timer = setInterval(() => {
    const run = getRun(runId);
    if (!run || run.status === 'aborted') {
      clearInterval(timer);
      return;
    }

    elapsed += tickMs;
    const progress = Math.min(Math.round((elapsed / totalMs) * 100), 99);
    updateRun(runId, { progress });

    if (elapsed >= totalMs) {
      clearInterval(timer);
      // ~10 % chance of failure for realism
      const result = Math.random() < MOCK_FAILURE_RATE ? 'failed' : 'completed';
      updateRun(runId, { status: result, progress: 100 });
    }
  }, tickMs);
}

// ─── LitmusChaos GraphQL helpers ────────────────────────────────────────────

async function litmusRequest(token, query, variables = {}) {
  const endpoint = process.env.LITMUS_ENDPOINT;
  const response = await axios.post(
    `${endpoint}/api/query`,
    { query, variables },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    }
  );
  if (response.data.errors) {
    throw new Error(response.data.errors.map((e) => e.message).join('; '));
  }
  return response.data.data;
}

let _tokenCache = null;
let _tokenExpiry = 0;
let _projectId = null;

async function getAuthToken() {
  if (_tokenCache && Date.now() < _tokenExpiry) return _tokenCache;

  const endpoint = process.env.LITMUS_ENDPOINT;
  const username = process.env.LITMUS_USERNAME || 'admin';
  const password = process.env.LITMUS_PASSWORD || 'litmus';

  const res = await axios.post(`${endpoint}/auth/login`, { username, password }, {
    timeout: 10000,
  });

  _tokenCache = res.data.access_token;
  _tokenExpiry = Date.now() + 50 * 60 * 1000; // 50 minutes
  _projectId = process.env.LITMUS_PROJECT_ID || res.data.project_id;
  return _tokenCache;
}

// ─── Public API ─────────────────────────────────────────────────────────────

const isMock = !process.env.LITMUS_ENDPOINT;

async function triggerExperiment(experiment, params = {}) {
  const {
    namespace = experiment.defaultNamespace,
    appLabel = experiment.defaultAppLabel,
    duration = experiment.defaultDuration,
  } = params;

  const run = createRun(experiment.id, experiment.name);

  if (isMock) {
    // Tiny async gap so callers always receive the run object first
    setTimeout(() => simulateRun(run.id, duration), 200);
    return run;
  }

  // Real LitmusChaos path
  try {
    const token = await getAuthToken();

    const workflowManifest = buildWorkflowManifest(
      experiment.id,
      namespace,
      appLabel,
      duration
    );

    const clusterID = process.env.LITMUS_CLUSTER_ID;
    if (!clusterID) throw new Error('LITMUS_CLUSTER_ID is required for real mode');

    // Create the workflow
    const createData = await litmusRequest(
      token,
      `mutation createWorkflow($request: SaveWorkflowRequest!) {
         createWorkflow(request: $request) { workflowID workflowName }
       }`,
      {
        request: {
          workflowManifest,
          cronSyntax: '',
          workflowName: `${experiment.id}-${Date.now()}`,
          workflowDescription: experiment.description,
          weightages: [{ experimentName: experiment.id, weightage: 10 }],
          isCustomWorkflow: true,
          projectID: _projectId,
          clusterID,
        },
      }
    );

    const workflowID = createData.createWorkflow.workflowID;

    // Run the workflow
    const runData = await litmusRequest(
      token,
      `mutation runChaosWorkflow($workflowID: String!, $projectID: String!) {
         runChaosWorkflow(workflowID: $workflowID, projectID: $projectID) {
           message workflowRunID
         }
       }`,
      { workflowID, projectID: _projectId }
    );

    updateRun(run.id, {
      status: 'running',
      workflowId: workflowID,
      workflowRunId: runData.runChaosWorkflow.workflowRunID,
    });

    // Start a background poller to sync status
    pollWorkflowStatus(run.id, workflowID, token);
  } catch (err) {
    updateRun(run.id, { status: 'failed' });
    console.error('Failed to trigger experiment via LitmusChaos API:', err.message);
  }

  return run;
}

async function pollWorkflowStatus(runId, workflowID, token) {
  let count = 0;

  const poll = async () => {
    try {
      const run = getRun(runId);
      if (!run || ['completed', 'failed', 'aborted'].includes(run.status)) return;

      const data = await litmusRequest(
        token,
        `query listWorkflow($projectID: String!, $workflowIDs: [ID]) {
           listWorkflow(projectID: $projectID, workflowIDs: $workflowIDs) {
             workflows { workflowRuns { workflowRunID phase } }
           }
         }`,
        { projectID: _projectId, workflowIDs: [workflowID] }
      );

      const workflows = data.listWorkflow?.workflows || [];
      const latestRun = workflows[0]?.workflowRuns?.[0];
      if (latestRun) {
        const phase = latestRun.phase?.toLowerCase();
        const statusMap = {
          running: 'running',
          succeeded: 'completed',
          failed: 'failed',
          error: 'failed',
          pending: 'running',
        };
        const newStatus = statusMap[phase] || 'running';
        const progress = newStatus === 'completed' ? 100 : Math.min(count, 99);
        updateRun(runId, { status: newStatus, progress });
      }
    } catch (e) {
      console.warn('Poll error:', e.message);
    }

    count++;
    if (count < MAX_POLLS) {
      const run = getRun(runId);
      if (run && !['completed', 'failed', 'aborted'].includes(run.status)) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }
  };

  setTimeout(poll, POLL_INTERVAL_MS);
}

async function abortAllRuns() {
  const active = getAllRuns().filter((r) => ['pending', 'running'].includes(r.status));

  if (!isMock) {
    try {
      const token = await getAuthToken();
      for (const run of active) {
        if (run.workflowId && run.workflowRunId) {
          await litmusRequest(
            token,
            `mutation stopWorkflowRuns($projectID: String!, $workflowID: String!, $workflowRunID: [String]!) {
               stopWorkflowRuns(projectID: $projectID, workflowID: $workflowID, workflowRunID: $workflowRunID)
             }`,
            {
              projectID: _projectId,
              workflowID: run.workflowId,
              workflowRunID: [run.workflowRunId],
            }
          ).catch((e) => console.warn(`Stop workflow failed for ${run.id}:`, e.message));
        }
      }
    } catch (e) {
      console.error('Abort error:', e.message);
    }
  }

  active.forEach((run) => updateRun(run.id, { status: 'aborted', progress: run.progress }));
  return active.length;
}

module.exports = {
  triggerExperiment,
  abortAllRuns,
  getRun,
  getAllRuns,
  isMock,
};
