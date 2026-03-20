import { CheckCircle2, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'text-gray-400',  bg: 'bg-gray-500/15',   border: 'border-gray-600',   Icon: Clock,        bar: 'bg-gray-500' },
  running:   { label: 'Running',   color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/40', Icon: Loader2,    bar: 'bg-indigo-500' },
  completed: { label: 'Completed', color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/40', Icon: CheckCircle2, bar: 'bg-green-500' },
  failed:    { label: 'Failed',    color: 'text-red-400',    bg: 'bg-red-500/15',    border: 'border-red-500/40',   Icon: XCircle,      bar: 'bg-red-500' },
  aborted:   { label: 'Aborted',   color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/40', Icon: AlertCircle,  bar: 'bg-amber-500' },
};

function RunRow({ run }) {
  const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.pending;
  const { Icon } = cfg;
  const isRunning = run.status === 'running';

  return (
    <li className={`flex flex-col gap-2 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color} ${isRunning ? 'animate-spin' : ''}`} />
          <span className="font-medium text-white text-sm truncate">{run.experimentName}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color} bg-black/20 flex-shrink-0`}>
          {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      {(isRunning || run.status === 'pending') && (
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full progress-bar ${cfg.bar}`}
            style={{ width: `${run.progress}%` }}
          />
        </div>
      )}

      {/* Footer meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-mono truncate opacity-70">{run.id.slice(0, 8)}…</span>
        <span>{new Date(run.startedAt).toLocaleTimeString()}</span>
      </div>
    </li>
  );
}

export default function StatusMonitor({ runs }) {
  const active = runs.filter((r) => ['pending', 'running'].includes(r.status));
  const history = runs.filter((r) => !['pending', 'running'].includes(r.status)).slice(0, 10);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-bold text-white">Status Monitor</h2>
        {active.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {active.length} active
          </span>
        )}
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600">
          <span className="text-4xl mb-3">🌀</span>
          <p className="text-sm">No experiments yet. Launch one from the gallery above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Active</p>
              <ul className="space-y-2">
                {active.map((r) => <RunRow key={r.id} run={r} />)}
              </ul>
            </div>
          )}

          {history.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">History</p>
              <ul className="space-y-2">
                {history.map((r) => <RunRow key={r.id} run={r} />)}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
