import { CalendarClock, CalendarDays, LayoutDashboard, Scissors } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router";
import { useBarberNotifications, type LiveStatus } from "@/realtime/useBarberNotifications";
import { cn } from "@/lib/utils";

export default function AdminLayout() {
  const { t } = useTranslation();
  const live = useBarberNotifications();

  const links = [
    { to: "/admin", label: t("admin.nav.dashboard"), icon: LayoutDashboard, end: true },
    { to: "/admin/appointments", label: t("admin.nav.appointments"), icon: CalendarDays },
    { to: "/admin/services", label: t("admin.nav.services"), icon: Scissors },
    { to: "/admin/schedule", label: t("admin.nav.schedule"), icon: CalendarClock },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 md:py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav className="scrollbar-thin -mx-4 flex gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
                  isActive ? "bg-fg text-bg" : "text-muted hover:bg-surface-2 hover:text-fg",
                )
              }
            >
              <l.icon className="size-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <LiveIndicator status={live} />
      </div>
      <Outlet />
    </div>
  );
}

function LiveIndicator({ status }: { status: LiveStatus }) {
  const { t } = useTranslation();
  const color = { connected: "bg-success", connecting: "bg-warning", offline: "bg-danger" }[status];
  return (
    <span className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted md:self-auto">
      <span className="relative flex size-2">
        {status === "connected" && <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", color)} />}
        <span className={cn("relative inline-flex size-2 rounded-full", color)} />
      </span>
      {t(`admin.live.${status}`)}
    </span>
  );
}
