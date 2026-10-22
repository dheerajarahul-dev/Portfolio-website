"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Mail,
  Phone,
  FolderKanban,
  Search,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { StudioSession, StudioClient, StudioProject } from "@/lib/studio-types";

interface Props {
  session: StudioSession;
  initialClients: StudioClient[];
  projects: StudioProject[];
}

export default function ClientsClient({ session, initialClients, projects }: Props) {
  const [clients, setClients] = useState<StudioClient[]>(initialClients);
  const [search, setSearch] = useState("");

  // New client modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredClients = clients.filter((c) => {
    const term = search.toLowerCase().trim();
    return (
      !term ||
      c.companyName.toLowerCase().includes(term) ||
      c.contactName.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      // In Phase 1, project create can register client or we can call project route with mock
      // Or we can mock client addition optimistically
      const newClient: StudioClient = {
        id: crypto.randomUUID(),
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        userId: null,
        createdBy: session.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setClients((prev) => [newClient, ...prev]);
      setIsModalOpen(false);
      setCompanyName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setNotes("");
    } catch {
      setError("Failed to create client organization");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-violet-500" />
            Client Directory
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Brand partners, creators, corporate accounts, and associated productions
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Client Organization
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, contact person, or email..."
          className="w-full pl-9 pr-3.5 py-2.5 bg-[#111113] border border-white/[0.06] rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500 text-sm bg-[#111113] rounded-2xl border border-white/[0.06]">
            No client accounts found.
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientProjects = projects.filter((p) => p.clientId === client.id);

            return (
              <div
                key={client.id}
                className="bg-[#111113] p-5 rounded-2xl border border-white/[0.06] flex flex-col justify-between hover:border-violet-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-950/50 border border-violet-800/40 flex items-center justify-center text-violet-400 font-bold">
                      {client.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white text-base font-semibold truncate">
                        {client.companyName}
                      </h3>
                      <p className="text-zinc-400 text-xs truncate">{client.contactName}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-400 mt-4">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Phone className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/[0.04] flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    {clientProjects.length} {clientProjects.length === 1 ? "project" : "projects"}
                  </span>
                  <Link
                    href={`/studio/projects?clientId=${client.id}`}
                    className="text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center gap-1"
                  >
                    View Projects
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#161619] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-500" />
              Add Client Organization
            </h2>

            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Media Group"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Primary Contact Person <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@apexmedia.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1.5">
                  Phone (Optional)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
