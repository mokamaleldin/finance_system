import { KeyRound, ShieldCheck, UserCog } from "lucide-react";
import { UserForm } from "@/components/forms/user-form";
import { DeleteUserButton } from "@/components/forms/user-actions";
import { Card, StatCard } from "@/components/ui/card";
import { DataError } from "@/components/ui/data-error";
import { requirePagePermission } from "@/lib/auth";
import { roleLabels, userRoles, type UserRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { logMissingServerEnv, logServerError } from "@/lib/server-logging";

export const dynamic = "force-dynamic";

function formatUserDate(date: Date) {
  return new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function UsersPage() {
  const session = await requirePagePermission("users:manage");

  let users;
  try {
    logMissingServerEnv("dashboard/users");
    users = await prisma.user.findMany({
      orderBy: [{ role: "asc" }, { email: "asc" }],
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    logServerError("dashboard/users: failed to load users", error);
    return (
      <div className="grid gap-6">
        <div className="rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
          <h2 className="text-3xl font-bold text-ink">المستخدمين والصلاحيات</h2>
          <p className="mt-1 text-sm text-muted">أضف أي عدد من الحسابات، واختر صلاحية كل حساب حسب شغله.</p>
        </div>
        <DataError description="تعذر تحميل المستخدمين من قاعدة البيانات. راجع إعدادات الاتصال في Vercel." />
      </div>
    );
  }

  const counts = userRoles.reduce(
    (totals, role) => {
      totals[role] = users.filter((user) => user.role === role).length;
      return totals;
    },
    {} as Record<UserRole, number>,
  );

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-line/80 bg-white/75 p-5 shadow-soft backdrop-blur">
        <h2 className="text-3xl font-bold text-ink">المستخدمين والصلاحيات</h2>
        <p className="mt-1 text-sm text-muted">أضف أي عدد من الحسابات، واختر صلاحية كل حساب حسب شغله.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="كل الحسابات" value={String(users.length)} icon={<UserCog className="h-5 w-5" />} />
        <StatCard title={roleLabels.FULL_ADMIN} value={String(counts.FULL_ADMIN)} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard title={roleLabels.OPERATOR} value={String(counts.OPERATOR)} icon={<KeyRound className="h-5 w-5" />} />
        <StatCard title={roleLabels.VIEWER} value={String(counts.VIEWER)} icon={<UserCog className="h-5 w-5" />} />
      </div>

      <Card title="إضافة حساب جديد">
        <UserForm mode="create" />
      </Card>

      <Card title="الحسابات الحالية">
        <div className="grid gap-4">
          {users.map((user) => (
            <section key={user.id} className="rounded-lg border border-line/80 bg-paper/50 p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-line/70 pb-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-ink" dir="ltr">{user.email}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {roleLabels[user.role]} - آخر تعديل {formatUserDate(user.updatedAt)}
                  </p>
                </div>
                {user.email === session.email ? (
                  <span className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-muted">الحساب الحالي</span>
                ) : user.role === "FULL_ADMIN" && counts.FULL_ADMIN <= 1 ? (
                  <span className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-muted">آخر مدير كامل</span>
                ) : (
                  <DeleteUserButton userId={user.id} email={user.email} />
                )}
              </div>
              <UserForm
                mode="update"
                userId={user.id}
                email={user.email}
                role={user.role}
                canChangeRole={user.email !== session.email && (user.role !== "FULL_ADMIN" || counts.FULL_ADMIN > 1)}
              />
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}
