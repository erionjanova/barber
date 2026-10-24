import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Moon, Sun, Sunrise } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { z } from "zod";
import { useAvailability, useBookAppointment, useServices, useShop } from "@/api/queries";
import { Button, buttonClass } from "@/components/ui/Button";
import { Card, Skeleton } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { currentLanguage, errorMessage } from "@/i18n";
import { ApiError } from "@/lib/api";
import { addDays, dayOfWeekOf, formatCalendarDate, formatLongDate, formatPrice, formatTime } from "@/lib/format";
import type { Appointment, Service, ShopInfo, Slot } from "@/lib/types";
import { cn } from "@/lib/utils";
import { bookingDetailsSchema } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";

type Step = 0 | 1 | 2;
type DetailsForm = z.infer<typeof bookingDetailsSchema>;

const serviceName = (s: { nameSq: string; nameEn: string }, lang: string) => (lang === "en" ? s.nameEn : s.nameSq);

export default function BookPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: shop } = useShop();

  const preselected = params.get("service");
  const [step, setStep] = useState<Step>(preselected ? 1 : 0);
  const [serviceId, setServiceId] = useState<string | null>(preselected);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [booked, setBooked] = useState<Appointment | null>(null);

  const service = services?.find((s) => s.id === serviceId) ?? null;

  useEffect(() => {
    if (services && serviceId && !service) {
      setServiceId(null);
      setStep(0);
    }
  }, [services, serviceId, service]);

  if (booked && shop)
    return (
      <BookingSuccess
        appointment={booked}
        shop={shop}
        onBookAnother={() => {
          setBooked(null);
          setServiceId(null);
          setSlot(null);
          setStep(0);
        }}
      />
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10 md:py-14">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold sm:text-5xl">{t("book.title")}</h1>
        <p className="mt-2 text-muted">{t("book.subtitle")}</p>
      </div>

      <Stepper step={step} onStepClick={(s) => s < step && setStep(s)} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22 }}
            >
              {step === 0 && (
                <ServiceStep
                  services={services}
                  loading={servicesLoading}
                  currency={shop?.currency ?? "EUR"}
                  selectedId={serviceId}
                  onSelect={(id) => {
                    setServiceId(id);
                    setSlot(null);
                    setStep(1);
                  }}
                />
              )}
              {step === 1 && shop && serviceId && (
                <TimeStep
                  shop={shop}
                  serviceId={serviceId}
                  date={date}
                  onDateChange={(d) => {
                    setDate(d);
                    setSlot(null);
                  }}
                  slot={slot}
                  onSlotChange={setSlot}
                  onBack={() => setStep(0)}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && service && slot && (
                <DetailsStep
                  service={service}
                  slot={slot}
                  onBack={() => setStep(1)}
                  onBooked={setBooked}
                  onSlotTaken={() => {
                    setSlot(null);
                    setStep(1);
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Summary service={service} slot={slot} shop={shop} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stepper({ step, onStepClick }: { step: Step; onStepClick: (s: Step) => void }) {
  const { t } = useTranslation();
  const steps = [t("book.steps.service"), t("book.steps.time"), t("book.steps.details")];

  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-4">
            <button
              onClick={() => onStepClick(i as Step)}
              disabled={!done}
              className={cn("flex items-center gap-2.5 text-sm font-medium", done && "cursor-pointer", !done && !active && "text-muted")}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                  active && "border-accent bg-accent text-accent-fg",
                  done && "border-accent bg-accent-soft text-accent",
                  !done && !active && "border-line",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="h-px flex-1 bg-line">
                <span className={cn("block h-full bg-accent transition-all duration-500", done ? "w-full" : "w-0")} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ServiceStep(props: {
  services?: Service[];
  loading: boolean;
  currency: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const lang = currentLanguage();

  return (
    <div>
      <h2 className="mb-5 font-sans text-xl font-semibold">{t("book.chooseService")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {props.loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        {props.services?.map((s) => {
          const selected = s.id === props.selectedId;
          const description = lang === "en" ? s.descriptionEn : s.descriptionSq;
          return (
            <button
              key={s.id}
              onClick={() => props.onSelect(s.id)}
              className={cn(
                "group flex cursor-pointer flex-col rounded-2xl border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5",
                selected ? "border-accent ring-4 ring-ring" : "border-line hover:border-accent/50",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold">{serviceName(s, lang)}</span>
                <span className="font-display text-xl font-semibold text-accent">{formatPrice(s.price, props.currency, lang)}</span>
              </div>
              {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
              <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-medium text-muted">
                <Clock className="size-3.5" /> {t("common.minutes", { count: s.durationMinutes })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeStep(props: {
  shop: ShopInfo;
  serviceId: string;
  date: string | null;
  onDateChange: (date: string) => void;
  slot: Slot | null;
  onSlotChange: (slot: Slot) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const lang = currentLanguage();
  const { shop } = props;

  const days = useMemo(() => {
    const closedWeekdays = new Set(shop.workingHours.filter((w) => !w.isOpen).map((w) => w.dayOfWeek));
    const closedDates = new Set(shop.closedDates);
    return Array.from({ length: shop.bookingWindowDays + 1 }, (_, i) => {
      const date = addDays(shop.today, i);
      return { date, closed: closedWeekdays.has(dayOfWeekOf(date)) || closedDates.has(date) };
    });
  }, [shop]);

  const { date, onDateChange } = props;
  useEffect(() => {
    if (!date) {
      const firstOpen = days.find((d) => !d.closed);
      if (firstOpen) onDateChange(firstOpen.date);
    }
  }, [date, days, onDateChange]);

  const { data: availability, isFetching, isError, refetch } = useAvailability(props.date, props.serviceId);

  const autoPicking = useRef(true);
  useEffect(() => {
    if (!autoPicking.current || !availability || availability.date !== date || availability.slots.length > 0) return;
    const next = days.find((d) => !d.closed && d.date > availability.date);
    if (next) onDateChange(next.date);
    else autoPicking.current = false;
  }, [availability, date, days, onDateChange]);
  useEffect(() => {
    if (availability?.slots.length) autoPicking.current = false;
  }, [availability]);

  const pickDate = (d: string) => {
    autoPicking.current = false;
    onDateChange(d);
  };

  const groups = useMemo(() => {
    const slots = availability?.slots ?? [];
    const hour = (s: Slot) => Number(s.localTime.slice(0, 2));
    return [
      { key: "morning", icon: Sunrise, slots: slots.filter((s) => hour(s) < 12) },
      { key: "afternoon", icon: Sun, slots: slots.filter((s) => hour(s) >= 12 && hour(s) < 17) },
      { key: "evening", icon: Moon, slots: slots.filter((s) => hour(s) >= 17) },
    ] as const;
  }, [availability]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 font-sans text-xl font-semibold">{t("book.chooseDate")}</h2>
        <DateStrip days={days} selected={props.date} onSelect={pickDate} lang={lang} />
      </section>

      <section>
        <h2 className="mb-4 font-sans text-xl font-semibold">{t("book.chooseTime")}</h2>
        {isFetching && !availability ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-danger/30 bg-danger-soft p-6 text-center text-sm text-danger">
            {t("errors.server_error")}{" "}
            <button onClick={() => refetch()} className="cursor-pointer font-semibold underline">
              {t("common.retry")}
            </button>
          </div>
        ) : availability?.closedReason || availability?.slots.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <CalendarDays className="size-8 text-muted" />
            <p className="text-muted">
              {availability.closedReason ? t(`book.closedReason.${availability.closedReason}`) : t("book.noSlots")}
            </p>
          </div>
        ) : (
          <div className={cn("space-y-6 transition-opacity", isFetching && "opacity-60")}>
            {groups
              .filter((g) => g.slots.length > 0)
              .map((g) => (
                <div key={g.key}>
                  <p className="mb-2.5 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted uppercase">
                    <g.icon className="size-3.5" /> {t(`book.${g.key}`)}
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                    {g.slots.map((s) => {
                      const selected = props.slot?.startTime === s.startTime;
                      return (
                        <motion.button
                          key={s.startTime}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => props.onSlotChange(s)}
                          aria-pressed={selected}
                          className={cn(
                            "h-11 cursor-pointer rounded-xl border text-sm font-semibold tabular-nums transition-colors",
                            selected ? "border-accent bg-accent text-accent-fg shadow-md shadow-accent/25" : "border-line bg-surface hover:border-accent/60",
                          )}
                        >
                          {s.localTime}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      <StepNav onBack={props.onBack} onNext={props.onNext} nextDisabled={!props.slot} />
    </div>
  );
}

function DateStrip(props: { days: { date: string; closed: boolean }[]; selected: string | null; onSelect: (d: string) => void; lang: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("[aria-pressed=true]")?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [props.selected]);

  return (
    <div ref={ref} className="scrollbar-thin -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      {props.days.map(({ date, closed }) => {
        const selected = date === props.selected;
        return (
          <button
            key={date}
            disabled={closed}
            onClick={() => props.onSelect(date)}
            aria-pressed={selected}
            className={cn(
              "flex w-16 shrink-0 cursor-pointer snap-start flex-col items-center gap-0.5 rounded-2xl border py-3 transition-all",
              selected && "border-accent bg-accent text-accent-fg shadow-md shadow-accent/25",
              !selected && !closed && "border-line bg-surface hover:border-accent/60",
              closed && "cursor-not-allowed border-transparent opacity-35",
            )}
          >
            <span className="text-[0.6875rem] font-semibold uppercase opacity-75">{formatCalendarDate(date, props.lang, { weekday: "short" })}</span>
            <span className="font-display text-xl font-semibold">{Number(date.slice(8, 10))}</span>
            <span className="text-[0.6875rem] opacity-75">{formatCalendarDate(date, props.lang, { month: "short" })}</span>
          </button>
        );
      })}
    </div>
  );
}

function DetailsStep(props: {
  service: Service;
  slot: Slot;
  onBack: () => void;
  onBooked: (a: Appointment) => void;
  onSlotTaken: () => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: shop } = useShop();
  const book = useBookAppointment();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsForm>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: { clientName: user?.fullName ?? "", clientPhone: user?.phoneNumber ?? "", notes: "" },
  });

  const onSubmit = (data: DetailsForm) =>
    book.mutate(
      { serviceId: props.service.id, startTime: props.slot.startTime, ...data, notes: data.notes || undefined },
      {
        onSuccess: props.onBooked,
        onError: (e) => {
          toast.error(errorMessage(e));
          if (e instanceof ApiError && e.code === "slot_unavailable") props.onSlotTaken();
        },
      },
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div>
        <h2 className="font-sans text-xl font-semibold">{t("book.details")}</h2>
        <p className="mt-1 text-sm text-muted">{t("book.detailsHint")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("book.nameOnAppointment")} error={errors.clientName?.message}>
          {(id, d) => <Input id={id} autoComplete="name" aria-describedby={d} aria-invalid={!!errors.clientName} {...register("clientName")} />}
        </Field>
        <Field label={t("book.phoneOnAppointment")} error={errors.clientPhone?.message}>
          {(id, d) => <Input id={id} type="tel" autoComplete="tel" aria-describedby={d} aria-invalid={!!errors.clientPhone} {...register("clientPhone")} />}
        </Field>
      </div>
      <Field label={t("book.notes")} error={errors.notes?.message} optional>
        {(id, d) => <Textarea id={id} placeholder={t("book.notesPlaceholder")} aria-describedby={d} {...register("notes")} />}
      </Field>

      <div className="lg:hidden">
        <Summary service={props.service} slot={props.slot} shop={shop} />
      </div>

      <StepNav onBack={props.onBack} nextLabel={book.isPending ? t("book.booking") : t("book.confirm")} nextLoading={book.isPending} submit />
    </form>
  );
}

function StepNav(props: { onBack: () => void; onNext?: () => void; nextDisabled?: boolean; nextLabel?: string; nextLoading?: boolean; submit?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-6">
      <Button type="button" variant="ghost" onClick={props.onBack}>
        <ArrowLeft className="size-4" /> {t("common.back")}
      </Button>
      <Button
        type={props.submit ? "submit" : "button"}
        size="lg"
        onClick={props.onNext}
        disabled={props.nextDisabled}
        loading={props.nextLoading}
      >
        {props.nextLabel ?? t("common.next")}
        {!props.nextLoading && <ArrowRight className="size-4" />}
      </Button>
    </div>
  );
}

function Summary({ service, slot, shop }: { service: Service | null; slot: Slot | null; shop?: ShopInfo }) {
  const { t } = useTranslation();
  const lang = currentLanguage();

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line bg-surface-2 px-5 py-3.5 text-xs font-semibold tracking-wider text-muted uppercase">{t("book.summary")}</div>
      <dl className="space-y-4 px-5 py-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("book.steps.service")}</dt>
          <dd className="text-right font-medium">{service ? serviceName(service, lang) : "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("book.steps.time")}</dt>
          <dd className="text-right font-medium">
            {slot && shop ? (
              <>
                <span className="block first-letter:uppercase">{formatLongDate(slot.startTime, lang, shop.timeZone)}</span>
                <span className="text-accent">{slot.localTime}</span>
              </>
            ) : (
              "—"
            )}
          </dd>
        </div>
        {service && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("book.duration")}</dt>
            <dd className="font-medium">{t("common.minutes", { count: service.durationMinutes })}</dd>
          </div>
        )}
      </dl>
      <div className="flex items-center justify-between border-t border-line px-5 py-4">
        <span className="font-semibold">{t("book.total")}</span>
        <span className="font-display text-2xl font-semibold text-accent">{service && shop ? formatPrice(service.price, shop.currency, lang) : "—"}</span>
      </div>
    </Card>
  );
}

function BookingSuccess({ appointment, shop, onBookAnother }: { appointment: Appointment; shop: ShopInfo; onBookAnother: () => void }) {
  const { t } = useTranslation();
  const lang = currentLanguage();

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center sm:py-24">
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 180 }}
        className="grid size-20 place-items-center rounded-full bg-success-soft text-success"
      >
        <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
          <Check className="size-10" strokeWidth={2.5} />
        </motion.span>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="mt-8 text-4xl font-semibold">{t("book.successTitle")}</h1>
        <p className="mt-3 text-muted">{t("book.successText")}</p>

        <Card className="mt-8 p-6 text-left">
          <p className="font-semibold">{lang === "en" ? appointment.serviceNameEn : appointment.serviceNameSq}</p>
          <p className="mt-1 text-muted first-letter:uppercase">
            {formatLongDate(appointment.startTime, lang, shop.timeZone)} · {formatTime(appointment.startTime, lang, shop.timeZone)}
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-accent">{formatPrice(appointment.price, shop.currency, lang)}</p>
        </Card>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/appointments" className={buttonClass("primary", "lg")}>
            {t("book.viewAppointments")}
          </Link>
          <Button variant="outline" size="lg" onClick={onBookAnother}>
            {t("book.bookAnother")}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
