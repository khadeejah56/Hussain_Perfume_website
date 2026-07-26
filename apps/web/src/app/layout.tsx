import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PageTransition } from "@/components/motion/page-transition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hussain Perfumes — Luxury Fragrances",
    template: "%s | Hussain Perfumes",
  },
  description:
    "Luxury fragrances crafted with rare oud, amber, and floral notes. Discover a scent that stays with you.",
  keywords: ["perfume", "fragrance", "oud", "luxury perfume", "Hussain Perfumes", "eau de parfum"],
  openGraph: {
    type: "website",
    siteName: "Hussain Perfumes",
    title: "Hussain Perfumes — Luxury Fragrances",
    description: "Luxury fragrances crafted with rare oud, amber, and floral notes.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Hussain Perfumes — Luxury Fragrances",
    description: "Luxury fragrances crafted with rare oud, amber, and floral notes.",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
