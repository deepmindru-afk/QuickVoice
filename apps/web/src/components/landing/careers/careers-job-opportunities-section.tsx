"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Brain, Target, TrendingUp, Cog, ChevronDown, MapPin, Clock, Award, ExternalLink } from "lucide-react";

const jobCategories = [
  {
    title: "Engineering",
    description: "Build the future of AI voice technology",
    icon: Brain,
    color: "from-blue-500 to-cyan-500",
    jobs: [
      { title: "Senior AI Engineer", location: "Remote", type: "Full-time", experience: "5+ years" },
      { title: "Voice AI Specialist", location: "San Francisco, CA", type: "Full-time", experience: "3+ years" },
      { title: "ML Engineer", location: "Remote", type: "Full-time", experience: "4+ years" },
      { title: "Frontend Developer", location: "New York, NY", type: "Full-time", experience: "2+ years" }
    ]
  },
  {
    title: "Product & Design",
    description: "Shape user experiences and product strategy",
    icon: Target,
    color: "from-emerald-500 to-blue-500",
    jobs: [
      { title: "Product Manager", location: "Remote", type: "Full-time", experience: "4+ years" },
      { title: "UX Designer", location: "San Francisco, CA", type: "Full-time", experience: "3+ years" },
      { title: "Product Designer", location: "Remote", type: "Full-time", experience: "2+ years" }
    ]
  },
  {
    title: "Sales & Marketing",
    description: "Drive growth and market expansion",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    jobs: [
      { title: "Sales Director", location: "New York, NY", type: "Full-time", experience: "6+ years" },
      { title: "Marketing Manager", location: "Remote", type: "Full-time", experience: "3+ years" },
      { title: "Business Development", location: "Remote", type: "Full-time", experience: "4+ years" }
    ]
  },
  {
    title: "Operations",
    description: "Keep our business running smoothly",
    icon: Cog,
    color: "from-orange-500 to-red-500",
    jobs: [
      { title: "Operations Manager", location: "Remote", type: "Full-time", experience: "5+ years" },
      { title: "Customer Success", location: "Remote", type: "Full-time", experience: "2+ years" }
    ]
  }
];

export function CareersJobOpportunitiesSection() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <section id="open-positions" className="relative py-24 bg-background overflow-hidden">
      {/* Background gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mx-auto h-96 max-w-2xl blur-[120px]"
        style={{
          background:
            "linear-gradient(152.92deg, rgba(var(--primary-rgb),0.22) 4.54%, rgba(var(--primary-rgb),0.32) 34.2%, rgba(var(--primary-rgb),0.1) 77.55%)",
        }}
      />
      {/* Seamless blending vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80 dark:from-background/80 dark:via-transparent dark:to-background/95"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mx-auto max-w-2xl"
          >
            <div
              className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
              style={{
                background:
                  "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.6) 4.54%, rgba(var(--primary-rgb), 0.35) 34.2%, rgba(var(--primary-rgb), 0.95) 77.55%)",
              }}
            />
            <h2 className="relative z-10 font-geist text-3xl font-light tracking-tighter text-foreground sm:text-4xl lg:text-5xl mb-4">
              Find Your Perfect Role
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg leading-8 text-muted-foreground max-w-3xl mx-auto"
          >
            Explore opportunities across different teams and find the role that matches your skills and passions.
          </motion.p>
        </div>

        {/* Job Categories */}
        <div className="space-y-4">
          {jobCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: categoryIndex * 0.1 }}
              whileHover={{ y: -2 }}
              className="group relative transform-gpu rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 ease-out hover:border-primary/30 hover:bg-card/80 shadow-[0_14px_40px_rgba(15,23,42,0.25)] hover:shadow-[0_20px_60px_rgba(var(--primary-rgb),0.2)]"
            >
              {/* Subtle distributed glow */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "radial-gradient(circle at center, rgba(var(--primary-rgb), 0.08) 0%, rgba(var(--primary-rgb), 0.04) 40%, transparent 70%)",
                }}
              />

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-0">
                  <div className="flex items-center space-x-4 sm:space-x-5">
                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 transition-all duration-300 ease-out group-hover:bg-primary/15 group-hover:ring-primary/30 group-hover:shadow-[0_0_18px_rgba(var(--primary-rgb),0.4)] flex-shrink-0">
                      <category.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">{category.title}</h3>
                      <p className="text-muted-foreground text-sm">{category.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCategory(selectedCategory === category.title ? null : category.title)}
                    className="relative overflow-hidden rounded-full border border-border px-5 py-2.5 sm:px-6 sm:py-3 text-foreground shadow-sm transition-all duration-300 bg-card/50 hover:border-primary/30 hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.25)] flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <span className="text-sm font-medium">{selectedCategory === category.title ? 'Hide' : 'View'} Jobs</span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${selectedCategory === category.title ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {selectedCategory === category.title && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-3 pt-4 mt-4 border-t border-border/50">
                      {category.jobs.map((job, jobIndex) => (
                        <motion.div
                          key={job.title}
                          initial={{ opacity: 0, x: -20, scale: 0.98 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ duration: 0.4, delay: jobIndex * 0.05 }}
                          whileHover={{ y: -2 }}
                          className="group/job relative transform-gpu rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm p-5 sm:p-6 transition-all duration-300 ease-out hover:border-primary/30 hover:bg-background/80 shadow-sm hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.15)]"
                        >
                          {/* Subtle glow on hover */}
                          <div
                            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/job:opacity-100"
                            style={{
                              background: "radial-gradient(circle at center, rgba(var(--primary-rgb), 0.06) 0%, rgba(var(--primary-rgb), 0.03) 40%, transparent 70%)",
                            }}
                          />

                          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-base sm:text-lg text-foreground mb-2 sm:mb-3 group-hover/job:text-primary transition-colors duration-300">{job.title}</h4>
                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70 flex-shrink-0" />
                                  <span className="truncate">{job.location}</span>
                                </div>
                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70 flex-shrink-0" />
                                  <span>{job.type}</span>
                                </div>
                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                  <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary/70 flex-shrink-0" />
                                  <span>{job.experience}</span>
                                </div>
                              </div>
                            </div>
                            <motion.a
                              href={`/company/contact?role=${encodeURIComponent(job.title)}`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary text-primary-foreground font-semibold px-5 py-2.5 sm:px-6 sm:py-3 shadow-lg hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.6)] transition-all duration-300 flex items-center justify-center whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
                            >
                              Apply Now
                              <ExternalLink className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </motion.a>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
