import { Metadata } from 'next';
import {
  AboutUsHeroSection,
  AboutUsJourneySection,
  AboutUsIndustriesSection,
  AboutUsSolutionsSection,
  AboutUsRecognitionSection,
  AboutUsLeadershipSection,
  AboutUsCtaSection,
} from '@/components/landing/about-us';

export const metadata: Metadata = {
  title: 'About QuickVoice — AI Voice Agent Platform',
  description: 'QuickVoice empowers businesses to automate operations with AI voice agents. Learn about our mission, leadership team, and vision.',
  keywords: 'AI voice agents, business operations automation, voice automation, AI-powered automation, business process automation, operational efficiency, voice AI for business, automated operations, AI voice automation solutions',
  authors: [{ name: 'QuickVoice Team' }],
  creator: 'QuickVoice',
  publisher: 'QuickVoice',
  robots: 'index, follow',
  openGraph: {
    title: 'About QuickVoice — AI Voice Agent Platform',
    description: 'QuickVoice empowers businesses across industries to automate operations and boost efficiency through intelligent AI voice agents.',
    type: 'website',
    url: 'https://quickvoice.co/company/about-us',
    siteName: 'QuickVoice',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'About QuickVoice — AI Voice Agent Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About QuickVoice — AI Voice Agent Platform',
    description: 'QuickVoice empowers businesses across industries to automate operations and boost efficiency through intelligent AI voice agents.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://quickvoice.co/company/about-us',
  },
};

export default function AboutUsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "QuickVoice",
    "alternateName": "QuickVoice",
    "description": "AI-powered business operations automation provider empowering businesses with intelligent voice agents.",
    "url": "https://quickvoice.co",
    "logo": {
      "@type": "ImageObject",
      "url": "https://quickvoice.co/logo.svg"
    },
    "foundingDate": "2020",
    "founder": {
      "@type": "Person",
      "name": "Rahul Agarwal"
    },
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "minValue": 80
    },
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": "4000 Innovation Drive, 3rd Floor",
        "addressLocality": "Ottawa",
        "addressRegion": "Ontario",
        "postalCode": "K2K 3K1",
        "addressCountry": "CA"
      },
      {
        "@type": "PostalAddress",
        "streetAddress": "104 West 40th Street, Suite 1800",
        "addressLocality": "New York",
        "addressRegion": "NY",
        "postalCode": "10018",
        "addressCountry": "US"
      }
    ],
    "makesOffer": {
      "@type": "Offer",
      "itemOffered": {
        "@type": "Service",
        "name": "AI-Powered Voice Automation",
        "description": "Intelligent voice agents for business operations automation"
      }
    },
    "sameAs": [
      "https://www.linkedin.com/company/quickvoice",
      "https://twitter.com/quickvoice"
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AboutUsHeroSection />
      <AboutUsJourneySection />
      <AboutUsIndustriesSection />
      <AboutUsSolutionsSection />
      <AboutUsRecognitionSection />
      <AboutUsLeadershipSection />
      <AboutUsCtaSection />
    </div>
  );
}
