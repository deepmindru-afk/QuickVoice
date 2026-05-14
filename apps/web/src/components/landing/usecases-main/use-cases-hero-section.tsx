"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Headphones,
  MessageSquare,
  Calendar,
  Bell,
  Package,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { DEMO_BOOKING_URL } from "@/lib/links";

const floatingIcons = [
  { Icon: Headphones, delay: 0, x: "10%", y: "20%" },
  { Icon: MessageSquare, delay: 0.2, x: "85%", y: "15%" },
  { Icon: Calendar, delay: 0.4, x: "15%", y: "75%" },
  { Icon: Bell, delay: 0.6, x: "80%", y: "70%" },
  { Icon: Package, delay: 0.8, x: "5%", y: "50%" },
  { Icon: Settings, delay: 1, x: "90%", y: "55%" },
  { Icon: Headphones, delay: 1.2, x: "25%", y: "10%" },
  { Icon: MessageSquare, delay: 1.4, x: "75%", y: "25%" },
  { Icon: Calendar, delay: 1.6, x: "20%", y: "85%" },
  { Icon: Bell, delay: 1.8, x: "70%", y: "80%" },
];

export function UseCasesHeroSection() {
  return (
    <section className="relative pt-32 pb-20 bg-background min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-8 -top-8 h-96 w-96 blur-[120px] opacity-40"
          style={{
            background:
              "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.6) 4.54%, rgba(var(--primary-rgb), 0.35) 34.2%, rgba(var(--primary-rgb), 0.95) 77.55%)",
          }}
        />
        <div
          className="absolute -right-8 -bottom-8 h-96 w-96 blur-[120px] opacity-40"
          style={{
            background:
              "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.6) 4.54%, rgba(var(--primary-rgb), 0.35) 34.2%, rgba(var(--primary-rgb), 0.95) 77.55%)",
          }}
        />

        {/* Floating decorative icons */}
        {floatingIcons.map(({ Icon, delay, x, y }, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0.5, 0.3, 0],
              scale: [0, 1, 1.2, 1, 0],
              y: [0, -20, -40, -20, 0],
            }}
            transition={{
              duration: 8,
              delay: delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute"
            style={{ left: x, top: y }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary/60" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-6"
          >
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-800 p-4 shadow-lg shadow-primary/20">
              <Headphones className="w-10 h-10 text-primary-foreground" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-geist text-4xl font-light tracking-tighter text-foreground sm:text-5xl lg:text-6xl mb-6"
          >
            Built for the calls your team keeps missing
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg leading-8 text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Explore the phone workflows where AI voice agents pay back fastest:
            support, scheduling, lead response, order updates, collections, and
            operational follow-up.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href={DEMO_BOOKING_URL}
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 sm:w-auto"
            >
              Book a Demo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted sm:w-auto"
            >
              View Pricing
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Tailored solutions for your business needs</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
