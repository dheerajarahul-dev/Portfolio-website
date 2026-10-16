"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Mail, Send, Loader2, AlertCircle, Inbox, CircleCheck, X } from "lucide-react";
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

export default function Contact() {
  const { content, editMode } = useSiteContent();
  const section = content.contact;
  const reduceMotion = useReducedMotion();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    projectType: content.contact.form.projectTypes[0] || "General",
    message: "",
  });
  const [otherProjectType, setOtherProjectType] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sentMessages, setSentMessages] = useState<SentMessageReceipt[]>([]);
  const [sentBoxOpen, setSentBoxOpen] = useState(false);
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

    const submittedMessage = {
      ...form,
      projectType: form.projectType === "Other" ? otherProjectType.trim() : form.projectType,
      subject: form.subject.trim(),
      message: form.message.trim(),
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
    <section id="contact" className="scroll-mt-28 px-3 py-8 sm:px-5 sm:py-12 lg:scroll-mt-[5.375rem] lg:px-6 lg:py-1">
      <div className="mx-auto grid max-w-[88rem] min-w-0 gap-5 sm:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-6">
        <div className="min-w-0 rounded-2xl border border-white/10 bg-[#111111]/85 p-5 shadow-2xl shadow-black/20 sm:rounded-[2rem] sm:p-8 lg:p-6">
          <span className="mb-2 inline-flex rounded-full bg-purple-500/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-purple-200 sm:px-4 sm:text-sm sm:tracking-[0.35em]">
            <EditableText path="contact.badge" value={section.badge} as="span" />
          </span>
          <h2 className="text-2xl font-semibold leading-tight tracking-normal text-white min-[390px]:text-3xl sm:text-5xl lg:text-[2rem]">
            <EditableText path="contact.title" value={section.title} as="span" />
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:mt-4 sm:text-base sm:leading-7 lg:mt-2 lg:text-sm lg:leading-6">
            <EditableText path="contact.description" value={section.description} as="span" multiline />
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-5 text-white/50 lg:whitespace-nowrap lg:text-[10px]">We’ll reply to the email address you provide, usually within two business days.</p>
            <button
              type="button"
              onClick={() => setSentBoxOpen((open) => !open)}
              aria-expanded={sentBoxOpen}
              aria-controls="contact-sent-box"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/30 py-1 pl-1 pr-3 text-xs text-white/75 transition-colors hover:border-cyan-200/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            >
              <span className="relative grid h-8 w-8 place-items-center rounded-full border border-cyan-200/20 bg-cyan-300/10 text-cyan-100">
                <Inbox className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>Sent box</span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] tabular-nums">{sentMessages.length}</span>
            </button>
          </div>

          {sentBoxOpen && (
            <section
              id="contact-sent-box"
              aria-label="Messages sent during this page session"
              className="mt-3 w-full min-w-0 max-w-full space-y-3 overflow-hidden rounded-2xl border border-cyan-200/15 bg-[#090d10] p-3 sm:p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <Inbox className="h-4 w-4 text-cyan-100" aria-hidden="true" />
                  Sent to CreativeXCreations
                </h3>
                <button
                  type="button"
                  onClick={() => setSentBoxOpen(false)}
                  aria-label="Close sent box"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {sentMessages.length === 0 ? (
                <p className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs leading-5 text-white/55">
                  Messages confirmed by the server will appear here for this page session.
                </p>
              ) : (
                <div className="max-h-64 w-full min-w-0 space-y-2 overflow-x-hidden overflow-y-auto">
                  {sentMessages.map((sentMessage) => (
                    <article key={sentMessage.id} className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.025] p-3">
                      <div className="flex items-start gap-2">
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                            <p className="min-w-0 break-all text-xs font-semibold text-white">{sentMessage.subject || sentMessage.projectType}</p>
                            <time dateTime={sentMessage.sentAt} className="break-all text-[10px] text-white/45">{new Date(sentMessage.sentAt).toLocaleString()}</time>
                          </div>
                          <p className="mt-1 break-all text-[11px] text-white/55">From {sentMessage.name} · {sentMessage.email}</p>
                          <p className="mt-2 whitespace-pre-wrap break-all text-xs leading-5 text-white/75">{sentMessage.message}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-4 lg:mt-2 lg:space-y-1" onSubmit={submit}>
            <div className="pointer-events-none absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label>Website<input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-white/75 text-sm">
                <EditableText path="contact.form.nameLabel" value={section.form.nameLabel} as="span" />
                <input
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl lg:py-2"
                  placeholder={section.form.namePlaceholder}
                />
              </label>
              <label className="flex flex-col gap-2 text-white/75 text-sm">
                <EditableText path="contact.form.emailLabel" value={section.form.emailLabel} as="span" />
                <input
                  required
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl lg:py-2"
                  placeholder={section.form.emailPlaceholder}
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 lg:gap-3">
              <div className="space-y-4 lg:space-y-3">
                <label className="flex flex-col gap-2 text-white/75 text-sm">
                  <EditableText path="contact.form.projectTypeLabel" value={section.form.projectTypeLabel} as="span" />
                  <select
                    value={form.projectType}
                    onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
                    className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl lg:py-2"
                  >
                    {section.form.projectTypes.map((projectType) => (
                      <option key={projectType}>{projectType}</option>
                    ))}
                  </select>
                </label>
                {form.projectType === "Other" && (
                  <label className="flex flex-col gap-2 text-sm text-white/75">
                    Describe your project type
                    <input
                      required
                      value={otherProjectType}
                      onChange={(event) => setOtherProjectType(event.target.value)}
                      maxLength={80}
                      className="rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none focus:border-purple-400/80 sm:rounded-2xl lg:py-2"
                      placeholder="For example: Product launch film"
                    />
                  </label>
                )}
              </div>

              <label className="flex flex-col gap-2 text-white/75 text-sm">
                <EditableText path="contact.form.subjectLabel" value={section.form.subjectLabel} as="span" />
                <input
                  maxLength={80}
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl lg:py-2"
                  placeholder={section.form.subjectPlaceholder}
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-white/75 text-sm">
              <EditableText path="contact.form.messageLabel" value={section.form.messageLabel} as="span" />
              <textarea
                required
                rows={3}
                maxLength={5000}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl lg:h-16 lg:py-2"
                placeholder={section.form.messagePlaceholder}
              />
            </label>

            {editMode ? (
              <div className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-purple-500 px-6 py-4 text-sm font-semibold text-white">
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
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition disabled:cursor-default disabled:opacity-100 ${status === "success" ? "bg-emerald-700" : "bg-purple-500 hover:bg-purple-400 disabled:opacity-60"}`}
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
                    <Inbox className="h-4 w-4" aria-hidden="true" />
                    <EditableText path="contact.form.successMessage" value={section.form.successMessage} as="span" />
                  </motion.span>
                ) : (
                  <><Send className="h-4 w-4" aria-hidden="true" /><span>{section.form.submitLabel}</span></>
                )}
              </button>
            )}

            {status === "error" && errorMessage && (
              <p
                role="alert"
                className="flex items-center gap-2 text-sm text-red-400"
              >
                <AlertCircle className="h-4 w-4" /> {errorMessage}
              </p>
            )}
          </form>
        </div>

        <div className="min-w-0 space-y-4 rounded-2xl border border-white/10 bg-[#111111]/85 p-5 shadow-2xl shadow-black/20 sm:space-y-5 sm:rounded-[2rem] sm:p-8 lg:p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">
            <EditableText path="contact.directTitle" value={section.directTitle} as="span" />
          </p>
          <h3 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">
            <EditableText path="contact.directHeading" value={section.directHeading} as="span" />
          </h3>
          <p className="text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
            <EditableText path="contact.directDescription" value={section.directDescription} as="span" multiline />
          </p>
          <div className="grid gap-4">
            {section.channels.map((contact) => {
              const Icon = channelIcons[contact.label] ?? Mail;
              return (
                <a
                  key={contact.label}
                  href={contact.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-purple-300/20 hover:bg-purple-500/10 sm:rounded-3xl sm:px-5 sm:py-4"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-300 sm:h-11 sm:w-11 sm:rounded-3xl">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{contact.label}</p>
                      <p className="truncate text-sm text-white/70">{contact.value}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm text-purple-300 group-hover:text-white">
                    <EditableText path="contact.channelAction" value={section.channelAction} as="span" />
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
