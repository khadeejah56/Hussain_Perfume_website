"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <h1 className="font-display text-2xl font-semibold text-neutral-900">Something went wrong</h1>
      <p className="mt-3 text-neutral-600">
        We hit an unexpected error. Please try again, and if the problem continues, come back a little later.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-full bg-neutral-900 px-8 py-3 text-sm font-medium text-white transition-transform hover:scale-105 hover:bg-gold-700"
      >
        Try Again
      </button>
    </div>
  );
}
