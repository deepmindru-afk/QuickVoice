import type { Metadata } from "next";

import { GuideContentSection } from "@/components/landing/GuideContentSection";
import { RelatedPages } from "@/components/landing/related-pages";
import { getUseCaseContent } from "@/lib/industries";
import {
  RemindersCollectionsHeroSection,
  RemindersCollectionsFeaturesSection,
  RemindersCollectionsBenefitsSection,
  RemindersCollectionsSecuritySection,
  RemindersCollectionsFaqSection,
} from "@/components/landing/reminders-collections";

export const metadata: Metadata = {
  title: "AI Reminders & Collections Voice Agents",
  description:
    "Automate payment reminders, appointment follow-ups, and collections with AI voice agents. Improve collection rates while maintaining customer relationships. Free trial.",
  alternates: { canonical: "https://quickvoice.co/use-cases/reminders-collections" },
  openGraph: {
    title: "AI Reminders & Collections Voice Agents | QuickVoice",
    description:
      "Automate payment reminders and collections with AI voice agents. Improve collection rates while maintaining relationships.",
    url: "https://quickvoice.co/use-cases/reminders-collections",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Reminders & Collections Voice Agents | QuickVoice",
    description:
      "Automate payment reminders and collections with AI voice agents.",
    images: ["/og-image.png"],
  },
};

export default async function RemindersCollectionsPage() {
  const guideContent = getUseCaseContent("reminders-collections");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://quickvoice.co" },
      { "@type": "ListItem", position: 2, name: "Use Cases", item: "https://quickvoice.co/use-cases" },
      { "@type": "ListItem", position: 3, name: "Reminders & Collections", item: "https://quickvoice.co/use-cases/reminders-collections" },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <RemindersCollectionsHeroSection />
      <RemindersCollectionsFeaturesSection />
      <RemindersCollectionsBenefitsSection />
      <RemindersCollectionsSecuritySection />
      <RemindersCollectionsFaqSection />
      {guideContent && <GuideContentSection content={guideContent} />}
      <RelatedPages
        title="Related Solutions"
        pages={[
          { title: "Appointment Scheduling", href: "/use-cases/appointment-scheduling", description: "Automated booking and scheduling" },
          { title: "Customer Support", href: "/use-cases/customer-support", description: "AI-powered customer support automation" },
          { title: "Financial Services", href: "/industries/financial-services", description: "AI voice agents for banking and insurance" },
          { title: "Healthcare", href: "/industries/healthcare", description: "AI voice agents for healthcare" },
        ]}
      />
    </div>
  );
}
