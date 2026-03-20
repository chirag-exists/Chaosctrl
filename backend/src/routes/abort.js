const { Router } = require('express');
const { abortAllRuns } = require('../services/litmus');

const router = Router();

// POST /api/abort – emergency stop: abort every active experiment run
router.post('/', async (_req, res) => {
  try {
    const count = await abortAllRuns();
    res.json({ aborted: count, message: `${count} active run(s) aborted.` });
  } catch (err) {
    console.error('Abort error:', err);
    res.status(500).json({ error: 'Failed to abort runs' });
  }
});

module.exports = router;
