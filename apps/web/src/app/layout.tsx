import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import type { Metadata } from "next";
import Navbar from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { CtaAnalytics } from "@/components/cta-analytics";
const inter = Inter({ subsets: ["latin"], display: "swap" });

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL("https://quickvoice.co"),
  title: {
    default: "QuickVoice — No-Code AI Voice Agents | Deploy in 2 Minutes",
    template: "%s | QuickVoice",
  },
  description:
    "Deploy human-like AI voice agents without coding. Automate support, scheduling, and sales calls. HIPAA compliant. 100+ languages. Free trial.",
  keywords: [
    "AI voice agents",
    "no-code voice AI",
    "AI voice automation",
    "HIPAA compliant voice AI",
    "voice agent platform",
    "conversational AI",
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "QuickVoice",
    title: "QuickVoice — No-Code AI Voice Agents | Deploy in 2 Minutes",
    description:
      "Deploy human-like AI voice agents without coding. Automate support, scheduling, and sales calls. HIPAA compliant. 100+ languages. Free trial.",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "QuickVoice Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickVoice — No-Code AI Voice Agents",
    description:
      "Deploy human-like AI voice agents without coding. Automate support, scheduling, and sales calls.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Information" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}
      </head>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Navbar />
        <CtaAnalytics />
        <div id="main-content">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
