import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { z } from "zod";
import { useUpdateProfile } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Input";
import { errorMessage, LANGUAGES } from "@/i18n";
import { profileSchema } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuth();
  const update = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      preferredLanguage: user?.preferredLanguage ?? "sq",
    },
  });

  const onSubmit = (data: ProfileForm) =>
    update.mutate(data, {
      onSuccess: async (updated) => {
        setUser(updated);
        reset({ fullName: updated.fullName, phoneNumber: updated.phoneNumber, preferredLanguage: updated.preferredLanguage });
        if (updated.preferredLanguage !== i18n.resolvedLanguage) await i18n.changeLanguage(updated.preferredLanguage);
        toast.success(t("profile.saved"));
      },
      onError: (e) => toast.error(errorMessage(e)),
    });

  if (!user) return null;
  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
      <h1 className="text-4xl font-semibold xl:text-5xl">{t("profile.title")}</h1>
      <p className="mt-2 text-muted">{t("profile.subtitle")}</p>

      <Card className="mt-8 p-6 sm:p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-accent text-lg font-semibold text-accent-fg">{initials}</div>
          <div>
            <p className="font-semibold">{user.fullName}</p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label={t("auth.fullName")} error={errors.fullName?.message}>
            {(id, d) => <Input id={id} autoComplete="name" aria-describedby={d} aria-invalid={!!errors.fullName} {...register("fullName")} />}
          </Field>
          <Field label={t("auth.phone")} error={errors.phoneNumber?.message}>
            {(id, d) => <Input id={id} type="tel" autoComplete="tel" aria-describedby={d} aria-invalid={!!errors.phoneNumber} {...register("phoneNumber")} />}
          </Field>
          <Field label={t("profile.emailLanguage")}>
            {(id) => (
              <Select id={id} {...register("preferredLanguage")}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={update.isPending} disabled={!isDirty}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
