import Link from "next/link";
import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import { readContent } from "@/lib/storage";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Website & Service Information | CreativeXCreations",
  description: "Privacy, website terms, project terms, and copyright information for CreativeXCreations.",
  alternates: siteUrl ? { canonical: `${siteUrl}/legal` } : undefined,
};

export const dynamic = "force-dynamic";

export default async function LegalPage() {
  const content = await readContent();

  return (
    <>
      <header className="border-b border-white/10 bg-[#080809] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="font-space text-sm font-bold text-white">{content.navbar.brandName}</Link>
          <Link href="/" className="text-sm text-white/70 hover:text-white">Back to site</Link>
        </div>
      </header>
      <main className="min-h-[70vh] bg-[#050505] px-4 py-10 text-white sm:px-6 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <h1 className="font-space text-3xl font-semibold sm:text-4xl">Website &amp; Service Information</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            These notes describe the current website and published project information. They are not legal advice or a substitute for a project-specific agreement. Applicable rights and requirements depend on the operator, client, and location; have qualified counsel review these terms before relying on them.
          </p>
          <nav aria-label="Legal page sections" className="mt-6 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Link href="#privacy-policy" className="rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">Privacy Policy</Link>
            <Link href="#terms-of-use" className="rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">Terms of Use</Link>
            <Link href="#service-terms" className="rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">Service Terms</Link>
            <Link href="#copyright-licensing" className="rounded-lg border border-white/10 px-3 py-2 text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">Copyright &amp; Licensing</Link>
          </nav>

          <section id="privacy-policy" className="scroll-mt-8 border-b border-white/10 py-8">
            <h2 className="text-2xl font-semibold">Privacy Policy</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/70">
              <p>
                The contact form collects the name, email address, project type, subject, message, and submission time that you provide. These details are used to review and respond to your inquiry. The form does not ask you to upload files.
              </p>
              <p>
                Contact messages are available to authenticated administrators with message permissions. Moving a message to the recycle bin hides it from the inbox; an authorized administrator can restore it or permanently delete it from the recycle bin. The application has no automatic message-expiry process. Storage is local JSON during development and is intended to use the configured Supabase service in hosted deployments.
              </p>
              <p>
                To choose a regional pricing display, the site may request country information from ipapi.co. It stores the resulting country category in browser local storage for up to seven days and falls back to the browser locale if the request fails. This site does not currently provide an in-app cookie-preferences control.
              </p>
              <p>
                If configured by the operator, analytics scripts for Plausible and/or Google Analytics may collect page and section activity. Google Analytics may use its own cookies. Video embeds and external links can connect you to YouTube, Google Drive, Instagram, or other providers, which handle information under their own policies. Administrators who sign in receive an eight-hour HTTP-only session cookie; it is marked Secure in production and uses SameSite=Lax.
              </p>
              <p>
                Admin-only media uploads accept specified image and video formats and are stored in local uploads during development or the configured hosted media bucket. Do not submit information you do not have permission to share. For a privacy request or question, contact the operator at <a href="mailto:creativexcreations1@gmail.com" className="text-purple-200 underline underline-offset-4">creativexcreations1@gmail.com</a>. Requests for access, correction, or deletion will be reviewed under the law that applies; the website does not provide a self-service data export tool.
              </p>
            </div>
          </section>

          <section id="terms-of-use" className="scroll-mt-8 border-b border-white/10 py-8">
            <h2 className="text-2xl font-semibold">Terms of Use</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/70">
              <p>
                You may browse the website for its portfolio and service information. Do not use it to interfere with site operation, attempt unauthorized access, submit unlawful material, or infringe another person&apos;s rights.
              </p>
              <p>
                Portfolio examples, descriptions, and displayed prices are informational and may change. They are not a confirmed quote, availability promise, or complete scope of work. Confirm project details directly before relying on them.
              </p>
              <p>
                The site and third-party embeds are provided as available and may be changed or unavailable. Nothing in this notice removes consumer or other rights that cannot be limited by applicable law. The operator&apos;s governing legal entity, jurisdiction, and venue have not been supplied for this site and must be confirmed before adding a governing-law clause.
              </p>
            </div>
          </section>

          <section id="service-terms" className="scroll-mt-8 border-b border-white/10 py-8">
            <h2 className="text-2xl font-semibold">Service Terms</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/70">
              <p>
                This website does not publish a binding project contract, checkout, payment schedule, cancellation process, or fixed revision policy. Prices shown are informational; confirm a quote before work begins.
              </p>
              <p>
                For each project, the client and service provider should confirm the scope, deliverables and formats, source materials and usage permissions, timeline, revision limits, fees and payment dates, cancellation or refund arrangements, and ownership or licensing of the final work in a separate written agreement.
              </p>
              <p>
                No specific refund, warranty, completion guarantee, or governing-law term is stated here. Those details remain unresolved and should be agreed with the client and reviewed for the applicable jurisdiction before accepting paid work.
              </p>
            </div>
          </section>

          <section id="copyright-licensing" className="scroll-mt-8 py-8">
            <h2 className="text-2xl font-semibold">Copyright &amp; Licensing</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-white/70">
              <p>
                Portfolio entries may combine original creative work, client-provided footage or brand assets, and third-party materials such as music, stock footage, fonts, templates, software marks, or other licensed elements. Rights and permitted uses vary by item, asset license, and project agreement.
              </p>
              <p>
                Displaying a project does not mean that CreativeXCreations owns every element in it or grants visitors a license to reuse it. Client-provided assets remain subject to the client&apos;s rights and permissions; third-party assets remain subject to their respective licenses; trademarks and logos belong to their respective owners.
              </p>
              <p>
                Before reusing or distributing any portfolio material, identify the applicable rights holder and obtain permission or a license. Contact the operator at <a href="mailto:creativexcreations1@gmail.com" className="text-purple-200 underline underline-offset-4">creativexcreations1@gmail.com</a> with questions about a specific item.
              </p>
            </div>
          </section>
        </article>
      </main>
      <SiteFooter
        brandName={content.navbar.brandName}
        founderName={content.founder.name}
        founderRole={content.founder.role}
        founderPhotoUrl={content.founder.photoUrl}
        contactChannels={content.contact.channels}
      />
    </>
  );
}