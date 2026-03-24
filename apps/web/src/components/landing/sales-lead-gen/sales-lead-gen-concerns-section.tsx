"use client";

import { motion } from "framer-motion";
import { Users, Lightbulb, Shield, CheckCircle } from "lucide-react";

const concerns = [
  {
    title: "Guided purchases",
    description: "Don the hat of a sales rep and guide customers with relevant product information that drive informed purchases.",
    icon: Users
  },
  {
    title: "Share expertise",
    description: "Provide actionable tips and usage recommendations, building trust and empowering customers for future purchases.",
    icon: Lightbulb
  },
  {
    title: "Competitor handling",
    description: "Efficiently handle competitor-related queries with balanced responses highlighting the unique value of your brand and products.",
    icon: Shield
  }
];

export function SalesLeadGenConcernsSection() {
  return (
    <div className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4">
            Address Customer Concerns
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Build trust and confidence with AI-powered sales guidance that addresses every customer concern.
          </p>
        </motion.div>

        {/* Concerns Grid */}
        <div className="grid gap-8 lg:grid-cols-3 mb-16">
          {concerns.map((concern, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                <concern.icon className="h-8 w-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {concern.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {concern.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Trust Building Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 lg:p-12 shadow-lg"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Build Customer Trust with AI Sales Expertise
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Our AI sales agents are trained to handle complex customer concerns with empathy, 
                expertise, and strategic guidance that builds lasting relationships.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Expert product knowledge</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Competitive advantage insights</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Personalized recommendations</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Risk-free trial guidance</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-br from-primary/10 to-primary/[0.08] rounded-2xl p-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">92%</div>
                  <div className="text-lg text-gray-600 dark:text-gray-300">Customer Trust Score</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
