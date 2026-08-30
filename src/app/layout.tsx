import type { Metadata } from "next";
import Link from "next/link";
import { Big_Shoulders_Stencil, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Big_Shoulders_Stencil({
  variable: "--display-font",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const bodyFont = IBM_Plex_Sans({
  variable: "--body-font",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--mono-font",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Media Manager",
  description: "Catalog of physical event-media folder locations",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full ${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
    >
      <body className="min-h-full flex flex-col text-ink bg-paper font-sans antialiased max-w-[100vw] overflow-x-hidden">
        <nav className="bg-ink border-b-[3px] border-accent px-5 py-3.5">
          <Link
            href="/events"
            className="inline-flex items-baseline gap-2.5 font-display font-bold text-2xl tracking-wide uppercase text-paper"
          >
            Media Manager
            <span className="font-mono text-[0.62rem] font-medium tracking-[0.16em] uppercase text-accent">
              Storage Ledger
            </span>
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
