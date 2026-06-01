"use client";

import { motion } from "framer-motion";
import { Clock, Smartphone, RotateCcw, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { REGISTER_URL } from "@/lib/links";

const journeyFeatures = [
  {
    title: "Zero wait times",
    description:
      "Process instant confirmations and cancellations without prolonged delays or wait times.",
    icon: Clock,
  },
  {
    title: "Personalized experience",
    description:
      "Tailor recommendations based on preferences and booking history, winning loyalty and repeat engagement.",
    icon: Smartphone,
  },
  {
    title: "Enhanced operations",
    description:
      "Unlock higher efficiency by automating scheduling, reminders, and follow-ups, reducing manual effort.",
    icon: RotateCcw,
  },
];

const omnichannelFeatures = [
  {
    title: "Omnichannel support",
    description:
      "Help customers to book across chat, voice, and web platforms, providing flexible and convenient options at their fingertips.",
  },
  {
    title: "Easy navigation",
    description:
      "Eliminate the hassle of multiple screens and web URLs with a streamlined, single-interface booking experience.",
  },
  {
    title: "Highly flexible",
    description:
      "Allow customers to easily modify, reschedule, or cancel bookings for increased convenience and flexibility.",
  },
];

export function AppointmentSchedulingJourneySection() {
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
              Seamless Booking Journeys at Scale
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-foreground/70">
              From movie bookings to travel reservations and appointment scheduling, simplify the
              entire journey with AI booking agent.
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

        {/* Instant and Intelligent Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h3 className="text-2xl font-semibold text-foreground">
              Instant and Intelligent
            </h3>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {journeyFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-background/80 dark:bg-background/20 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(var(--primary-rgb),0.35)] [box-shadow:0_-20px_80px_-24px_rgba(var(--primary-rgb),0.2)_inset] dark:[box-shadow:0_-20px_80px_-24px_rgba(var(--primary-rgb),0.16)_inset]"
              >
                {/* Inner crystal glow */}
                <div className="pointer-events-none absolute inset-px rounded-2xl bg-gradient-to-br from-primary/12 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative">
                  {/* Icon */}
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/25 transition-all duration-300 group-hover:bg-primary/20 group-hover:ring-primary/40 group-hover:shadow-[0_0_24px_rgba(var(--primary-rgb),0.5)]">
                    <feature.icon className="h-8 w-8" />
                  </div>

                  {/* Content */}
                  <h4 className="mb-4 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h4>
                  <p className="leading-relaxed text-foreground/70">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Book Anytime, Anywhere Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary to-primary/80 shadow-[0_18px_65px_rgba(var(--primary-rgb),0.45)] backdrop-blur-xl"
        >
          {/* Grain / texture overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20 mix-blend-soft-light"
            style={{
              backgroundImage:
                "url('https://grainy-gradients.vercel.app/noise.svg')",
            }}
          />

          <div className="relative px-8 py-10 text-white sm:px-10 lg:px-12 lg:py-14">
            <div className="mb-12 text-center">
              <h3 className="mb-4 text-2xl font-semibold">
                Book Anytime, Anywhere
              </h3>
              <p className="mx-auto max-w-3xl text-lg text-white/85">
                Provide your customers with flexible booking options across all channels and devices.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {omnichannelFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/15 backdrop-blur-md shadow-lg transition-transform duration-300">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="mb-3 text-lg font-semibold text-white">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-white/80">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href={REGISTER_URL}
                className="inline-flex items-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-primary shadow-lg shadow-[rgba(15,23,42,0.45)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(255,255,255,0.35)] cursor-pointer"
              >
                Experience the Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
