import type { Metadata } from "next";

import { GuideContentSection } from "@/components/landing/GuideContentSection";
import { RelatedPages } from "@/components/landing/related-pages";
import { getIndustryContent } from "@/lib/industries";
import {
  FinancialServicesHeroSection,
  FinancialServicesFeaturesSection,
  FinancialServicesBenefitsSection,
  FinancialServicesSecuritySection,
  FinancialServicesFaqSection,
  FinancialServicesCtaSection,
} from "@/components/landing/financial-services";

export const metadata: Metadata = {
  title: "AI Voice Agents for Financial Services | Compliant & Secure",
  description: "Deploy compliant AI voice agents for financial services: KYC verification, payment reminders, loan follow-ups, and customer support. SOC 2, PCI DSS. Free trial.",
  alternates: { canonical: "https://quickvoice.co/industries/financial-services" },
  openGraph: {
    title: "AI Voice Agents for Financial Services",
    description: "Compliant AI voice agents for financial services — KYC, payment reminders, loan follow-ups.",
    url: "https://quickvoice.co/industries/financial-services",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Voice Agents for Financial Services",
    description: "Compliant AI voice agents for financial services — KYC, payment reminders, loan follow-ups.",
    images: ["/og-image.png"],
  },
};

export default async function FinancialServicesPage() {
  const guideContent = getIndustryContent("financial-services");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Conversational Banking Solutions | QuickVoice AI Voice Agents",
    description:
      "Elevate banking interactions with QuickVoice's AI-powered conversational solutions. Automate customer inquiries, provide 24/7 support, and drive customer satisfaction.",
    url: "https://quickvoice.co/industries/financial-services",
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
          name: "Financial Services",
          item: "https://quickvoice.co/industries/financial-services",
        },
      ],
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How does QuickVoice ensure PCI DSS compliance for financial services?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice is fully PCI DSS Level 1 compliant with comprehensive security controls, encrypted data transmission, secure payment processing, and complete audit trails. We maintain SOC 2 Type II certification and follow strict data handling protocols to protect sensitive financial information and customer data." } },
      { "@type": "Question", "name": "Can QuickVoice integrate with our existing core banking systems and CRM?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice offers native integrations with leading core banking systems, LOS/LMS platforms, and CRM systems. Our API-first approach allows seamless data synchronization for customer profiles, transaction history, account information, and real-time updates across all your existing financial technology stack." } },
      { "@type": "Question", "name": "How does the AI handle complex financial queries and regulatory compliance?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice uses advanced AI with financial domain expertise to handle complex queries about accounts, transactions, loans, and investments. The system is trained on regulatory requirements and can provide compliant responses while maintaining audit trails for all customer interactions and ensuring adherence to financial regulations." } },
      { "@type": "Question", "name": "What security measures are in place for handling sensitive financial data?", "acceptedAnswer": { "@type": "Answer", "text": "We implement enterprise-grade security including end-to-end encryption, secure authentication, fraud detection, real-time monitoring, and comprehensive audit logs. All data is stored in PCI DSS compliant data centers with regular security assessments, penetration testing, and compliance monitoring to protect sensitive financial information." } },
      { "@type": "Question", "name": "How quickly can we implement QuickVoice in our financial institution?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice offers rapid deployment with our no-code configuration platform. Most financial institutions can be up and running within 2-4 weeks, including core system integration, compliance setup, staff training, and workflow optimization. Our dedicated financial services implementation team ensures smooth transition with minimal disruption to operations." } },
      { "@type": "Question", "name": "Does QuickVoice support multilingual customer service for diverse banking customers?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice supports over 100 languages and dialects, making it ideal for diverse customer bases. The AI can automatically detect customer language preferences, provide culturally appropriate financial guidance, and ensure accurate translation of complex banking terminology for better customer understanding and service delivery." } },
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
      <FinancialServicesHeroSection />
      <FinancialServicesFeaturesSection />
      <FinancialServicesBenefitsSection />
      <FinancialServicesSecuritySection />
      <FinancialServicesFaqSection />
      <FinancialServicesCtaSection />
      {guideContent && <GuideContentSection content={guideContent} />}
      <RelatedPages
        title="Related Solutions & Industries"
        pages={[
          { title: "Customer Support", href: "/use-cases/customer-support", description: "AI-powered support for banking and insurance customers" },
          { title: "Reminders & Collections", href: "/use-cases/reminders-collections", description: "Automated payment reminders and collections outreach" },
          { title: "HIPAA Compliance", href: "/compliance/hipaa", description: "Enterprise-grade security and compliance standards" },
          { title: "Healthcare", href: "/industries/healthcare", description: "AI voice agents for healthcare organizations" },
          { title: "SaaS", href: "/industries/saas", description: "AI voice agents for software companies" },
        ]}
      />
    </div>
  );
}
