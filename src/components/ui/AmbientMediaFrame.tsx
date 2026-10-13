"use client";

import type { ReactNode } from "react";

/** Blurred thumbnail fills letterbox gaps; media sits centered on top */
export default function AmbientMediaFrame({
  thumbnailUrl,
  children,
  className = "",
  mediaClassName = "",
}: {
  thumbnailUrl?: string;
  children: ReactNode;
  className?: string;
  mediaClassName?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {thumbnailUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-[48px] brightness-[0.55] saturate-[1.35] opacity-90"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-40 mix-blend-screen"
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0d0d12] to-[#050505]" />
      )}
      <div
        className={`relative z-10 flex h-full w-full items-center justify-center ${mediaClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
