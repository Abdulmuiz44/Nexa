'use client';

import { useState, useCallback, useRef } from 'react';

export interface StreamingState {
  executionLog: string[];
  contentVariations?: Record<string, string>;
  postIds?: string[];
  published?: boolean;
  metrics?: Record<string, any>;
  error?: string;
}

export interface UseStreamingAgentState {
  loading: boolean;
  error: string | null;
  state: StreamingState;
  eventSource: EventSource | null;
}

export interface UseStreamingAgentActions {
  startWorkflow: (brief: string, toolkits: string[]) => Promise<void>;
  stopWorkflow: () => void;
  reset: () => void;
}

export function useStreamingAgent(): UseStreamingAgentState & UseStreamingAgentActions {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<StreamingState>({
    executionLog: [],
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startWorkflow = useCallback(async (brief: string, toolkits: string[]) => {
    if (!brief.trim() || toolkits.length === 0) {
      setError('Brief and toolkits are required');
      return;
    }

    setLoading(true);
    setError(null);
    setState({ executionLog: ['Starting workflow...'] });

    try {
      // Initiate workflow via streaming endpoint
      const response = await fetch('/api/agents/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, toolkits }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Workflow failed');
      }

      // Create EventSource from response body
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // Process streaming response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);

            try {
              const event = JSON.parse(dataStr);

              if (event.type === 'state_update') {
                setState((prev) => ({
                  ...prev,
                  ...event.payload,
                  executionLog: event.payload.executionLog || prev.executionLog,
                }));
              } else if (event.type === 'complete') {
                setLoading(false);
                setState((prev) => ({
                  ...prev,
                  executionLog: [...prev.executionLog, '✓ Workflow completed'],
                }));
              } else if (event.type === 'error') {
                setError(event.payload.error);
                setLoading(false);
                setState((prev) => ({
                  ...prev,
                  error: event.payload.error,
                  executionLog: [...prev.executionLog, `✗ Error: ${event.payload.error}`],
                }));
              }
            } catch (parseError) {
              console.error('Failed to parse event:', parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      setLoading(false);
      setState((prev) => ({
        ...prev,
        executionLog: [...prev.executionLog, `✗ Error: ${errorMsg}`],
      }));
    }
  }, []);

  const stopWorkflow = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    stopWorkflow();
    setError(null);
    setState({ executionLog: [] });
  }, [stopWorkflow]);

  return {
    loading,
    error,
    state,
    eventSource: eventSourceRef.current,
    startWorkflow,
    stopWorkflow,
    reset,
  };
}
