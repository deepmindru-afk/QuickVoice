import dynamic from "next/dynamic";

// Above-fold: server-rendered immediately (SSR)
import { HeroSection } from "@/components/landing/hero-section";

// Below-fold: lazy-loaded to reduce initial JS parse
const FeaturesSection = dynamic(() =>
  import("@/components/landing/features-section").then((m) => ({ default: m.FeaturesSection }))
);
const AboutSection = dynamic(() =>
  import("@/components/landing/about-section").then((m) => ({ default: m.AboutSection }))
);
const TestimonialsSection = dynamic(() =>
  import("@/components/landing/testimonials-section").then((m) => ({ default: m.TestimonialsSection }))
);
const CtaSection = dynamic(() =>
  import("@/components/landing/cta-section").then((m) => ({ default: m.CtaSection }))
);
const FaqSection = dynamic(() =>
  import("@/components/landing/faq-section").then((m) => ({ default: m.FaqSection }))
);
const ContactSection = dynamic(() =>
  import("@/components/landing/contact-section").then((m) => ({ default: m.ContactSection }))
);


const homepageSchema = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://quickvoice.co/#website",
    "name": "QuickVoice",
    "url": "https://quickvoice.co",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://quickvoice.co/blog?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://quickvoice.co/#organization",
    "name": "QuickVoice",
    "alternateName": ["QuickVoice AI", "QuickVoice.co", "QuickVoice AI Voice Agent Platform"],
    "url": "https://quickvoice.co",
    "logo": {
      "@type": "ImageObject",
      "url": "https://quickvoice.co/logo.svg",
      "width": 512,
      "height": 512,
    },
    "description":
      "No-code AI voice agent platform for creating, managing, and automating business voice communications at scale.",
    "foundingDate": "2020",
    "founder": { "@type": "Person", "name": "Rahul Agarwal" },
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": "4000 Innovation Drive, 3rd Floor",
        "addressLocality": "Ottawa",
        "addressRegion": "Ontario",
        "postalCode": "K2K 3K1",
        "addressCountry": "CA",
      },
      {
        "@type": "PostalAddress",
        "streetAddress": "104 West 40th Street, Suite 1800",
        "addressLocality": "New York",
        "addressRegion": "NY",
        "postalCode": "10018",
        "addressCountry": "US",
      },
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://quickvoice.co/company/contact",
    },
    "sameAs": [
      "https://www.linkedin.com/company/quickvoice",
      "https://twitter.com/quickvoice",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "QuickVoice",
    "description":
      "No-code platform to deploy AI voice agents for inbound and outbound calls in minutes.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "browserRequirements": "Requires JavaScript. Requires HTML5.",
    "url": "https://quickvoice.co",
    "offers": [
      { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD" },
      { "@type": "Offer", "name": "Starter", "price": "49", "priceCurrency": "USD" },
      { "@type": "Offer", "name": "Growth", "price": "99", "priceCurrency": "USD" },
      { "@type": "Offer", "name": "Scale", "price": "399", "priceCurrency": "USD" },
    ],
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What is QuickVoice and how does it work?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice is an AI-powered voice automation platform that allows businesses to deploy human-like AI voice agents in minutes. Our no-code platform uses advanced natural language processing to handle customer calls, answer questions, and perform tasks without any coding required." } },
    { "@type": "Question", "name": "How quickly can I deploy an AI voice agent?", "acceptedAnswer": { "@type": "Answer", "text": "You can deploy your first AI voice agent in under 2 minutes. Our intuitive platform uses pre-built templates and drag-and-drop functionality to get you up and running immediately. No technical expertise required." } },
    { "@type": "Question", "name": "What languages does QuickVoice support?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice supports over 100 languages and dialects worldwide. Our AI agents can communicate naturally in multiple languages, making it easy to serve global customers without language barriers." } },
    { "@type": "Question", "name": "Is QuickVoice HIPAA compliant?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice is fully HIPAA compliant. We implement enterprise-grade security measures including end-to-end encryption, secure data transmission, and strict access controls to ensure your sensitive customer data is always protected." } },
    { "@type": "Question", "name": "How much does QuickVoice cost?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice pricing starts at just 20 cents per minute. We offer flexible pricing plans based on your call volume and requirements. Contact our sales team for a custom quote tailored to your business needs." } },
    { "@type": "Question", "name": "Can QuickVoice integrate with my existing CRM?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely! QuickVoice seamlessly integrates with popular CRM systems like Salesforce, HubSpot, and custom solutions. Our API allows for easy data synchronization and workflow automation." } },
    { "@type": "Question", "name": "How does the AI understand complex customer requests?", "acceptedAnswer": { "@type": "Answer", "text": "Our AI uses advanced natural language processing and machine learning to understand context, intent, and sentiment. It can handle complex conversations, follow up on previous interactions, and provide personalized responses." } },
    { "@type": "Question", "name": "Can I customize the voice and personality of my AI agent?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can fully customize your AI agent's voice, personality, and conversation style. Choose from various voice options and train the AI to match your brand's tone and communication style." } },
    { "@type": "Question", "name": "What happens if the AI can't handle a customer request?", "acceptedAnswer": { "@type": "Answer", "text": "Our AI agents are programmed to seamlessly transfer calls to human agents when they encounter complex requests or when human intervention is needed. This ensures customers always get the help they need." } },
    { "@type": "Question", "name": "How does QuickVoice handle call analytics and reporting?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice provides comprehensive analytics including call duration, success rates, customer satisfaction scores, and conversation insights. All data is automatically synced to your CRM for better customer relationship management." } },
    { "@type": "Question", "name": "Is there a free trial available?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, the Free plan includes 15 browser-only minutes each month so you can test the builder before a production launch. No credit card is required." } },
    { "@type": "Question", "name": "Can QuickVoice handle outbound calls and campaigns?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, QuickVoice supports both inbound and outbound calling. You can create automated outbound campaigns for appointment reminders, follow-ups, and proactive customer engagement." } },
    { "@type": "Question", "name": "What security measures does QuickVoice implement?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice implements enterprise-grade security including SSL/TLS encryption, secure data centers, regular security audits, and compliance with industry standards like SOC 2, GDPR, and HIPAA." } },
    { "@type": "Question", "name": "How does QuickVoice handle different accents and dialects?", "acceptedAnswer": { "@type": "Answer", "text": "Our AI is trained on diverse speech patterns and can understand various accents, dialects, and speech variations. The system continuously learns and improves its recognition capabilities." } },
    { "@type": "Question", "name": "Can I use QuickVoice for my healthcare practice?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely! QuickVoice is specifically designed for healthcare applications with full HIPAA compliance. It can handle appointment scheduling, patient reminders, insurance verification, and other healthcare-related tasks." } },
    { "@type": "Question", "name": "What kind of support do you provide?", "acceptedAnswer": { "@type": "Answer", "text": "We provide 24/7 customer support including live chat, email support, and dedicated account managers for enterprise clients. Our team is always available to help you optimize your AI voice agents." } },
    { "@type": "Question", "name": "How does QuickVoice handle peak call volumes?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice automatically scales to handle unlimited concurrent calls. Our cloud infrastructure ensures your AI agents can handle peak volumes without any performance degradation or additional costs." } },
    { "@type": "Question", "name": "Can I use my existing phone numbers with QuickVoice?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, you can port your existing phone numbers to QuickVoice or purchase new numbers through our platform. We support both local and toll-free numbers." } },
    { "@type": "Question", "name": "How does QuickVoice ensure data privacy?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice follows strict data privacy protocols including data encryption at rest and in transit, regular security audits, and compliance with international privacy regulations. We never share your customer data with third parties." } },
    { "@type": "Question", "name": "What industries can benefit from QuickVoice?", "acceptedAnswer": { "@type": "Answer", "text": "QuickVoice serves industries including healthcare, real estate, finance, e-commerce, logistics, insurance, and more. Our platform is designed to be versatile and adaptable to any business that handles customer calls." } },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <HeroSection />
        <FeaturesSection />
        <AboutSection />
        <TestimonialsSection />
        <CtaSection />
        <FaqSection />
        <ContactSection />
      </main>
    </>
  );
}
