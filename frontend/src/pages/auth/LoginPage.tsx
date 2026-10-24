import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { errorMessage } from "@/i18n";
import { loginSchema } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { AuthLayout } from "./AuthLayout";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const user = await login(data.email, data.password);
      toast.success(t("auth.welcome", { name: user.fullName.split(" ")[0] }));
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? (user.role === "Admin" ? "/admin" : "/book"), { replace: true });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && (
          <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
        <Field label={t("auth.email")} error={errors.email?.message}>
          {(id, d) => <Input id={id} type="email" autoComplete="email" aria-describedby={d} aria-invalid={!!errors.email} {...register("email")} />}
        </Field>
        <Field label={t("auth.password")} error={errors.password?.message}>
          {(id, d) => (
            <Input id={id} type="password" autoComplete="current-password" aria-describedby={d} aria-invalid={!!errors.password} {...register("password")} />
          )}
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          {t("auth.loginButton")}
        </Button>
        <p className="text-center text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <Link to="/register" state={location.state} className="font-semibold text-accent hover:underline">
            {t("nav.register")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
