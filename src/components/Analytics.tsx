"use client";

import { useEffect } from "react";
import Script from "next/script";

const SECTIONS = [
  "trust",
  "work",
  "why-us",
  "showcase",
  "pricing",
  "about",
  "contact",
] as const;

function track(event: string, props?: Record<string, string | number>) {
  if (typeof window !== "undefined" && "plausible" in window) {
    const plausible = (window as Window & {
      plausible?: (e: string, o?: { props?: Record<string, string | number> }) => void;
    }).plausible;
    plausible?.(event, props ? { props } : undefined);
  }
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as Window & { gtag?: (...args: unknown[]) => void }).gtag?.("event", event, props);
  }
}

export function AnalyticsScripts() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <>
      {plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
          </Script>
        </>
      )}
    </>
  );
}

export default function SectionAnalytics() {
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      let enteredAt = 0;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            enteredAt = Date.now();
            track("Section Enter", { section: id });
          } else if (enteredAt > 0) {
            const seconds = Math.round((Date.now() - enteredAt) / 1000);
            if (seconds >= 2) {
              track("Section Time", { section: id, seconds });
            }
            enteredAt = 0;
          }
        },
        { threshold: 0.35 }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return null;
}
