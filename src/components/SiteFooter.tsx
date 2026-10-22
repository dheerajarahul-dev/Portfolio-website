import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { InstagramMark, YouTubeMark } from "@/components/ui/SocialMarks";

export default function SiteFooter({
  brandName,
  founderName,
  founderRole,
  founderPhotoUrl,
  contactChannels,
}: {
  brandName: string;
  founderName: string;
  founderRole: string;
  founderPhotoUrl: string;
  contactChannels: { label: string; value: string; href: string }[];
}) {
  const founderInitials = founderName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const displayBrandName = brandName.replace(/\s*x\s*/i, " X ").replace(/\s+/g, " ").trim().toUpperCase();
  return (
    <footer className="mx-3 my-3 overflow-hidden rounded-[20px] border border-[#29292d] bg-[#0b0c0f] text-white sm:mx-5 sm:my-5">
      <div className="mx-auto grid max-w-[88rem] gap-7 px-5 py-7 sm:px-8 sm:py-9 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(270px,1.1fr)] lg:gap-0 lg:px-7 lg:py-10">
        <section aria-label="Creative X Creations" className="space-y-5 lg:border-r lg:border-[#303034] lg:pr-8">
          <Link href="/" className="group inline-flex min-w-0 items-center gap-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
            <span className="grid h-[56px] w-[56px] shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-[0_0_20px_rgba(124,58,237,0.15)] transition duration-300 group-hover:border-purple-400/40 group-hover:bg-purple-500/10 sm:h-[64px] sm:w-[64px] sm:p-2.5">
              <Image src="/assets/logo-icon.png" alt="" width={48} height={48} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
            </span>
            <span className="min-w-0">
              <span className="inline-flex items-center whitespace-nowrap font-space text-base font-bold text-white transition-colors duration-300 group-hover:text-purple-200 sm:text-lg">
                <span className="shrink-0">CREATIVE</span>
                <span className="brand-x-bulb mx-1.5 shrink-0 select-none">X</span>
                <span className="shrink-0">CREATIONS</span>
              </span>
              <span className="mt-1 block text-xs leading-5 text-white/60 sm:text-sm">Editing with purpose. Stories with impact.</span>
            </span>
          </Link>
          <p className="max-w-md text-sm leading-6 text-white/65">
            Video editing, motion design and visual storytelling for brands, creators and businesses.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-5 border-t border-[#303034] pt-5 md:border-t-0 md:pt-0 lg:border-r lg:border-[#303034] lg:px-8">
          <nav aria-label="Explore">
            <h2 className="mb-3 text-sm font-semibold text-white">Explore</h2>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li><Link href="/#work" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">Portfolio</Link></li>
              <li><Link href="/library" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">Creative Library</Link></li>
              <li><Link href="/#pricing" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">Services</Link></li>
              <li><Link href="/#about" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">About</Link></li>
              <li><Link href="/#contact" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">Contact</Link></li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h2 className="mb-3 text-sm font-semibold text-white">Legal</h2>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li><Link href="/legal#privacy-policy" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">Privacy Policy</Link></li>
              <li><Link href="/legal#terms-of-use" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">Terms of Use</Link></li>
              <li><Link href="/legal#service-terms" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">Service Terms</Link></li>
              <li><Link href="/legal#copyright-licensing" className="transition-colors hover:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4">Copyright &amp; Licensing</Link></li>
            </ul>
          </nav>
        </div>

        <Link
          href="/founder"
          aria-label={`Meet ${founderName}, ${founderRole}`}
          className="group flex min-h-[112px] items-center gap-3 rounded-2xl border border-[#29292d] p-4 transition-colors hover:border-[#49494f] hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:ml-8 lg:p-4"
        >
          <span className="relative grid h-[76px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-full border border-white/20 bg-[#141417] font-space text-lg font-semibold text-white/70 sm:h-[84px] sm:w-[84px]">
            {founderPhotoUrl ? (
              <Image src={founderPhotoUrl} alt="" fill unoptimized sizes="84px" className="object-cover" />
            ) : (
              <span aria-hidden="true">{founderInitials || "DA"}</span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white sm:text-base">{founderName}</span>
            <span className="mt-1 block truncate text-xs text-white/60 sm:text-sm">{founderRole}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white/85 group-hover:text-white">
              Meet the Founder
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </span>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="border-t border-[#29292d] px-5 py-5 sm:px-8 md:flex md:items-center md:justify-between md:gap-8 lg:px-7">
        <div className="space-y-1.5 text-sm leading-6 text-white/60">
          <p>© {new Date().getFullYear()} {displayBrandName}. All rights reserved.</p>
          <p className="max-w-3xl text-xs leading-5 text-white/45">
            Portfolio work may include client-provided and third-party material. Trademarks, logos and other third-party materials remain the property of their respective owners.
          </p>
        </div>
        <nav aria-label="Social and contact links" className="mt-4 flex items-center gap-2 border-t border-[#303034] pt-3 md:mt-0 md:shrink-0 md:border-l md:border-t-0 md:pl-6 md:pt-0">
          {contactChannels.map((channel) => {
            const Icon = channel.label === "Instagram"
              ? <InstagramMark className="h-5 w-5" />
              : channel.label === "YouTube"
                ? <YouTubeMark className="h-5 w-5" monochrome />
                : channel.label === "Email"
                  ? <Mail className="h-5 w-5" aria-hidden="true" />
                  : null;
            if (!Icon) return null;
            return (
              <a
                key={channel.label}
                href={channel.href}
                target={channel.href.startsWith("https:") ? "_blank" : undefined}
                rel={channel.href.startsWith("https:") ? "noopener noreferrer" : undefined}
                aria-label={`${channel.label}: ${channel.value}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
              >
                {Icon}
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}