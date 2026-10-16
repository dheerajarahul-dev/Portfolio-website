import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { readContent } from "@/lib/storage";
import { defaultContent } from "@/lib/default-content";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 15;

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  let contentMetadata = defaultContent.metadata;
  try {
    contentMetadata = (await readContent()).metadata;
  } catch (error) {
    console.error(
      "Failed to load CMS metadata; using defaults:",
      error instanceof Error ? error.message : error
    );
  }
  const siteUrl = getSiteUrl();
  const ogImage = siteUrl ? `${siteUrl}/logo.png` : undefined;

  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: contentMetadata.title,
    description: contentMetadata.description,
    applicationName: "CreativeXCreations",
    creator: defaultContent.founder.name,
    publisher: "CreativeXCreations",
    keywords: [
      "CreativeXCreations",
      "Creative X Creations",
      "CreativeXCreation",
      "video editing",
      "cinematic video editing",
      "short-form video editing",
      "motion graphics",
    ],
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    alternates: siteUrl ? { canonical: `${siteUrl}/` } : undefined,
    icons: {
      icon: "/assets/logo-icon.png",
      shortcut: "/assets/logo-icon.png",
      apple: "/assets/logo-icon.png",
    },
    openGraph: {
      title: contentMetadata.title,
      description: contentMetadata.description,
      ...(siteUrl ? { url: siteUrl } : {}),
      siteName: "CreativeXCreations",
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "CreativeXCreations — Premium cinematic video editing",
        },
      ] : undefined,
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: contentMetadata.title,
      description: contentMetadata.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = getSiteUrl();
  const organizationId = siteUrl ? `${siteUrl}/#organization` : undefined;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        ...(organizationId ? { "@id": organizationId } : {}),
        name: "CreativeXCreations",
        alternateName: ["Creative X Creations", "CreativeXCreation"],
        ...(siteUrl ? { url: siteUrl, logo: `${siteUrl}/assets/logo-icon.png` } : {}),
        description: defaultContent.metadata.description,
        founder: { "@type": "Person", name: defaultContent.founder.name },
        sameAs: defaultContent.contact.channels
          .filter((channel) => channel.href.startsWith("https://"))
          .map((channel) => channel.href),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: defaultContent.contact.channels.find((channel) => channel.label === "Email")?.value,
        },
      },
      ...(siteUrl
        ? [{
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            url: siteUrl,
            name: "CreativeXCreations",
            alternateName: "Creative X Creations",
            publisher: { "@id": organizationId },
          }]
        : []),
    ],
  };

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-brand-bg text-brand-text font-inter">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c"),
          }}
        />
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
