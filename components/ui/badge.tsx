import type { ReactNode } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const toneClassName: Record<BadgeTone, string> = {
  neutral: "bg-mint text-olive",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName[tone]}`}>
      {children}
    </span>
  );
}
