const { Router } = require('express');
const { EXPERIMENTS } = require('../data/experiments');
const { triggerExperiment } = require('../services/litmus');

const router = Router();

// GET /api/experiments – return the experiment catalogue
router.get('/', (_req, res) => {
  res.json(EXPERIMENTS.map(({ id, name, description, category, riskLevel, icon, defaultDuration, defaultNamespace, defaultAppLabel }) => ({
    id, name, description, category, riskLevel, icon, defaultDuration, defaultNamespace, defaultAppLabel,
  })));
});

// POST /api/experiments/:id/run – trigger a pre-defined experiment
router.post('/:id/run', async (req, res) => {
  const experiment = EXPERIMENTS.find((e) => e.id === req.params.id);
  if (!experiment) {
    return res.status(404).json({ error: `Experiment '${req.params.id}' not found` });
  }

  try {
    const run = await triggerExperiment(experiment, req.body);
    res.status(202).json(run);
  } catch (err) {
    console.error('Run experiment error:', err);
    res.status(500).json({ error: 'Failed to trigger experiment' });
  }
});

module.exports = router;
