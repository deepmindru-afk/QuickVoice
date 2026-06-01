"use client";

import { motion } from "framer-motion";
import { Mic, MessageSquare, Globe, ArrowRight, Settings, Plug, TrendingUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Img from "@/data/use-cases/appointment-scheduling.json"
import { REGISTER_URL } from "@/lib/links";

const voiceFeatures = [
  {
    title: "Fully automated",
    description:
      "Allow customers to chat with the booking agent for movie ticket bookings, hotel reservations, and more.",
    icon: Mic,
  },
  {
    title: "Effortless bookings",
    description:
      "Speak naturally and let the AI booking agent handle the rest. No menus and no typing, just a fast and efficient way to book in seconds.",
    icon: MessageSquare,
  },
  {
    title: "Multilingual support",
    description:
      "Our AI booking agent supports 100+ languages, making voice bookings accessible to global customers.",
    icon: Globe,
  },
];

const enterpriseFeatures = [
  {
    title: "Bespoke Solution",
    description:
      "Our AI booking agent is a pioneering initiative highly customized for enterprises in industries like entertainment, retail, healthcare, real estate, and more",
    icon: Settings,
  },
  {
    title: "Powerful Integrations",
    description:
      "Easily connect to 100+ integrations including CRMs, messaging channels, payment gateways, and other 3rd-party tools to auto-sync bookings and manage leads in real-time",
    icon: Plug,
  },
  {
    title: "Highly Scalable",
    description:
      "Easily manage high booking volumes without disruptions. Our systems handle peak demand for the largest enterprises, ensuring reliability and operational efficiency at scale",
    icon: TrendingUp,
  },
];

export function AppointmentSchedulingVoiceSection() {
  return (
    <section className="relative py-20 bg-background">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              Offer Voice-Enabled Bookings
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-foreground/70">
              Engage in natural dialogs and offer real-time support with voice-powered appointment
              scheduling.
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

        {/* Voice Features Grid */}
        <div className="mb-20 grid gap-8 lg:grid-cols-3">
          {voiceFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                default: { duration: 0.6, delay: index * 0.1 },
                y: { duration: 0.2, ease: "easeOut" }
              }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="group relative transform-gpu space-y-4 rounded-xl border border-border bg-transparent p-8 transition-all duration-200 ease-out hover:border-primary/30 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset] hover:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset]"
            >
              {/* Subtle gradient background on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none"></div>

              <div className="relative z-10">
                <div className="text-primary w-fit transform-gpu rounded-full border p-4 mb-6 transition-all duration-200 ease-out group-hover:scale-110 group-hover:bg-primary/10 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset] dark:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.06)_inset]">
                  <feature.icon className="h-6 w-6 text-primary transition-transform duration-200 ease-out group-hover:scale-110" />
                </div>

                <h3 className="font-geist text-xl font-bold tracking-tighter text-foreground mb-4">
                  {feature.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed transition-colors duration-200 ease-out group-hover:text-foreground/80">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enterprise Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          {/* Centered Header */}
          <div className="mb-12 text-center">
            <h3 className="mb-4 text-2xl font-semibold text-foreground sm:text-3xl">
              Built for the Modern Enterprise
            </h3>
            <p className="text-lg text-foreground/70">
              To enhance booking journeys
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left column - Content */}
            <div>
              <div className="space-y-6">
                {enterpriseFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                      default: { duration: 0.6, delay: index * 0.1 },
                      y: { duration: 0.2, ease: "easeOut" }
                    }}
                    viewport={{ once: true }}
                    whileHover={{ y: -4 }}
                    className="group relative transform-gpu overflow-hidden rounded-xl border border-border bg-transparent p-6 transition-all duration-200 ease-out hover:border-primary/30 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset] hover:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset]"
                  >
                    {/* Subtle gradient background on hover */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none"></div>
                    <div className="relative z-10 flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 p-3 transition-all duration-200 ease-out group-hover:scale-110 group-hover:bg-primary/20 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset] dark:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.06)_inset]">
                        <feature.icon className="h-6 w-6 text-primary transition-transform duration-200 ease-out group-hover:scale-110" />
                      </div>
                      {/* Content */}
                      <div className="flex-1">
                        <h4 className="mb-3 text-xl font-bold tracking-tighter text-foreground transition-colors duration-200 ease-out group-hover:text-primary">
                          {feature.title}
                        </h4>
                        <p className="text-sm leading-relaxed text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground/80">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right column - Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative flex justify-center lg:justify-end"
            >
              {/* Background glow behind image */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/25 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
              />

              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl border border-border/70 bg-background/80 p-2 shadow-[0_26px_65px_rgba(15,23,42,0.75)] backdrop-blur-2xl">
                <div className="relative overflow-hidden rounded-2xl">
                  <Image
                    src={Img.useCases.url}
                    alt={Img.useCases.alt}
                    width={600}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="h-auto w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/15 via-transparent to-transparent" />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Link
            href={REGISTER_URL}
            className="inline-flex items-center rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-[rgba(var(--primary-rgb),0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_24px_80px_rgba(var(--primary-rgb),0.5)] cursor-pointer"
          >
            Book a Free Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
