"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, MessageSquare, HelpCircle, Phone, Bot } from "lucide-react";
import Image from "next/image";
import Img from "@/data/use-cases/customer-support.json";
import { REGISTER_URL } from "@/lib/links";

const useCases = [
  {
    title: "Instantly answer FAQs, handle returns & order status inquiries",
    icon: HelpCircle,
  },
  {
    title: "Deflect high-volume support tickets with smart automation",
    icon: Bot,
  },
  {
    title: "Resolve customer issues 24/7 without human intervention",
    icon: Phone,
  },
  {
    title: "Seamlessly integrate with your CRM, help desk & live chat systems",
    icon: MessageSquare,
  },
];

const additionalFeatures = [
  "Order tracking and status updates",
  "Account information and billing inquiries",
  "Product recommendations and support",
  "Appointment scheduling and reminders",
  "Technical troubleshooting assistance",
  "Refund and return processing",
  "Multi-language support",
  "Sentiment analysis and escalation",
];

export function CustomerSupportUseCasesSection() {
  return (
    <section className="relative py-20 bg-background">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-2xl sm:text-center mb-16"
        >
          <div className="relative z-10">
          <h2 className="mb-4 font-geist text-3xl font-normal tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Try Your AI Customer Service Agent Now
          </h2>
          <p className="text-lg text-foreground/70">
            Experience the power of AI-driven customer support that transforms your service operations.
          </p>
          </div>
          <div
            className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
            style={{
              background:
                "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.6) 4.54%, rgba(var(--primary-rgb), 0.35) 34.2%, rgba(var(--primary-rgb), 0.95) 77.55%)",
            }}
          ></div>
        </motion.div>
        <hr className="bg-foreground/30 mx-auto mb-12 h-px w-1/2" />

        {/* Main Use Cases */}
        <div className="mb-16 grid items-center gap-10 lg:grid-cols-2">
          {/* Left Column - Use Cases */}
          <div className="space-y-5">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative transform-gpu flex items-start gap-4 rounded-xl border border-border bg-transparent p-5 transition-all duration-200 ease-out hover:border-primary/30 hover:-translate-y-1 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset] hover:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset]"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none"></div>
                <div className="relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 group-hover:bg-primary/20 transition-all duration-200 ease-out group-hover:scale-110 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset] dark:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.06)_inset]">
                  <useCase.icon className="h-6 w-6 text-primary transition-transform duration-200 ease-out group-hover:scale-110" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-geist text-base font-bold tracking-tighter text-foreground sm:text-lg transition-colors duration-200 ease-out group-hover:text-primary">
                    {useCase.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column - Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="relative lg:ml-6"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 rounded-3xl opacity-70 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle at top left, rgba(var(--primary-rgb),0.35), transparent 60%)",
              }}
            />
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-background/70 dark:bg-background/20 shadow-2xl backdrop-blur-2xl [box-shadow:0_-20px_80px_-24px_rgba(var(--primary-rgb),0.18)_inset] dark:[box-shadow:0_-20px_80px_-24px_rgba(var(--primary-rgb),0.14)_inset]">
              <Image
                src={Img.useCases.url}
                alt={Img.useCases.alt}
                width={600}
                height={400}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-full w-full object-cover"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="rounded-3xl border border-border/70 bg-background/80 dark:bg-background/20 p-8 sm:p-10 shadow-[0_20px_80px_rgba(15,23,42,0.3)] backdrop-blur-2xl [box-shadow:0_-22px_90px_-24px_rgba(var(--primary-rgb),0.18)_inset] dark:[box-shadow:0_-22px_90px_-24px_rgba(var(--primary-rgb),0.14)_inset]"
        >
          <h3 className="text-center text-2xl font-semibold text-foreground">
            Additional AI Customer Service Capabilities
          </h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-2 backdrop-blur-sm"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
                <span className="text-sm text-foreground/80">{feature}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href={REGISTER_URL}
              className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-[rgba(var(--primary-rgb),0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(var(--primary-rgb),0.5)]"
            >
              Create Free Account
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}