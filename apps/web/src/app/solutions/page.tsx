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
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden px-6 pt-28 pb-16 md:px-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(var(--primary-rgb),0.18),transparent_32%),linear-gradient(135deg,rgba(var(--primary-rgb),0.08),transparent_52%)]" />
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              QuickVoice solutions
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
              Built for the calls your team keeps missing.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              QuickVoice voice agents answer, qualify, schedule, route, and
              follow up with callers while your staff focuses on the work that
              needs a human.
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
          <div className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
            {[
              [
                "Answer every call",
                "Instant pickup for inbound demand, after-hours coverage, and overflow.",
              ],
              [
                "Collect useful context",
                "Caller intent, transcript, disposition, and next step captured automatically.",
              ],
              [
                "Hand off cleanly",
                "Escalate complex conversations with summary and call history attached.",
              ],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-4"
              >
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-20 md:px-10">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Choose the workflow you want to automate first
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each solution is designed around a real phone workflow, not a
            generic chatbot script.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <Link
                key={solution.href}
                href={solution.href}
                className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary/60 hover:shadow-md hover:shadow-primary/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold">{solution.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {solution.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Explore{" "}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-muted/40 p-6 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <h2 className="text-xl font-semibold">Not sure where to start?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Book a working session and we will map your call volume, routing
              rules, integrations, and compliance needs to the right first
              agent.
            </p>
          </div>
          <div className="mt-5 md:mt-0">
            <Button asChild size="lg">
              <Link href={DEMO_BOOKING_URL}>Book a Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
