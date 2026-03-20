const express = require('express');
const cors = require('cors');
const experimentsRouter = require('./routes/experiments');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'chaosctrl-backend' });
});

// Experiments routes
app.use('/api/experiments', experimentsRouter);

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Only start the server when this file is run directly (not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Chaosctrl backend listening on port ${PORT}`);
  });
}

module.exports = app;
