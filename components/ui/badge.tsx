import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneClassName: Record<BadgeTone, string> = {
  neutral: "border-line bg-white text-muted",
  success: "border-emerald-100 bg-emerald-50 text-emerald-700",
  warning: "border-amber-100 bg-amber-50 text-amber-700",
  danger: "border-red-100 bg-red-50 text-red-700",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${toneClassName[tone]}`}>
      {children}
    </span>
  );
}
