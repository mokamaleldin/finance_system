import { LogoutButton } from "@/components/layout/logout-button";
import { appBranding } from "@/lib/branding";
import { roleLabels, type UserRole } from "@/lib/permissions";

export function Header({ email, role }: { email: string; role: UserRole }) {
  return (
    <header className="no-print sticky top-0 z-20 hidden border-b border-line/80 bg-paper/90 px-8 py-3 backdrop-blur lg:block">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{appBranding.tagline}</p>
          <h1 className="text-xl font-bold text-ink">{appBranding.dashboardTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-line bg-white/80 px-3 py-2 text-sm text-muted shadow-sm">
            {email} - {roleLabels[role]}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
