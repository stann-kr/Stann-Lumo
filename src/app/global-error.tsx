'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8" style={{ fontFamily: 'monospace', background: '#000', color: '#fff' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Something went wrong.</h2>
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1.5rem', border: '1px solid #fff', background: 'transparent', color: '#fff', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
