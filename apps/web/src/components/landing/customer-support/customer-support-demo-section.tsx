"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
import { REGISTER_URL } from "@/lib/links";
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Phone,
  Bot,
  User,
  MoreHorizontal,
  Send,
} from "lucide-react";

// --- Data ---
const demoFeatures = [
  "Resolves common support tickets like order issues, refunds, and account access",
  "Handles multi-turn conversations for step-by-step troubleshooting",
  "Automatically updates, cancels, or modifies orders based on customer requests",
  "Routes complex issues to human agents with full conversation history",
  "Analyzes customer conversations to improve service quality",
];

const conversationTypes = [
  {
    type: "General Question",
    icon: MessageSquare,
    color:
      "border-border/60 bg-background/40 text-foreground hover:border-primary/60 hover:bg-primary/5",
  },
  {
    type: "Complaint",
    icon: MessageSquare,
    color:
      "border-border/60 bg-background/40 text-foreground hover:border-primary/60 hover:bg-primary/5",
  },
  {
    type: "Difficult Customer",
    icon: MessageSquare,
    color:
      "border-border/60 bg-background/40 text-foreground hover:border-primary/60 hover:bg-primary/5",
  },
  {
    type: "General Question",
    icon: MessageSquare,
    color:
      "border-border/60 bg-background/40 text-foreground hover:border-primary/60 hover:bg-primary/5",
  },
];

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function CustomerSupportDemoSection() {
  return (
    <section className="relative py-20 bg-background">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="relative mx-auto max-w-2xl sm:text-center mb-16"
        >
          <div className="relative z-10">
            <motion.h2
              variants={itemVariants}
              className="font-geist text-3xl font-normal tracking-tight text-foreground sm:text-4xl md:text-5xl mb-4"
            >
              Talk to the AI Customer Service Agent Now
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="font-geist text-lg text-foreground/70 max-w-3xl mx-auto"
            >
              Experience how our AI customer service agent handles real customer
              inquiries with human-like understanding and efficiency.
            </motion.p>
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

        <div className="grid gap-12 lg:gap-10 lg:grid-cols-12 items-center">
          {/* Left Column: Features */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="lg:col-span-5 space-y-8"
          >
            <motion.h3
              variants={itemVariants}
              className="font-geist text-2xl font-semibold text-foreground tracking-tight"
            >
              What Our AI Customer Service Agent Can Do:
            </motion.h3>

            <div className="space-y-5">
              {demoFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <p className="font-geist text-foreground/70 leading-relaxed">
                    {feature}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="pt-4">
              <Link
                href={REGISTER_URL}
                className="group inline-flex items-center rounded-full bg-primary px-8 py-4 text-primary-foreground font-semibold shadow-lg shadow-[rgba(var(--primary-rgb),0.35)] hover:bg-primary/90 hover:shadow-[0_18px_60px_rgba(var(--primary-rgb),0.45)] hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200"
              >
                Try Demo Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column: Interactive Demo Interface */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            {/* Main Card Container */}
            <motion.div
              whileHover={{ y: -4 }}
              className="group relative rounded-3xl border border-border/70 bg-background/60 dark:bg-background/20 backdrop-blur-2xl shadow-2xl transform-gpu transition-all duration-300 hover:border-primary/30 hover:shadow-[0_24px_80px_rgba(var(--primary-rgb),0.35)] [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset] dark:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.14)_inset]"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out pointer-events-none"></div>
              <div className="relative z-10">
                {/* Window Header */}
                <div className="bg-background/80 dark:bg-background/30 border-b border-border/60 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/90" />
                </div>
                <div className="text-[11px] font-medium text-foreground/50 uppercase tracking-[0.18em]">
                  Live Demo
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-[0.2em] mb-4">
                  Select Scenario
                </h3>

                {/* Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {conversationTypes.map((conversation, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center p-3 rounded-xl transition-all duration-200 text-left ${conversation.color}`}
                    >
                      <div className="p-2 rounded-lg bg-background/80 dark:bg-background/40 mr-3 shadow-sm">
                        <conversation.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium font-geist text-foreground">
                        {conversation.type}
                      </span>
                    </motion.button>
                  ))}
                </div>

                {/* Chat UI Window */}
                <div className="border border-border/70 rounded-2xl bg-background/50 dark:bg-background/10 overflow-hidden flex flex-col h-[320px] transform-gpu [box-shadow:0_-16px_60px_-24px_rgba(var(--primary-rgb),0.18)_inset] dark:[box-shadow:0_-16px_60px_-24px_rgba(var(--primary-rgb),0.14)_inset]">
                  {/* Chat Header */}
                  <div className="bg-background/90 dark:bg-background/25 p-3 shadow-sm flex items-center justify-between z-10 border-b border-border/70">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="h-9 w-9 bg-gradient-to-tr from-primary to-primary/60 rounded-full flex items-center justify-center text-primary-foreground">
                          <Bot className="h-5 w-5" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full"></span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          AI Support Agent
                        </p>
                        <p className="text-xs text-foreground/60">
                          Typically replies instantly
                        </p>
                      </div>
                    </div>
                    <MoreHorizontal className="h-5 w-5 text-foreground/40" />
                  </div>

                  {/* Message Area */}
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {/* User Message */}
                    <div className="flex items-end justify-end space-x-2">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-3 max-w-[80%] shadow-md">
                        <p className="text-sm font-geist">
                          Hi, I need help with my order #12345. It hasn&apos;t arrived
                          yet.
                        </p>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 text-foreground/60" />
                      </div>
                    </div>

                    {/* Bot Message */}
                    <div className="flex items-end justify-start space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3 w-3 text-primary-foreground" />
                      </div>
                      <div className="bg-background/95 dark:bg-background/40 text-foreground rounded-2xl rounded-tl-none p-3 max-w-[80%] shadow-sm border border-border/70">
                        <p className="text-sm font-geist">
                          I&apos;d be happy to help you track your order. Let me look
                          that up for you right away.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Input Area (Visual Only) */}
                  <div className="p-3 bg-background/90 dark:bg-background/25 border-t border-border/70">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/50">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="flex-1 h-8 bg-background/70 dark:bg-background/20 rounded-full px-3 text-sm text-foreground/50 flex items-center">
                        Type a message...
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Send className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}