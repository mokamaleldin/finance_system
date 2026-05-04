import type { ReactNode } from "react";

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
};

export function StatCard({ title, value, hint }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-line/80 bg-white/95 p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-olive/25">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-gold via-olive to-transparent" />
      <p className="text-sm font-semibold text-muted">{title}</p>
      <p className="mt-3 break-words text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-muted">{hint}</p> : null}
    </div>
  );
}
