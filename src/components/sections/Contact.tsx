"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Camera, PlayCircle, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import EditableText from "../edit/EditableText";
import { useSiteContent } from "@/context/SiteContentContext";

const channelIcons: Record<string, typeof Mail> = {
  Email: Mail,
  Instagram: Camera,
  YouTube: PlayCircle,
};

export default function Contact() {
  const { content } = useSiteContent();
  const section = content.contact;
  const [form, setForm] = useState({
    name: "",
    email: "",
    projectType: "Short Form Edit",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setForm({ name: "", email: "", projectType: "Short Form Edit", message: "" });

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
    <section id="contact" className="px-3 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-5 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-white/10 bg-[#111111]/85 p-5 shadow-2xl shadow-black/20 sm:rounded-[2rem] sm:p-10">
          <span className="mb-3 inline-flex rounded-full bg-purple-500/10 px-3 py-2 text-xs uppercase tracking-[0.22em] text-purple-200 sm:px-4 sm:text-sm sm:tracking-[0.35em]">
            <EditableText path="contact.badge" value={section.badge} as="span" />
          </span>
          <h2 className="text-2xl font-semibold leading-tight tracking-normal text-white min-[390px]:text-3xl sm:text-5xl">
            <EditableText path="contact.title" value={section.title} as="span" />
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:mt-5 sm:text-base sm:leading-8">
            <EditableText path="contact.description" value={section.description} as="span" multiline />
          </p>

          <form className="mt-7 space-y-4 sm:mt-10 sm:space-y-6" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-white/75 text-sm">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl"
                  placeholder="Your name"
                />
              </label>
              <label className="flex flex-col gap-2 text-white/75 text-sm">
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-white/75 text-sm">
              Project Type
              <select
                value={form.projectType}
                onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl"
              >
                <option>Short Form Edit</option>
                <option>Long Form Edit</option>
                <option>Motion Graphic & Infographic Edit</option>
                <option>Consultation</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-white/75 text-sm">
              Message
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className="rounded-2xl border border-white/10 bg-[#050505] px-4 py-3 text-white outline-none transition focus:border-purple-400/80 focus:ring-2 focus:ring-purple-500/10 sm:rounded-3xl"
                placeholder="Tell us about your project"
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-purple-500 px-6 py-4 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-60"
            >
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Inquiry
            </button>

            {status === "success" && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-green-400"
              >
                <CheckCircle className="h-4 w-4" /> Message sent! We'll get back to you soon.
              </motion.p>
            )}
            {status === "error" && errorMessage && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-400"
              >
                <AlertCircle className="h-4 w-4" /> {errorMessage}
              </motion.p>
            )}
          </form>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-[#111111]/85 p-5 shadow-2xl shadow-black/20 sm:space-y-6 sm:rounded-[2rem] sm:p-10">
          <p className="text-xs uppercase tracking-[0.22em] text-purple-300/80 sm:text-sm sm:tracking-[0.35em]">Direct contact</p>
          <h3 className="text-2xl font-semibold leading-tight text-white sm:text-3xl">Reach CreativeXCreations</h3>
          <p className="text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
            Prefer to connect directly? Use one of the channels below.
          </p>
          <div className="grid gap-4">
            {section.channels.map((contact) => {
              const Icon = channelIcons[contact.label] ?? Mail;
              return (
                <motion.a
                  key={contact.label}
                  href={contact.href}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ x: 4, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
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
                  <span className="shrink-0 text-sm text-purple-300 group-hover:text-white">Open</span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
