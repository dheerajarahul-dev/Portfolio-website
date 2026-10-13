"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cpu, Palette, Sparkles, Settings2 } from "lucide-react";

const STORAGE_KEY = "portfolio-site-settings";

type SiteSettings = {
  accent: string;
  background: string;
  intensity: number;
  showDecor: boolean;
};

const defaultSettings: SiteSettings = {
  accent: "#7C3AED",
  background: "#050505",
  intensity: 4,
  showDecor: true,
};

const inferSettings = (prompt: string, current: SiteSettings): SiteSettings => {
  const normalized = prompt.toLowerCase();
  let accent = current.accent;
  let background = current.background;
  let intensity = current.intensity;
  const showDecor = current.showDecor;

  if (/dark|noir|cinematic|premium/.test(normalized)) {
    background = "#06060b";
    accent = "#d946ef";
    intensity = 7;
  }
  if (/blue|tech|modern|clean/.test(normalized)) {
    accent = "#0ea5e9";
    background = "#050f1e";
    intensity = Math.max(intensity, 6);
  }
  if (/warm|sunny|brand|gold/.test(normalized)) {
    accent = "#fb923c";
    background = "#111827";
  }
  if (/audio|music|wave|sound/.test(normalized)) {
    intensity = Math.max(intensity, 7);
  }
  if (/fast|dynamic|energy/.test(normalized)) {
    intensity = Math.max(intensity, 8);
  }
  if (/soft|minimal|simple/.test(normalized)) {
    intensity = 3;
  }
  if (/quiet|darkmode|night/.test(normalized)) {
    background = "#030305";
  }

  return {
    accent,
    background,
    intensity,
    showDecor,
  };
};

const applyTheme = (settings: SiteSettings) => {
  document.documentElement.style.setProperty("--brand-accent", settings.accent);
  document.documentElement.style.setProperty("--brand-bg", settings.background);
  document.documentElement.style.setProperty("--scene-intensity", settings.intensity.toString());
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultSettings;
    try {
      return JSON.parse(stored) as SiteSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [prompt, setPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  useEffect(() => {
    applyTheme(settings);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  const handleAiGenerate = () => {
    const result = inferSettings(prompt, settings);
    setSettings(result);
    setAiResponse(
      prompt
        ? `AI assistant applied a custom theme based on your prompt: "${prompt}".`
        : "Please type what you want to change, like \"more cinematic\" or \"audio edit studio\"."
    );
  };

  return (
    <main className="admin-compact min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-3 py-8 sm:gap-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b0b13]/90 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:rounded-[2rem] sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:tracking-[0.35em]">Customization Studio</p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-4xl">AI Settings & Visual Theme</h1>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-purple-300/40 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>
        </div>

        <div className="grid gap-5 sm:gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-2xl border border-white/10 bg-[#111] p-5 sm:space-y-6 sm:rounded-[2rem] sm:p-6">
            <div className="rounded-3xl bg-white/5 p-6">
              <p className="text-sm font-semibold text-white">AI Assistant</p>
              <p className="mt-2 text-sm text-white/70">
                Describe the style you want and the assistant will automatically tune the theme, color,
                and motion intensity.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm uppercase tracking-[0.35em] text-white/50">Tell the assistant</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full rounded-3xl border border-white/10 bg-[#0a0a0a] px-4 py-3 text-sm text-white outline-none focus:border-purple-400/60"
                placeholder="Make the website more cinematic, energetic, and audio-focused"
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white hover:bg-purple-500"
              >
                Generate with AI
              </button>
              {aiResponse ? (
                <p className="rounded-3xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-purple-100">
                  {aiResponse}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-5 rounded-2xl border border-white/10 bg-[#111] p-5 sm:space-y-6 sm:rounded-[2rem] sm:p-6">
            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-[#0b0b13]/90 p-5">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-purple-300" />
                  <p className="text-sm font-semibold text-white">Theme Settings</p>
                </div>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm text-white/60">Accent Color</label>
                  <input
                    type="color"
                    value={settings.accent}
                    onChange={(e) => setSettings((prev) => ({ ...prev, accent: e.target.value }))}
                    className="h-12 w-full cursor-pointer rounded-3xl border border-white/10 bg-[#0a0a0a]"
                  />
                </div>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm text-white/60">Background Color</label>
                  <input
                    type="color"
                    value={settings.background}
                    onChange={(e) => setSettings((prev) => ({ ...prev, background: e.target.value }))}
                    className="h-12 w-full cursor-pointer rounded-3xl border border-white/10 bg-[#0a0a0a]"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <label className="block text-sm text-white/60">3D Motion Strength</label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={settings.intensity}
                    onChange={(e) => setSettings((prev) => ({ ...prev, intensity: Number(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                  <p className="text-sm text-white/70">Current: {settings.intensity}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="text-sm text-white">Decorative motion</p>
                    <p className="text-xs text-white/50">Enable or disable floating decorations.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, showDecor: !prev.showDecor }))}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
                  >
                    {settings.showDecor ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-[#111] p-6">
            <h2 className="text-xl font-semibold text-white">What the AI can do</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-purple-300" />
                Tune the website mood automatically.
              </li>
              <li className="flex gap-2">
                <Cpu className="h-4 w-4 text-purple-300" />
                Adjust motion intensity for smoother 3D reactions.
              </li>
              <li className="flex gap-2">
                <Palette className="h-4 w-4 text-purple-300" />
                Update accent and background colors instantly.
              </li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#111] p-6">
            <h2 className="text-xl font-semibold text-white">Live preview</h2>
            <div className="mt-4 rounded-[1.75rem] border border-white/10 bg-[#0a0a0a]/90 p-6">
              <p className="text-sm text-white/70">
                The current theme is applied globally. Visit the homepage to see the updated 3D motion and accent color in action.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
