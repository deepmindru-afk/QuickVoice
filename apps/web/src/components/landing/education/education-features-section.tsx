"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  Globe,
  Zap,
  Target,
  BarChart3,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";

import { REGISTER_URL } from "@/lib/links";

const mainFeatures = [
  {
    title: "24/7 Availability",
    subtitle: "Engage at Every Step",
    description: "Engage students, teachers, and staff across platforms using generative AI-powered chat and voice solutions. Automate processes and enhance self-service for superior customer experience with 24×7 real-time support.",
    icon: MessageCircle
  },
  {
    title: "Omnichannel Experience",
    subtitle: "Be Where your Customers are",
    description: "Boost support experience with AI-powered omnichannel conversational AI. Personalise branded experiences on preferred channels, and languages.",
    icon: Globe
  },
  {
    title: "Integrations",
    subtitle: "Connect with your Stack",
    description: "With over 100+ integrations available, connect with your existing tools for efficient self-service and live chat, offering unified customer insights.",
    icon: Zap
  },
  {
    title: "Real time Dashboards",
    subtitle: "Streamline Communications",
    description: "Optimise alumni and parent/student engagement with AI-driven solutions. Streamline applicant communication, improve conversions, and enhance document handling.",
    icon: Target
  },
  {
    title: "Intuitive Analytics",
    subtitle: "Measure and Grow",
    description: "Get real-time insights on agent & chatbot KPIs, and customer interaction with predictive analysis for enhanced customer engagement.",
    icon: BarChart3
  },
  {
    title: "Automated Workflows",
    subtitle: "Streamline Operations",
    description: "Automate routine tasks like enrollment processing, fee collection reminders, and document verification to reduce administrative burden and improve efficiency.",
    icon: Clock
  }
];

export function EducationFeaturesSection() {
  return (
    <section className="relative py-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="relative mx-auto max-w-2xl sm:text-center mb-16">
          <div className="relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="font-geist mt-4 text-3xl font-normal tracking-tighter text-foreground sm:text-4xl md:text-5xl mb-4"
            >
              Conversational AI for Ed-Tech to Improve Customer Experiences
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="font-geist text-foreground/60 mt-3 max-w-3xl mx-auto"
            >
              Fostering success for 500+ customers
            </motion.p>
          </div>
          <div
            className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
            style={{
              background:
                "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.6) 4.54%, rgba(var(--primary-rgb), 0.35) 34.2%, rgba(var(--primary-rgb), 0.95) 77.55%)",
            }}></div>
        </div>
        <hr className="bg-foreground/30 mx-auto mt-5 h-px w-1/2" />

        <div className="relative mt-12">
          <ul className="grid gap-8 sm:grid-cols-2">
            {mainFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    default: { duration: 0.6, delay: index * 0.1, ease: "easeOut" },
                    y: { duration: 0.2, ease: "easeOut" }
                  }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="group relative transform-gpu space-y-4 rounded-xl border border-border bg-transparent p-8 transition-all duration-200 ease-out hover:border-primary/30 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset] hover:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset]"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-primary w-fit transform-gpu rounded-full border p-4 transition-all duration-200 ease-out group-hover:scale-110 group-hover:bg-primary/10 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset] dark:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.06)_inset] flex-shrink-0">
                        <Icon
                          className="h-6 w-6 text-primary transition-transform duration-200 ease-out group-hover:scale-110"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-geist text-xl font-bold tracking-tighter text-foreground mb-1 transition-colors duration-200 ease-out group-hover:text-primary">
                          {feature.title}
                        </h3>
                        <p className="font-geist text-sm font-medium text-muted-foreground mb-3 transition-colors duration-200 ease-out group-hover:text-foreground/80">
                          {feature.subtitle}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed transition-colors duration-200 ease-out group-hover:text-foreground/80 mb-4">
                      {feature.description}
                    </p>
                    <Link
                      href={REGISTER_URL}
                      className="mt-4 inline-flex items-center text-primary font-semibold hover:underline text-sm transition-transform duration-200 ease-out group-hover:translate-x-1"
                    >
                      TRY THE BUILDER
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
