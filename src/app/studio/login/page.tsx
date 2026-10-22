"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft, Film } from "lucide-react";

export default function StudioLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("dheeraj@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextUrl = params.get("next");
    const target = nextUrl && nextUrl.startsWith("/studio") ? nextUrl : "/studio/dashboard";

    fetch("/api/studio/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) router.replace(target);
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [router]);

  async function performLogin(loginEmail: string, loginPass: string) {
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/studio/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const nextUrl = params.get("next");
      const target = nextUrl && nextUrl.startsWith("/studio") ? nextUrl : "/studio/dashboard";
      router.replace(target);
    } catch {
      setError("A network error occurred. Please try again.");
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await performLogin(email, password);
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/5">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to portfolio
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight text-sm">Creative X Studio</span>
        </div>
      </header>

      {/* Login form */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Logo + heading */}
          <div className="mb-8 text-center">
            <div className="w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white mb-1">Sign in to Studio</h1>
            <p className="text-zinc-400 text-sm">
              Access your video production workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="studio-email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email address
              </label>
              <input
                id="studio-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                placeholder="dheeraj@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500
                           transition-colors"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="studio-password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="studio-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 text-sm
                             focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500
                             transition-colors"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Login Helper */}
            <div className="p-3.5 bg-gradient-to-r from-violet-950/60 to-purple-950/40 border border-violet-700/50 rounded-xl flex items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="text-xs font-semibold text-white">Default Super Admin</p>
                <p className="text-[11px] text-zinc-400 font-mono">dheeraj@gmail.com</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("dheeraj@gmail.com");
                    setError(null);
                  }}
                  className="text-zinc-400 hover:text-zinc-200 text-xs underline"
                >
                  Fill Email
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="px-3.5 py-2.5 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2.5 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* CMS Admin Link & Footer Note */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center space-y-2">
            <p className="text-xs text-zinc-500">
              Need to edit the portfolio site content?{" "}
              <Link href="/admin/login" className="text-violet-400 hover:text-violet-300 underline">
                Go to CMS Admin
              </Link>
            </p>
            <p className="text-xs text-zinc-600">
              Don&apos;t have an account?{" "}
              <span className="text-zinc-400">Contact your project manager to receive an invitation.</span>
            </p>
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <footer className="px-6 py-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-600">
        <span>Creative X Studio &copy; {new Date().getFullYear()}</span>
        <span className="text-zinc-700">v1.0</span>
      </footer>
    </div>
  );
}
