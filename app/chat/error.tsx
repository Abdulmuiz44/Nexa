"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold mb-2">Failed to load Chat</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {error?.name === 'ChunkLoadError' ?
            "We couldn't load the latest application code. This is usually temporary." :
            'An unexpected error occurred.'}
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => (typeof window !== 'undefined' ? window.location.reload() : reset())}
            className="px-3 py-2 rounded-md bg-primary text-primary-foreground"
          >
            Reload
          </button>
          <button
            onClick={() => reset()}
            className="px-3 py-2 rounded-md border border-border"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
