"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Headphones, ArrowRight } from "lucide-react";
import Link from "next/link";
import { REGISTER_URL } from "@/lib/links";

const touchpoints = [
  {
    title: "Lead Qualification Calls",
    description:
      "AI voice agents engage prospects instantly, qualify leads with smart questions, and pass only high-intent leads to sales teams.",
    icon: DollarSign,
  },
  {
    title: "Follow-Up & Nurturing",
    description:
      "Automated voice follow-ups keep prospects engaged, answer queries, and move them closer to purchase without manual effort.",
    icon: TrendingUp,
  },
  {
    title: "Post-Demo/Meeting Reminders",
    description:
      "Send timely voice reminders and updates after demos or meetings to increase conversion rates and reduce drop-offs.",
    icon: Headphones,
  },
];

export function SalesLeadGenTouchpointsSection() {
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
              Make Each Touchpoint Count
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              Transform every customer interaction into a sales opportunity with AI-powered
              engagement.
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

        {/* Touchpoints Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {touchpoints.map((touchpoint, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
              className="group relative transform-gpu space-y-4 rounded-xl border border-border bg-transparent p-8 transition-all duration-200 ease-out hover:border-primary/30 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset] hover:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset]"
            >
              {/* Subtle gradient background on hover */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none"></div>

              <div className="relative z-10">
                <div className="text-primary w-fit transform-gpu rounded-full border p-4 mb-6 transition-all duration-200 ease-out group-hover:scale-110 group-hover:bg-primary/10 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset] dark:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.06)_inset]">
                  <touchpoint.icon className="h-6 w-6 text-primary transition-transform duration-200 ease-out group-hover:scale-110" />
                </div>

                <h3 className="font-geist text-xl font-bold tracking-tighter text-foreground mb-4">
                  {touchpoint.title}
                </h3>

                <p className="text-muted-foreground text-sm leading-relaxed transition-colors duration-200 ease-out group-hover:text-foreground/80 mb-6">
                  {touchpoint.description}
                </p>

                {/* CTA */}
                <button className="inline-flex items-center font-semibold text-primary transition-transform duration-300 group-hover:translate-x-1 hover:underline">
                  Learn More
                  <ArrowRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="rounded-2xl border border-border/70 bg-background/80 dark:bg-background/20 p-8 shadow-2xl backdrop-blur-xl [box-shadow:0_-22px_90px_-24px_rgba(var(--primary-rgb),0.22)_inset]">
            <h3 className="mb-4 text-2xl font-semibold text-foreground">
              Ready to Transform Your Sales Process?
            </h3>
            <p className="mb-6 text-lg text-foreground/70 max-w-2xl mx-auto">
              See how our AI sales agents can help you convert more leads and increase revenue.
            </p>
            <Link
              href={REGISTER_URL}
              className="inline-flex items-center rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-[rgba(var(--primary-rgb),0.35)] transition-all duration-200 hover:scale-105 hover:shadow-[0_24px_80px_rgba(var(--primary-rgb),0.5)]"
            >
              Book a Free Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
