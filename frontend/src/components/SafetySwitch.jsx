import { useState } from 'react';
import { ShieldOff, Loader2 } from 'lucide-react';

export default function SafetySwitch({ activeCount, onAbort }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleAbort() {
    if (!window.confirm('⚠️  This will immediately abort ALL active experiments. Proceed?')) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await onAbort();
      setResult({ ok: true, message: data.message });
    } catch (e) {
      setResult({ ok: false, message: e.message });
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 5000);
    }
  }

  const disabled = loading || activeCount === 0;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl bg-red-950/30 border border-red-800/50">
      {/* Text block */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-300 flex items-center gap-2">
          <ShieldOff className="w-4 h-4" />
          Safety Switch
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          Immediately aborts every active experiment run.
          {activeCount > 0 && (
            <span className="ml-1 text-red-400 font-medium">{activeCount} active now.</span>
          )}
        </p>
        {result && (
          <p className={`text-xs mt-1 font-medium ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
            {result.message}
          </p>
        )}
      </div>

      {/* Button */}
      <button
        onClick={handleAbort}
        disabled={disabled}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 flex-shrink-0 ${
          disabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-500 text-white safety-glow'
        }`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
        {loading ? 'Aborting…' : 'Abort All'}
      </button>
    </div>
  );
}
