import type { Metadata } from "next";
import "./globals.css";
import { SvgDefs } from "@/components/SvgSprite";
import { HeaderClient, NewsletterForm, Footer } from "@/components/HeaderFooter";
import { getSiteSettings } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dpathtojannah.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "D2J Media Hub | Voice in propagation of the truth",
    template: "%s | D2J Media Hub",
  },
  description:
    "D-Path to Jannah Media Hub (D2J Media Hub) is a Muslim-centred digital news platform with a special focus on youth and campus life in Nigeria.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: "D2J Media Hub",
    type: "website",
    locale: "en_NG",
    url: SITE_URL,
    images: [
      {
        url: "/logo.webp",
        width: 1200,
        height: 630,
        alt: "D-Path to Jannah Media Hub (D2J Media Hub)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "D2J Media Hub | Voice in propagation of the truth",
    description:
      "D-Path to Jannah Media Hub (D2J Media Hub) is a Muslim-centred digital news platform with a special focus on youth and campus life in Nigeria.",
    images: ["/logo.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = getSiteSettings();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SvgDefs />
        <HeaderClient
          breakingEnabled={settings.breakingNewsEnabled}
          breakingText={settings.breakingNewsText}
          breakingUrl={settings.breakingNewsUrl}
        />
        <main id="app" tabIndex={-1}>
          {children}
        </main>
        <NewsletterForm />
        <Footer />
      </body>
    </html>
  );
}
