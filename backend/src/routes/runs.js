const { Router } = require('express');
const { getAllRuns, getRun } = require('../services/litmus');

const router = Router();

// GET /api/runs – list all runs (most recent first)
router.get('/', (_req, res) => {
  res.json(getAllRuns());
});

// GET /api/runs/:runId – get a single run
router.get('/:runId', (req, res) => {
  const run = getRun(req.params.runId);
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run);
});

module.exports = router;
