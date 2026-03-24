import type { Metadata } from "next";

import { GuideContentSection } from "@/components/landing/GuideContentSection";
import { RelatedPages } from "@/components/landing/related-pages";
import { getIndustryContent } from "@/lib/industries";
import {
  RealEstateHeroSection,
  RealEstateFeaturesSection,
  RealEstateBenefitsSection,
  RealEstateFaqSection,
  RealEstateCtaSection,
} from "@/components/landing/real-estate";

export const metadata: Metadata = {
  title: "AI Voice Agents for Real Estate | Lead Qualification & Follow-Ups",
  description: "Deploy AI voice agents for real estate: lead qualification, property inquiry handling, showing scheduling, and follow-up automation. No-code. Free trial.",
  alternates: { canonical: "https://quickvoice.co/industries/real-estate" },
  openGraph: {
    title: "AI Voice Agents for Real Estate",
    description: "Automate lead qualification, showing scheduling, and follow-ups for real estate with AI voice agents.",
    url: "https://quickvoice.co/industries/real-estate",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Voice Agents for Real Estate",
    description: "Automate lead qualification, showing scheduling, and follow-ups for real estate with AI voice agents.",
    images: ["/og-image.png"],
  },
};

export default async function RealEstatePage() {
  const guideContent = getIndustryContent("real-estate");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "AI-Powered Customer Support & Sales Solutions for Real Estate | QuickVoice",
    description:
      "Elevate customer support and drive business growth with QuickVoice's AI-powered solutions for real estate. Get instant answers, boost sales, and streamline operations with our cutting-edge technology.",
    url: "https://quickvoice.co/industries/real-estate",
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
        {
          "@type": "ListItem",
          position: 3,
          name: "Real Estate",
          item: "https://quickvoice.co/industries/real-estate",
        },
      ],
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How does QuickVoice integrate with MLS systems and real estate CRMs?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice offers seamless integration with leading MLS systems, real estate CRMs, and property management software. Our API-first approach allows real-time data synchronization for listings, customer information, appointment scheduling, and lead management, ensuring all your systems work together seamlessly." } },
      { "@type": "Question", "name": "Can QuickVoice handle complex real estate inquiries and property-specific questions?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice uses advanced AI trained specifically on real estate terminology and processes. The system can handle complex inquiries about property details, pricing, neighborhood information, financing options, and transaction processes, providing accurate and helpful responses to potential buyers and sellers." } },
      { "@type": "Question", "name": "How does the AI-powered lead qualification work for real estate leads?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice's AI automatically qualifies leads by analyzing budget, location preferences, timeline, financing status, and property requirements. The system can instantly respond to leads, schedule property tours, and route qualified prospects to the appropriate agents, significantly improving conversion rates and reducing response time." } },
      { "@type": "Question", "name": "Is QuickVoice compliant with real estate regulations and TCPA requirements?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. QuickVoice is fully TCPA compliant with built-in consent capture, DNC list management, and proper call recording notifications. We also ensure compliance with real estate regulations including fair housing laws, disclosure requirements, and state-specific real estate practices." } },
      { "@type": "Question", "name": "How quickly can we implement QuickVoice in our real estate agency?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice offers rapid deployment with our no-code platform. Most real estate agencies can be up and running within 1-2 weeks, including MLS integration, CRM setup, staff training, and workflow optimization. Our dedicated real estate implementation team ensures smooth transition with minimal disruption to daily operations." } },
      { "@type": "Question", "name": "Does QuickVoice support multilingual communication for diverse real estate markets?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice supports over 100 languages and dialects, making it ideal for diverse real estate markets. The AI can automatically detect customer language preferences, provide culturally appropriate responses, and ensure accurate translation of complex real estate terminology for better customer understanding and service delivery." } },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <RealEstateHeroSection />
      <RealEstateFeaturesSection />
      <RealEstateBenefitsSection />
      <RealEstateFaqSection />
      <RealEstateCtaSection />
      {guideContent && <GuideContentSection content={guideContent} />}
      <RelatedPages
        title="Related Solutions & Industries"
        pages={[
          { title: "Sales & Lead Generation", href: "/use-cases/sales-lead-gen", description: "AI-powered lead qualification and follow-ups" },
          { title: "Appointment Scheduling", href: "/use-cases/appointment-scheduling", description: "Automate property showing and meeting scheduling" },
          { title: "24/7 Customer Support", href: "/use-cases/customer-support", description: "AI-powered customer support that never sleeps" },
          { title: "Reminders & Collections", href: "/use-cases/reminders-collections", description: "Automated rent reminders and payment follow-ups" },
          { title: "Automotive", href: "/industries/automotive", description: "AI voice agents for automotive dealerships" },
          { title: "Financial Services", href: "/industries/financial-services", description: "AI voice agents for banking and insurance" },
        ]}
      />
    </div>
  );
}
