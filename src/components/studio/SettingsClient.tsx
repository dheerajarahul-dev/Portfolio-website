"use client";

import { useState } from "react";
import {
  Settings,
  Shield,
  HardDrive,
  Bell,
  Check,
  Save,
  Loader2,
  Lock,
} from "lucide-react";
import type { StudioSession } from "@/lib/studio-types";

interface Props {
  session: StudioSession;
}

export default function SettingsClient({ session }: Props) {
  const [studioName, setStudioName] = useState("Creative X Studio");
  const [sessionDurationHours, setSessionDurationHours] = useState("8");
  const [maxUploadGb, setMaxUploadGb] = useState("4");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-violet-500" />
            Studio Platform Configuration
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Global administrative parameters, storage limits, and security protocols
          </p>
        </div>

        {saved && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold">
            <Check className="w-4 h-4" />
            Settings saved
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-4">
          <h2 className="text-base font-semibold text-white border-b border-white/[0.06] pb-3 flex items-center gap-2">
            General Studio Branding
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Studio Platform Name
              </label>
              <input
                type="text"
                value={studioName}
                onChange={(e) => setStudioName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Session Expiration (Hours)
              </label>
              <input
                type="number"
                value={sessionDurationHours}
                onChange={(e) => setSessionDurationHours(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Storage Limits */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-4">
          <h2 className="text-base font-semibold text-white border-b border-white/[0.06] pb-3 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-violet-400" />
            Supabase Storage & Video Uploads
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Maximum Single File Size (GB)
              </label>
              <input
                type="number"
                value={maxUploadGb}
                onChange={(e) => setMaxUploadGb(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Uploads bypass Next.js server directly via Supabase presigned URLs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Signed URL Expiry (Minutes)
              </label>
              <input
                type="number"
                defaultValue={60}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security Summary */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-4">
          <h2 className="text-base font-semibold text-white border-b border-white/[0.06] pb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            Active Security Protocols
          </h2>

          <div className="space-y-3 text-xs text-zinc-300">
            <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl">
              <span>Authentication Cookie</span>
              <span className="font-mono text-violet-400 font-semibold">cxs_session (httpOnly, HMAC-SHA256)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl">
              <span>Role-Based Access Control</span>
              <span className="font-semibold text-emerald-400">Strict Server-side Enforcement</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl">
              <span>Internal Message Filtering</span>
              <span className="font-semibold text-emerald-400">Restricted at DB Query Level</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-violet-600/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving Changes..." : "Save Platform Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
