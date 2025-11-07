"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Auto-recover from transient chunk loading issues often seen in dev/HMR
    if (
      error?.name === "ChunkLoadError" ||
      /ChunkLoadError|Loading chunk(.*)failed/i.test(error?.message || "")
    ) {
      // Force a hard reload to get a fresh runtime/chunk graph
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
        }}>
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              Something went wrong
            </h2>
            <p style={{ opacity: 0.8, marginBottom: 16 }}>
              {error?.name === "ChunkLoadError"
                ? "We couldn't load the latest application code. This is usually temporary."
                : "An unexpected error occurred."}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => (typeof window !== "undefined" ? window.location.reload() : reset())}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Reload
              </button>
              <button
                onClick={() => reset()}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "hsl(var(--muted))",
                  color: "hsl(var(--foreground))",
                  border: "1px solid hsl(var(--border))",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
