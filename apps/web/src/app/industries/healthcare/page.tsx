import type { Metadata } from "next";

import { GuideContentSection } from "@/components/landing/GuideContentSection";
import { RelatedPages } from "@/components/landing/related-pages";
import { getIndustryContent } from "@/lib/industries";
import {
  HealthcareHeroSection,
  HealthcareFeaturesSection,
  HealthcareBenefitsSection,
  HealthcareSecuritySection,
  HealthcareIntegrationsSection,
  HealthcareFaqSection,
  HealthcareCtaSection
} from "@/components/landing/healthcare";

export const metadata: Metadata = {
  title: "AI Voice Agents for Healthcare | HIPAA Compliant",
  description: "Deploy HIPAA-compliant AI voice agents for appointment scheduling, patient reminders, insurance verification, and post-discharge follow-ups. No coding required. Free trial.",
  alternates: { canonical: "https://quickvoice.co/industries/healthcare" },
  openGraph: {
    title: "AI Voice Agents for Healthcare | HIPAA Compliant",
    description: "HIPAA-compliant AI voice agents for appointment scheduling, patient reminders, and healthcare operations.",
    url: "https://quickvoice.co/industries/healthcare",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Voice Agents for Healthcare | HIPAA Compliant",
    description: "HIPAA-compliant AI voice agents for appointment scheduling, patient reminders, and healthcare operations.",
    images: ["/og-image.png"],
  },
};

export default async function HealthcarePage() {
  const guideContent = getIndustryContent("healthcare");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Transforming Healthcare Communication with QuickVoice Voice AI Agents",
    "description": "Revolutionize patient engagement with QuickVoice's cutting-edge Voice AI Agents. Automate call routing, scheduling, and patient interactions for a better healthcare experience.",
    "url": "https://quickvoice.co/industries/healthcare",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "QuickVoice",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://quickvoice.co"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Industries",
          "item": "https://quickvoice.co/industries"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Healthcare",
          "item": "https://quickvoice.co/industries/healthcare"
        }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How does QuickVoice ensure HIPAA compliance for healthcare organizations?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice is fully HIPAA compliant with comprehensive Business Associate Agreements (BAA), automatic PHI redaction from call recordings, encrypted data transmission, and complete audit logs. We maintain SOC 2 Type II certification and follow strict data handling protocols to protect patient information." } },
      { "@type": "Question", "name": "Can QuickVoice integrate with our existing EHR system like Epic or Cerner?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice offers native integrations with leading EHR systems including Epic, Cerner, athenahealth, Allscripts, NextGen, and eClinicalWorks. Our API-first approach allows seamless data synchronization for patient scheduling, appointment management, and call routing based on patient records." } },
      { "@type": "Question", "name": "How does the AI-powered call routing work for multiple clinic locations?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice uses advanced AI to route calls based on patient ZIP code, spoken location preferences, department needs, and clinic availability. The system can automatically transfer patients to the nearest available clinic, schedule appointments at the most convenient location, and handle complex multi-location routing scenarios without human intervention." } },
      { "@type": "Question", "name": "What kind of patient data security measures are in place?", "acceptedAnswer": { "@type": "Answer", "text": "We implement enterprise-grade security including end-to-end encryption, automatic PHI redaction, consent capture for all recordings, role-based access controls, and comprehensive audit trails. All data is stored in HIPAA-compliant data centers with regular security assessments and compliance monitoring." } },
      { "@type": "Question", "name": "How quickly can we implement QuickVoice in our healthcare organization?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice offers rapid deployment with our no-code configuration platform. Most healthcare organizations can be up and running within 2-4 weeks, including EHR integration, staff training, and workflow optimization. Our dedicated healthcare implementation team ensures smooth transition with minimal disruption to patient care." } },
      { "@type": "Question", "name": "Does QuickVoice support multilingual patient communication?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice supports over 100 languages and dialects, making it ideal for diverse patient populations. The AI can automatically detect patient language preferences, provide culturally appropriate responses, and ensure accurate medical terminology translation for better patient understanding and care coordination." } },
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
      <HealthcareHeroSection />
      <HealthcareFeaturesSection />
      <HealthcareBenefitsSection />
      <HealthcareSecuritySection />
      <HealthcareIntegrationsSection />
      <HealthcareFaqSection />
      <HealthcareCtaSection />
      {guideContent && <GuideContentSection content={guideContent} />}
      <RelatedPages
        title="Related Solutions & Industries"
        pages={[
          { title: "24/7 Customer Support", href: "/use-cases/customer-support", description: "AI-powered customer support that never sleeps" },
          { title: "Appointment Scheduling", href: "/use-cases/appointment-scheduling", description: "Automate booking, reminders, and rescheduling" },
          { title: "HIPAA Compliance", href: "/compliance/hipaa", description: "Enterprise-grade security for healthcare voice AI" },
          { title: "Reminders & Collections", href: "/use-cases/reminders-collections", description: "Automated patient reminders and payment follow-ups" },
          { title: "Financial Services", href: "/industries/financial-services", description: "AI voice agents for banking and insurance" },
          { title: "Education", href: "/industries/education", description: "AI voice agents for student engagement" },
        ]}
      />
    </div>
  );
}
