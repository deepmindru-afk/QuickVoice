"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Calendar, Users, Clock, Globe } from "lucide-react";
import Link from "next/link";

const features = [
  "Automated Scheduling",
  "24/7 Availability",
  "Voice-Enabled Bookings",
  "Multi-Language Support",
  "Enterprise Security"
];

export function AppointmentSchedulingCtaSection() {
  return (
    <div className="py-20 bg-gradient-to-r from-primary to-primary/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl mb-6">
              Managing Over 20K Minutes of Calls Monthly?
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-white/90 leading-relaxed mb-12">
              Dive deeper with our experts to learn how Voice AI can scale your appointment scheduling operations
              and deliver ROI around the clock.
            </p>
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-6 mb-12"
          >
            {features.map((feature, index) => (
              <div key={index} className="flex items-center text-white">
                <CheckCircle className="h-5 w-5 mr-2 text-white/80" />
                <span className="text-lg font-medium">{feature}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-primary shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
            >
              Contact Sales
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center rounded-full border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white hover:text-primary transition-colors duration-200"
            >
              Tailored Demo
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-16 pt-8 border-t border-white/20"
          >
            <p className="text-white/80 text-sm mb-4">
              Trusted by enterprises worldwide for AI-powered appointment scheduling
            </p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="flex items-center text-white/60 text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                Smart Scheduling
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <Users className="h-4 w-4 mr-1" />
                Customer Satisfaction
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                24/7 Availability
              </div>
              <div className="flex items-center text-white/60 text-sm">
                <Globe className="h-4 w-4 mr-1" />
                Global Support
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
