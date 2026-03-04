'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical errors to monitoring service
    console.error('Critical application error:', error);

    // Auto-recover from transient chunk loading issues
    if (
      error?.name === 'ChunkLoadError' ||
      /ChunkLoadError|Loading chunk(.*)failed/i.test(error?.message || '')
    ) {
      // Force a hard reload to get fresh runtime
      if (typeof window !== 'undefined') {
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  }, [error]);

  const isChunkError = error?.name === 'ChunkLoadError' || /ChunkLoadError|Loading chunk(.*)failed/i.test(error?.message || '');

  return (
    <html>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#f1f5f9',
        }}>
          <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
            {/* Error Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              background: 'rgba(220, 38, 38, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Content */}
            <h2 style={{
              fontSize: '24px',
              fontWeight: 700,
              margin: '0 0 12px 0',
              color: '#f1f5f9',
            }}>
              {isChunkError ? 'Loading Error' : 'Critical Error'}
            </h2>

            <p style={{
              fontSize: '14px',
              opacity: 0.8,
              margin: '0 0 24px 0',
              lineHeight: 1.6,
              color: '#cbd5e1',
            }}>
              {isChunkError
                ? "We couldn't load the latest application code. This is usually temporary. Please try reloading."
                : 'The application encountered a critical error and cannot continue. Our team has been notified.'}
            </p>

            {/* Error Details (development only) */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '24px',
                textAlign: 'left',
              }}>
                <p style={{
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  margin: 0,
                  color: '#94a3b8',
                  wordBreak: 'break-word',
                }}>
                  {error.message}
                </p>
                {error.digest && (
                  <p style={{
                    fontSize: '11px',
                    margin: '8px 0 0 0',
                    color: '#64748b',
                  }}>
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => (typeof window !== 'undefined' ? window.location.reload() : reset())}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
              >
                {isChunkError ? 'Reload Page' : 'Try Again'}
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/';
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: '#f1f5f9',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)')}
              >
                Go Home
              </button>
            </div>

            {/* Status */}
            <p style={{
              fontSize: '12px',
              margin: '24px 0 0 0',
              opacity: 0.6,
              color: '#94a3b8',
            }}>
              {isChunkError ? 'Auto-reloading in a moment...' : `Error ID: ${error.digest || 'unknown'}`}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
