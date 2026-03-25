import type { Metadata } from "next";

import { GuideContentSection } from "@/components/landing/GuideContentSection";
import { RelatedPages } from "@/components/landing/related-pages";
import { getIndustryContent } from "@/lib/industries";
import {
  ManufacturingHeroSection,
  ManufacturingFeaturesSection,
  ManufacturingBenefitsSection,
  ManufacturingFaqSection,
  ManufacturingCtaSection,
} from "@/components/landing/manufacturing-engineering";

export const metadata: Metadata = {
  title: "Unlock Manufacturing Efficiency with QuickVoice AI Voice Agents",
  description: "Discover how QuickVoice's AI-powered voice agents can revolutionize manufacturing operations. Boost productivity and customer satisfaction. Learn more.",
  keywords: "Manufacturing Efficiency, AI Voice Agents, Manufacturing Operations, Productivity, Customer Satisfaction, Operations Optimization, AI-powered voice assistants in manufacturing, manufacturing process automation, voice-activated manufacturing operations",
  openGraph: {
    title: "Unlock Manufacturing Efficiency with QuickVoice AI Voice Agents",
    description: "Discover how QuickVoice's AI-powered voice agents can revolutionize manufacturing operations. Boost productivity and customer satisfaction. Learn more.",
    url: "https://quickvoice.co/industries/manufacturing-engineering",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Manufacturing AI Dashboard showing production metrics and AI-powered operations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Unlock Manufacturing Efficiency with QuickVoice AI Voice Agents",
    description: "Discover how QuickVoice's AI-powered voice agents can revolutionize manufacturing operations. Boost productivity and customer satisfaction. Learn more.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://quickvoice.co/industries/manufacturing-engineering",
  },
};

export default async function ManufacturingEngineeringPage() {
  const guideContent = getIndustryContent("manufacturing-engineering");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Unlock Manufacturing Efficiency with QuickVoice AI Voice Agents",
    description:
      "Discover how QuickVoice's AI-powered voice agents can revolutionize manufacturing operations. Boost productivity, enhance customer satisfaction, and reduce costs with our cutting-edge technology.",
    url: "https://quickvoice.co/industries/manufacturing-engineering",
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
      featureList: [
        "AI-powered voice agents",
        "ERP/MES integration",
        "24/7 customer support",
        "Real-time analytics",
        "Multi-language support",
        "Compliance management"
      ]
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
          name: "Manufacturing & Engineering",
          item: "https://quickvoice.co/industries/manufacturing-engineering",
        },
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "QuickVoice",
      logo: {
        "@type": "ImageObject",
        url: "https://quickvoice.co/logo.svg"
      }
    },
    about: [
      {
        "@type": "Thing",
        name: "Manufacturing Automation"
      },
      {
        "@type": "Thing",
        name: "AI Voice Technology"
      },
      {
        "@type": "Thing",
        name: "Industrial Operations"
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How does QuickVoice integrate with existing ERP and MES systems in manufacturing environments?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice offers seamless integration with leading ERP systems (SAP, Oracle, Microsoft Dynamics) and MES platforms through our robust API framework. Our AI agents can access real-time production data, inventory levels, work orders, and quality metrics to provide accurate responses and automate workflows. The integration typically takes 2-4 weeks and includes data synchronization, workflow mapping, and staff training." } },
      { "@type": "Question", "name": "Can AI voice agents handle complex technical inquiries about manufacturing processes and equipment?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice's AI is specifically trained on manufacturing terminology, processes, and technical documentation. Our agents can handle inquiries about equipment specifications, troubleshooting procedures, maintenance schedules, quality standards, and safety protocols. The system continuously learns from your technical documentation, SOPs, and expert knowledge to provide increasingly accurate responses." } },
      { "@type": "Question", "name": "How does QuickVoice ensure compliance with manufacturing industry regulations and quality standards?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice is designed with compliance at its core, supporting ISO 9001, ISO 14001, FDA regulations, and other industry-specific standards. Our system maintains detailed audit trails, ensures data integrity, and can automatically generate compliance reports. All interactions are logged and can be reviewed for quality assurance, regulatory audits, and continuous improvement initiatives." } },
      { "@type": "Question", "name": "What security measures are in place to protect sensitive manufacturing data and intellectual property?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice employs enterprise-grade security including end-to-end encryption, role-based access controls, and compliance with SOC 2 Type II, ISO 27001, and GDPR standards. All data is processed in secure, isolated environments with regular security audits. We offer on-premises deployment options for organizations with strict data sovereignty requirements." } },
      { "@type": "Question", "name": "How quickly can QuickVoice be deployed across multiple manufacturing facilities and production lines?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice supports rapid, scalable deployment across multiple facilities. Our cloud-native architecture allows for quick provisioning of new instances, while our configuration management tools enable consistent setup across locations. Typically, a single facility can be operational within 1-2 weeks, with additional facilities added incrementally based on your rollout timeline and change management requirements." } },
      { "@type": "Question", "name": "Can QuickVoice handle multilingual support for global manufacturing operations with diverse workforces?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. QuickVoice supports over 100 languages and dialects, making it ideal for global manufacturing operations. The AI can automatically detect worker language preferences, provide culturally appropriate responses, and ensure accurate translation of technical terms and safety instructions. This capability is essential for multinational manufacturers with diverse teams and global supply chains." } },
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
      <ManufacturingHeroSection />
      <ManufacturingFeaturesSection />
      <ManufacturingBenefitsSection />
      <ManufacturingFaqSection />
      <ManufacturingCtaSection />
      {guideContent && <GuideContentSection content={guideContent} />}
      <RelatedPages
        title="Related Solutions & Industries"
        pages={[
          { title: "Operations Automation", href: "/use-cases/operations-automation", description: "Streamline manufacturing workflows and processes" },
          { title: "Customer Support", href: "/use-cases/customer-support", description: "AI-powered support for technical inquiries" },
          { title: "Logistics", href: "/industries/logistics", description: "AI voice agents for supply chain and delivery" },
          { title: "Automotive", href: "/industries/automotive", description: "AI voice agents for automotive operations" },
        ]}
      />
    </div>
  );
}
