import type { Metadata } from "next";
import { DEMO_BOOKING_URL } from "@/lib/links";
import Link from "next/link";
import {
  Phone,
  Clock,
  DollarSign,
  Bot,
  Globe,
  ShieldCheck,
  Zap,
  BarChart3,
  Building2,
  Stethoscope,
  Scale,
  Home,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

/* ================================================================== */
/*  Metadata                                                           */
/* ================================================================== */

export const metadata: Metadata = {
  title: "AI Answering Service — Never Miss a Call",
  description:
    "QuickVoice AI answering service picks up every call 24/7 at $0.20/min. Replace hold music with instant, human-like responses. Start free today.",
  keywords:
    "ai answering service, AI phone answering, virtual receptionist AI, automated answering service, AI call answering, 24/7 answering service",
  alternates: {
    canonical: "https://quickvoice.co/solutions/ai-answering-service",
  },
  openGraph: {
    title: "AI Answering Service — Never Miss a Call",
    description:
      "QuickVoice AI answering service picks up every call 24/7 at $0.20/min. Replace hold music with instant, human-like responses.",
    type: "website",
    url: "https://quickvoice.co/solutions/ai-answering-service",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Answering Service — Never Miss a Call",
    description:
      "QuickVoice AI answering service picks up every call 24/7 at $0.20/min. Replace hold music with instant, human-like responses.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/* ================================================================== */
/*  Static data                                                        */
/* ================================================================== */

const FEATURES = [
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Your AI answering service never sleeps. Every call is picked up instantly — nights, weekends, and holidays included.",
  },
  {
    icon: Globe,
    title: "100+ Languages",
    description:
      "Serve callers in their preferred language with real-time multilingual support. No additional staff required.",
  },
  {
    icon: Zap,
    title: "Instant Call Handling",
    description:
      "Zero hold times. Callers get immediate, context-aware responses powered by natural language processing.",
  },
  {
    icon: Bot,
    title: "Human-Like Conversations",
    description:
      "Advanced AI voice models deliver natural, empathetic dialogue that callers trust and prefer over robotic IVR menus.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description:
      "SOC 2 Type II certified, HIPAA-ready logging, end-to-end encryption, and PII redaction built in.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Track call volume, resolution rates, caller sentiment, and peak hours from a single dashboard.",
  },
];

const INDUSTRIES = [
  {
    icon: Building2,
    title: "Small Business",
    description:
      "Never lose a lead after hours. Capture caller info, answer FAQs, and route urgent calls to your mobile.",
    href: "/industries",
  },
  {
    icon: Stethoscope,
    title: "Healthcare",
    description:
      "HIPAA-compliant appointment scheduling, prescription refill requests, and patient triage — 24/7.",
    href: "/industries/healthcare",
  },
  {
    icon: Scale,
    title: "Legal",
    description:
      "Screen potential clients, schedule consultations, and capture case details without missing billable hours.",
    href: "/industries",
  },
  {
    icon: Home,
    title: "Real Estate",
    description:
      "Qualify leads, schedule showings, and provide property details to every caller — even at midnight.",
    href: "/industries/real-estate",
  },
  {
    icon: Briefcase,
    title: "Professional Services",
    description:
      "Route calls intelligently, manage appointment bookings, and deliver polished first impressions at scale.",
    href: "/industries",
  },
  {
    icon: DollarSign,
    title: "Financial Services",
    description:
      "Handle account inquiries, route to the right advisor, and maintain full compliance with regulatory requirements.",
    href: "/industries/financial-services",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Availability",
    ai: "24/7/365",
    traditional: "Business hours (or premium for after-hours)",
  },
  {
    feature: "Cost per minute",
    ai: "$0.20/min",
    traditional: "$1.00 - $3.00/min",
  },
  { feature: "Hold time", ai: "0 seconds", traditional: "30 sec - 5+ minutes" },
  {
    feature: "Languages supported",
    ai: "100+",
    traditional: "1 - 3 (extra cost)",
  },
  {
    feature: "Scalability",
    ai: "Unlimited concurrent calls",
    traditional: "Limited by staff count",
  },
  {
    feature: "Setup time",
    ai: "Under 5 minutes",
    traditional: "Days to weeks",
  },
  {
    feature: "Call analytics",
    ai: "Real-time dashboard",
    traditional: "Monthly reports (if any)",
  },
  {
    feature: "Consistency",
    ai: "Every call, every time",
    traditional: "Varies by operator",
  },
];

const FAQS = [
  {
    q: "What is an AI answering service?",
    a: "An AI answering service uses advanced voice AI to answer phone calls on behalf of your business. It understands natural language, responds in a human-like voice, captures caller information, schedules appointments, answers FAQs, and routes urgent calls — all without a live operator.",
  },
  {
    q: "How does QuickVoice compare to a traditional answering service?",
    a: "QuickVoice answers every call instantly with zero hold time, operates 24/7/365, supports 100+ languages, and costs as little as $0.20 per minute. Traditional services typically charge $1-3 per minute, are limited by staff availability, and may put callers on hold during peak periods.",
  },
  {
    q: "Can the AI answering service transfer calls to a live person?",
    a: "Yes. You can configure rules to transfer calls to a live agent based on caller intent, keywords, VIP caller lists, or time of day. The AI provides a warm handoff with full context so the human agent is up to speed immediately.",
  },
  {
    q: "Is QuickVoice HIPAA compliant for healthcare use?",
    a: "Yes. Our Scale and Enterprise plans include HIPAA-ready logging, automatic PHI redaction, and we can sign a Business Associate Agreement (BAA). This makes QuickVoice suitable for medical offices, dental clinics, and other healthcare organizations.",
  },
  {
    q: "How long does it take to set up?",
    a: "Most businesses are live in under 5 minutes. You create an AI agent in the QuickVoice dashboard, configure your greeting and call-handling rules, and forward your business phone number. No coding or hardware is required.",
  },
  {
    q: "What happens if the AI cannot handle a caller's request?",
    a: "The AI is designed to gracefully escalate. It can transfer the call to a live person, take a detailed message with a callback number, or send an email notification to your team. You control the escalation rules from your dashboard.",
  },
];

/* ================================================================== */
/*  JSON-LD structured data                                            */
/* ================================================================== */

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://quickvoice.co",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Solutions",
      item: "https://quickvoice.co/solutions",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "AI Answering Service",
      item: "https://quickvoice.co/solutions/ai-answering-service",
    },
  ],
};

/* ================================================================== */
/*  Page component                                                     */
/* ================================================================== */

export default function AIAnsweringServicePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── JSON-LD ─────────────────────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 text-center">
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[10%] left-1/2 h-[40%] w-[60%] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="container mx-auto max-w-4xl px-4">
          <p className="mb-4 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-sm font-medium text-primary">
            AI Answering Service
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Never Miss a Call Again
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            QuickVoice&apos;s AI answering service picks up every call
            instantly, 24/7, in over 100 languages — at a fraction of the cost
            of a traditional answering service. No hold music. No missed leads.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={DEMO_BOOKING_URL}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              Book a Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-8 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              Try the Builder
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required. Live in under 5 minutes.
          </p>
        </div>
      </section>

      {/* ── Why AI vs Traditional ────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight">
            Why Choose AI Over a Traditional Answering Service?
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            Traditional answering services are expensive, limited by staff
            availability, and inconsistent. AI changes the equation.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border p-4 text-left font-medium text-muted-foreground">
                    Feature
                  </th>
                  <th className="border-b border-primary bg-primary/5 p-4 text-center font-semibold">
                    <span className="flex items-center justify-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      QuickVoice AI
                    </span>
                  </th>
                  <th className="border-b border-border p-4 text-center font-semibold">
                    Traditional Service
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="bg-primary/5 p-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-primary">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {row.ai}
                      </span>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {row.traditional}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Key Features ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight">
            Everything You Need in an AI Answering Service
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            QuickVoice goes far beyond basic call answering. Here is what you
            get out of the box.
          </p>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industry Applications ─────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight">
            AI Answering for Every Industry
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            From solo practitioners to enterprise teams, QuickVoice adapts to
            the way your industry handles calls.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((industry) => (
              <Link
                key={industry.title}
                href={industry.href}
                className="group rounded-2xl border border-border bg-background p-6 transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <industry.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold">
                  {industry.title}
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </h3>
                <p className="text-sm text-muted-foreground">
                  {industry.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Comparison ────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight">
            Save Up to 90% vs. Traditional Answering Services
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
            Human answering services charge $1 - $3 per minute and still put
            your callers on hold. QuickVoice answers instantly at $0.20/min.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* AI Card */}
            <div className="relative rounded-2xl border-2 border-primary bg-primary/5 p-8">
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                RECOMMENDED
              </span>
              <div className="mb-4 flex items-center gap-3">
                <Bot className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">QuickVoice AI</h3>
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">$0.20</span>
                <span className="text-muted-foreground">/min</span>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  "24/7/365 availability",
                  "Zero hold time",
                  "100+ languages included",
                  "Unlimited concurrent calls",
                  "Real-time analytics dashboard",
                  "No contracts or setup fees",
                  "Live in under 5 minutes",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="mt-8 block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                View All Plans
              </Link>
            </div>

            {/* Traditional Card */}
            <div className="rounded-2xl border border-border bg-background p-8">
              <div className="mb-4 flex items-center gap-3">
                <Phone className="h-8 w-8 text-muted-foreground" />
                <h3 className="text-xl font-bold">Traditional Service</h3>
              </div>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">$1 - $3</span>
                <span className="text-muted-foreground">/min</span>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Business hours (after-hours costs extra)",
                  "30-second to 5-minute hold times",
                  "1 - 3 languages (extra fees)",
                  "Limited by operator count",
                  "Monthly PDF reports",
                  "12-month contracts typical",
                  "1 - 2 week onboarding",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 block w-full rounded-lg border border-border bg-muted px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                Industry Average
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-2 text-center text-3xl font-bold tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
            Everything you need to know about our AI answering service.
            Can&apos;t find what you&apos;re looking for?{" "}
            <Link
              href="/company/contact"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Contact our team
            </Link>
            .
          </p>

          <dl className="divide-y divide-border">
            {FAQS.map((faq) => (
              <div key={faq.q} className="py-6">
                <dt className="text-base font-semibold">{faq.q}</dt>
                <dd className="mt-2 text-muted-foreground">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Let AI Answer Your Calls?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join thousands of businesses that trust QuickVoice to deliver
            instant, professional call handling around the clock. Book a demo to
            map your call volume, transfer rules, and rollout plan.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={DEMO_BOOKING_URL}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              Book a Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-8 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              Try the Builder
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
