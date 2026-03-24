import {
  getCaseStudyBySlug,
  getAllSlugs,
  getRelatedCaseStudies,
} from "@/lib/case-studies";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Tag,
  TrendingUp,
  BarChart2,
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return { title: "Case study not found" };
  return {
    title: study.metaTitle || study.title,
    description: study.metaDescription,
    alternates: { canonical: study.canonical },
    openGraph: {
      title: study.metaTitle || study.title,
      description: study.metaDescription,
      type: "article",
      tags: study.tags,
      url: study.canonical,
      siteName: "QuickVoice",
      images: [
        {
          url: study.ogImage || "/og-image.png",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: study.metaTitle || study.title,
      description: study.metaDescription,
      images: [study.ogImage || "/og-image.png"],
    },
  };
}

const INDUSTRY_META: Record<string, { color: string; bg: string }> = {
  Healthcare: { color: "text-red-500", bg: "bg-red-500/10" },
  Automotive: { color: "text-orange-500", bg: "bg-orange-500/10" },
  "E-Commerce & Retail": { color: "text-pink-500", bg: "bg-pink-500/10" },
  "Financial Services": { color: "text-emerald-500", bg: "bg-emerald-500/10" },
  "Real Estate": { color: "text-sky-500", bg: "bg-sky-500/10" },
  "Travel & Hospitality": { color: "text-violet-500", bg: "bg-violet-500/10" },
  Manufacturing: { color: "text-amber-500", bg: "bg-amber-500/10" },
  Education: { color: "text-blue-500", bg: "bg-blue-500/10" },
  "HR & Recruiting": { color: "text-teal-500", bg: "bg-teal-500/10" },
  "Logistics & Supply Chain": { color: "text-indigo-500", bg: "bg-indigo-500/10" },
  SaaS: { color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
};

function defaultMeta() {
  return { color: "text-primary", bg: "bg-primary/10" };
}

export default async function CaseStudyDetailPage({ params }: Props) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) notFound();

  const related = getRelatedCaseStudies(slug, 3);
  const meta = INDUSTRY_META[study.industry] || defaultMeta();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: study.metaTitle || study.title,
    description: study.metaDescription,
    author: {
      "@type": "Organization",
      name: "QuickVoice",
      url: "https://quickvoice.co",
    },
    publisher: {
      "@type": "Organization",
      name: "QuickVoice",
      url: "https://quickvoice.co",
      logo: {
        "@type": "ImageObject",
        url: "https://quickvoice.co/logo.svg",
      },
    },
    datePublished: "2026-02-28",
    dateModified: "2026-02-28",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://quickvoice.co/case-studies/${study.slug}`,
    },
    image: study.ogImage
      ? `https://quickvoice.co${study.ogImage}`
      : "https://quickvoice.co/og-image.png",
    url: `https://quickvoice.co/case-studies/${study.slug}`,
    keywords: study.tags.join(", "),
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
        name: "Case Studies",
        item: "https://quickvoice.co/case-studies",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: study.industry,
        item: `https://quickvoice.co/case-studies#${study.industry.toLowerCase().replace(/[\s&]+/g, "-")}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: study.title,
        item: `https://quickvoice.co/case-studies/${study.slug}`,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleSchema, breadcrumbSchema]),
        }}
      />

      {/* Sticky breadcrumb bar */}
      <div className="border-b border-border bg-background/80 backdrop-blur sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href="/case-studies"
            className="hover:text-foreground transition-colors"
          >
            Case Studies
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={`${meta.color} font-medium`}>
            {study.industry}
          </span>
          <ChevronRight className="h-3.5 w-3.5 hidden sm:block" />
          <span className="hidden sm:block text-foreground truncate max-w-xs">
            {study.title}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-10 pb-24">
        <div className="grid lg:grid-cols-[1fr_300px] gap-12 items-start">
          {/* Main content */}
          <article>
            {/* Back link */}
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all case studies
            </Link>

            {/* Article header */}
            <header className="mb-10">
              {/* Industry + use case badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${meta.bg} ${meta.color}`}
                >
                  <Building2 className="h-3 w-3" />
                  {study.industry}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border">
                  {study.useCase}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-6">
                {study.title}
              </h1>

              {/* Company profile card */}
              <div className="rounded-xl border border-border bg-card p-6 mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Industry
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {study.industry}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Company Size
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {study.companySize}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {study.location}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Key Result
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {study.heroStat}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {study.heroStatLabel}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {study.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  {study.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Article body */}
            <div className="min-w-0">
              <MarkdownRenderer content={study.content} />
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-blue-600/5 p-8 text-center">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Ready to see results like these?
              </h2>
              <p className="text-muted-foreground text-sm mb-5">
                Deploy an AI voice agent for your {study.industry.toLowerCase()} business in under 30 minutes. No code, no credit card.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--primary), #1e40af)",
                  }}
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/company/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
                >
                  Book a Demo
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-28 space-y-8">
            {/* Key metric highlight */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-6 text-center">
              <div className="text-4xl font-bold text-primary mb-1">
                {study.heroStat}
              </div>
              <div className="text-sm text-muted-foreground">
                {study.heroStatLabel}
              </div>
            </div>

            {/* Related case studies */}
            {related.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">
                  Related Case Studies
                </h3>
                <div className="space-y-4">
                  {related.map((rel) => {
                    const relMeta =
                      INDUSTRY_META[rel.industry] || defaultMeta();
                    return (
                      <Link
                        key={rel.slug}
                        href={`/case-studies/${rel.slug}`}
                        className="group block"
                      >
                        <div className="flex gap-3 items-start">
                          <div
                            className={`flex-shrink-0 rounded-lg p-1.5 ${relMeta.bg} ${relMeta.color} mt-0.5`}
                          >
                            <BarChart2 className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {rel.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {rel.industry} &middot; {rel.heroStat}{" "}
                              {rel.heroStatLabel}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick CTA card */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-5">
              <h3 className="font-semibold text-foreground mb-2 text-sm">
                Try QuickVoice Free
              </h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Deploy an AI voice agent in under 30 minutes. No code, no credit card, 14-day free trial.
              </p>
              <Link
                href="/register"
                className="block text-center rounded-full py-2 text-sm font-medium text-white transition-all hover:shadow-md"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--primary), #1e40af)",
                }}
              >
                Get Started Free
              </Link>
            </div>

            {/* Browse industries */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
                Browse by Industry
              </h3>
              <div className="space-y-1">
                {Object.entries(INDUSTRY_META).map(([industry, m]) => (
                  <Link
                    key={industry}
                    href={`/case-studies#${industry.toLowerCase().replace(/[\s&]+/g, "-")}`}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-muted transition-colors ${
                      industry === study.industry
                        ? `${m.bg} ${m.color} font-medium`
                        : "text-muted-foreground"
                    }`}
                  >
                    <Building2 className="h-3 w-3" />
                    {industry}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
