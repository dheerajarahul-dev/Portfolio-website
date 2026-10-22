"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Mail,
  Shield,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import type { StudioSession, StudioUser, StudioInvitation, StudioRole } from "@/lib/studio-types";
import { STUDIO_ROLE_LABELS } from "@/lib/studio-permissions";

interface Props {
  session: StudioSession;
  initialUsers: StudioUser[];
  initialInvitations: StudioInvitation[];
}

export default function TeamClient({ session, initialUsers, initialInvitations }: Props) {
  const [users, setUsers] = useState<StudioUser[]>(initialUsers);
  const [invitations, setInvitations] = useState<StudioInvitation[]>(initialInvitations);

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StudioRole>("editor");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteSuccessUrl, setInviteSuccessUrl] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || submittingInvite) return;
    setSubmittingInvite(true);
    setInviteError(null);
    setInviteSuccessUrl(null);

    try {
      const res = await fetch("/api/studio/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || "Failed to create invitation");
        setSubmittingInvite(false);
        return;
      }

      setInvitations((prev) => [data.data, ...prev]);
      if (data.data.inviteUrl) {
        setInviteSuccessUrl(data.data.inviteUrl);
      }
      setInviteEmail("");
    } catch {
      setInviteError("Network error sending invite");
    } finally {
      setSubmittingInvite(false);
    }
  }

  function handleCopyInviteUrl() {
    if (!inviteSuccessUrl) return;
    navigator.clipboard.writeText(inviteSuccessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-violet-500" />
            Team & Collaborators
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage agency roles, video editors, producers, and client reviewers
          </p>
        </div>

        <button
          onClick={() => {
            setIsInviteOpen(true);
            setInviteSuccessUrl(null);
            setInviteError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Team Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          Active Members ({users.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-[#111113] p-5 rounded-2xl border border-white/[0.06] flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-700/80 text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
                {user.displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-white text-sm font-semibold truncate">
                    {user.displayName}
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-950/60 border border-violet-800/40 px-2 py-0.5 rounded-md">
                    {STUDIO_ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
                <p className="text-zinc-400 text-xs truncate mt-0.5">{user.email}</p>
                <div className="text-[11px] text-zinc-600 mt-2 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-500" />
                  <span>Active member</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-white/[0.06]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Pending Invitations ({invitations.length})
          </h2>

          <div className="bg-[#111113] rounded-2xl border border-white/[0.06] divide-y divide-white/[0.04]">
            {invitations.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">{inv.email}</span>
                  <span className="text-zinc-500 ml-2">
                    Role: <strong className="text-zinc-300">{STUDIO_ROLE_LABELS[inv.role]}</strong>
                  </span>
                </div>
                <span className="text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161619] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-violet-500" />
              Invite Team Member
            </h2>

            {inviteError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteSuccessUrl ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
                  Invitation created successfully! Copy and send the registration link below to your team member:
                </div>

                <div className="flex items-center gap-2 bg-zinc-900 p-2.5 rounded-xl border border-white/[0.08]">
                  <input
                    type="text"
                    readOnly
                    value={inviteSuccessUrl}
                    className="flex-1 bg-transparent text-xs text-zinc-300 outline-none truncate"
                  />
                  <button
                    onClick={handleCopyInviteUrl}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <button
                  onClick={() => setIsInviteOpen(false)}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@creativexcreations.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                    Role & Permissions
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as StudioRole)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none cursor-pointer"
                  >
                    <option value="editor">Video Editor (Upload WIPs, tasks)</option>
                    <option value="manager">Project Manager (Full project management)</option>
                    <option value="client">Client (Review and approval)</option>
                    <option value="reviewer">External Reviewer (Feedback only)</option>
                    {session.role === "super_admin" && (
                      <option value="super_admin">Super Administrator</option>
                    )}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(false)}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingInvite}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {submittingInvite && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Generate Invite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
