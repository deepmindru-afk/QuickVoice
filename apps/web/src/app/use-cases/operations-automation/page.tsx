import type { Metadata } from "next";

import { GuideContentSection } from "@/components/landing/GuideContentSection";
import { RelatedPages } from "@/components/landing/related-pages";
import { getUseCaseContent } from "@/lib/industries";
import {
  OperationsAutomationHeroSection,
  OperationsAutomationImpactSection,
  OperationsAutomationWorkflowSection,
  OperationsAutomationBenefitsSection,
  OperationsAutomationExperienceSection,
  OperationsAutomationTrustedSection,
  OperationsAutomationWhySection,
  OperationsAutomationIndustriesSection,
  OperationsAutomationFaqSection,
  OperationsAutomationCtaSection,
} from "@/components/landing/operations-automation";

export const metadata: Metadata = {
  title: "AI Operations Automation Voice Agents",
  description:
    "Streamline business operations with AI voice agents. Automate workflows, reduce manual tasks, and boost efficiency across your organization. Free trial.",
  alternates: { canonical: "https://quickvoice.co/use-cases/operations-automation" },
  openGraph: {
    title: "AI Operations Automation Voice Agents | QuickVoice",
    description:
      "Streamline business operations with AI voice agents. Automate workflows and boost efficiency.",
    url: "https://quickvoice.co/use-cases/operations-automation",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Operations Automation Voice Agents | QuickVoice",
    description:
      "Streamline business operations with AI voice agents.",
    images: ["/og-image.png"],
  },
};

export default async function OperationsAutomationPage() {
  const guideContent = getUseCaseContent("operations-automation");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://quickvoice.co" },
      { "@type": "ListItem", position: 2, name: "Use Cases", item: "https://quickvoice.co/use-cases" },
      { "@type": "ListItem", position: 3, name: "Operations Automation", item: "https://quickvoice.co/use-cases/operations-automation" },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <OperationsAutomationHeroSection />
      <OperationsAutomationImpactSection />
      <OperationsAutomationWorkflowSection />
      <OperationsAutomationBenefitsSection />
      <OperationsAutomationExperienceSection />
      <OperationsAutomationTrustedSection />
      <OperationsAutomationWhySection />
      <OperationsAutomationIndustriesSection />
      <OperationsAutomationFaqSection />
      <OperationsAutomationCtaSection />
      {guideContent && <GuideContentSection content={guideContent} />}
      <RelatedPages
        title="Related Solutions"
        pages={[
          { title: "Customer Support", href: "/use-cases/customer-support", description: "AI-powered customer support automation" },
          { title: "Order Status & Returns", href: "/use-cases/order-status-returns", description: "Automated order tracking and returns" },
          { title: "Manufacturing", href: "/industries/manufacturing-engineering", description: "AI voice agents for manufacturing" },
          { title: "Logistics", href: "/industries/logistics", description: "AI voice agents for logistics" },
        ]}
      />
    </div>
  );
}
