'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from "next/link";
import { ArrowRight, Users, Sparkles } from 'lucide-react';
import { REGISTER_URL } from "@/lib/links";

export function AboutUsCtaSection() {
  return (
    <section className="relative py-20 bg-background">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="group relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-12 text-center transition-all duration-300 hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)] hover:shadow-primary/50 hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 rounded-b-3xl bg-gradient-to-t from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-geist font-normal tracking-tight text-foreground mb-6">
              Join Us in Building the Future of{' '}
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Healthcare AI
              </span>
            </h2>
            <p className="text-xl text-foreground/75 mb-10 leading-relaxed max-w-3xl mx-auto">
              We&apos;re building the future of healthcare AI. Join our team to help us create a more efficient,
              effective, and safe healthcare system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href={REGISTER_URL} className="cursor-pointer">
                  <Button
                    size="lg"
                    className="group/btn bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold rounded-full shadow-lg shadow-[rgba(15,23,42,0.45)] hover:shadow-[0_24px_80px_rgba(var(--primary-rgb),0.75)] transition-all duration-300"
                  >
                    Get a Free Demo
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/company/careers" className="inline-flex cursor-pointer">
                  <Button
                    variant="outline"
                    size="lg"
                    className="group/btn rounded-full border border-primary/40 px-8 py-4 text-lg font-semibold text-primary bg-white/0 hover:bg-primary hover:text-primary-foreground transition-all duration-300 dark:border-primary/60 dark:text-primary/90 dark:bg-white/5 dark:hover:bg-primary dark:hover:text-slate-950 dark:backdrop-blur-md"
                  >
                    View Careers
                    <Users className="ml-2 h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
