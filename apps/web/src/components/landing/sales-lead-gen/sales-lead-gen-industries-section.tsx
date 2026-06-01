"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { REGISTER_URL } from "@/lib/links";
import {
  Building2,
  Heart,
  DollarSign,
  Home,
  Car,
  Plane,
  GraduationCap,
  Briefcase,
  Truck,
  Users,
} from "lucide-react";

const industries = [
  { name: "Retail & E-comm", icon: Building2 },
  { name: "Healthcare", icon: Heart },
  { name: "Financial Services", icon: DollarSign },
  { name: "Real Estate", icon: Home },
  { name: "Automotive", icon: Car },
  { name: "Travel & Hospitality", icon: Plane },
  { name: "Education", icon: GraduationCap },
  { name: "B2B SaaS", icon: Briefcase },
  { name: "Logistics", icon: Truck },
  { name: "HR & Recruiting", icon: Users },
];

export function SalesLeadGenIndustriesSection() {
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
              Tailored for Enterprises
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
              To engage and sell efficiently
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

        {/* Industries Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
          {industries.map((industry, index) => (
            <motion.button
              type="button"
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="
                group relative flex flex-col items-center p-6 cursor-pointer
                rounded-xl border border-border/70 bg-background/60
                backdrop-blur-xl transition-all duration-300
                shadow-[0_0_25px_-8px_rgba(var(--primary-rgb),0.22)]
                [box-shadow:inset_0_-18px_70px_-24px_rgba(var(--primary-rgb),0.18)]
                dark:[box-shadow:inset_0_-18px_70px_-24px_rgba(var(--primary-rgb),0.14)]
                hover:-translate-y-1 hover:shadow-[0_0_45px_-10px_rgba(var(--primary-rgb),0.45)]
              "
            >
              {/* Inner glow overlay */}
              <div className="pointer-events-none absolute inset-px rounded-[0.75rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative flex flex-col items-center">
                <div
                  className="
                    mb-3 flex h-12 w-12 items-center justify-center rounded-full
                    bg-primary/10 text-primary
                    ring-1 ring-primary/20
                    transition-all duration-300
                    group-hover:bg-primary/20 group-hover:ring-primary/35
                    group-hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.45)]
                  "
                >
                  <industry.icon className="h-6 w-6" />
                </div>
                <span
                  className="
                    text-sm font-medium text-foreground text-center
                    transition-all duration-300
                    group-hover:text-primary
                    group-hover:drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.55)]
                  "
                >
                  {industry.name}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/70 p-8 text-white shadow-2xl lg:p-12">
            <h3 className="mb-4 text-2xl font-semibold">
              Get Your Custom AI Sales Agent
            </h3>
            <p className="mb-6 max-w-2xl mx-auto text-lg text-white/90">
              Ready to transform your sales process? Let us build a custom AI sales agent
              tailored to your industry and business needs.
            </p>
            <Link
              href={REGISTER_URL}
              className="inline-flex items-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-primary shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              Book a Free Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
