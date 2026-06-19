'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PlusIcon } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: "general" | "pricing" | "technical" | "security" | "integration";
}

const faqItems: FaqItem[] = [
  {
    id: "1",
    question: "What is QuickVoice and how does it work?",
    answer:
      "QuickVoice is an AI-powered voice automation platform that allows businesses to deploy human-like AI voice agents in minutes. Our no-code platform uses advanced natural language processing to handle customer calls, answer questions, and perform tasks without any coding required.",
    category: "general",
  },
  {
    id: "2",
    question: "How quickly can I deploy an AI voice agent?",
    answer:
      "You can deploy your first AI voice agent in under 2 minutes. Our intuitive platform uses pre-built templates and drag-and-drop functionality to get you up and running immediately. No technical expertise required.",
    category: "general",
  },
  {
    id: "3",
    question: "What languages does QuickVoice support?",
    answer:
      "QuickVoice supports over 100 languages and dialects worldwide. Our AI agents can communicate naturally in multiple languages, making it easy to serve global customers without language barriers.",
    category: "technical",
  },
  {
    id: "4",
    question: "Is QuickVoice HIPAA compliant?",
    answer:
      "Yes, QuickVoice is fully HIPAA compliant. We implement enterprise-grade security measures including end-to-end encryption, secure data transmission, and strict access controls to ensure your sensitive customer data is always protected.",
    category: "security",
  },
  {
    id: "5",
    question: "How much does QuickVoice cost?",
    answer:
      "QuickVoice pricing starts at just 20 cents per minute. We offer flexible pricing plans based on your call volume and requirements. Contact our sales team for a custom quote tailored to your business needs.",
    category: "pricing",
  },
  {
    id: "6",
    question: "Can QuickVoice integrate with my existing CRM?",
    answer:
      "Absolutely! QuickVoice seamlessly integrates with popular CRM systems like Salesforce, HubSpot, and custom solutions. Our API allows for easy data synchronization and workflow automation.",
    category: "integration",
  },
  {
    id: "7",
    question: "How does the AI understand complex customer requests?",
    answer:
      "Our AI uses advanced natural language processing and machine learning to understand context, intent, and sentiment. It can handle complex conversations, follow up on previous interactions, and provide personalized responses.",
    category: "technical",
  },
  {
    id: "8",
    question: "Can I customize the voice and personality of my AI agent?",
    answer:
      "Yes, you can fully customize your AI agent's voice, personality, and conversation style. Choose from various voice options and train the AI to match your brand's tone and communication style.",
    category: "general",
  },
  {
    id: "9",
    question: "What happens if the AI can't handle a customer request?",
    answer:
      "Our AI agents are programmed to seamlessly transfer calls to human agents when they encounter complex requests or when human intervention is needed. This ensures customers always get the help they need.",
    category: "technical",
  },
  {
    id: "10",
    question: "How does QuickVoice handle call analytics and reporting?",
    answer:
      "QuickVoice provides comprehensive analytics including call duration, success rates, customer satisfaction scores, and conversation insights. All data is automatically synced to your CRM for better customer relationship management.",
    category: "technical",
  },
  {
    id: "11",
    question: "Is there a free trial available?",
    answer:
      "Yes, the Free plan includes 15 browser-only minutes each month so you can test the builder before a production launch. No credit card is required.",
    category: "pricing",
  },
  {
    id: "12",
    question: "Can QuickVoice handle outbound calls and campaigns?",
    answer:
      "Yes, QuickVoice supports both inbound and outbound calling. You can create automated outbound campaigns for appointment reminders, follow-ups, and proactive customer engagement.",
    category: "general",
  },
  {
    id: "13",
    question: "What security measures does QuickVoice implement?",
    answer:
      "QuickVoice implements enterprise-grade security including SSL/TLS encryption, secure data centers, regular security audits, and compliance with industry standards like SOC 2, GDPR, and HIPAA.",
    category: "security",
  },
  {
    id: "14",
    question: "How does QuickVoice handle different accents and dialects?",
    answer:
      "Our AI is trained on diverse speech patterns and can understand various accents, dialects, and speech variations. The system continuously learns and improves its recognition capabilities.",
    category: "technical",
  },
  {
    id: "15",
    question: "Can I use QuickVoice for my healthcare practice?",
    answer:
      "Absolutely! QuickVoice is specifically designed for healthcare applications with full HIPAA compliance. It can handle appointment scheduling, patient reminders, insurance verification, and other healthcare-related tasks.",
    category: "general",
  },
  {
    id: "16",
    question: "What kind of support do you provide?",
    answer:
      "We provide 24/7 customer support including live chat, email support, and dedicated account managers for enterprise clients. Our team is always available to help you optimize your AI voice agents.",
    category: "general",
  },
  {
    id: "17",
    question: "How does QuickVoice handle peak call volumes?",
    answer:
      "QuickVoice automatically scales to handle unlimited concurrent calls. Our cloud infrastructure ensures your AI agents can handle peak volumes without any performance degradation or additional costs.",
    category: "technical",
  },
  {
    id: "18",
    question: "Can I use my existing phone numbers with QuickVoice?",
    answer:
      "Yes, you can port your existing phone numbers to QuickVoice or purchase new numbers through our platform. We support both local and toll-free numbers.",
    category: "integration",
  },
  {
    id: "19",
    question: "How does QuickVoice ensure data privacy?",
    answer:
      "QuickVoice follows strict data privacy protocols including data encryption at rest and in transit, regular security audits, and compliance with international privacy regulations. We never share your customer data with third parties.",
    category: "security",
  },
  {
    id: "20",
    question: "What industries can benefit from QuickVoice?",
    answer:
      "QuickVoice serves industries including healthcare, real estate, finance, e-commerce, logistics, insurance, and more. Our platform is designed to be versatile and adaptable to any business that handles customer calls.",
    category: "general",
  },
];

const categories = [
  { id: "all", label: "All" },
  { id: "general", label: "General" },
  { id: "technical", label: "Technical" },
  { id: "pricing", label: "Pricing" },
  { id: "security", label: "Security" },
  { id: "integration", label: "Integration" },
];

export default function Faq2() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs =
    activeCategory === 'all'
      ? faqItems
      : faqItems.filter((item) => item.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-12 flex flex-col items-center">
          <Badge
            variant="outline"
            className="border-primary mb-4 px-3 py-1 text-xs font-medium tracking-wider uppercase"
          >
            FAQs
          </Badge>

          <h2 className="text-foreground mb-6 text-center text-4xl font-bold tracking-tight md:text-5xl">
            Frequently Asked Questions
          </h2>

          <p className="text-muted-foreground max-w-2xl text-center">
            Find answers to common questions about QuickVoice — from deployment
            and pricing to integrations, security, and compliance.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-all',
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* FAQ Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <AnimatePresence>
            {filteredFaqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn(
                  'border-border h-fit overflow-hidden rounded-xl border',
                  expandedId === faq.id
                    ? 'shadow-3xl bg-card/50'
                    : 'bg-card/50',
                )}
              >
                <button
                  onClick={() => toggleExpand(faq.id)}
                  aria-expanded={expandedId === faq.id}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <h3 className="text-foreground text-lg font-medium">
                    {faq.question}
                  </h3>
                  <div className="ml-4 flex-shrink-0">
                    <PlusIcon className={`text-primary h-5 w-5 transition-transform duration-300 ${expandedId === faq.id ? "rotate-45" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === faq.id && (
                    <motion.div
                      id={`faq-answer-${faq.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-border border-t px-6 pt-2 pb-6">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-4">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <a
            href="/company/contact"
            className="border-primary text-foreground hover:bg-primary hover:text-white inline-flex items-center justify-center rounded-lg border-2 px-6 py-3 font-medium transition-colors"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  );
}
