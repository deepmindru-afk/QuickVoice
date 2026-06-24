import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Skeleton } from "@/src/components/ui/skeleton";

type StatTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneStyles: Record<StatTone, string> = {
  neutral: "border-border bg-card text-primary",
  success:
    "border-emerald-500/20 bg-emerald-500/5 text-emerald-500 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
  warning:
    "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
  danger:
    "border-destructive/20 bg-destructive/5 text-destructive dark:bg-destructive/10",
  info:
    "border-sky-500/20 bg-sky-500/5 text-sky-600 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
};

export function StatCard({
  label,
  value,
  helper,
  eyebrow,
  icon: Icon,
  loading,
  className,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  tone?: StatTone;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[168px] flex-col overflow-hidden border bg-card p-5 shadow-xs transition-colors hover:border-primary/35",
        className
      )}
    >
      <div className="flex h-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-[2.5rem] space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            {eyebrow ? (
              <p className="text-xs text-muted-foreground">{eyebrow}</p>
            ) : null}
          </div>
          {loading ? (
            <Skeleton className="mt-4 h-8 w-24" />
          ) : (
            <p className="mt-4 text-3xl font-semibold leading-none text-foreground">
              {value}
            </p>
          )}
          <div className="mt-auto min-h-[2.75rem] pt-4 text-xs font-medium leading-snug text-muted-foreground">
            {helper}
          </div>
        </div>
        {Icon ? (
          <div className={cn("shrink-0 border p-2.5", toneStyles[tone])}>
            <Icon className="size-4" />
          </div>
        ) : null}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
    </div>
  );
}
