const express = require('express');
const router = express.Router();
const litmus = require('../litmus/client');
const { EXPERIMENT_TEMPLATES } = require('../litmus/templates');

const PROJECT_ID = process.env.LITMUS_PROJECT_ID || 'default-project';

/**
 * GET /api/experiments/templates
 * Returns the pre-defined experiment gallery (no LitmusChaos call needed).
 */
router.get('/templates', (_req, res) => {
  res.json({ templates: EXPERIMENT_TEMPLATES });
});

/**
 * GET /api/experiments
 * Lists all chaos workflows from LitmusChaos.
 */
router.get('/', async (_req, res) => {
  try {
    const workflows = await litmus.listWorkflows(PROJECT_ID);
    res.json({ workflows });
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch workflows', detail: err.message });
  }
});

/**
 * POST /api/experiments/:workflowID/run
 * Triggers a specific chaos workflow by ID.
 */
router.post('/:workflowID/run', async (req, res) => {
  const { workflowID } = req.params;
  try {
    const result = await litmus.runChaosWorkflow(PROJECT_ID, workflowID);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: 'Failed to trigger workflow', detail: err.message });
  }
});

/**
 * GET /api/experiments/runs
 * Lists all workflow runs with their current phase/status.
 */
router.get('/runs', async (_req, res) => {
  try {
    const data = await litmus.listWorkflowRuns(PROJECT_ID);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch workflow runs', detail: err.message });
  }
});

/**
 * GET /api/experiments/runs/:runID
 * Gets a single workflow run status.
 */
router.get('/runs/:runID', async (req, res) => {
  const { runID } = req.params;
  try {
    const run = await litmus.getWorkflowRun(PROJECT_ID, runID);
    res.json(run);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch workflow run', detail: err.message });
  }
});

/**
 * POST /api/experiments/abort
 * Safety Switch: stops all active workflow runs.
 * Optionally accepts { runIDs: [] } body; if omitted, fetches and aborts all running experiments.
 */
router.post('/abort', async (req, res) => {
  try {
    let runIDs = req.body && Array.isArray(req.body.runIDs) ? req.body.runIDs : null;

    if (!runIDs) {
      // Fetch all runs and filter to active ones
      const data = await litmus.listWorkflowRuns(PROJECT_ID);
      const activePhases = ['Running', 'Awaited'];
      runIDs = (data.workflowRuns || [])
        .filter((r) => activePhases.includes(r.phase))
        .map((r) => r.workflowRunID);
    }

    if (runIDs.length === 0) {
      return res.json({ message: 'No active workflow runs to abort', aborted: 0 });
    }

    const result = await litmus.stopWorkflowRuns(PROJECT_ID, runIDs);
    res.json({ message: 'Abort signal sent', aborted: runIDs.length, result });
  } catch (err) {
    res.status(502).json({ error: 'Failed to abort workflow runs', detail: err.message });
  }
});

module.exports = router;
