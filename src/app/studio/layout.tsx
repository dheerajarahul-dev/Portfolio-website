// Studio Root Layout — completely separate from the portfolio layout
// Has its own shell, navigation, and styles
// No Navbar, no SiteFooter — the Studio is a standalone application

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Creative X Studio",
    template: "%s — Creative X Studio",
  },
  description: "Professional video production collaboration platform for Creative X Creations.",
  robots: { index: false, follow: false }, // Studio is not public
};

export default function StudioRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The portfolio root layout already provides html/body/fonts/globals.css.
  // This layout just provides the Studio-specific wrapper.
  return <div className="studio-root">{children}</div>;
}
