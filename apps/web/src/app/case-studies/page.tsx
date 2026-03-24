import { getAllCaseStudies, getAllIndustries } from "@/lib/case-studies";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  Building2,
  TrendingUp,
  ArrowRight,
  BarChart2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Voice Agent Case Studies & ROI Data",
  description:
    "See how businesses use QuickVoice AI voice agents to cut costs and automate calls. 33 case studies with real ROI data across 11 industries.",
  alternates: { canonical: "https://quickvoice.co/case-studies" },
  openGraph: {
    title: "QuickVoice Case Studies — Real Results, Real ROI",
    description:
      "33 case studies showing how businesses use AI voice agents to automate calls, reduce no-shows, and drive revenue.",
    type: "website",
    url: "https://quickvoice.co/case-studies",
    siteName: "QuickVoice",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickVoice Case Studies — Real Results, Real ROI",
    description:
      "33 case studies showing how businesses use AI voice agents to automate calls, reduce no-shows, and drive revenue.",
    images: ["/og-image.png"],
  },
};

const INDUSTRY_META: Record<
  string,
  { color: string; bg: string; slug: string }
> = {
  Healthcare: { color: "text-red-500", bg: "bg-red-500/10", slug: "healthcare" },
  Automotive: { color: "text-orange-500", bg: "bg-orange-500/10", slug: "automotive" },
  "E-Commerce & Retail": { color: "text-pink-500", bg: "bg-pink-500/10", slug: "e-commerce" },
  "Financial Services": { color: "text-emerald-500", bg: "bg-emerald-500/10", slug: "financial-services" },
  "Real Estate": { color: "text-sky-500", bg: "bg-sky-500/10", slug: "real-estate" },
  "Travel & Hospitality": { color: "text-violet-500", bg: "bg-violet-500/10", slug: "travel-hospitality" },
  Manufacturing: { color: "text-amber-500", bg: "bg-amber-500/10", slug: "manufacturing-engineering" },
  Education: { color: "text-blue-500", bg: "bg-blue-500/10", slug: "education" },
  "HR & Recruiting": { color: "text-teal-500", bg: "bg-teal-500/10", slug: "hr-recruiting" },
  "Logistics & Supply Chain": { color: "text-indigo-500", bg: "bg-indigo-500/10", slug: "logistics" },
  SaaS: { color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", slug: "saas" },
};

function defaultIndustryMeta() {
  return { color: "text-primary", bg: "bg-primary/10", slug: "" };
}

export default function CaseStudiesIndexPage() {
  const allStudies = getAllCaseStudies();
  const industries = getAllIndustries();

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "QuickVoice Case Studies — AI Voice Agent Results Across 11 Industries",
    description:
      "See how businesses use QuickVoice AI voice agents to cut costs, boost revenue, and automate phone operations. 33 case studies with real ROI data.",
    url: "https://quickvoice.co/case-studies",
    publisher: {
      "@type": "Organization",
      name: "QuickVoice",
      url: "https://quickvoice.co",
      logo: { "@type": "ImageObject", url: "https://quickvoice.co/logo.svg" },
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://quickvoice.co" },
      { "@type": "ListItem", position: 2, name: "Case Studies", item: "https://quickvoice.co/case-studies" },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([collectionSchema, breadcrumbSchema]),
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 px-4">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-blue-600/5" />
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
              <BarChart2 className="h-3.5 w-3.5" />
              <span>{allStudies.length} case studies across {industries.length} industries</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 leading-tight">
              Real Results from
              <br />
              <span className="text-primary">AI Voice Agents</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how businesses across healthcare, automotive, e-commerce, and more use QuickVoice to automate calls, cut costs, and drive revenue — with measurable ROI.
            </p>
          </div>

          {/* Stats bar */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: "33", label: "Case Studies" },
              { value: "11", label: "Industries" },
              { value: "Avg 1,847%", label: "ROI" },
              { value: "$0.65–$4", label: "Cost Per Contact" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center rounded-xl border border-border bg-card p-4"
              >
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-24">
        {/* Industry sections */}
        {industries.map((industry) => {
          const meta = INDUSTRY_META[industry] || defaultIndustryMeta();
          const studies = allStudies.filter((s) => s.industry === industry);
          return (
            <section key={industry} className="mb-16" id={industry.toLowerCase().replace(/[\s&]+/g, "-")}>
              {/* Section header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${meta.bg} ${meta.color}`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{industry}</h2>
                    <p className="text-xs text-muted-foreground">
                      {studies.length} case {studies.length === 1 ? "study" : "studies"}
                    </p>
                  </div>
                </div>
                {meta.slug && (
                  <Link
                    href={`/industries/${meta.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:flex items-center gap-1"
                  >
                    View industry page <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>

              {/* Case study cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {studies.map((study) => (
                  <Link
                    key={study.slug}
                    href={`/case-studies/${study.slug}`}
                    className="group block rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-6 flex flex-col h-full">
                      {/* Industry + use case badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.color}`}
                        >
                          {industry}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                          {study.useCase}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-base leading-snug mb-3">
                        {study.title}
                      </h3>

                      {/* Hero stat */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-bold text-primary">
                          {study.heroStat}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {study.heroStatLabel}
                        </span>
                      </div>

                      {/* Excerpt */}
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
                        {study.metaDescription}
                      </p>

                      {/* Footer */}
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          <span>{study.companySize}</span>
                        </div>
                        <span className="flex items-center gap-0.5 text-primary font-medium group-hover:gap-1.5 transition-all">
                          Read case study <ChevronRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* Bottom CTA */}
        <section className="mt-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-blue-600/5 p-10 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Ready to become the next case study?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join businesses across 11 industries already using QuickVoice to automate calls and drive measurable ROI. Start free — no credit card, no code, first agent live in under 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 font-medium text-white transition-all hover:shadow-lg"
              style={{ backgroundImage: "linear-gradient(to right, var(--primary), #1e40af)" }}
            >
              Start Free Trial
            </Link>
            <Link
              href="/company/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3 font-medium text-foreground hover:bg-muted transition-all"
            >
              Book a Demo
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
