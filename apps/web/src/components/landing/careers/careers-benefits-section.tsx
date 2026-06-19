"use client";

import { motion } from "framer-motion";
import { Heart, DollarSign, Home, GraduationCap, Users2, Coffee, CheckCircle } from "lucide-react";
const benefits = [
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive health, dental, and vision insurance. Mental health support and wellness programs.",
    features: ["100% health coverage", "Mental health support", "Gym membership", "Wellness stipend"]
  },
  {
    icon: DollarSign,
    title: "Competitive Compensation",
    description: "Top-tier salaries, equity participation, and performance bonuses.",
    features: ["Above-market salaries", "Equity participation", "Performance bonuses", "401k matching"]
  },
  {
    icon: Home,
    title: "Flexible Work",
    description: "Work from anywhere with flexible hours and unlimited PTO.",
    features: ["Remote-first culture", "Flexible hours", "Unlimited PTO", "Home office stipend"]
  },
  {
    icon: GraduationCap,
    title: "Learning & Growth",
    description: "Continuous learning opportunities and career development support.",
    features: ["Learning budget", "Conference attendance", "Mentorship programs", "Career coaching"]
  },
  {
    icon: Users2,
    title: "Team & Culture",
    description: "Inclusive, diverse team with regular social events and team building.",
    features: ["Team events", "Diversity initiatives", "Social clubs", "Company retreats"]
  },
  {
    icon: Coffee,
    title: "Perks & Benefits",
    description: "Modern office spaces, free meals, and unique company perks.",
    features: ["Free meals", "Modern offices", "Latest equipment", "Company swag"]
  }
];

export function CareersBenefitsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto max-w-3xl"
          >
            <div
              className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
              style={{
                background:
                  "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.6) 4.54%, rgba(var(--primary-rgb), 0.35) 34.2%, rgba(var(--primary-rgb), 0.95) 77.55%)",
              }}
            />
            <h2 className="relative z-10 font-geist text-4xl font-light tracking-tighter text-foreground sm:text-5xl lg:text-6xl mb-8">
              Comprehensive Benefits Package
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg leading-8 text-muted-foreground max-w-4xl mx-auto"
          >
            We invest in our team&apos;s well-being, growth, and success with a comprehensive benefits package that goes beyond the basics.
          </motion.p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                default: { duration: 0.6, delay: index * 0.1, ease: "easeOut" },
                y: { duration: 0.2, ease: "easeOut" }
              }}
              whileHover={{ y: -4 }}
              className="group relative transform-gpu space-y-3 rounded-xl border border-border bg-transparent p-8 transition-all duration-200 ease-out hover:border-primary/30 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset] hover:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset]"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out pointer-events-none"></div>

              {/* Content */}
              <div className="relative z-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-all duration-200 ease-out group-hover:bg-primary/20 mb-6">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-4 transition-colors duration-200 ease-out group-hover:text-primary">
                  {benefit.title}
                </h3>

                <p className="text-muted-foreground mb-6 leading-relaxed transition-colors duration-200 ease-out group-hover:text-foreground/80">
                  {benefit.description}
                </p>

                <div className="space-y-3">
                  {benefit.features.slice(0, 3).map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 + featureIndex * 0.05 }}
                      className="flex items-center space-x-3"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      </motion.div>
                      <span className="text-muted-foreground font-medium transition-colors duration-200 ease-out group-hover:text-foreground/80">
                        {feature}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative rounded-xl border border-border bg-card p-12 text-center overflow-hidden [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset]"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.6) 4.54%, rgba(var(--primary-rgb), 0.35) 34.2%, rgba(var(--primary-rgb), 0.95) 77.55%)",
            }}
          />

          <div className="relative z-10">
            <div className="relative mx-auto max-w-2xl mb-6">
              <div
                className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
                style={{
                  background:
                    "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.6) 4.54%, rgba(var(--primary-rgb), 0.35) 34.2%, rgba(var(--primary-rgb), 0.95) 77.55%)",
                }}
              />
              <h3 className="relative z-10 font-geist text-3xl font-light tracking-tighter text-foreground sm:text-4xl">
                Why Our Benefits Stand Out
              </h3>
            </div>
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
              We believe in taking care of our team with industry-leading benefits that support your health, growth, and happiness.
            </p>

            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground">Health Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">∞</div>
                <div className="text-muted-foreground">Learning Budget</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">30+</div>
                <div className="text-muted-foreground">Days PTO</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">Support</div>
              </div>
            </div>

            <motion.a
              href="#open-positions"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] transition-all duration-300"
            >
              View Open Positions
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
