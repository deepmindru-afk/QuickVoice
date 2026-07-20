import Link from "next/link";

export function DocCard({ title, description, href }: Readonly<{ title: string; description: string; href: string }>) {
  return (
    <Link className="group block rounded-2xl border border-[var(--qv-border)] bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--qv-blue)] hover:shadow-md" href={href}>
      <h3 className="text-base font-semibold tracking-tight text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--qv-muted)]">{description}</p>
      <span className="mt-4 inline-flex text-sm font-semibold text-[var(--qv-blue)]">Read guide <span className="ml-1 transition group-hover:translate-x-1">→</span></span>
    </Link>
  );
}
