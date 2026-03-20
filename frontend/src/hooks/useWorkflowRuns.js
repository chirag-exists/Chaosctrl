import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';

/**
 * Polls workflow runs every `intervalMs` milliseconds.
 */
export function useWorkflowRuns(intervalMs = 5000) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchRuns = useCallback(async () => {
    try {
      const data = await api.getWorkflowRuns();
      setRuns(data.workflowRuns || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
    intervalRef.current = setInterval(fetchRuns, intervalMs);
    return () => clearInterval(intervalRef.current);
  }, [fetchRuns, intervalMs]);

  return { runs, loading, error, refresh: fetchRuns };
}
