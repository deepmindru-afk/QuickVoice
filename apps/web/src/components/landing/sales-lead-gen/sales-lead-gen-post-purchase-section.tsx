"use client";

import { motion } from "framer-motion";
import { Gift, Heart, TrendingUp, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Img from "@/data/use-cases/sales-lead-gen.json";
import { REGISTER_URL } from "@/lib/links";

const postPurchaseFeatures = [
  {
    title: "Offers and discounts",
    description:
      "Proactively reach customers with personalized offers and back-in-stock alerts to facilitate conversions and sales.",
    icon: Gift,
  },
  {
    title: "Win loyalty",
    description:
      "Keep customers engaged with order status, return policies, and product feedback to foster lasting relationships at scale.",
    icon: Heart,
  },
  {
    title: "Higher AOV",
    description:
      "Amplify average order value through upsell and cross-selling of products related to customers' recent purchases.",
    icon: TrendingUp,
  },
];

export function SalesLeadGenPostPurchaseSection() {
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
            <div className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <span className="mr-2 flex h-2 w-2 rounded-full bg-primary" />
              Retention Strategy
            </div>
            <h2 className="mb-4 font-geist text-3xl font-normal tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Engage{" "}
              <span className="text-foreground">
                Post-Purchase
              </span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-foreground/70">
              Turn one-time buyers into loyal customers with AI-powered post-purchase engagement.
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

        {/* Content with Image */}
        <div className="mb-24 grid items-center gap-16 lg:grid-cols-2">
          {/* Left side - Features */}
          <div className="space-y-6">
            {postPurchaseFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="group relative transform-gpu flex gap-6 rounded-xl border border-border bg-transparent p-6 transition-all duration-200 ease-out hover:border-primary/30 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset] hover:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset]"
              >
                {/* Subtle gradient background on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none" />

                <div className="relative z-10 flex gap-6">
                  {/* Icon */}
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-primary/10 p-3 transition-all duration-200 ease-out group-hover:scale-110 group-hover:bg-primary/20 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset] dark:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.06)_inset]">
                      <feature.icon className="h-7 w-7 text-primary transition-transform duration-200 ease-out group-hover:scale-110" />
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="mb-2 text-xl font-bold tracking-tighter text-foreground transition-colors duration-200 ease-out group-hover:text-primary">
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground/80">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right side - Image with styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-center lg:h-full"
          >
            {/* Decorative blob behind image */}
            <div
              aria-hidden="true"
              className="absolute -z-10 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-primary/20 to-transparent blur-3xl"
              style={{ top: "50%", left: "50%" }}
            />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative rounded-2xl border border-border/70 bg-background/90 dark:bg-background/30 p-2 shadow-[0_26px_80px_rgba(15,23,42,0.8)] backdrop-blur-2xl [box-shadow:0_-22px_90px_-24px_rgba(var(--primary-rgb),0.22)_inset] dark:[box-shadow:0_-22px_90px_-24px_rgba(var(--primary-rgb),0.18)_inset]"
            >
              <Image
                src={Img.postPurchase.url}
                alt={Img.postPurchase.alt}
                width={600}
                height={400}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-auto w-full rounded-xl object-cover"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Customer Journey Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl"
        >
          {/* Background pattern overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

          <div className="relative p-8 text-white lg:p-16">
            <div className="mb-16 text-center">
              <h3 className="mb-6 text-3xl font-bold md:text-4xl">
                Complete Customer Journey Management
              </h3>
              <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-purple-100">
                From initial interest to repeat purchases, our AI sales agents guide customers
                through every step of their journey with personalized engagement.
              </p>
            </div>

            {/* Journey Steps with Connector Line */}
            <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-4 lg:gap-8">
              {/* Connector Line (Desktop) */}
              <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-0.5 bg-gradient-to-r from-purple-300/20 via-white/40 to-purple-300/20 lg:block" />

              {[
                { step: "1", title: "Initial Interest", desc: "Capture and qualify leads" },
                { step: "2", title: "Purchase Decision", desc: "Guide to conversion" },
                { step: "3", title: "Post-Purchase", desc: "Ensure satisfaction" },
                { step: "4", title: "Retention", desc: "Build loyalty" },
              ].map((item, i) => (
                <div key={i} className="group relative text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-primary">
                    <span className="text-2xl font-bold">{item.step}</span>
                  </div>
                  <h4 className="mb-2 text-xl font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-purple-100/80">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link
                href={REGISTER_URL}
                className="group inline-flex items-center rounded-full bg-white px-8 py-4 text-lg font-bold text-primary shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/20"
              >
                Start Your Customer Journey
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
