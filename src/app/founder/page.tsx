import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { readContent } from "@/lib/storage";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const { founder } = await readContent();
  return {
    title: `${founder.name}, Founder | CreativeXCreations`,
    description: `Meet ${founder.name}, founder of CreativeXCreations.`,
    alternates: siteUrl ? { canonical: `${siteUrl}/founder` } : undefined,
  };
}

export const dynamic = "force-dynamic";

export default async function FounderPage() {
  const content = await readContent();
  const { founder } = content;

  return (
    <>
      <header className="border-b border-white/10 bg-[#080809] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="inline-flex min-w-0 items-center gap-3 rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
            <Image src={content.navbar.logoUrl || "/logo.png"} alt="" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
            <span className="truncate font-space text-xs font-bold sm:text-sm">{content.navbar.brandName}</span>
          </Link>
          <Link href="/" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-xs text-white/75 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 sm:px-4 sm:text-sm">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>
      <main className="min-h-[70vh] bg-[#050505] px-4 py-9 text-white sm:px-6 sm:py-16">
        <article className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[minmax(260px,0.8fr)_1.2fr] md:gap-14 lg:gap-20">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[19rem] overflow-hidden rounded-2xl border border-[#303033] bg-[#101012] sm:max-w-sm md:mx-0">
            {founder.photoUrl ? (
              <Image
                src={founder.photoUrl}
                alt={`${founder.name}, ${founder.role}`}
                fill
                unoptimized
                sizes="(min-width: 768px) 320px, 80vw"
                className="object-cover"
              />
            ) : (
              <div className="relative grid h-full place-items-center overflow-hidden bg-[linear-gradient(145deg,#151518,#0d0d0f_55%,#17171a)]">
                <div aria-hidden="true" className="absolute inset-4 rounded-xl border border-white/[0.06]" />
                <div className="relative text-center">
                  <span aria-hidden="true" className="font-space text-7xl font-semibold tracking-[0.12em] text-white/25 sm:text-8xl">DA</span>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-white/45">Founder portrait</p>
                </div>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/65">CreativeXCreations</p>
            </div>
          </div>

          <div className="min-w-0 pb-2 pt-1 md:py-8">
            <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-purple-200/80 sm:text-xs">
              <span className="h-px w-6 bg-purple-300/70" aria-hidden="true" />
              The person behind the work
            </p>
            <p className="mb-2 text-xs text-white/50 sm:text-sm">{founder.role}</p>
            <h1 className="font-space text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{founder.name}</h1>
            <div className="mt-5 h-px w-16 bg-white/20" aria-hidden="true" />
            <div className="mt-5 max-w-2xl whitespace-pre-line text-sm leading-7 text-white/70 sm:mt-7 sm:text-base sm:leading-8">
              {founder.biography}
            </div>
            <Link href="/#contact" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white/85 transition-colors hover:border-white/35 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 sm:mt-9">
              Contact CreativeXCreations
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter
        brandName={content.navbar.brandName}
        founderName={founder.name}
        founderRole={founder.role}
        founderPhotoUrl={founder.photoUrl}
        contactChannels={content.contact.channels}
      />
    </>
  );
}