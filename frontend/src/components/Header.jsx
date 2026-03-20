import { Zap, Activity } from 'lucide-react';

export default function Header({ mode, activeCount }) {
  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Chaosctrl</h1>
            <p className="text-xs text-gray-500 -mt-0.5">LitmusChaos Control Room</p>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-4">
          {/* Mode badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              mode === 'litmus'
                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                mode === 'litmus' ? 'bg-green-400' : 'bg-amber-400'
              }`}
            />
            {mode === 'litmus' ? 'Live' : 'Mock Mode'}
          </span>

          {/* Active runs indicator */}
          {activeCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Activity className="w-3 h-3" />
              {activeCount} running
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
