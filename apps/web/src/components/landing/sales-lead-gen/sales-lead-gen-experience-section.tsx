"use client";

import { motion } from "framer-motion";
import { Brain, Target, Zap, CheckCircle } from "lucide-react";

const experienceFeatures = [
  {
    title: "Out-Of-Scope Queries",
    description: "Our AI sales agent easily tackles queries beyond its scope by directing customers to the use cases it's trained to help with, driving rich conversational experiences.",
    icon: Brain
  },
  {
    title: "Superior Context Retention",
    description: "Your customers won't have to repeat themselves during pre-purchase. The AI sales agent remembers customer preferences and displays products purely based on intent.",
    icon: Target
  },
  {
    title: "Unmatched Precision",
    description: "Integrated with the product catalog, the sales agent filters results using parameters such as price, size, and store location for accurate recommendations and better buying experience.",
    icon: Zap
  }
];

export function SalesLeadGenExperienceSection() {
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
            Streamline the Buying Experience
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            with the power of AI sales agent
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-8 lg:grid-cols-3 mb-16">
          {experienceFeatures.map((feature, index) => (
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
                <feature.icon className="h-8 w-8 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* AI Capabilities Section */}
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
                Advanced AI Sales Capabilities
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Our AI sales agents are equipped with advanced capabilities that ensure every customer 
                interaction is meaningful, efficient, and conversion-focused.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Natural language understanding</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Real-time product matching</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Sentiment analysis</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Predictive recommendations</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Multi-channel consistency</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-br from-primary/10 to-primary/[0.08] rounded-2xl p-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">98%</div>
                  <div className="text-lg text-gray-600 dark:text-gray-300">Query Resolution Rate</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
