/* ============ LUMIÈRE — data model (mirrors the Firestore structure) ============
   Firestore layout the admin writes into:
     siteConfig / main        -> SiteConfig
     menuItems  / {id}        -> MenuItem[]
     coupons    / {id}        -> Coupon[]
     bookings   / {id}        -> Booking[]
============================================================================= */

export interface NavLink {
  id: string;
  label: string;
  href: string;
}

export interface ThemeConfig {
  preset: string;
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  fontDisplay: string;
  fontBody: string;
  radius: number; // px 0-24
  cartFontSize: number; // px 11-22
}

export interface AnimConfig {
  preloader: "cinematic" | "logo" | "counter" | "none";
  reveal: "fade-up" | "fade" | "slide-left" | "slide-right" | "zoom" | "mask" | "parallax" | "none";
  hero: "kenburns" | "zoomin" | "fade" | "none";
  text: "mask" | "letters" | "typewriter" | "none";
  hover: "lift" | "scale" | "glow" | "underline" | "tilt" | "none";
  cursor: "ring" | "dot" | "glow" | "default-glow" | "none";
  marquee: boolean;
  marqueeSpeed: number; // seconds per loop
  parallax: boolean;
  duration: number; // seconds for reveals
}

export interface HeroConfig {
  mode: "video" | "image";
  videoUrl: string;
  posterUrl: string;
  imageUrl: string;
  overlay: number; // 0-100
  kicker: string;
  titleA: string;
  titleB: string;
  sub: string;
  cta: string;
  ctaHref: string;
  /** second (outline) button — empty label hides it */
  cta2?: string;
  cta2Href?: string;
}

export interface AboutConfig {
  kicker: string;
  title: string;
  text: string;
  image: string;
  image2: string;
  /** the big outlined word behind the photos (default "Est."); empty hides it */
  badge?: string;
  stats: { id: string; label: string; value: string }[];
}

export interface GalleryItem {
  id: string;
  url: string;
  caption: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
}

export interface ChefConfig {
  kicker: string;
  title: string;
  name: string;
  role: string;
  text: string;
  image: string;
}

export interface MenuConfig {
  kicker: string;
  title: string;
  note: string;
  /** false/undefined = view-only menu (no Add to cart, no cart board) */
  ordering?: boolean;
}

export interface CurrencyConfig {
  symbol: string; // ₹, $, £, € ... anything
  position: "before" | "after";
  locale: "en-IN" | "en-US" | "en-GB" | "de-DE";
}

export interface OffersConfig {
  kicker: string;
  title: string;
  sub: string;
  /** button next to the title — empty label hides it */
  ctaLabel?: string;
  ctaHref?: string;
  /** text when no coupon is active */
  emptyText?: string;
}

export type ResField = "name" | "phone" | "email" | "date" | "time" | "guests" | "coupon" | "requests";

/** Which booking-form fields a guest MUST fill (true = required, shows a red star). */
export type ResRequired = Record<ResField, boolean>;

export interface ResConfig {
  required: ResRequired;
  kicker: string;
  title: string;
  sub: string;
  image: string;
  note: string;
  /** caption written over the side photo — empty hides it */
  caption?: string;
  submitLabel?: string;
  successTitle?: string;
}

export interface LocationConfig {
  kicker: string;
  title: string;
  /** address / phone / mapsUrl: leave empty to use the ones in Restaurant Settings */
  address: string;
  phone: string;
  mapsUrl: string;
  hoursTitle?: string;
  mapsLabel?: string;
}

export interface CustomSectionConfig {
  kicker: string;
  title: string;
  text: string;
  image: string;
  cta: string;
  ctaUrl: string;
  flip: boolean;
}

export interface BreakConfig {
  kicker: string;
  line: string;
  image: string;
}

export type SectionType =
  | "hero"
  | "about"
  | "menu"
  | "offers"
  | "chef"
  | "break"
  | "gallery"
  | "testimonials"
  | "reservation"
  | "location"
  | "custom";

export interface Section {
  id: string;
  type: SectionType;
  enabled: boolean;
  title: string;
  /** the #anchor menu links jump to, e.g. "events" for href="#events" (blank = automatic) */
  anchor?: string;
  data:
    | HeroConfig
    | AboutConfig
    | MenuConfig
    | OffersConfig
    | ChefConfig
    | { items: GalleryItem[] } & Partial<CustomSectionConfig>
    | { items: Testimonial[] } & Partial<CustomSectionConfig>
    | ResConfig
    | LocationConfig
    | BreakConfig
    | CustomSectionConfig;
}

export interface HeaderConfig {
  logoText: string;
  logoSub: string;
  logoImage: string;
  links: NavLink[];
  /** @deprecated moved to Restaurant Settings → contact (kept so old saved data can be migrated) */
  phone?: string;
  /** @deprecated moved to Restaurant Settings → contact */
  email?: string;
  bookLabel: string;
  sticky: boolean;
}

export interface FooterSocial {
  id: string;
  label: string;
  url: string;
  icon: "instagram" | "facebook" | "twitter" | "youtube" | "tiktok" | "website";
}

export interface FooterConfig {
  about: string;
  /** @deprecated address / phone / email / hours / socials moved to Restaurant Settings */
  address?: string;
  phone?: string;
  email?: string;
  hours?: { id: string; d: string; t: string }[];
  socials?: FooterSocial[];
  links: NavLink[];
  copyright: string;
}

/* ---------- Restaurant Settings: everything that is about the restaurant itself, not a section ---------- */

export interface RestaurantSettings {
  seo: { title: string; description: string; favicon: string; ogImage: string };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    mapsUrl: string;
    /** Google Maps embed link or whole <iframe> code */
    mapEmbed: string;
  };
  hours: { id: string; d: string; t: string }[];
  socials: FooterSocial[];
  booking: {
    enabled: boolean;
    timeSlots: string[]; // "HH:MM"
    maxGuests: number;
    leadDays: number; // earliest bookable day, 0 = today
    closedDays: number[]; // 0 = Sunday … 6 = Saturday
  };
  labels: {
    navigateTitle: string;
    hoursTitle: string;
    contactTitle: string;
    footerTagline: string;
    scrollCue: string;
    preloaderText: string;
    showAdminLink: boolean;
    marquee: string[];
    addLabel: string;
    addToCartLabel: string;
    boardButton: string;
    boardTitle: string;
    boardEmptyTitle: string;
    boardBrowse: string;
    boardEmptyText: string;
    boardNote: string;
  };
  announcement: { enabled: boolean; text: string; linkLabel: string; linkUrl: string; dismissible: boolean };
  floating: { whatsapp: boolean; call: boolean };
}

export interface SiteConfig {
  siteName: string;
  tagline: string;
  settings: RestaurantSettings;
  theme: ThemeConfig;
  animations: AnimConfig;
  currency?: CurrencyConfig;
  header: HeaderConfig;
  footer: FooterConfig;
  sections: Section[];
}

export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: string;
  category: string;
  image: string;
  tag: "none" | "new" | "chef" | "spicy" | "veg";
  enabled: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  minSpend: number;
  desc: string;
  active: boolean;
  expires: string; // yyyy-mm-dd or ""
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  requests: string;
  coupon?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: number;
}

export interface DB {
  config: SiteConfig;
  menu: MenuItem[];
  coupons: Coupon[];
  bookings: Booking[];
}

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
