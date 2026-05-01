"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginSchema } from "@/lib/validations";

type LoginFormValues = z.input<typeof loginSchema>;

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError("");
    setIsSubmitting(true);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setServerError(payload?.message ?? "تعذر تسجيل الدخول");
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div>
        <label className="text-sm font-semibold text-ink" htmlFor="email">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-olive"
          {...register("email")}
        />
        {errors.email ? <p className="mt-1 text-sm text-red-700">{errors.email.message}</p> : null}
      </div>

      <div>
        <label className="text-sm font-semibold text-ink" htmlFor="password">
          كلمة المرور
        </label>
        <input
          id="password"
          type="password"
          className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-2 outline-none focus:border-olive"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1 text-sm text-red-700">{errors.password.message}</p>
        ) : null}
      </div>

      {serverError ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-olive disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />
        تسجيل الدخول
      </button>
    </form>
  );
}
