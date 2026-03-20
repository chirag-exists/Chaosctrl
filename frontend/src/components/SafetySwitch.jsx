import { useState } from 'react';
import { api } from '../api';

/**
 * Safety Switch
 * Immediately aborts all active chaos experiments with a single click.
 * Requires double-confirmation to prevent accidental triggers.
 */
export default function SafetySwitch({ onAborted }) {
  const [stage, setStage] = useState('idle'); // idle | confirm | aborting | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleClick = () => {
    if (stage === 'idle') {
      setStage('confirm');
    }
  };

  const handleConfirm = async () => {
    setStage('aborting');
    try {
      const res = await api.abortAll();
      setResult(res);
      setStage('done');
      if (onAborted) onAborted(res);
      setTimeout(() => setStage('idle'), 6000);
    } catch (err) {
      setErrorMsg(err.message);
      setStage('error');
      setTimeout(() => setStage('idle'), 5000);
    }
  };

  const handleCancel = () => setStage('idle');

  return (
    <div
      className={`rounded-xl border-2 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
        stage === 'confirm'
          ? 'border-orange-500 bg-orange-950'
          : stage === 'done'
          ? 'border-green-600 bg-green-950'
          : stage === 'error'
          ? 'border-red-600 bg-red-950'
          : 'border-red-700 bg-gray-900'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-4xl select-none">🛑</span>
        <div>
          <h2 className="text-xl font-bold text-white">Safety Switch</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Immediately abort <strong className="text-white">all</strong> active chaos
            experiments.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        {stage === 'idle' && (
          <button
            onClick={handleClick}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-base transition-all shadow-lg shadow-red-900/40 active:scale-95"
          >
            🛑 Abort All
          </button>
        )}

        {stage === 'confirm' && (
          <>
            <span className="text-orange-300 font-medium text-sm">
              Abort all running experiments?
            </span>
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all animate-pulse"
            >
              ⚠️ Confirm Abort
            </button>
          </>
        )}

        {stage === 'aborting' && (
          <span className="text-orange-400 font-medium flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            Aborting…
          </span>
        )}

        {stage === 'done' && result && (
          <span className="text-green-400 font-medium text-sm">
            ✅ Aborted {result.aborted} run{result.aborted !== 1 ? 's' : ''}
          </span>
        )}

        {stage === 'error' && (
          <span className="text-red-400 font-medium text-sm">❌ {errorMsg}</span>
        )}
      </div>
    </div>
  );
}
