import type { Metadata } from "next";
import {
  IndustriesHeroSection,
  IndustriesGridSection,
  IndustriesCtaSection,
} from "@/components/landing/industries-main";

export const metadata: Metadata = {
  title: "AI Voice Agent Solutions by Industry",
  description:
    "QuickVoice AI voice agents serve healthcare, real estate, finance, e-commerce, logistics, and 10+ more industries. No-code deployment. HIPAA compliant. Free trial.",
  alternates: {
    canonical: "https://quickvoice.co/industries",
  },
  openGraph: {
    title: "AI Voice Agent Solutions by Industry",
    description:
      "Discover AI voice agent solutions tailored to your industry. HIPAA compliant. 100+ languages. Deploy in 2 minutes.",
    type: "website",
    url: "https://quickvoice.co/industries",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Voice Agent Solutions by Industry",
    description:
      "Discover AI voice agent solutions tailored to your industry. HIPAA compliant. 100+ languages. Deploy in 2 minutes.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AI Voice Agent Solutions by Industry | QuickVoice",
  description:
    "Discover how QuickVoice's AI-powered voice agents transform customer interactions, streamline operations, and drive growth across diverse industries including healthcare, e-commerce, financial services, and more.",
  url: "https://quickvoice.co/industries",
  mainEntity: {
    "@type": "WebApplication",
    name: "QuickVoice",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://quickvoice.co",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Industries",
        item: "https://quickvoice.co/industries",
      },
    ],
  },
};

export default function IndustriesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <IndustriesHeroSection />
      <IndustriesGridSection />
      <IndustriesCtaSection />
    </div>
  );
}
