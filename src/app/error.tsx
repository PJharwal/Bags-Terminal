'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="border border-red-500/30 bg-red-500/5 p-8 max-w-md w-full">
        <h2 className="text-red-400 font-mono text-lg mb-2">SYSTEM ERROR</h2>
        <p className="text-zinc-400 text-sm mb-6">
          Something went wrong. This error has been logged.
        </p>
        <button
          onClick={reset}
          className="w-full py-2 bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-colors font-mono text-sm"
        >
          RETRY
        </button>
      </div>
    </div>
  );
}
