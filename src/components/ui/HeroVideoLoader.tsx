"use client";

export default function HeroVideoLoader({ visible, fadingOut }: { visible: boolean; fadingOut: boolean }) {
  if (!visible) return null;

  return (
    <div
      className={`hero-loader-overlay absolute inset-0 z-[5] overflow-hidden bg-[#050505] ${
        fadingOut ? "hero-loader-fade-out" : "hero-loader-fade-in"
      }`}
    >
      <div className="hero-shimmer absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div className="hero-shimmer-bar h-full w-1/2 rounded-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600" />
        </div>
        <p className="text-xs uppercase tracking-[0.35em] text-purple-300/60">
          Loading cinematic preview…
        </p>
      </div>
    </div>
  );
}
