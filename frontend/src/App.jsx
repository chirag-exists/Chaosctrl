import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import Header from './components/Header';
import ExperimentGallery from './components/ExperimentGallery';
import StatusMonitor from './components/StatusMonitor';
import SafetySwitch from './components/SafetySwitch';

const POLL_INTERVAL_MS = 3000;

export default function App() {
  const [mode, setMode] = useState('mock');
  const [experiments, setExperiments] = useState([]);
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState(null);

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    api.health()
      .then((data) => setMode(data.mode))
      .catch(console.warn);

    api.experiments()
      .then(setExperiments)
      .catch((e) => setError(`Failed to load experiments: ${e.message}`));
  }, []);

  // ── Poll runs every 3 s ──────────────────────────────────────────────────
  const refreshRuns = useCallback(() => {
    api.runs()
      .then(setRuns)
      .catch(console.warn);
  }, []);

  useEffect(() => {
    refreshRuns();
    const id = setInterval(refreshRuns, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshRuns]);

  // ── Actions ──────────────────────────────────────────────────────────────
  async function handleRun(experimentId) {
    const run = await api.runExperiment(experimentId);
    // Optimistically prepend the new run
    setRuns((prev) => [run, ...prev]);
  }

  async function handleAbort() {
    const result = await api.abortAll();
    refreshRuns();
    return result;
  }

  const activeCount = runs.filter((r) => ['pending', 'running'].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Header mode={mode} activeCount={activeCount} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Error banner */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Safety Switch – always visible at top of content */}
        <SafetySwitch activeCount={activeCount} onAbort={handleAbort} />

        {/* One-Click Chaos Gallery */}
        <ExperimentGallery experiments={experiments} onRun={handleRun} />

        {/* Divider */}
        <hr className="border-gray-800" />

        {/* Real-time Status Monitor */}
        <StatusMonitor runs={runs} />

        {/* Footer */}
        <footer className="text-center text-xs text-gray-600 pb-4">
          Chaosctrl · Built on{' '}
          <a href="https://litmuschaos.io" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">
            LitmusChaos
          </a>
        </footer>
      </main>
    </div>
  );
}
