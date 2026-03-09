import { useEffect, useRef, useState, useCallback } from 'react';

type ConnectionState = 'connecting' | 'connected' | 'polling';

/**
 * Hook that subscribes to profile-level SSE events for connection changes.
 * Falls back to polling if SSE fails.
 *
 * @param profileId - The current user's profile ID
 * @param onChanged - Callback when connections change (re-fetch data here)
 * @returns connectionState for optional UI indicator
 */
export function useConnectionEvents(
  profileId: string | null,
  onChanged: () => void
): ConnectionState {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    setConnectionState('polling');
    pollIntervalRef.current = setInterval(onChanged, 10000);
  }, [onChanged]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!profileId) return;

    const connectSSE = () => {
      setConnectionState('connecting');
      const es = new EventSource(`/api/profile-events?profileId=${profileId}`);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        setConnectionState('connected');
        stopPolling();
      });

      es.addEventListener('connections_changed', () => {
        onChanged();
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
        startPolling();

        // Retry SSE after 30 seconds
        setTimeout(() => {
          if (!eventSourceRef.current) connectSSE();
        }, 30000);
      };
    };

    connectSSE();

    // Also refresh on visibility/focus (Safari compat, tab-switch catch-up)
    const handleVisibility = () => { if (!document.hidden) onChanged(); };
    const handleFocus = () => onChanged();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handleFocus);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handleFocus);
    };
  }, [profileId, onChanged, startPolling, stopPolling]);

  return connectionState;
}
