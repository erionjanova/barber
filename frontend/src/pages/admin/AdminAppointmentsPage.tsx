import { Ban, CalendarX2, Check, Phone, Search, UserX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAdminAppointments, useShop, useUpdateAppointmentStatus } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { currentLanguage, errorMessage } from "@/i18n";
import { addDays, formatCalendarDate, formatPrice, formatTime, localDateOf } from "@/lib/format";
import type { Appointment, AppointmentStatus, ShopInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type Range = "today" | "week" | "month" | "custom";
const STATUSES: AppointmentStatus[] = ["Booked", "Completed", "Cancelled", "NoShow"];

export default function AdminAppointmentsPage() {
  const { data: shop } = useShop();
  if (!shop) return <Skeleton className="h-96" />;
  return <AppointmentsView shop={shop} />;
}

function AppointmentsView({ shop }: { shop: ShopInfo }) {
  const { t } = useTranslation();
  const lang = currentLanguage();
  const [range, setRange] = useState<Range>("week");
  const [custom, setCustom] = useState({ from: shop.today, to: addDays(shop.today, 6) });
  const [status, setStatus] = useState<AppointmentStatus | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const update = useUpdateAppointmentStatus();

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { from, to } = useMemo(() => {
    switch (range) {
      case "today":
        return { from: shop.today, to: shop.today };
      case "week":
        return { from: shop.today, to: addDays(shop.today, 6) };
      case "month":
        return { from: shop.today, to: addDays(shop.today, 30) };
      case "custom":
        return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from };
    }
  }, [range, custom, shop.today]);

  const { data, isLoading, isError, refetch, isFetching } = useAdminAppointments({ from, to, status, search: search || undefined });

  const byDay = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    for (const a of data ?? []) {
      const day = localDateOf(a.startTime, shop.timeZone);
      groups.set(day, [...(groups.get(day) ?? []), a]);
    }
    return [...groups.entries()];
  }, [data, shop.timeZone]);

  const setAppointmentStatus = (a: Appointment, next: AppointmentStatus) =>
    update.mutate(
      { id: a.id, status: next },
      {
        onSuccess: () => {
          toast.success(t("admin.appointments.updated"));
          setToCancel(null);
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold xl:text-4xl">{t("admin.appointments.title")}</h1>

      <Card className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "week", "month"] as const).map((r) => (
            <FilterChip key={r} active={range === r} onClick={() => setRange(r)}>
              {t(`admin.appointments.${r}`)}
            </FilterChip>
          ))}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              aria-label={t("admin.appointments.from")}
              value={custom.from}
              onChange={(e) => {
                setCustom((c) => ({ ...c, from: e.target.value }));
                setRange("custom");
              }}
              className={cn("h-9 rounded-full border bg-surface px-3 text-sm", range === "custom" ? "border-accent" : "border-line")}
            />
            <span className="text-muted">–</span>
            <input
              type="date"
              aria-label={t("admin.appointments.to")}
              value={custom.to}
              onChange={(e) => {
                setCustom((c) => ({ ...c, to: e.target.value }));
                setRange("custom");
              }}
              className={cn("h-9 rounded-full border bg-surface px-3 text-sm", range === "custom" ? "border-accent" : "border-line")}
            />
          </div>
        </div>
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={t("admin.appointments.search")} className="h-10 rounded-full pl-10 text-sm" />
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!status} onClick={() => setStatus(undefined)}>
          {t("admin.appointments.allStatuses")}
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
            {t(`status.${s}`)}
          </FilterChip>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={t("errors.server_error")} onRetry={() => refetch()} retryLabel={t("common.retry")} />
      ) : byDay.length === 0 ? (
        <EmptyState icon={CalendarX2} text={t("admin.appointments.empty")} />
      ) : (
        <div className={cn("space-y-8 transition-opacity", isFetching && "opacity-60")}>
          {byDay.map(([day, items]) => (
            <section key={day}>
              <h2 className="sticky top-18 z-10 -mx-1 mb-3 flex items-baseline gap-3 bg-bg/90 px-1 py-2 font-sans text-sm font-semibold backdrop-blur">
                <span className="first-letter:uppercase">{formatCalendarDate(day, lang, { weekday: "long", day: "numeric", month: "long" })}</span>
                {day === shop.today && <span className="rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] text-accent-fg">{t("admin.appointments.today")}</span>}
                <span className="text-xs font-normal text-muted">{t("admin.dashboard.bookings", { count: items.filter((a) => a.status !== "Cancelled").length })}</span>
              </h2>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {items.map((a) => (
                    <motion.div key={a.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <AppointmentRow
                        appointment={a}
                        shop={shop}
                        lang={lang}
                        busy={update.isPending && update.variables?.id === a.id}
                        onStatus={(s) => (s === "Cancelled" ? setToCancel(a) : setAppointmentStatus(a, s))}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toCancel}
        onClose={() => setToCancel(null)}
        title={t("admin.appointments.cancelConfirmTitle")}
        description={toCancel ? t("admin.appointments.cancelConfirmText", { name: toCancel.clientName }) : ""}
        confirmLabel={t("admin.appointments.cancel")}
        onConfirm={() => toCancel && setAppointmentStatus(toCancel, "Cancelled")}
        loading={update.isPending}
        destructive
      />
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors",
        active ? "border-fg bg-fg text-bg" : "border-line bg-surface text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function AppointmentRow(props: {
  appointment: Appointment;
  shop: ShopInfo;
  lang: string;
  busy: boolean;
  onStatus: (s: AppointmentStatus) => void;
}) {
  const { t } = useTranslation();
  const { appointment: a, shop, lang } = props;
  const started = new Date(a.startTime).getTime() <= Date.now();
  const actionable = a.status === "Booked";

  return (
    <Card className={cn("flex flex-col gap-4 p-4 sm:flex-row sm:items-center", a.status === "Cancelled" && "opacity-60")}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="w-14 shrink-0 text-center">
          <p className="font-display text-lg font-semibold tabular-nums">{formatTime(a.startTime, lang, shop.timeZone)}</p>
          <p className="text-xs text-muted">{t("common.minutes", { count: a.durationMinutes })}</p>
        </div>
        <div className="h-10 w-px shrink-0 bg-line" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{a.clientName}</p>
            <StatusBadge status={a.status} />
          </div>
          <p className="truncate text-sm text-muted">
            {lang === "en" ? a.serviceNameEn : a.serviceNameSq} · {formatPrice(a.price, shop.currency, lang)}
          </p>
          {a.notes && <p className="mt-1 truncate text-xs text-muted italic">“{a.notes}”</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <a
          href={`tel:${a.clientPhone.replace(/\s/g, "")}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium hover:bg-surface-2"
          title={a.clientPhone}
        >
          <Phone className="size-3.5" /> <span className="tabular-nums">{a.clientPhone}</span>
        </a>
        {actionable && started && (
          <>
            <Button size="sm" variant="outline" onClick={() => props.onStatus("Completed")} disabled={props.busy} className="hover:border-success/50 hover:text-success">
              <Check className="size-4" /> {t("admin.appointments.complete")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => props.onStatus("NoShow")} disabled={props.busy} className="hover:border-danger/50 hover:text-danger">
              <UserX className="size-4" /> {t("admin.appointments.noShow")}
            </Button>
          </>
        )}
        {actionable && !started && (
          <Button size="sm" variant="ghost" onClick={() => props.onStatus("Cancelled")} disabled={props.busy} className="text-muted hover:text-danger">
            <Ban className="size-4" /> {t("admin.appointments.cancel")}
          </Button>
        )}
      </div>
    </Card>
  );
}
