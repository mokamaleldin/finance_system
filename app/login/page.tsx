import { LoginForm } from "@/components/forms/login-form";
import { Card } from "@/components/ui/card";
import { appBranding } from "@/lib/branding";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/dashboard")
      ? params.next
      : "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 rounded-lg border border-line/80 bg-white/75 p-6 text-center shadow-soft backdrop-blur">
          <span className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-4xl font-black text-gold">
            ع
          </span>
          <h1 className="text-3xl font-bold text-ink">{appBranding.name}</h1>
          <p className="mt-2 text-sm text-muted">{appBranding.tagline}</p>
          <p className="mt-1 text-sm text-muted">تسجيل دخول المسؤول</p>
        </div>
        <Card>
          <LoginForm nextPath={nextPath} />
        </Card>
      </div>
    </main>
  );
}
