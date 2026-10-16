"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error.digest || error.message);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <div className="max-w-lg rounded-2xl border border-white/10 bg-[#111111] p-6 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-purple-300/80">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-semibold">The page could not finish loading.</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          Please retry. If it keeps happening, share this reference code:
          {" "}
          <span className="font-mono text-white/80">{error.digest || "unavailable"}</span>.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <details className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-left">
            <summary className="cursor-pointer text-xs font-semibold text-white/70">Development error details</summary>
            <p className="mt-2 break-words font-mono text-xs leading-5 text-red-200">
              {error.name}: {error.message}
            </p>
          </details>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={unstable_retry}
            className="rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500"
          >
            Retry
          </button>
          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
