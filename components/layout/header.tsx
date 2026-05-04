import { LogoutButton } from "@/components/layout/logout-button";
import { appBranding } from "@/lib/branding";

export function Header({ email }: { email: string }) {
  return (
    <header className="no-print sticky top-0 z-20 hidden border-b border-line bg-paper/95 px-8 py-3 backdrop-blur lg:block">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{appBranding.tagline}</p>
          <h1 className="text-xl font-bold text-ink">{appBranding.dashboardTitle}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
