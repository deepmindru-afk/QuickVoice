import type { Metadata } from "next";
import {
  UseCasesHeroSection,
  UseCasesGridSection,
  UseCasesCtaSection,
} from "@/components/landing/usecases-main";

export const metadata: Metadata = {
  title: "AI Voice Agent Use Cases — Support, Scheduling, Sales",
  description:
    "Automate customer support, appointment scheduling, outbound sales, order tracking, collections, and HR screening with QuickVoice AI voice agents. No-code. Free trial.",
  alternates: {
    canonical: "https://quickvoice.co/use-cases",
  },
  openGraph: {
    title: "AI Voice Agent Use Cases",
    description:
      "Explore how QuickVoice AI voice agents automate support, scheduling, sales, collections, and more. HIPAA compliant. 100+ languages.",
    type: "website",
    url: "https://quickvoice.co/use-cases",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Voice Agent Use Cases",
    description:
      "Explore how QuickVoice AI voice agents automate support, scheduling, sales, collections, and more. HIPAA compliant. 100+ languages.",
    images: ["/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "AI Voice Agent Use Cases | QuickVoice",
  description:
    "Discover how QuickVoice's AI-powered voice agents automate workflows, enhance customer experiences, and drive operational efficiency across customer support, sales, scheduling, and more.",
  url: "https://quickvoice.co/use-cases",
  mainEntity: {
    "@type": "SoftwareApplication",
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
        name: "Use Cases",
        item: "https://quickvoice.co/use-cases",
      },
    ],
  },
};

export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <UseCasesHeroSection />
      <UseCasesGridSection />
      <UseCasesCtaSection />
    </div>
  );
}
