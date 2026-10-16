import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <div className="max-w-lg rounded-2xl border border-white/10 bg-[#111111] p-6 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-purple-300/80">404</p>
        <h1 className="mt-3 text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-white/65">
          That route does not exist, or the media link is no longer available.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-500"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
