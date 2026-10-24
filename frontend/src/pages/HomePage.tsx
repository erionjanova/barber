import { ArrowRight, BellRing, CalendarCheck, Clock, MapPin, Phone, Scissors, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useServices, useShop } from "@/api/queries";
import { buttonClass } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { currentLanguage } from "@/i18n";
import { formatPrice, shortTime } from "@/lib/format";
import type { Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

function useMainCta() {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  return isAdmin ? { to: "/admin", label: t("admin.title") } : { to: "/book", label: t("home.cta") };
}

export default function HomePage() {
  const { t } = useTranslation();
  const cta = useMainCta();
  const [line1, line2] = t("home.title").split("<br/>");

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 lg:px-10 md:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-xs font-semibold text-muted backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              {t("home.badge")}
            </span>
            <h1 className="mt-6 text-5xl leading-[1.02] font-semibold sm:text-6xl lg:text-7xl 2xl:text-8xl">
              {line1}
              <br />
              <span className="text-accent italic">{line2}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">{t("home.subtitle")}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to={cta.to} className={buttonClass("primary", "lg", "group")}>
                {cta.label}
                <ArrowRight className="size-4.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#services" className={buttonClass("outline", "lg")}>
                {t("home.ctaSecondary")}
              </a>
            </div>
          </motion.div>

          <HeroTicket />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              { key: "fast", icon: CalendarCheck },
              { key: "reminders", icon: BellRing },
              { key: "flexible", icon: Undo2 },
            ] as const
          ).map(({ key, icon: Icon }, i) => (
            <motion.div key={key} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
              <Card className="h-full p-6">
                <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 font-sans text-base font-semibold">{t(`home.features.${key}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{t(`home.features.${key}.text`)}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <ServicesSection />
      <HoursSection />
    </>
  );
}

function HeroTicket() {
  const { t } = useTranslation();
  const { data: services } = useServices();
  const { data: shop } = useShop();
  const lang = currentLanguage();
  const service = services?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent/10 blur-2xl" />
      <Card className="overflow-hidden rounded-3xl p-0 shadow-2xl shadow-black/10">
        <div className="flex items-center justify-between bg-fg px-6 py-5 text-bg">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-fg">
              <Scissors className="size-5" />
            </div>
            <div>
              <p className="text-xs opacity-60">{shop?.name ?? "Barber"}</p>
              <p className="font-semibold">{t("book.successTitle")}</p>
            </div>
          </div>
          <CalendarCheck className="size-5 text-accent" />
        </div>
        <div className="space-y-4 px-6 py-6">
          <TicketRow label={t("book.steps.service")} value={service ? (lang === "en" ? service.nameEn : service.nameSq) : "—"} />
          <TicketRow label={t("book.steps.time")} value={`${t("days.Saturday")} · 10:30`} />
          <TicketRow
            label={t("book.total")}
            value={service && shop ? formatPrice(service.price, shop.currency, lang) : "—"}
            strong
          />
        </div>
        <div className="relative border-t border-dashed border-line px-6 py-4">
          <span className="absolute -top-3 -left-3 size-6 rounded-full bg-bg" />
          <span className="absolute -top-3 -right-3 size-6 rounded-full bg-bg" />
          <p className="flex items-center gap-2 text-xs text-muted">
            <BellRing className="size-3.5 text-accent" /> {t("home.features.reminders.text")}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

const TicketRow = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className="flex items-center justify-between gap-4 text-sm">
    <span className="text-muted">{label}</span>
    <span className={cn("text-right font-medium", strong && "text-lg font-semibold text-accent")}>{value}</span>
  </div>
);

function ServicesSection() {
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();
  const { data: shop } = useShop();

  return (
    <section id="services" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-10">
      <motion.div {...fadeUp} className="mb-10 flex flex-col gap-2">
        <h2 className="text-4xl font-semibold sm:text-5xl">{t("home.servicesTitle")}</h2>
        <p className="text-muted">{t("home.servicesSubtitle")}</p>
      </motion.div>

      <div className="grid gap-3 md:grid-cols-2">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        {services?.map((s, i) => (
          <motion.div key={s.id} {...fadeUp} transition={{ ...fadeUp.transition, delay: (i % 2) * 0.06 }}>
            <ServiceRow service={s} currency={shop?.currency ?? "EUR"} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function ServiceRow({ service, currency }: { service: Service; currency: string }) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const lang = currentLanguage();
  const name = lang === "en" ? service.nameEn : service.nameSq;
  const description = lang === "en" ? service.descriptionEn : service.descriptionSq;

  return (
    <Link
      to={isAdmin ? "/admin/services" : `/book?service=${service.id}`}
      className="group flex h-full items-center justify-between gap-6 rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="min-w-0">
        <h3 className="font-sans text-lg font-semibold">{name}</h3>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted">
          <Clock className="size-3.5" /> {t("common.minutes", { count: service.durationMinutes })}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-3">
        <span className="font-display text-2xl font-semibold">{formatPrice(service.price, currency, lang)}</span>
        <span className="flex items-center gap-1 text-sm font-semibold text-accent opacity-80 transition-opacity group-hover:opacity-100">
          {isAdmin ? t("common.edit") : t("home.bookThis")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function HoursSection() {
  const { t } = useTranslation();
  const cta = useMainCta();
  const { data: shop } = useShop();
  const todayName = shop ? new Date(`${shop.today}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }) : null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-10">
      <motion.div {...fadeUp}>
        <Card className="grid overflow-hidden rounded-3xl md:grid-cols-2">
          <div className="p-8 sm:p-10">
            <h2 className="text-3xl font-semibold xl:text-4xl">{t("home.hoursTitle")}</h2>
            <ul className="mt-6 divide-y divide-line">
              {shop?.workingHours.map((d) => (
                <li
                  key={d.dayOfWeek}
                  className={cn("flex items-center justify-between py-3 text-sm", d.dayOfWeek === todayName && "font-semibold text-accent")}
                >
                  <span>{t(`days.${d.dayOfWeek}`)}</span>
                  <span className={cn(!d.isOpen && "text-muted")}>
                    {d.isOpen ? `${shortTime(d.openTime)} – ${shortTime(d.closeTime)}` : t("home.closed")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative flex flex-col justify-between gap-8 bg-fg p-8 text-bg sm:p-10">
            <div className="hero-glow pointer-events-none absolute inset-0 opacity-60" />
            <div className="relative">
              <h2 className="text-3xl font-semibold xl:text-4xl">{t("home.contactTitle")}</h2>
              <div className="mt-6 space-y-4 text-sm opacity-80">
                {shop?.address && (
                  <p className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0" /> {shop.address}
                  </p>
                )}
                {shop?.phone && (
                  <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 hover:opacity-100">
                    <Phone className="size-4" /> {shop.phone}
                  </a>
                )}
              </div>
            </div>
            <Link to={cta.to} className={buttonClass("primary", "lg", "relative self-start")}>
              {cta.label} <ArrowRight className="size-4.5" />
            </Link>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
