import { LoginForm } from "@/components/forms/login-form";
import { Card } from "@/components/ui/card";

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
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-ink">دفتر الصرافة</h1>
          <p className="mt-2 text-sm text-muted">تسجيل دخول المسؤول</p>
        </div>
        <Card>
          <LoginForm nextPath={nextPath} />
        </Card>
      </div>
    </main>
  );
}
