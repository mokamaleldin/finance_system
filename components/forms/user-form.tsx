"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { roleLabels, userRoles, type UserRole } from "@/lib/permissions";
import { userCreateSchema, userUpdateSchema } from "@/lib/validations";

type UserCreateValues = z.input<typeof userCreateSchema>;
type UserUpdateValues = z.input<typeof userUpdateSchema>;

type UserFormProps =
  | {
      mode: "create";
    }
  | {
      mode: "update";
      userId: string;
      email: string;
      role: UserRole;
      canChangeRole?: boolean;
    };

function roleHelp(role: UserRole) {
  if (role === "FULL_ADMIN") return "كل الصلاحيات، بما فيها رأس المال والمستخدمين.";
  if (role === "OPERATOR") return "إضافة وتعديل المعاملات، إضافة عملاء، وإضافة مصاريف فقط.";
  return "مشاهدة النظام بدون تعديل.";
}

export function UserForm(props: UserFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isCreate = props.mode === "create";
  const schema = isCreate ? userCreateSchema : userUpdateSchema;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserCreateValues | UserUpdateValues>({
    resolver: zodResolver(schema),
    defaultValues: isCreate
      ? {
          email: "",
          password: "",
          role: "VIEWER",
        }
      : {
          password: "",
          role: props.role,
        },
  });
  const selectedRole = watch("role") as UserRole;
  const canChangeRole = isCreate || props.canChangeRole !== false;

  async function onSubmit(values: UserCreateValues | UserUpdateValues) {
    setServerError("");
    setIsSubmitting(true);

    const response = await fetch(isCreate ? "/api/users" : `/api/users/${props.userId}`, {
      method: isCreate ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر حفظ المستخدم");
      return;
    }

    reset(isCreate ? { email: "", password: "", role: "VIEWER" } : { password: "", role: selectedRole });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {isCreate ? (
          <div>
            <label className="text-sm font-semibold text-ink">البريد الإلكتروني</label>
            <input
              type="email"
              dir="ltr"
              className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 text-left outline-none focus:border-olive"
              {...register("email" as never)}
            />
            {"email" in errors && errors.email ? <p className="mt-1 text-sm text-red-700">{errors.email.message}</p> : null}
          </div>
        ) : (
          <div>
            <label className="text-sm font-semibold text-ink">البريد الإلكتروني</label>
            <input
              value={props.email}
              readOnly
              dir="ltr"
              className="mt-2 min-h-12 w-full rounded-lg border border-line bg-paper/80 px-3 py-2 text-left text-muted outline-none"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-ink">كلمة المرور</label>
          <input
            type="password"
            className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive"
            placeholder={isCreate ? "مطلوبة" : "اتركها فارغة بدون تغيير"}
            {...register("password")}
          />
          {errors.password ? <p className="mt-1 text-sm text-red-700">{errors.password.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">الصلاحية</label>
          {canChangeRole ? (
            <select className="mt-2 min-h-12 w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-olive" {...register("role")}>
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input type="hidden" defaultValue={selectedRole} {...register("role")} />
              <input
                value={roleLabels[selectedRole]}
                readOnly
                className="mt-2 min-h-12 w-full rounded-lg border border-line bg-paper/80 px-3 py-2 text-muted outline-none"
              />
            </>
          )}
          <p className="mt-1 text-xs leading-5 text-muted">{roleHelp(selectedRole)}</p>
        </div>
      </div>

      {serverError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}

      <button type="submit" disabled={isSubmitting} className="action-primary w-full sm:w-fit">
        {isCreate ? <UserPlus className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {isCreate ? "إضافة مستخدم" : "حفظ المستخدم"}
      </button>
    </form>
  );
}
