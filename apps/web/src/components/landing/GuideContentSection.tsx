import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import Link from "next/link";
import { REGISTER_URL } from "@/lib/links";

interface Props {
  content: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function GuideContentSection({
  content,
  ctaHref = REGISTER_URL,
  ctaLabel = "Start Free Trial",
}: Props) {
  return (
    <section className="bg-background py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-3">
            In-Depth Guide
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Markdown body */}
        <div className="min-w-0">
          <MarkdownRenderer content={content} />
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-blue-600/5 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            No code. No credit card. First agent live in under 30 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg"
              style={{ backgroundImage: "linear-gradient(to right, var(--primary), #1e40af)" }}
            >
              {ctaLabel}
            </Link>
            <Link
              href="/company/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-all"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
