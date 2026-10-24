import type { Language } from "./types";

const LOCALES: Record<Language, string> = { sq: "sq-AL", en: "en-GB" };

export const localeOf = (lang: string) => LOCALES[(lang as Language) in LOCALES ? (lang as Language) : "sq"];

export function formatDateTime(iso: string, lang: string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(localeOf(lang), { timeZone, ...options }).format(new Date(iso));
}

export const formatTime = (iso: string, lang: string, timeZone: string) =>
  formatDateTime(iso, lang, timeZone, { hour: "2-digit", minute: "2-digit", hour12: false });

export const formatLongDate = (iso: string, lang: string, timeZone: string) =>
  formatDateTime(iso, lang, timeZone, { weekday: "long", day: "numeric", month: "long" });

const parseDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export const addDays = (date: string, days: number) => {
  const d = parseDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const dayOfWeekOf = (date: string) =>
  (["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const)[parseDate(date).getUTCDay()];

export const formatCalendarDate = (date: string, lang: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(localeOf(lang), { timeZone: "UTC", ...options }).format(parseDate(date));

export const localDateOf = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

export const formatPrice = (price: number, currency: string, lang: string) =>
  new Intl.NumberFormat(localeOf(lang), {
    style: "currency",
    currency,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);

export const shortTime = (time: string) => time.slice(0, 5);
