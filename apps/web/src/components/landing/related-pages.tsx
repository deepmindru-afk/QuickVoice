import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface RelatedPage {
  title: string;
  href: string;
  description: string;
}

export function RelatedPages({
  title = "Explore More",
  pages,
}: {
  title?: string;
  pages: RelatedPage[];
}) {
  return (
    <section className="py-16 bg-muted/30">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
          {title}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page, index) => (
            <Link
              key={`${page.href}-${index}`}
              href={page.href}
              className="group rounded-xl border border-border bg-background p-5 hover:border-primary/40 hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                {page.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {page.description}
              </p>
              <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
