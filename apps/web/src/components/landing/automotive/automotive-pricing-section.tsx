"use client";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { CONTACT_URL, DEMO_BOOKING_URL, REGISTER_URL } from "@/lib/links";

export function AutomotivePricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$0.13/min",
      included: "2,000 mins included",
      description: "Ideal for developing and launching your AI voice agent",
      features: [
        "Basic AI voice assistant",
        "Standard integrations",
        "Email support",
        "Basic analytics",
        "Up to 2,000 minutes/month"
      ],
      popular: false
    },
    {
      name: "Growth",
      price: "$0.12/min",
      included: "4,000 mins included",
      description: "Self-serve for businesses with higher call volumes",
      features: [
        "Advanced AI capabilities",
        "Priority integrations",
        "Phone & email support",
        "Advanced analytics",
        "Up to 4,000 minutes/month",
        "Custom caller IDs"
      ],
      popular: true
    },
    {
      name: "Agency",
      price: "$0.12/min",
      included: "6,000 mins included",
      description: "White label platform for agencies and resellers",
      features: [
        "White label solution",
        "Full API access",
        "Dedicated support",
        "Custom branding",
        "Up to 6,000 minutes/month",
        "Multi-tenant management"
      ],
      popular: false
    },
    {
      name: "Enterprise",
      price: "Custom pricing",
      included: "Unlimited usage",
      description: "Top-tier performance, scalability, and support",
      features: [
        "Custom AI training",
        "Enterprise integrations",
        "24/7 dedicated support",
        "Custom analytics",
        "Unlimited minutes",
        "SLA guarantees",
        "On-premise deployment"
      ],
      popular: false
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl mb-4"
          >
            Pricing Plans
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            Choose the perfect plan for your automotive dealership&apos;s needs. All plans include our core AI voice assistant features with varying levels of support and customization.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-primary scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-2 text-sm font-semibold">
                  <div className="flex items-center justify-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {plan.price}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {plan.included}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === "Enterprise" ? CONTACT_URL : REGISTER_URL}
                  className={`w-full inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105'
                      : 'border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground'
                  }`}
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Need a Custom Solution?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Our Enterprise plan offers unlimited customization, dedicated support, and can be tailored to your specific automotive dealership requirements. Contact our sales team to discuss your needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={CONTACT_URL}
                className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
              >
                Contact Sales Team
              </Link>
              <Link
                href={DEMO_BOOKING_URL}
                className="inline-flex items-center rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
