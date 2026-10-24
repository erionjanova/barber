import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Pencil, Plus, Scissors, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { useAdminServices, useDeleteService, useSaveService, useShop } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { ConfirmDialog, Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { currentLanguage, errorMessage } from "@/i18n";
import { formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";

const serviceSchema = z.object({
  nameSq: z.string().trim().min(1, "validation.required").max(100, "validation.tooLong"),
  nameEn: z.string().trim().min(1, "validation.required").max(100, "validation.tooLong"),
  descriptionSq: z.string().max(500, "validation.tooLong"),
  descriptionEn: z.string().max(500, "validation.tooLong"),
  durationMinutes: z.number({ error: "validation.required" }).int().min(5, "validation.duration").max(480, "validation.duration"),
  price: z.number({ error: "validation.required" }).min(0, "validation.price").max(10000, "validation.price"),
  sortOrder: z.number({ error: "validation.required" }).int().min(0),
  isActive: z.boolean(),
});
type ServiceForm = z.infer<typeof serviceSchema>;

export default function AdminServicesPage() {
  const { t } = useTranslation();
  const { data: services, isLoading, isError, refetch } = useAdminServices();
  const { data: shop } = useShop();
  const remove = useDeleteService();
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const lang = currentLanguage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold xl:text-4xl">{t("admin.services.title")}</h1>
          <p className="mt-1.5 text-muted">{t("admin.services.subtitle")}</p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> {t("admin.services.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={t("errors.server_error")} onRetry={() => refetch()} retryLabel={t("common.retry")} />
      ) : services?.length === 0 ? (
        <EmptyState icon={Scissors} text={t("admin.services.subtitle")} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {services?.map((s) => (
            <Card key={s.id} className={cn("flex flex-col p-5", !s.isActive && "opacity-60")}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{lang === "en" ? s.nameEn : s.nameSq}</p>
                    {!s.isActive && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{t("admin.services.inactive")}</span>}
                  </div>
                  <p className="truncate text-sm text-muted">{lang === "en" ? s.nameSq : s.nameEn}</p>
                </div>
                <span className="font-display text-xl font-semibold text-accent">{shop && formatPrice(s.price, shop.currency, lang)}</span>
              </div>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Clock className="size-3.5" /> {t("common.minutes", { count: s.durationMinutes })}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(s)}>
                    <Pencil className="size-3.5" /> {t("common.edit")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(s)} className="text-muted hover:text-danger" aria-label={t("common.delete")}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && <ServiceFormModal service={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title={t("admin.services.deleteConfirmTitle")}
        description={t("admin.services.deleteConfirmText")}
        confirmLabel={t("common.delete")}
        loading={remove.isPending}
        destructive
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success(t("admin.services.deleted"));
              setToDelete(null);
            },
            onError: (e) => toast.error(errorMessage(e)),
          })
        }
      />
    </div>
  );
}

function ServiceFormModal({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const { t } = useTranslation();
  const save = useSaveService();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      nameSq: service?.nameSq ?? "",
      nameEn: service?.nameEn ?? "",
      descriptionSq: service?.descriptionSq ?? "",
      descriptionEn: service?.descriptionEn ?? "",
      durationMinutes: service?.durationMinutes ?? 30,
      price: service?.price ?? 10,
      sortOrder: service?.sortOrder ?? 0,
      isActive: service?.isActive ?? true,
    },
  });

  const onSubmit = (data: ServiceForm) =>
    save.mutate(
      { id: service?.id, data: { ...data, descriptionSq: data.descriptionSq || null, descriptionEn: data.descriptionEn || null } },
      {
        onSuccess: () => {
          toast.success(t("admin.services.saved"));
          onClose();
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  return (
    <Modal
      open
      onClose={onClose}
      title={service ? t("admin.services.edit") : t("admin.services.add")}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="service-form" loading={save.isPending}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.services.nameSq")} error={errors.nameSq?.message}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.nameSq} {...register("nameSq")} />}
          </Field>
          <Field label={t("admin.services.nameEn")} error={errors.nameEn?.message}>
            {(id, d) => <Input id={id} aria-describedby={d} aria-invalid={!!errors.nameEn} {...register("nameEn")} />}
          </Field>
        </div>
        <Field label={t("admin.services.descriptionSq")} error={errors.descriptionSq?.message} optional>
          {(id, d) => <Textarea id={id} rows={2} className="min-h-0" aria-describedby={d} {...register("descriptionSq")} />}
        </Field>
        <Field label={t("admin.services.descriptionEn")} error={errors.descriptionEn?.message} optional>
          {(id, d) => <Textarea id={id} rows={2} className="min-h-0" aria-describedby={d} {...register("descriptionEn")} />}
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label={t("admin.services.duration")} error={errors.durationMinutes?.message}>
            {(id, d) => (
              <Input id={id} type="number" min={5} max={480} step={5} aria-describedby={d} aria-invalid={!!errors.durationMinutes} {...register("durationMinutes", { valueAsNumber: true })} />
            )}
          </Field>
          <Field label={t("admin.services.price")} error={errors.price?.message}>
            {(id, d) => <Input id={id} type="number" min={0} step={0.5} aria-describedby={d} aria-invalid={!!errors.price} {...register("price", { valueAsNumber: true })} />}
          </Field>
          <Field label={t("admin.services.sortOrder")} error={errors.sortOrder?.message}>
            {(id, d) => <Input id={id} type="number" min={0} aria-describedby={d} {...register("sortOrder", { valueAsNumber: true })} />}
          </Field>
        </div>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
              <div>
                <p className="text-sm font-medium">{t("admin.services.active")}</p>
                <p className="text-xs text-muted">{t("admin.services.activeHint")}</p>
              </div>
              <Switch checked={field.value} onChange={field.onChange} label={t("admin.services.active")} />
            </div>
          )}
        />
      </form>
    </Modal>
  );
}
