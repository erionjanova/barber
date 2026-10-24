import { AlertTriangle, CalendarOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAddTimeOff, useDeleteTimeOff, useSaveWorkingHours, useShop, useTimeOff, useWorkingHours } from "@/api/queries";
import { Button } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { currentLanguage, errorMessage } from "@/i18n";
import { formatCalendarDate, shortTime } from "@/lib/format";
import type { WorkingHours } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AdminSchedulePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold xl:text-4xl">{t("admin.schedule.title")}</h1>
        <p className="mt-1.5 text-muted">{t("admin.schedule.subtitle")}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <WeeklyHours />
        <DaysOff />
      </div>
    </div>
  );
}

function WeeklyHours() {
  const { t } = useTranslation();
  const { data, isLoading } = useWorkingHours();
  const save = useSaveWorkingHours();
  const [days, setDays] = useState<WorkingHours[]>([]);

  useEffect(() => {
    if (data) setDays(data);
  }, [data]);

  const update = (index: number, patch: Partial<WorkingHours>) => setDays((ds) => ds.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  const invalid = days.some((d) => d.isOpen && d.openTime >= d.closeTime);
  const dirty = JSON.stringify(days) !== JSON.stringify(data);

  const onSave = () =>
    save.mutate(days, {
      onSuccess: () => toast.success(t("admin.schedule.saved")),
      onError: (e) => toast.error(errorMessage(e)),
    });

  return (
    <Card className="p-6">
      <h2 className="font-sans text-lg font-semibold">{t("admin.schedule.workingHours")}</h2>
      <div className="mt-5 divide-y divide-line">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="my-2 h-12" />)
          : days.map((d, i) => {
              const badRange = d.isOpen && d.openTime >= d.closeTime;
              return (
                <div key={d.dayOfWeek} className="flex flex-wrap items-center gap-3 py-3 sm:flex-nowrap">
                  <Switch checked={d.isOpen} onChange={(isOpen) => update(i, { isOpen })} label={t(`days.${d.dayOfWeek}`)} />
                  <span className={cn("w-28 font-medium", !d.isOpen && "text-muted")}>{t(`days.${d.dayOfWeek}`)}</span>
                  {d.isOpen ? (
                    <div className="ml-auto flex items-center gap-2">
                      <input
                        type="time"
                        step={900}
                        value={shortTime(d.openTime)}
                        onChange={(e) => update(i, { openTime: `${e.target.value}:00` })}
                        aria-label={`${t(`days.${d.dayOfWeek}`)} – ${t("admin.schedule.open")}`}
                        className={cn("h-10 rounded-xl border bg-surface px-3 text-sm tabular-nums", badRange ? "border-danger" : "border-line")}
                      />
                      <span className="text-muted">–</span>
                      <input
                        type="time"
                        step={900}
                        value={shortTime(d.closeTime)}
                        onChange={(e) => update(i, { closeTime: `${e.target.value}:00` })}
                        aria-label={`${t(`days.${d.dayOfWeek}`)} – ${t("admin.schedule.closed")}`}
                        className={cn("h-10 rounded-xl border bg-surface px-3 text-sm tabular-nums", badRange ? "border-danger" : "border-line")}
                      />
                    </div>
                  ) : (
                    <span className="ml-auto text-sm text-muted">{t("admin.schedule.closed")}</span>
                  )}
                </div>
              );
            })}
      </div>
      {invalid && <p className="mt-2 text-xs text-danger">{t("validation.timeOrder")}</p>}
      <div className="mt-5 flex justify-end">
        <Button onClick={onSave} loading={save.isPending} disabled={!dirty || invalid}>
          {t("common.save")}
        </Button>
      </div>
    </Card>
  );
}

function DaysOff() {
  const { t } = useTranslation();
  const lang = currentLanguage();
  const { data: shop } = useShop();
  const { data: timeOff, isLoading } = useTimeOff();
  const add = useAddTimeOff();
  const remove = useDeleteTimeOff();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const onAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!date) return;
    add.mutate(
      { date, reason: reason.trim() || undefined },
      {
        onSuccess: (created) => {
          toast.success(t("admin.schedule.added"));
          if (created.bookedAppointments > 0) toast.warning(t("admin.schedule.bookedWarning", { count: created.bookedAppointments }));
          setDate("");
          setReason("");
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <Card className="p-6">
      <h2 className="font-sans text-lg font-semibold">{t("admin.schedule.timeOff")}</h2>
      <p className="mt-1 text-sm text-muted">{t("admin.schedule.timeOffHint")}</p>

      <form onSubmit={onAdd} className="mt-5 space-y-2">
        <div className="flex gap-2">
          <Input type="date" min={shop?.today} value={date} onChange={(e) => setDate(e.target.value)} aria-label={t("admin.schedule.date")} className="h-11" required />
          <Button type="submit" loading={add.isPending} disabled={!date} aria-label={t("admin.schedule.addTimeOff")} className="shrink-0">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("common.add")}</span>
          </Button>
        </div>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("admin.schedule.reasonPlaceholder")} aria-label={t("admin.schedule.reason")} maxLength={200} className="h-11" />
      </form>

      <ul className="mt-6 space-y-2">
        {isLoading && <Skeleton className="h-14" />}
        {!isLoading && timeOff?.length === 0 && (
          <li className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
            <CalendarOff className="size-5" />
            {t("admin.schedule.noTimeOff")}
          </li>
        )}
        {timeOff?.map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium first-letter:uppercase">{formatCalendarDate(d.date, lang, { weekday: "long", day: "numeric", month: "long" })}</p>
              {d.reason && <p className="truncate text-sm text-muted">{d.reason}</p>}
              {d.bookedAppointments > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-warning">
                  <AlertTriangle className="size-3.5" /> {t("admin.schedule.bookedWarning", { count: d.bookedAppointments })}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.delete")}
              className="text-muted hover:text-danger"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(d.id, {
                  onSuccess: () => toast.success(t("admin.schedule.removed")),
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
