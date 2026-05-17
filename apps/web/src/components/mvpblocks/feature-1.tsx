'use client'
import { Icons } from "@/components/icons";
import { motion } from 'framer-motion';
import React, { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import complianceData from "@/data/compliance.json";
import {
  DeepgramLogo,
  ElevenlabsLogo,
  MicrosoftForStartups,
  NvidiaInception,
  Pinecone,
  Telnyx,
  Twilio
} from "@/components/ui/partners";

import { cn } from "@/lib/utils";

const useAnimationFrame = (callback: (time: number, delta: number) => void) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let requestId: number;
    let previousTime: number | null = null;

    const animate = (time: number) => {
      if (previousTime !== null) {
        callbackRef.current(time, time - previousTime);
      }
      previousTime = time;
      requestId = requestAnimationFrame(animate);
    };

    requestId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestId);
    };
  }, []);
};

interface MarqueeProps extends React.ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  speed?: number;
  vertical?: boolean;
  repeat?: number;
}

function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  speed = 50,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const singleContentBlockRef = useRef<HTMLDivElement | null>(null);
  const animX = useRef<number>(0);
  const isPaused = useRef<boolean>(false);
  const gapRef = useRef<number>(0);

  // Cache computed gap value — avoids forced style recalculation on every animation frame
  useEffect(() => {
    if (!contentRef.current) return;
    const updateGap = () => {
      if (contentRef.current) {
        const style = window.getComputedStyle(contentRef.current);
        gapRef.current = parseFloat(
          vertical ? style.rowGap || "0" : style.columnGap || "0"
        ) || 0;
      }
    };
    const resizeObserver = new ResizeObserver(updateGap);
    resizeObserver.observe(contentRef.current);
    updateGap();
    return () => resizeObserver.disconnect();
  }, [vertical]);

  useAnimationFrame((t, delta) => {
    if (!containerRef.current || !contentRef.current || !singleContentBlockRef.current) return;

    if (pauseOnHover && isPaused.current) {
      return;
    }

    const singleContentBlockSize = vertical
      ? singleContentBlockRef.current.offsetHeight
      : singleContentBlockRef.current.offsetWidth;

    const computedGap = gapRef.current;
    const loopDistance = singleContentBlockSize + computedGap;
    const dx = (speed * delta) / 1000;
    const effectiveDx = reverse ? dx : -dx;
    animX.current += effectiveDx;

    if (Math.abs(animX.current) >= loopDistance) {
      animX.current = animX.current % loopDistance;
    }

    if (vertical) {
      contentRef.current.style.transform = `translateY(${animX.current}px)`;
    } else {
      contentRef.current.style.transform = `translateX(${animX.current}px)`;
    }
  });

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) {
      isPaused.current = true;
    }
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) {
      isPaused.current = false;
    }
  }, [pauseOnHover]);

  return (
    <div
      {...props}
      ref={containerRef}
      className={cn(
        "group flex overflow-hidden p-2 [--gap:2rem] [gap:var(--gap)]" +
          (vertical ? " flex-col" : " flex-row"),
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={contentRef}
        className={cn(
          "flex shrink-0 justify-around [gap:var(--gap)]" +
            (vertical ? " flex-col" : " flex-row")
        )}
      >
        {Array(repeat)
          .fill(0)
          .map((_, i) => (
            <div key={i} ref={i === 0 ? singleContentBlockRef : null} className="flex gap-8">
              {children}
            </div>
          ))}
      </div>
    </div>
  );
}



const features = [
  {
    title: "Launch in Minutes",
    description:
      "Forget lengthy development cycles. Our intuitive, no-code platform lets you build and deploy a sophisticated AI voice agent instantly.",
    icon: Icons.phoneCall,
  },
  {
    title: "HIPAA Compliant Security",
    description:
      "Built on a foundation of security, meeting stringent HIPAA compliance standards to ensure your sensitive customer data is always protected.",
    icon: Icons.barChart,
  },
  {
    title: "Conversation Analytics",
    description:
      "Every call is a data goldmine. Our built-in CRM automatically syncs every interaction, capturing custom insights that enhance your workflows.",
    icon: Icons.fileText,
  },
  {
    title: "Global Language Support",
    description:
      "Connect with customers worldwide with support for over 100 languages, allowing you to serve customers around the corner or across the globe.",
    icon: Icons.globe,
  },
  {
    title: "24/7 Availability",
    description:
      "Your customers get instant responses any time of day or night, ensuring you never miss a potential conversion opportunity.",
    icon: Icons.clock,
  },
  {
    title: "Seamless Integration",
    description:
      "Works with the tools you already love. Effortlessly connect to your existing CRM and telephony systems to streamline operations.",
    icon: Icons.plug,
  },
];

function ComplianceCertifications() {
  return (
    <section id="features" className="relative py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="mt-4 text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl">
            Enterprise-Grade Security & Compliance
          </h2>
          <p className="text-muted-foreground mt-3">
            Certified to the highest industry standards to protect your data
          </p>
        </div>
        <div className="flex flex-row items-center justify-center gap-8 md:gap-12 lg:gap-16 flex-wrap">
          {complianceData.compliance.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group"
              whileHover={{ scale: 1.1, y: -8 }}
              transition={{ 
                opacity: { duration: 0.5, delay: index * 0.1 },
                scale: { type: "spring", stiffness: 300, damping: 20 },
                y: { type: "spring", stiffness: 300, damping: 20 }
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 scale-150"></div>

              {/* Main badge container */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full overflow-hidden bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 group-hover:border-primary/50 shadow-lg group-hover:shadow-2xl group-hover:[box-shadow:0_0_30px_rgba(var(--primary-rgb),0.3)] transition-all duration-300 flex items-center justify-center p-2">
                {/* Gradient overlay */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                {/* Animated ring */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/0 group-hover:border-primary/30 transition-all duration-300 scale-0 group-hover:scale-110"></div>

                <Image
                  src={item.url}
                  alt={item.alt}
                  width={144}
                  height={144}
                  sizes="(max-width: 768px) 96px, (max-width: 1024px) 128px, 144px"
                  className="w-full h-full object-contain rounded-full relative z-10 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnersSection() {
  const partners = [
    { name: 'Deepgram', logo: DeepgramLogo },
    { name: 'ElevenLabs', logo: ElevenlabsLogo },
    { name: 'Microsoft for Startups', logo: MicrosoftForStartups },
    { name: 'Pinecone', logo: Pinecone },
    { name: 'Nvidia Inception', logo: NvidiaInception },
    { name: 'Telnyx', logo: Telnyx },
    { name: 'Twilio', logo: Twilio },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-screen-xl px-4 md:px-8">
        <div className="relative mx-auto max-w-2xl sm:text-center mb-12">
          <div className="relative z-10">
            <h2 className="mt-4 text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl">
              Our Partners
            </h2>
            <p className="text-foreground/60 mt-3">
              We partner with the best in the business to bring you the best experience possible
            </p>
          </div>
          <div
            className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
            style={{
              background:
                "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.2) 4.54%, rgba(var(--primary-rgb), 0.26) 34.2%, rgba(var(--primary-rgb), 0.1) 77.55%)",
            }}></div>
        </div>
        <div className="relative">
          <Marquee pauseOnHover speed={30} className="[--gap:3rem]">
            {partners.map((partner, index) => {
              const LogoComponent = partner.logo;
              return (
                <div
                  key={index}
                  className="flex items-center justify-center h-24 w-auto px-8 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`flex items-center justify-center h-20 w-auto overflow-hidden opacity-60 hover:opacity-100 transition-opacity duration-300 dark:opacity-70 dark:hover:opacity-100 [&>svg]:!h-20 [&>svg]:w-auto [&>svg]:!max-h-20 [&>svg]:max-w-[180px]`}>
                    <LogoComponent />
                  </div>
                </div>
              );
            })}
          </Marquee>
        </div>
      </div>
    </section>
  );
}

export default function Feature1() {
  return (
    <>
      <ComplianceCertifications />
      <section className="relative py-20 md:py-28">
      <div className="mx-auto max-w-screen-xl px-4 md:px-8">
        <div className="relative mx-auto max-w-2xl sm:text-center">
          <div className="relative z-10">
            <h2 className="mt-4 text-3xl font-normal tracking-tighter sm:text-4xl md:text-5xl">
              Why QuickVoice is the Smarter Choice
            </h2>
            <p className="text-foreground/60 mt-3">
              We&apos;ve engineered QuickVoice to be a seamless, powerful, and secure
              extension of your brand. Here&apos;s how we deliver unrivaled value.
            </p>
          </div>
          <div
            className="absolute inset-0 mx-auto h-44 max-w-xs blur-[118px]"
            style={{
              background:
                "linear-gradient(152.92deg, rgba(var(--primary-rgb), 0.2) 4.54%, rgba(var(--primary-rgb), 0.26) 34.2%, rgba(var(--primary-rgb), 0.1) 77.55%)",
            }}></div>
        </div>
        <hr className="bg-foreground/30 mx-auto mt-5 h-px w-1/2" />
        <div className="relative mt-12">
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item, idx) => (
              <li
                key={idx}
                className="transform-gpu space-y-3 rounded-xl border bg-transparent p-4 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.18)_inset]">
                <div className="text-primary w-fit transform-gpu rounded-full border p-4 [box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.25)_inset] dark:[box-shadow:0_-20px_80px_-20px_rgba(var(--primary-rgb),0.06)_inset]">
                  <item.icon
                    className="h-6 w-6 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-bold tracking-tighter">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
    <PartnersSection />
    </>
  );
}
