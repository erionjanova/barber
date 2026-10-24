import { CalendarPlus, CalendarX2, Clock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { useCancelMyAppointment, useMyAppointments, useShop } from "@/api/queries";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { currentLanguage, errorMessage } from "@/i18n";
import { formatDateTime, formatLongDate, formatPrice, formatTime } from "@/lib/format";
import type { Appointment, ShopInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "upcoming" | "past";

export default function MyAppointmentsPage() {
  const { t } = useTranslation();
  const { data: appointments, isLoading, isError, refetch } = useMyAppointments();
  const { data: shop } = useShop();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const cancel = useCancelMyAppointment();
  const lang = currentLanguage();

  const now = Date.now();
  const upcoming = (appointments ?? [])
    .filter((a) => a.status === "Booked" && new Date(a.endTime).getTime() > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const past = (appointments ?? []).filter((a) => !upcoming.includes(a));
  const list = tab === "upcoming" ? upcoming : past;

  const confirmCancel = () => {
    if (!toCancel) return;
    cancel.mutate(toCancel.id, {
      onSuccess: () => {
        toast.success(t("appointments.cancelled"));
        setToCancel(null);
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold xl:text-5xl">{t("appointments.title")}</h1>
          <p className="mt-2 text-muted">{t("appointments.subtitle")}</p>
        </div>
        <Link to="/book" className={buttonClass("primary")}>
          <CalendarPlus className="size-4" /> {t("nav.book")}
        </Link>
      </div>

      <div role="tablist" className="mt-8 inline-flex rounded-full border border-line bg-surface p-1">
        {(["upcoming", "past"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "relative cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-colors",
              tab === key ? "text-bg" : "text-muted hover:text-fg",
            )}
          >
            {tab === key && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-fg" />}
            <span className="relative">
              {t(`appointments.${key}`)}
              <span className="ml-1.5 opacity-60">{(key === "upcoming" ? upcoming : past).length}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        {isError && <ErrorState message={t("errors.server_error")} onRetry={() => refetch()} retryLabel={t("common.retry")} />}
        {!isLoading && !isError && list.length === 0 && (
          <EmptyState
            icon={CalendarX2}
            text={tab === "upcoming" ? t("appointments.empty") : t("appointments.emptyPast")}
            action={
              tab === "upcoming" && (
                <Link to="/book" className={buttonClass("primary", "sm")}>
                  {t("appointments.emptyCta")}
                </Link>
              )
            }
          />
        )}
        <AnimatePresence initial={false}>
          {shop &&
            list.map((a) => (
              <motion.div key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <AppointmentCard appointment={a} shop={shop} lang={lang} onCancel={tab === "upcoming" ? () => setToCancel(a) : undefined} />
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {shop && tab === "upcoming" && upcoming.length > 0 && (
        <p className="mt-6 text-center text-xs text-muted">{t("appointments.cancelPolicy", { hours: shop.cancellationCutoffHours })}</p>
      )}

      <ConfirmDialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        title={t("appointments.cancelConfirmTitle")}
        description={
          toCancel && shop
            ? t("appointments.cancelConfirmText", {
                service: lang === "en" ? toCancel.serviceNameEn : toCancel.serviceNameSq,
                date: `${formatLongDate(toCancel.startTime, lang, shop.timeZone)} ${formatTime(toCancel.startTime, lang, shop.timeZone)}`,
              })
            : ""
        }
        confirmLabel={t("appointments.cancel")}
        onConfirm={confirmCancel}
        loading={cancel.isPending}
        destructive
      />
    </div>
  );
}

function AppointmentCard({ appointment: a, shop, lang, onCancel }: { appointment: Appointment; shop: ShopInfo; lang: string; onCancel?: () => void }) {
  const { t } = useTranslation();
  const hoursUntil = (new Date(a.startTime).getTime() - Date.now()) / 3_600_000;
  const canCancel = onCancel && hoursUntil >= shop.cancellationCutoffHours;

  return (
    <Card className={cn("flex items-center gap-4 p-4 sm:gap-5 sm:p-5", a.status === "Cancelled" && "opacity-70")}>
      <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-accent-soft py-2.5 text-accent">
        <span className="text-[0.6875rem] font-semibold uppercase">{formatDateTime(a.startTime, lang, shop.timeZone, { month: "short" })}</span>
        <span className="font-display text-2xl leading-none font-semibold">{formatDateTime(a.startTime, lang, shop.timeZone, { day: "numeric" })}</span>
        <span className="mt-0.5 text-[0.6875rem] font-medium">{formatDateTime(a.startTime, lang, shop.timeZone, { weekday: "short" })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold">{lang === "en" ? a.serviceNameEn : a.serviceNameSq}</p>
          <StatusBadge status={a.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <Clock className="size-3.5" />
          {formatTime(a.startTime, lang, shop.timeZone)} – {formatTime(a.endTime, lang, shop.timeZone)}
          <span aria-hidden>·</span>
          {formatPrice(a.price, shop.currency, lang)}
        </p>
        {a.clientName && <p className="mt-0.5 truncate text-xs text-muted">{a.clientName} · {a.clientPhone}</p>}
      </div>
      {onCancel && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={!canCancel}
          title={!canCancel ? t("appointments.cancelPolicy", { hours: shop.cancellationCutoffHours }) : undefined}
          className="shrink-0 hover:border-danger/50 hover:text-danger"
        >
          {t("common.cancel")}
        </Button>
      )}
    </Card>
  );
}
