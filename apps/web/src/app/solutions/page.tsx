import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Headphones, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_BOOKING_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "AI Voice Agent Solutions | QuickVoice",
  description:
    "Explore QuickVoice AI voice agent solutions for reception, call answering, appointment booking, routing, and front-office automation.",
  alternates: {
    canonical: "https://quickvoice.co/solutions",
  },
  openGraph: {
    title: "AI Voice Agent Solutions | QuickVoice",
    description:
      "Explore QuickVoice AI voice agent solutions for reception, call answering, appointment booking, routing, and front-office automation.",
    url: "https://quickvoice.co/solutions",
    siteName: "QuickVoice",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Voice Agent Solutions | QuickVoice",
    description:
      "Explore QuickVoice AI voice agent solutions for reception, call answering, appointment booking, routing, and front-office automation.",
    images: ["/og-image.png"],
  },
};

const solutions = [
  {
    title: "AI Receptionist",
    description:
      "Answer calls 24/7, capture caller intent, schedule appointments, and route urgent conversations to the right person.",
    href: "/solutions/ai-receptionist",
    icon: Bot,
  },
  {
    title: "AI Answering Service",
    description:
      "Replace missed calls and voicemail backlogs with instant, branded call handling that collects details and triggers follow-up.",
    href: "/solutions/ai-answering-service",
    icon: Headphones,
  },
  {
    title: "Appointment Scheduling",
    description:
      "Let callers book, reschedule, confirm, or cancel appointments without waiting for staff to pick up.",
    href: "/use-cases/appointment-scheduling",
    icon: CalendarCheck,
  },
];

export default function SolutionsPage() {
  return (
    <main className="bg-background text-foreground">
      <section className="mx-auto flex min-h-[72vh] w-full max-w-7xl flex-col justify-center px-6 py-20 md:px-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase text-primary">
            QuickVoice solutions
          </p>
          <h1 className="mt-4 text-4xl font-semibold md:text-6xl">
            AI voice agents for every front-office call flow
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Deploy voice agents that answer calls, qualify requests, book meetings,
            and hand off complex conversations with transcripts and context.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={DEMO_BOOKING_URL}>Book a Demo</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <Link
                key={solution.href}
                href={solution.href}
                className="group rounded-lg border bg-card p-6 transition hover:border-primary/60 hover:shadow-sm"
              >
                <Icon className="h-6 w-6 text-primary" />
                <h2 className="mt-5 text-xl font-semibold">{solution.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {solution.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
