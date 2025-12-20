import { useState, useCallback } from 'react';
import { ContentGenerationRequest, ContentGenerationResult } from '@/lib/agents/types';

export interface UseContentAgentState {
  loading: boolean;
  error: string | null;
  result: ContentGenerationResult | null;
  executionLog: string[];
}

interface UseContentAgentActions {
  generateContent: (request: Omit<ContentGenerationRequest, 'userId'>) => Promise<ContentGenerationResult>;
  reset: () => void;
}

export function useContentAgent(): UseContentAgentState & UseContentAgentActions {
  const [state, setState] = useState<UseContentAgentState>({
    loading: false,
    error: null,
    result: null,
    executionLog: [],
  });

  const generateContent = useCallback(
    async (request: Omit<ContentGenerationRequest, 'userId'>): Promise<ContentGenerationResult> => {
      setState({ loading: true, error: null, result: null, executionLog: ['Starting...'] });

      try {
        const response = await fetch('/api/agents/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Generation failed');
        }

        const result: ContentGenerationResult = await response.json();

        setState((prev) => ({
          ...prev,
          loading: false,
          result,
          executionLog: [...prev.executionLog, 'Generation complete ✓'],
        }));

        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMsg,
          executionLog: [...prev.executionLog, `Error: ${errorMsg}`],
        }));
        throw error;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      result: null,
      executionLog: [],
    });
  }, []);

  return {
    ...state,
    generateContent,
    reset,
  };
}
