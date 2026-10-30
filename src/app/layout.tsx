import type { Metadata } from "next";
import "./globals.css";
import { SvgDefs } from "@/components/SvgSprite";
import { HeaderClient, NewsletterForm, Footer } from "@/components/HeaderFooter";
import { getSiteSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: {
    default: "D2J Media Hub | Voice in propagation of the truth",
    template: "%s | D2J Media Hub",
  },
  description:
    "D-Path to Jannah Media Hub (D2J Media Hub) is a Muslim-centred digital news platform with a special focus on youth and campus life in Nigeria.",
  openGraph: {
    siteName: "D2J Media Hub",
    type: "website",
    locale: "en_NG",
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
