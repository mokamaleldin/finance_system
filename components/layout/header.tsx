import { LogoutButton } from "@/components/layout/logout-button";

export function Header({ email }: { email: string }) {
  return (
    <header className="no-print sticky top-0 z-20 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">نظام دفتر أستاذ مالي</p>
          <h1 className="text-xl font-bold text-ink">إدارة الصرافة والعملاء</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
