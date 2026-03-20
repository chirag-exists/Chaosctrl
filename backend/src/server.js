require('dotenv').config();
const express = require('express');
const cors = require('cors');
const experimentsRouter = require('./routes/experiments');
const runsRouter = require('./routes/runs');
const abortRouter = require('./routes/abort');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  const mode = process.env.LITMUS_ENDPOINT ? 'litmus' : 'mock';
  res.json({ status: 'ok', mode, timestamp: new Date().toISOString() });
});

app.use('/api/experiments', experimentsRouter);
app.use('/api/runs', runsRouter);
app.use('/api/abort', abortRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const mode = process.env.LITMUS_ENDPOINT ? `LitmusChaos @ ${process.env.LITMUS_ENDPOINT}` : 'mock mode';
  console.log(`Chaosctrl backend running on port ${PORT} [${mode}]`);
});
