import { useState } from 'react';
import { Play, Loader2 } from 'lucide-react';

const RISK_STYLES = {
  low: 'bg-green-500/15 text-green-400 border-green-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export default function ExperimentCard({ experiment, onRun }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      await onRun(experiment.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="experiment-card flex flex-col bg-gray-800 border border-gray-700 rounded-2xl p-5 transition-all duration-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl leading-none">{experiment.icon}</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${
            RISK_STYLES[experiment.riskLevel] || RISK_STYLES.medium
          }`}
        >
          {experiment.riskLevel}
        </span>
      </div>

      {/* Name + description */}
      <h3 className="font-semibold text-white mb-1">{experiment.name}</h3>
      <p className="text-sm text-gray-400 leading-relaxed flex-1">{experiment.description}</p>

      {/* Meta row */}
      <div className="flex items-center gap-2 mt-4 mb-4">
        <span className="text-xs text-gray-500 bg-gray-700/60 rounded px-2 py-0.5 capitalize">
          {experiment.category}
        </span>
        <span className="text-xs text-gray-500 bg-gray-700/60 rounded px-2 py-0.5">
          {experiment.defaultDuration}s
        </span>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400 mb-3 bg-red-500/10 rounded px-2 py-1">{error}</p>
      )}

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold text-white transition-colors"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {loading ? 'Launching…' : 'Run Experiment'}
      </button>
    </article>
  );
}
