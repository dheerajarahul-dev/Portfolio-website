"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, Send, Loader2, AlertCircle, Inbox, CircleCheck, X, Tag } from "lucide-react";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";
import { InstagramMark, YouTubeMark } from "@/components/ui/SocialMarks";

const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Email: Mail,
  Instagram: InstagramMark,
  YouTube: YouTubeMark,
};

type SentMessageReceipt = {
  id: string;
  name: string;
  email: string;
  subject: string;
  projectType: string;
  message: string;
  sentAt: string;
};

type VideoReference = { title: string; url: string };

export default function Contact({ initialVideoReference = null }: { initialVideoReference?: VideoReference | null }) {
  const { content, editMode } = useSiteContent();
  const section = content.contact;
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: initialVideoReference ? `Video inquiry: ${initialVideoReference.title}`.slice(0, 80) : "",
    projectType: content.contact.form.projectTypes[0] || "General",
    message: "",
  });
  const [otherProjectType, setOtherProjectType] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sentMessages, setSentMessages] = useState<SentMessageReceipt[]>([]);
  const [sentBoxOpen, setSentBoxOpen] = useState(false);
  const [videoReference, setVideoReference] = useState<VideoReference | null>(initialVideoReference);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const selectProjectType = (event: Event) => {
      const projectType = (event as CustomEvent<{ projectType?: string }>).detail?.projectType;
      if (projectType && section.form.projectTypes.includes(projectType)) {
        setForm((current) => ({ ...current, projectType }));
      }
    };
    window.addEventListener("creativex:project-type", selectProjectType);
    return () => window.removeEventListener("creativex:project-type", selectProjectType);
  }, [section.form.projectTypes]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setErrorMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Please enter your name");
      return;
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }
    if (!form.message.trim()) {
      setErrorMessage("Please enter your message");
      return;
    }
    if (form.projectType === "Other" && !otherProjectType.trim()) {
      setErrorMessage("Please describe your project type.");
      return;
    }

    const messageText = form.message.trim();
    const taggedMessage = videoReference
      ? `${messageText}\n\nVideo reference: ${videoReference.title}\n${videoReference.url}`
      : messageText;
    if (taggedMessage.length > 5000) {
      setErrorMessage("Please shorten your message so the attached video reference fits.");
      return;
    }
    const submittedMessage = {
      ...form,
      projectType: form.projectType === "Other" ? otherProjectType.trim() : form.projectType,
      subject: form.subject.trim(),
      message: taggedMessage,
    };

    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submittedMessage,
          website: honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSentMessages((current) => [{
        ...submittedMessage,
        id: typeof data.id === "string" ? data.id : `${Date.now()}`,
        sentAt: new Date().toISOString(),
      }, ...current].slice(0, 10));
      setStatus("success");
      setForm({
        name: "",
        email: "",
        subject: "",
        projectType: section.form.projectTypes[0] || "General",
        message: "",
      });
      setOtherProjectType("");
      setVideoReference(null);

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => setStatus("idle"), 5000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send message. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl min-w-0 gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-10">
        <div className="min-w-0 rounded-3xl border border-white/10 bg-[#0e0e14]/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">
              <EditableText path="contact.badge" value={section.badge} as="span" />
            </span>

            {sentMessages.length > 0 && (
              <button
                type="button"
                onClick={() => setSentBoxOpen((open) => !open)}
                aria-expanded={sentBoxOpen}
                aria-controls="contact-sent-box"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-2 pr-3 text-xs text-white/80 transition-colors hover:border-purple-400/50 hover:bg-white/10"
              >
                <Inbox className="h-3.5 w-3.5 text-purple-400" aria-hidden="true" />
                <span>Sent ({sentMessages.length})</span>
              </button>
            )}
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white min-[390px]:text-3xl sm:text-4xl lg:text-5xl leading-[1.15]">
            <EditableText path="contact.title" value={section.title} as="span" />
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
            <EditableText path="contact.description" value={section.description} as="span" multiline />
          </p>

          <p className="mt-2 text-xs text-white/45">
            We reply directly to your provided email within 24–48 hours.
          </p>

          {videoReference && (
            <div className="mt-5 flex min-w-0 items-start gap-3 rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3.5">
              <Tag className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-purple-300">Video reference attached</p>
                <a href={videoReference.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm font-medium text-white underline decoration-purple-400/40 underline-offset-2 hover:text-purple-200">
                  {videoReference.title}
                </a>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVideoReference(null);
                  setForm((current) => ({
                    ...current,
                    subject: current.subject === `Video inquiry: ${videoReference.title}`.slice(0, 80) ? "" : current.subject,
                  }));
                }}
                aria-label="Remove attached video"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {sentBoxOpen && (
            <section
              id="contact-sent-box"
              aria-label="Messages sent during this page session"
              className="mt-4 w-full min-w-0 space-y-3 overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <Inbox className="h-4 w-4 text-purple-400" aria-hidden="true" />
                  Sent Messages in this Session
                </h3>
                <button
                  type="button"
                  onClick={() => setSentBoxOpen(false)}
                  aria-label="Close sent box"
                  className="grid h-7 w-7 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
                {sentMessages.map((sentMessage) => (
                  <article key={sentMessage.id} className="rounded-xl border border-white/10 bg-black/40 p-3">
                    <div className="flex items-start gap-2.5">
                      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-xs font-semibold text-white">{sentMessage.subject || sentMessage.projectType}</p>
                          <time dateTime={sentMessage.sentAt} className="text-[10px] text-white/40">{new Date(sentMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                        </div>
                        <p className="mt-1 text-xs text-white/70 line-clamp-2">{sentMessage.message}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} /></label>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  <EditableText path="contact.form.nameLabel" value={section.form.nameLabel} as="span" />
                </span>
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-[#08080c] px-4 py-3.5 text-sm text-white placeholder-white/30 transition focus:border-purple-400 focus:bg-[#0c0c14] focus:outline-none focus:ring-4 focus:ring-purple-500/15"
                  placeholder={section.form.namePlaceholder}
                />
              </label>
              
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  <EditableText path="contact.form.emailLabel" value={section.form.emailLabel} as="span" />
                </span>
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-[#08080c] px-4 py-3.5 text-sm text-white placeholder-white/30 transition focus:border-purple-400 focus:bg-[#0c0c14] focus:outline-none focus:ring-4 focus:ring-purple-500/15"
                  placeholder={section.form.emailPlaceholder}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  <EditableText path="contact.form.projectTypeLabel" value={section.form.projectTypeLabel} as="span" />
                </label>
                <select
                  value={form.projectType}
                  onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-[#08080c] px-4 py-3.5 text-sm text-white outline-none transition focus:border-purple-400 focus:bg-[#0c0c14] focus:ring-4 focus:ring-purple-500/15 cursor-pointer"
                >
                  {section.form.projectTypes.map((projectType) => (
                    <option key={projectType} value={projectType} className="bg-[#111] text-white">
                      {projectType}
                    </option>
                  ))}
                </select>
                {form.projectType === "Other" && (
                  <input
                    required
                    value={otherProjectType}
                    onChange={(event) => setOtherProjectType(event.target.value)}
                    maxLength={80}
                    className="mt-2 rounded-xl border border-white/10 bg-[#08080c] px-4 py-3 text-sm text-white outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/15"
                    placeholder="Describe your project (e.g. Docuseries, Brand Film)"
                  />
                )}
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  <EditableText path="contact.form.subjectLabel" value={section.form.subjectLabel} as="span" />
                </span>
                <input
                  maxLength={80}
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="rounded-xl border border-white/10 bg-[#08080c] px-4 py-3.5 text-sm text-white placeholder-white/30 transition focus:border-purple-400 focus:bg-[#0c0c14] focus:outline-none focus:ring-4 focus:ring-purple-500/15"
                  placeholder={section.form.subjectPlaceholder}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                <EditableText path="contact.form.messageLabel" value={section.form.messageLabel} as="span" />
              </span>
              <textarea
                required
                rows={4}
                maxLength={5000}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-[#08080c] px-4 py-3.5 text-sm text-white placeholder-white/30 transition focus:border-purple-400 focus:bg-[#0c0c14] focus:outline-none focus:ring-4 focus:ring-purple-500/15 min-h-[120px] resize-y"
                placeholder={section.form.messagePlaceholder}
              />
            </label>

            {editMode ? (
              <div className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-purple-600 px-6 py-4 text-sm font-semibold text-white">
                <EditableText
                  path="contact.form.submitLabel"
                  value={section.form.submitLabel}
                  as="span"
                  showEditButton={false}
                />
              </div>
            ) : (
              <button
                type="submit"
                disabled={status === "loading" || status === "success"}
                aria-live="polite"
                aria-atomic="true"
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl px-7 py-4 text-sm font-bold text-white shadow-lg transition active:scale-[0.99] cursor-pointer ${
                  status === "success"
                    ? "bg-emerald-600 shadow-emerald-600/30"
                    : "bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 shadow-purple-600/30 hover:brightness-110 hover:shadow-purple-600/50 disabled:opacity-60"
                }`}
              >
                {status === "loading" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : status === "success" ? (
                  <motion.span
                    initial={reduceMotion ? false : { x: 16, y: -8, scale: 0.8, opacity: 0 }}
                    animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="inline-flex items-center gap-2"
                  >
                    <CircleCheck className="h-4 w-4 text-emerald-200" aria-hidden="true" />
                    <EditableText path="contact.form.successMessage" value={section.form.successMessage} as="span" />
                  </motion.span>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-purple-200" aria-hidden="true" />
                    <span>{section.form.submitLabel}</span>
                  </>
                )}
              </button>
            )}

            {status === "error" && errorMessage && (
              <p role="alert" className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" /> {errorMessage}
              </p>
            )}
          </form>
        </div>

        <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0e0e14]/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-10">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-purple-300 mb-4">
              <EditableText path="contact.directTitle" value={section.directTitle} as="span" />
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl leading-snug">
              <EditableText path="contact.directHeading" value={section.directHeading} as="span" />
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
              <EditableText path="contact.directDescription" value={section.directDescription} as="span" multiline />
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {section.channels.map((contact) => {
              const Icon = channelIcons[contact.label] ?? Mail;
              return (
                <a
                  key={contact.label}
                  href={contact.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-200 hover:border-purple-500/40 hover:bg-purple-600/10 cursor-pointer"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300 transition group-hover:bg-purple-500/25 group-hover:text-purple-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{contact.label}</p>
                      <p className="truncate text-sm font-medium text-white">{contact.value}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-purple-400 group-hover:text-white transition">
                    <EditableText path="contact.channelAction" value={section.channelAction} as="span" /> →
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
