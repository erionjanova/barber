import { CalendarCheck, CalendarDays, Clock, Coins, Phone, Users } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useAdminAppointments, useDashboard, useShop } from "@/api/queries";
import { Card, Skeleton } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { currentLanguage } from "@/i18n";
import { formatCalendarDate, formatLongDate, formatPrice, formatTime } from "@/lib/format";
import type { DashboardStats, ShopInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: stats, isLoading, isError, refetch } = useDashboard();
  const { data: shop } = useShop();
  const lang = currentLanguage();

  if (isError) return <ErrorState message={t("errors.server_error")} onRetry={() => refetch()} retryLabel={t("common.retry")} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{t("admin.dashboard.greeting", { name: user?.fullName.split(" ")[0] ?? "" })}</h1>
        <p className="mt-1.5 text-muted first-letter:uppercase">
          {shop && formatCalendarDate(shop.today, lang, { weekday: "long", day: "numeric", month: "long" })} · {t("admin.dashboard.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading || !stats || !shop ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatTile icon={CalendarCheck} label={t("admin.dashboard.today")} value={stats.todayAppointments} />
            <StatTile icon={CalendarDays} label={t("admin.dashboard.upcoming")} value={stats.upcomingAppointments} />
            <StatTile
              icon={Coins}
              label={t("admin.dashboard.revenue")}
              value={formatPrice(stats.revenueThisMonth, shop.currency, lang)}
              hint={t("admin.dashboard.expected", { amount: formatPrice(stats.expectedRevenueThisMonth, shop.currency, lang) })}
            />
            <StatTile icon={Users} label={t("admin.dashboard.customers")} value={stats.totalCustomers} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <TodaySchedule shop={shop} />
        <div className="space-y-6">
          {stats && shop && <NextAppointment stats={stats} shop={shop} />}
          {stats && <WeekChart days={stats.nextSevenDays} />}
        </div>
      </div>

      {stats && shop && <TopServices stats={stats} shop={shop} />}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className="size-4.5 text-muted" />
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums sm:text-4xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

function TodaySchedule({ shop }: { shop?: ShopInfo }) {
  const { t } = useTranslation();
  const lang = currentLanguage();
  const today = shop?.today ?? "";
  const { data, isLoading } = useAdminAppointments({ from: today, to: today });
  const appointments = (data ?? []).filter((a) => a.status !== "Cancelled");
  const now = Date.now();

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold">{t("admin.dashboard.todaySchedule")}</h2>
        <Link to="/admin/appointments" className="text-sm font-semibold text-accent hover:underline">
          {t("admin.nav.appointments")} →
        </Link>
      </div>
      {isLoading || !shop ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">{t("admin.dashboard.noToday")}</p>
      ) : (
        <ol className="relative space-y-1 before:absolute before:top-2 before:bottom-2 before:left-[3.25rem] before:w-px before:bg-line">
          {appointments.map((a) => {
            const isNow = new Date(a.startTime).getTime() <= now && new Date(a.endTime).getTime() > now;
            const isPast = new Date(a.endTime).getTime() <= now;
            return (
              <li key={a.id} className={cn("relative flex items-center gap-4 rounded-xl px-2 py-2.5", isNow && "bg-accent-soft", isPast && "opacity-60")}>
                <span className="w-10 text-right text-sm font-semibold tabular-nums">{formatTime(a.startTime, lang, shop.timeZone)}</span>
                <span className={cn("relative z-10 size-2.5 shrink-0 rounded-full ring-4 ring-surface", isNow ? "bg-accent" : "bg-line")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.clientName}</p>
                  <p className="truncate text-xs text-muted">
                    {lang === "en" ? a.serviceNameEn : a.serviceNameSq} · {t("common.minutes", { count: a.durationMinutes })}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function NextAppointment({ stats, shop }: { stats: DashboardStats; shop: ShopInfo }) {
  const { t } = useTranslation();
  const lang = currentLanguage();
  const a = stats.nextAppointment;

  return (
    <Card className="relative overflow-hidden bg-fg p-6 text-bg">
      <div className="hero-glow pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative">
        <p className="text-xs font-semibold tracking-wider uppercase opacity-60">{t("admin.dashboard.nextAppointment")}</p>
        {a ? (
          <>
            <p className="mt-3 font-display text-2xl font-semibold">{a.clientName}</p>
            <p className="mt-1 text-sm opacity-75">{lang === "en" ? a.serviceNameEn : a.serviceNameSq}</p>
            <p className="mt-4 flex items-center gap-2 text-sm first-letter:uppercase">
              <Clock className="size-4 text-accent" />
              <span className="first-letter:uppercase">
                {formatLongDate(a.startTime, lang, shop.timeZone)} · {formatTime(a.startTime, lang, shop.timeZone)}
              </span>
            </p>
            <a href={`tel:${a.clientPhone.replace(/\s/g, "")}`} className="mt-2 flex items-center gap-2 text-sm opacity-80 hover:opacity-100">
              <Phone className="size-4 text-accent" /> {a.clientPhone}
            </a>
            {a.notes && <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-sm italic">“{a.notes}”</p>}
          </>
        ) : (
          <p className="mt-3 opacity-70">{t("admin.dashboard.noNext")}</p>
        )}
      </div>
    </Card>
  );
}

function WeekChart({ days }: { days: { date: string; count: number }[] }) {
  const { t } = useTranslation();
  const lang = currentLanguage();
  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <Card className="p-6">
      <h2 className="font-sans text-lg font-semibold">{t("admin.dashboard.next7Days")}</h2>
      <div className="mt-6 flex h-36 items-end gap-[2px] border-b border-line" role="list">
        {days.map((d, i) => {
          const label = formatCalendarDate(d.date, lang, { weekday: "short", day: "numeric" });
          return (
            <div key={d.date} role="listitem" className="group relative flex h-full flex-1 flex-col items-center justify-end px-1">
              <span className="pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                <span className="text-muted first-letter:uppercase">{label}</span>
                <span className="ml-1.5 font-semibold">{t("admin.dashboard.bookings", { count: d.count })}</span>
              </span>
              {d.count > 0 && <span className="mb-1 text-xs font-semibold tabular-nums text-muted">{d.count}</span>}
              <motion.div
                className={cn("w-full max-w-9 rounded-t-[4px] bg-accent transition-opacity group-hover:opacity-80", d.count === 0 && "bg-line")}
                initial={{ height: 0 }}
                animate={{ height: d.count === 0 ? 2 : `${(d.count / max) * 80}%` }}
                transition={{ delay: i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                aria-label={`${label}: ${d.count}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[2px]">
        {days.map((d, i) => (
          <span key={d.date} className={cn("flex-1 text-center text-[0.6875rem] text-muted first-letter:uppercase", i === 0 && "font-semibold text-fg")}>
            {formatCalendarDate(d.date, lang, { weekday: "short" })}
          </span>
        ))}
      </div>
    </Card>
  );
}

function TopServices({ stats, shop }: { stats: DashboardStats; shop: ShopInfo }) {
  const { t } = useTranslation();
  const lang = currentLanguage();
  const max = Math.max(1, ...stats.topServices.map((s) => s.count));

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-sans text-lg font-semibold">{t("admin.dashboard.topServices")}</h2>
        <p className="text-xs text-muted">
          {t("admin.dashboard.monthSummary", {
            completed: stats.completedThisMonth,
            cancelled: stats.cancelledThisMonth,
            noShows: stats.noShowsThisMonth,
          })}
        </p>
      </div>
      {stats.topServices.length === 0 ? (
        <p className="text-sm text-muted">{t("admin.dashboard.noData")}</p>
      ) : (
        <ul className="space-y-4">
          {stats.topServices.map((s) => (
            <li key={s.serviceId} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-4 text-sm">
              <span className="truncate font-medium">{lang === "en" ? s.nameEn : s.nameSq}</span>
              <span className="h-2 overflow-hidden rounded-full bg-surface-2">
                <motion.span
                  className="block h-full rounded-full bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.count / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
              <span className="text-right tabular-nums">
                <span className="font-semibold">{s.count}</span>
                <span className="ml-2 text-muted">{formatPrice(s.revenue, shop.currency, lang)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
