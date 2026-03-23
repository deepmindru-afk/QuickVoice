'use client';

import React, { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const defaultTestimonials = [
  {
    text: "We deployed our first AI voice agent in under 10 minutes. It now handles 70% of appointment scheduling calls without any human intervention.",
    imageSrc: "https://api.dicebear.com/7.x/initials/svg?seed=SM&backgroundColor=6366f1",
    name: "Sarah M.",
    username: "Practice Manager",
    role: "Multi-Location Healthcare Group",
  },
  {
    text: "HIPAA compliance was non-negotiable for us. QuickVoice gave us the security certifications we needed while dramatically reducing missed calls.",
    imageSrc: "https://api.dicebear.com/7.x/initials/svg?seed=JT&backgroundColor=8b5cf6",
    name: "James T.",
    username: "Director of Operations",
    role: "Regional Hospital System",
  },
  {
    text: "The CRM integration alone saved our team 15 hours per week. Every call is logged, transcribed, and synced to HubSpot automatically.",
    imageSrc: "https://api.dicebear.com/7.x/initials/svg?seed=MR&backgroundColor=2563eb",
    name: "Michael R.",
    username: "VP of Sales",
    role: "B2B SaaS Company",
  },
  {
    text: "We went from missing 40% of after-hours calls to capturing every single inquiry. Our lead conversion rate increased by 35% in the first month.",
    imageSrc: "https://api.dicebear.com/7.x/initials/svg?seed=LK&backgroundColor=7c3aed",
    name: "Lisa K.",
    username: "Business Development Lead",
    role: "Commercial Real Estate Firm",
  },
  {
    text: "Multi-language support was the deciding factor. Our AI agents now handle calls in English, Spanish, and French across all our locations.",
    imageSrc: "https://api.dicebear.com/7.x/initials/svg?seed=DP&backgroundColor=4f46e5",
    name: "David P.",
    username: "Customer Experience Director",
    role: "National Retail Chain",
  },
  {
    text: "We replaced our legacy IVR with QuickVoice and saw customer satisfaction scores jump from 3.2 to 4.6 out of 5 within 60 days.",
    imageSrc: "https://api.dicebear.com/7.x/initials/svg?seed=RW&backgroundColor=6d28d9",
    name: "Rachel W.",
    username: "Contact Center Manager",
    role: "Financial Services Provider",
  },
];

interface TestimonialProps {
  testimonials?: {
    text: string;
    imageSrc: string;
    name: string;
    username: string;
    role?: string;
  }[];
  title?: string;
  subtitle?: string;
  autoplaySpeed?: number;
  className?: string;
}

export default function TestimonialsCarousel({
  testimonials = defaultTestimonials,
  title = 'Trusted by Over 100 Companies Worldwide',
  subtitle = 'From healthcare startups to global e-commerce leaders, businesses across every sector trust QuickVoice to automate and elevate their communications.',
  autoplaySpeed = 3000,
  className,
}: TestimonialProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, autoplaySpeed);

    return () => {
      clearInterval(autoplay);
    };
  }, [emblaApi, autoplaySpeed]);

  return (
    <section
      id="testimonials"
      className={cn('relative overflow-hidden py-20 md:py-28', className)}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.2),transparent_60%)]" />
        <div className="bg-primary/5 absolute top-1/4 left-1/4 h-32 w-32 rounded-full blur-3xl" />
        <div className="bg-primary/10 absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative mb-12 text-center md:mb-16"
        >
          <h2 className="from-foreground to-foreground/70 mb-4 pb-4 bg-gradient-to-b bg-clip-text text-3xl font-bold text-transparent md:text-5xl lg:text-6xl">
            {title}
          </h2>

          <motion.p
            className="text-muted-foreground mx-auto max-w-2xl text-base md:text-lg"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* Testimonials carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {testimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="flex-shrink-0 basis-[350px] md:basis-[400px] px-4"
              >
                <div
                  className="border-border from-secondary/20 to-card relative h-full rounded-2xl border bg-gradient-to-b p-6 shadow-md backdrop-blur-sm"
                >
                  {/* Enhanced decorative gradients */}
                  <div className="from-primary/15 to-card absolute -top-5 -left-5 -z-10 h-40 w-40 rounded-full bg-gradient-to-b blur-md" />
                  <div className="from-primary/10 absolute -right-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-gradient-to-t to-transparent opacity-70 blur-xl" />

                  <div className="text-primary mb-4">
                    <Quote className="h-10 w-10 -rotate-180" />
                  </div>

                  <p className="text-foreground/90 relative mb-6 text-base leading-relaxed">
                    {testimonial.text}
                  </p>

                  {/* User info */}
                  <div className="border-border/40 mt-auto flex items-center gap-3 border-t pt-2">
                    <Avatar className="border-border ring-primary/10 ring-offset-background h-10 w-10 border ring-2 ring-offset-1">
                      {testimonial.imageSrc ? (
                        <AvatarImage
                          src={testimonial.imageSrc}
                          alt={testimonial.name}
                        />
                      ) : null}
                      <AvatarFallback>
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-foreground font-medium whitespace-nowrap">
                        {testimonial.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {testimonial.username && (
                          <p className="text-primary/80 text-sm whitespace-nowrap">
                            {testimonial.username}
                          </p>
                        )}
                        {testimonial.role && (
                          <>
                            {testimonial.username && (
                              <span className="text-muted-foreground flex-shrink-0">
                                &bull;
                              </span>
                            )}
                            <p className="text-muted-foreground text-sm whitespace-nowrap">
                              {testimonial.role}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
