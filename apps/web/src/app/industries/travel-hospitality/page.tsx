import type { Metadata } from "next";

import { GuideContentSection } from "@/components/landing/GuideContentSection";
import { RelatedPages } from "@/components/landing/related-pages";
import { getIndustryContent } from "@/lib/industries";
import {
  TravelHospitalityHeroSection,
  TravelHospitalityFeaturesSection,
  TravelHospitalitySupportSection,
  TravelHospitalitySalesSection,
  TravelHospitalityOperationsSection,
  TravelHospitalityWhySection,
  TravelHospitalityFaqSection,
  TravelHospitalityCtaSection
} from "@/components/landing/travel-hospitality";

export const metadata: Metadata = {
  title: "AI Voice Agents for Travel & Hospitality",
  description: "Enhance guest support and bookings with QuickVoice AI voice agents for travel and hospitality. 24/7 multilingual support. Free trial.",
  keywords: "conversational AI, travel, hospitality, customer support, sales, lead generation, AI-powered customer support for travel industry, hospitality chatbot solutions, chatbot technology, customer experience, travel industry trends, hospitality management software, travel AI automation, hospitality voice agents, multilingual travel support, travel booking automation, hospitality customer service AI",
  openGraph: {
    title: "Conversational AI for Travel and Hospitality Support",
    description: "Transform your travel and hospitality business with AI-powered customer support, sales automation, and operational efficiency.",
    type: "website",
    url: "https://quickvoice.co/industries/travel-hospitality",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QuickVoice Travel and Hospitality AI Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conversational AI for Travel and Hospitality Support",
    description: "Transform your travel and hospitality business with AI-powered customer support, sales automation, and operational efficiency.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://quickvoice.co/industries/travel-hospitality",
  },
};

export default async function TravelHospitalityPage() {
  const guideContent = getIndustryContent("travel-hospitality");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Conversational AI for Travel and Hospitality Support",
    "description": "Enhance customer support and sales with QuickVoice's conversational AI solutions for travel and hospitality. 24/7 multilingual support, omnichannel experience, and actionable analytics.",
    "url": "https://quickvoice.co/industries/travel-hospitality",
    "mainEntity": {
      "@type": "WebApplication",
      "name": "QuickVoice AI for Travel and Hospitality",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0.20",
        "priceCurrency": "USD",
        "description": "Starting at 20 cents per minute"
      },
      "featureList": [
        "80+ Languages Supported",
        "24/7 Customer Support",
        "Omnichannel Experience",
        "Actionable Analytics",
        "Appointment Scheduling",
        "Lead Generation",
        "Fraud Prevention"
      ]
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
          "name": "Travel & Hospitality",
          "item": "https://quickvoice.co/industries/travel-hospitality"
        }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "How can AI voice agents assist guests with booking hotels, flights, or experiences?", "acceptedAnswer": { "@type": "Answer", "text": "AI voice agents can handle reservations 24/7, helping guests search, compare, and book hotels, flights, or tours without waiting for human staff." } },
      { "@type": "Question", "name": "What types of guest support queries can AI voice agents handle in the travel & hospitality industry?", "acceptedAnswer": { "@type": "Answer", "text": "They can answer FAQs like check-in/out times, baggage policies, refund requests, itinerary updates, and even local recommendations." } },
      { "@type": "Question", "name": "How do AI voice agents integrate with existing booking engines, CRMs, or property management systems?", "acceptedAnswer": { "@type": "Answer", "text": "Most AI voice agents offer APIs or connectors that sync directly with popular platforms, ensuring real-time updates on availability, pricing, and reservations." } },
      { "@type": "Question", "name": "Can AI voice agents help with upselling and cross-selling travel packages, room upgrades, or add-on services?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, they can suggest room upgrades, meal plans, car rentals, insurance, or special experiences at the right stage of the booking journey." } },
      { "@type": "Question", "name": "How do AI voice agents handle multilingual support for international guests?", "acceptedAnswer": { "@type": "Answer", "text": "They are equipped with multilingual capabilities, allowing seamless communication in multiple languages to serve global guests effectively." } },
      { "@type": "Question", "name": "What kind of analytics and insights do AI voice agents provide to improve guest experience and operational efficiency?", "acceptedAnswer": { "@type": "Answer", "text": "They track call volumes, booking trends, FAQs, and customer sentiment, helping businesses identify gaps and optimize guest experiences." } },
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
      <TravelHospitalityHeroSection />
      <TravelHospitalityFeaturesSection />
      <TravelHospitalitySupportSection />
      <TravelHospitalitySalesSection />
      <TravelHospitalityOperationsSection />
      <TravelHospitalityWhySection />
      <TravelHospitalityFaqSection />
      <TravelHospitalityCtaSection />
      {guideContent && <GuideContentSection content={guideContent} />}
      <RelatedPages
        title="Related Solutions & Industries"
        pages={[
          { title: "Appointment Scheduling", href: "/use-cases/appointment-scheduling", description: "Automate booking and reservation scheduling" },
          { title: "Customer Support", href: "/use-cases/customer-support", description: "AI-powered support for guests and travelers" },
          { title: "24/7 Customer Support", href: "/use-cases/customer-support", description: "AI-powered customer support that never sleeps" },
          { title: "Sales & Lead Generation", href: "/use-cases/sales-lead-gen", description: "AI-powered upselling and package promotion" },
          { title: "Real Estate", href: "/industries/real-estate", description: "AI voice agents for property management" },
        ]}
      />
    </div>
  );
}
