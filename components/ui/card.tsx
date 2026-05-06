import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type CardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, subtitle, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft backdrop-blur sm:p-5 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-line/70 pb-3">
          <div>
            {title ? <h2 className="text-lg font-bold tracking-normal text-ink">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm leading-6 text-muted">{subtitle}</p> : null}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  trend?: {
    label: string;
    value?: string;
    direction?: "up" | "down" | "neutral";
  };
};

export function StatCard({ title, value, hint, icon, trend }: StatCardProps) {
  const trendTone =
    trend?.direction === "up"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : trend?.direction === "down"
        ? "border-red-100 bg-red-50 text-red-700"
        : "border-slate-200 bg-slate-50 text-slate-700";
  const TrendIcon =
    trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;

  return (
    <div className="relative overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-olive/25">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold via-olive to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-muted">{title}</p>
          <p className="mt-3 break-words text-2xl font-bold text-ink sm:text-3xl">{value}</p>
        </div>
        {icon ? (
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-mint/70 text-olive shadow-sm">
            {icon}
          </div>
        ) : null}
      </div>
      {trend ? (
        <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${trendTone}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span>{trend.value ? `${trend.value} ${trend.label}` : trend.label}</span>
        </div>
      ) : null}
      {hint ? <p className="mt-2 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}
