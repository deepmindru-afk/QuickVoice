"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowRight, PhoneOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/logo";



export default function NotFound() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
      style={{ backgroundImage: "var(--color-home-background)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full blur-[160px]"
        style={{ background: "rgba(var(--primary-rgb), 0.08)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full blur-[120px]"
        style={{ background: "rgba(var(--primary-rgb), 0.05)" }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto text-center">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl  shadow-lg"
        >
          <Link href="/">
            <Logo/>
          </Link>
        </motion.div>

        {/* Waveform */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
        </motion.div>

        {/* 404 number */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-[10rem] leading-none font-bold tracking-tighter text-primary/10 select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
        >
          404
        </motion.p>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-sm font-medium uppercase tracking-widest text-primary mb-3">
            Signal Lost
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            This line has been disconnected
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-md mx-auto">
            The page you&apos;re trying to reach doesn&apos;t exist. Let&apos;s
            reconnect you.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <Link href="/login">
              <LogIn className="ml-2 h-4 w-4" />
              Login
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
