import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { readContent } from "@/lib/storage";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const content = await readContent();
  const ogImage = `${siteUrl}/logo.png`;

  return {
    title: content.metadata.title,
    description: content.metadata.description,
    icons: {
      icon: "/logo.png",
      apple: "/logo.png",
      shortcut: "/logo.png",
    },
    openGraph: {
      title: content.metadata.title,
      description: content.metadata.description,
      url: siteUrl,
      siteName: "CreativeXCreations",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "CreativeXCreations — Premium cinematic video editing",
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.metadata.title,
      description: content.metadata.description,
      images: [ogImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-brand-bg text-brand-text font-inter selection:bg-brand-accent/30 selection:text-white">
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
