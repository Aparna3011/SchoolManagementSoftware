import { useState, useCallback } from 'react';

/**
 * useDatabase Hook
 * 
 * Wraps window.api IPC calls with loading and error state management.
 * Provides a clean interface for components to call backend operations.
 * 
 * Usage:
 *   const { execute, loading, error } = useDatabase();
 *   const data = await execute(() => window.api.student.getAll());
 */

export function useDatabase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute an IPC call with loading/error state management.
   * @param {Function} apiCall - A function that returns a promise (e.g., () => window.api.student.getAll())
   * @returns {Promise<any>} The data from the response, or null on error.
   */
  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();

      if (!result.success) {
        setError(result.error || 'An unknown error occurred.');
        return null;
      }

      return result.data;
    } catch (err) {
      const message = err?.message || 'Failed to communicate with the backend.';
      setError(message);
      console.error('[useDatabase] Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear any existing error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { execute, loading, error, clearError };
}
