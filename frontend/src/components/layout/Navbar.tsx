import { CalendarDays, LayoutDashboard, LogOut, Menu, User as UserIcon, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn("rounded-full px-4 py-2 text-sm font-medium transition-colors", isActive ? "bg-surface-2 text-fg" : "text-muted hover:text-fg");

export function Navbar() {
  const { t } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    toast(t("auth.loggedOut"));
    navigate("/");
  };

  const links = !user
    ? []
    : isAdmin
      ? [
          { to: "/admin", label: t("nav.admin"), icon: LayoutDashboard },
          { to: "/profile", label: t("nav.profile"), icon: UserIcon },
        ]
      : [
          { to: "/book", label: t("nav.book"), icon: CalendarDays },
          { to: "/appointments", label: t("nav.myAppointments"), icon: CalendarDays },
          { to: "/profile", label: t("nav.profile"), icon: UserIcon },
        ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === "/admin" ? false : true}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <button onClick={handleLogout} className={buttonClass("ghost", "sm")} aria-label={t("nav.logout")}>
              <LogOut className="size-4" />
              {t("nav.logout")}
            </button>
          ) : (
            <>
              <Link to="/login" className={buttonClass("ghost", "sm")}>
                {t("nav.login")}
              </Link>
              <Link to="/register" className={buttonClass("primary", "sm")}>
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={t("nav.menu")}
            className="grid size-10 cursor-pointer place-items-center rounded-full border border-line bg-surface"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-bg md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-4 py-3 font-medium", isActive ? "bg-surface-2" : "text-muted")}>
                  <l.icon className="size-4.5" />
                  {l.label}
                </NavLink>
              ))}
              <div className="flex items-center justify-between gap-3 pt-3">
                <LanguageSwitcher />
                {user ? (
                  <button onClick={handleLogout} className={buttonClass("outline", "sm")}>
                    <LogOut className="size-4" />
                    {t("nav.logout")}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/login" className={buttonClass("outline", "sm")}>
                      {t("nav.login")}
                    </Link>
                    <Link to="/register" className={buttonClass("primary", "sm")}>
                      {t("nav.register")}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
