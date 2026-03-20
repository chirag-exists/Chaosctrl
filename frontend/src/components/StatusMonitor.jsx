import { useWorkflowRuns } from '../hooks/useWorkflowRuns';

const PHASE_CONFIG = {
  Running: { color: 'text-blue-400', dot: 'bg-blue-400 animate-pulse', label: 'Running' },
  Awaited: { color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse', label: 'Awaited' },
  Succeeded: { color: 'text-green-400', dot: 'bg-green-400', label: 'Succeeded' },
  Failed: { color: 'text-red-400', dot: 'bg-red-400', label: 'Failed' },
  Stopped: { color: 'text-gray-400', dot: 'bg-gray-400', label: 'Stopped' },
  NA: { color: 'text-gray-500', dot: 'bg-gray-500', label: 'Unknown' },
};

function PhaseIndicator({ phase }) {
  const cfg = PHASE_CONFIG[phase] || PHASE_CONFIG.NA;
  return (
    <span className={`flex items-center gap-1.5 text-sm font-medium ${cfg.color}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ResiliencyBar({ score }) {
  if (score == null) return <span className="text-gray-500 text-sm">—</span>;
  const pct = Math.round(score);
  const barColor =
    pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 bg-gray-700 rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-300">{pct}%</span>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '—';
  const d = new Date(Number(ts) * 1000);
  return isNaN(d) ? ts : d.toLocaleString();
}

/**
 * Real-Time Status Monitor
 * Polls the backend every 5 seconds to display the latest workflow run statuses.
 */
export default function StatusMonitor() {
  const { runs, loading, error, refresh } = useWorkflowRuns(5000);

  const activeRuns = runs.filter((r) => ['Running', 'Awaited'].includes(r.phase));
  const recentRuns = runs.slice(0, 20);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>📡</span> Real-Time Status Monitor
          {activeRuns.length > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {activeRuns.length} ACTIVE
            </span>
          )}
        </h2>
        <button
          onClick={refresh}
          className="text-gray-400 hover:text-white text-sm transition-colors"
          title="Refresh now"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-900 border border-red-700 text-red-200 text-sm">
          ⚠️ {error} — retrying automatically every 5s
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 animate-pulse">Fetching experiment runs…</div>
      ) : recentRuns.length === 0 ? (
        <div className="text-gray-500 text-center py-8 border border-dashed border-gray-700 rounded-xl">
          No workflow runs yet. Trigger an experiment from the gallery above.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-gray-400 text-left">
                <th className="px-4 py-3 font-medium">Workflow</th>
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Resiliency</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Experiments</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentRuns.map((run) => (
                <tr
                  key={run.workflowRunID}
                  className="bg-gray-900 hover:bg-gray-800 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-white font-medium truncate max-w-[180px]">
                      {run.workflowName}
                    </div>
                    <div className="text-gray-500 text-xs font-mono truncate max-w-[180px]">
                      {run.workflowRunID}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PhaseIndicator phase={run.phase} />
                  </td>
                  <td className="px-4 py-3">
                    <ResiliencyBar score={run.resiliencyScore} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-300">
                    <span className="text-green-400">{run.experimentsPassed ?? '—'}</span>
                    {' / '}
                    {run.totalExperiments ?? '—'}
                    {run.experimentsFailed > 0 && (
                      <span className="text-red-400 ml-1">({run.experimentsFailed} fail)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                    {formatTime(run.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
