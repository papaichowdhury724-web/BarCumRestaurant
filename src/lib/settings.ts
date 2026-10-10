import type { RestaurantSettings, SectionType } from "./types";
import { telHref } from "./url";

/** WhatsApp number typed by the admin (any format) → https://wa.me/… link, or "" when there are no digits. */
export function whatsappHref(raw: string | undefined): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length >= 6 ? `https://wa.me/${digits}` : "";
}

export interface FloatingBtn {
  kind: "whatsapp" | "call";
  href: string;
  label: string;
}

/** The round contact buttons that should really be shown (switched on AND the number exists). */
export function floatingButtons(st: RestaurantSettings): FloatingBtn[] {
  const out: FloatingBtn[] = [];
  const wa = whatsappHref(st.contact.whatsapp);
  if (st.floating.whatsapp && wa) out.push({ kind: "whatsapp", href: wa, label: "Chat on WhatsApp" });
  if (st.floating.call && st.contact.phone.replace(/\D/g, "")) out.push({ kind: "call", href: telHref(st.contact.phone), label: "Call us" });
  return out;
}

/** yyyy-mm-dd of (today + days) in the visitor's own timezone. */
export function dateStr(daysFromToday = 0): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Weekday (0 = Sunday) of a yyyy-mm-dd string, or -1 when it is not a valid date. */
export function weekdayOf(ymd: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return -1;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  // reject overflow dates such as 2026-13-40 (JS would silently roll them over)
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]) ? d.getDay() : -1;
}

export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Default #anchor of each section type (the first section of a type gets it, unless the admin typed their own). */
export const AUTO_ANCHOR: Partial<Record<SectionType, string>> = {
  hero: "hero",
  about: "about",
  menu: "menu",
  offers: "offers",
  chef: "chef",
  gallery: "gallery",
  testimonials: "testimonials",
  reservation: "reserve",
  location: "location",
};

/** What an admin types in "Link ID" → a safe anchor (letters, digits, - and _). */
export const cleanAnchor = (v: string) => v.trim().replace(/^#/, "").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "");
