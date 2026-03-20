import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

/**
 * One-Click Chaos Gallery
 * Displays pre-defined experiment cards and allows triggering them.
 * If a matching workflow exists in Litmus it will be triggered; otherwise
 * the card is shown as "not configured" (the workflow YAML must be imported
 * into LitmusChaos first).
 */
export default function ChaosGallery({ onExperimentTriggered }) {
  const [templates, setTemplates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      const [tplRes, wfRes] = await Promise.allSettled([
        api.getTemplates(),
        api.getWorkflows(),
      ]);
      if (tplRes.status === 'fulfilled') setTemplates(tplRes.value.templates || []);
      if (wfRes.status === 'fulfilled') setWorkflows(wfRes.value.workflows || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRun = async (template) => {
    // Find a workflow whose name contains the template id (case-insensitive)
    const match = workflows.find((wf) =>
      wf.workflowName.toLowerCase().includes(template.id.toLowerCase())
    );

    if (!match) {
      showToast(
        `No workflow found for "${template.name}". Import the workflow into LitmusChaos first.`,
        'error'
      );
      return;
    }

    setTriggering(template.id);
    try {
      const result = await api.runWorkflow(match.workflowID);
      showToast(`✅ "${template.name}" triggered! Run ID: ${result.workflowRunID}`);
      if (onExperimentTriggered) onExperimentTriggered(result);
    } catch (err) {
      showToast(`❌ Failed to trigger "${template.name}": ${err.message}`, 'error');
    } finally {
      setTriggering(null);
    }
  };

  const severityColor = {
    low: 'bg-green-900 text-green-300',
    medium: 'bg-yellow-900 text-yellow-300',
    high: 'bg-orange-900 text-orange-300',
    critical: 'bg-red-900 text-red-300',
  };

  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>⚡</span> One-Click Chaos Gallery
      </h2>

      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-red-900 text-red-200 border border-red-700'
              : 'bg-green-900 text-green-200 border border-green-700'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 animate-pulse">Loading experiment gallery…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((tpl) => {
            const hasWorkflow = workflows.some((wf) =>
              wf.workflowName.toLowerCase().includes(tpl.id.toLowerCase())
            );
            const isTriggering = triggering === tpl.id;

            return (
              <div
                key={tpl.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3 hover:border-purple-500 transition-colors"
              >
                <div className="text-4xl">{tpl.icon}</div>
                <div>
                  <h3 className="text-white font-semibold text-base">{tpl.name}</h3>
                  <p className="text-gray-400 text-sm mt-1 leading-snug">
                    {tpl.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityColor[tpl.severity] || 'bg-gray-700 text-gray-300'}`}
                  >
                    {tpl.severity}
                  </span>
                  <button
                    onClick={() => handleRun(tpl)}
                    disabled={isTriggering}
                    title={hasWorkflow ? 'Run experiment' : 'Workflow not configured in Litmus'}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      hasWorkflow
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    } ${isTriggering ? 'opacity-60 cursor-wait' : ''}`}
                  >
                    {isTriggering ? '…' : hasWorkflow ? '▶ Run' : '⚙ Setup'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
