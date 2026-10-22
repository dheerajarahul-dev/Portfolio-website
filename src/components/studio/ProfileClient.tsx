"use client";

import { useState } from "react";
import {
  User,
  Shield,
  Mail,
  KeyRound,
  Check,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { StudioSession, StudioUser } from "@/lib/studio-types";
import { STUDIO_ROLE_LABELS, STUDIO_ROLE_DESCRIPTIONS } from "@/lib/studio-permissions";

interface Props {
  session: StudioSession;
  user: StudioUser | null;
}

export default function ProfileClient({ session, user }: Props) {
  const [displayName, setDisplayName] = useState(user?.displayName ?? session.displayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSuccessMsg("Profile information updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }, 600);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <User className="w-6 h-6 text-violet-500" />
          My Profile & Account
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage your personal credentials, workspace preferences, and permissions
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* User Card */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 text-white font-bold text-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-600/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">{displayName}</h2>
            <p className="text-zinc-400 text-xs">{session.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-violet-400 bg-violet-950/60 border border-violet-800/40 px-2.5 py-0.5 rounded-full font-semibold">
              <Shield className="w-3 h-3" />
              <span>{STUDIO_ROLE_LABELS[session.role]}</span>
            </div>
          </div>
        </div>

        {/* Role & Permissions Info */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-3">
          <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
            Role Description & Scope
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {STUDIO_ROLE_DESCRIPTIONS[session.role]}
          </p>
        </div>

        {/* Account Details */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider border-b border-white/[0.06] pb-3">
            Account Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={session.email}
                className="w-full px-3.5 py-2.5 bg-zinc-900/50 border border-white/[0.04] rounded-xl text-zinc-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Security / Password */}
        <div className="bg-[#111113] p-6 rounded-2xl border border-white/[0.06] space-y-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-400 tracking-wider border-b border-white/[0.06] pb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-violet-400" />
            Change Password
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
              />
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
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
