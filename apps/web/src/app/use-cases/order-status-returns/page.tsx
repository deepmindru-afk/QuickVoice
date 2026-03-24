import type { Metadata } from "next";

import { GuideContentSection } from "@/components/landing/GuideContentSection";
import { RelatedPages } from "@/components/landing/related-pages";
import { getUseCaseContent } from "@/lib/industries";
import {
  OrderStatusReturnsHeroSection,
  OrderStatusReturnsFeaturesSection,
  OrderStatusReturnsBenefitsSection,
  OrderStatusReturnsIndustriesSection,
  OrderStatusReturnsSecuritySection,
  OrderStatusReturnsFaqSection,
} from "@/components/landing/order-status-returns";

export const metadata: Metadata = {
  title: "AI Order Status & Returns Voice Agents",
  description:
    "Automate order tracking, status updates, and return processing with AI voice agents. Reduce support tickets and improve customer experience. Free trial.",
  alternates: { canonical: "https://quickvoice.co/use-cases/order-status-returns" },
  openGraph: {
    title: "AI Order Status & Returns Voice Agents | QuickVoice",
    description:
      "Automate order tracking and return processing with AI voice agents. Reduce support tickets.",
    url: "https://quickvoice.co/use-cases/order-status-returns",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Order Status & Returns Voice Agents | QuickVoice",
    description:
      "Automate order tracking and return processing with AI voice agents.",
    images: ["/og-image.png"],
  },
};

export default async function OrderStatusReturnsPage() {
  const guideContent = getUseCaseContent("order-status-returns");

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://quickvoice.co" },
      { "@type": "ListItem", position: 2, name: "Use Cases", item: "https://quickvoice.co/use-cases" },
      { "@type": "ListItem", position: 3, name: "Order Status & Returns", item: "https://quickvoice.co/use-cases/order-status-returns" },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <OrderStatusReturnsHeroSection />
      <OrderStatusReturnsFeaturesSection />
      <OrderStatusReturnsBenefitsSection />
      <OrderStatusReturnsIndustriesSection />
      <OrderStatusReturnsSecuritySection />
      <OrderStatusReturnsFaqSection />
      {guideContent && <GuideContentSection content={guideContent} />}
      <RelatedPages
        title="Related Solutions"
        pages={[
          { title: "Customer Support", href: "/use-cases/customer-support", description: "AI-powered customer support automation" },
          { title: "Operations Automation", href: "/use-cases/operations-automation", description: "Streamline business operations with AI" },
          { title: "E-Commerce", href: "/industries/e-commerce", description: "AI voice agents for online retail" },
          { title: "Logistics", href: "/industries/logistics", description: "AI voice agents for logistics" },
        ]}
      />
    </div>
  );
}
