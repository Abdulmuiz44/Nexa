import { Button } from '@/components/ui/button';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  title?: string;
  description?: string;
}

/**
 * Generic error fallback component for client-side errors
 */
export function ErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
}: ErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="max-w-md w-full text-center space-y-4">
        {/* Error Icon */}
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error Content */}
        <div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
          <p className="text-sm text-red-700">{description}</p>
        </div>

        {/* Error Details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="text-xs text-red-600 cursor-pointer font-medium">
              Error details
            </summary>
            <pre className="mt-2 p-2 bg-white rounded text-xs text-red-700 overflow-auto border border-red-200">
              {error.message}
            </pre>
          </details>
        )}

        {/* Action Button */}
        <Button
          onClick={resetError}
          variant="default"
          className="w-full"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}

/**
 * Section-level error fallback for partial page errors
 */
export function SectionErrorFallback({
  resetError,
  title = 'Failed to load',
  message = 'This section encountered an error.',
}: Omit<ErrorFallbackProps, 'error'>) {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-amber-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-900">{title}</h4>
          <p className="text-sm text-amber-700 mt-1">{message}</p>
          <Button
            onClick={resetError}
            size="sm"
            variant="outline"
            className="mt-3 text-amber-700 border-amber-200 hover:bg-amber-100"
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline error message component
 */
export function InlineError({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
      <svg
        className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <div className="flex-1 text-sm text-red-700">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700 font-medium text-sm"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
