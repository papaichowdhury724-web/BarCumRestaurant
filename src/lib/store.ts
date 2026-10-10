import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { fbAuth, firestore } from "./firebase";
import { defaultConfig, defaultCoupons, defaultMenu, sectionFactory } from "./defaults";
import type { Booking, Coupon, DB, MenuItem, SectionType, SiteConfig } from "./types";
import { uid } from "./types";

/* ---------------- core cache ---------------- */

let cache: DB | null = null;
let loading: Promise<DB> | null = null;
const listeners = new Set<(db: DB) => void>();

function emit(db: DB) {
  // nothing changed -> do not re-render the whole site for identical data
  if (cache && JSON.stringify(cache) === JSON.stringify(db)) return;
  cache = db;
  listeners.forEach((l) => l(db));
}

/* A Firestore listener fires once right after it is attached with the data we have just loaded.
   Ignore that first call so the site is not re-downloaded and re-rendered 4-5 times while it opens. */
let loadFailed = false;
function afterFirst(fn: () => void): () => void {
  let first = true;
  return () => {
    if (first) {
      first = false;
      // only safe to skip when the initial load really succeeded; otherwise this snapshot is our recovery
      if (cache && !loadFailed) return;
    }
    fn();
  };
}

/* A stored document may be partial or from an older version: fill every missing
   field from the defaults so the site/admin never crash on `undefined`. */
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function fillDefaults<T>(stored: unknown, def: T): T {
  if (Array.isArray(def)) return (Array.isArray(stored) ? stored : def) as T;
  if (isObj(def)) {
    const src = isObj(stored) ? stored : {};
    const out: Record<string, unknown> = { ...src };
    for (const k of Object.keys(def)) out[k] = fillDefaults(src[k], (def as Record<string, unknown>)[k]);
    return out as T;
  }
  return (stored === undefined || stored === null ? def : stored) as T;
}

/* Older saved sites kept phone / address / hours / socials inside "header" and "footer".
   They now live in "settings" — carry the old values over so nothing the owner typed is lost. */
function withSettings(raw: unknown): unknown {
  if (!isObj(raw) || isObj(raw.settings)) return raw;
  const header = isObj(raw.header) ? raw.header : {};
  const footer = isObj(raw.footer) ? raw.footer : {};
  const loc = Array.isArray(raw.sections)
    ? (raw.sections as unknown[]).find((x) => isObj(x) && x.type === "location" && isObj(x.data))
    : undefined;
  const locData = isObj(loc) && isObj(loc.data) ? loc.data : {};
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
  const contact: Record<string, unknown> = {};
  const phone = str(footer.phone) ?? str(header.phone) ?? str(locData.phone);
  const email = str(footer.email) ?? str(header.email);
  const address = str(footer.address) ?? str(locData.address);
  const mapsUrl = str(locData.mapsUrl);
  if (phone) contact.phone = phone;
  if (email) contact.email = email;
  if (address) contact.address = address;
  if (mapsUrl) contact.mapsUrl = mapsUrl;
  const settings: Record<string, unknown> = { contact };
  if (Array.isArray(footer.hours)) settings.hours = footer.hours;
  if (Array.isArray(footer.socials)) settings.socials = footer.socials;
  return { ...raw, settings };
}

/* Fill the fields a section saved by an older version is missing (new buttons, labels…). */
function normaliseSection<T extends { type: SectionType; data: unknown }>(x: T): T {
  const make = sectionFactory[x.type];
  if (!make) return x;
  return { ...x, data: fillDefaults(x.data, make().data) };
}

async function loadFirebase(): Promise<DB> {
  const fs = firestore;
  // bookings are readable only by the signed-in admin; public visitors must still load the site
  const bookingsP = fbAuth.currentUser
    ? getDocs(collection(fs, "bookings")).catch(() => null)
    : Promise.resolve(null);
  try {
    const [cfgSnap, menuSnap, couponSnap, bookingSnap] = await Promise.all([
      getDoc(doc(fs, "siteConfig", "main")),
      getDocs(collection(fs, "menuItems")),
      getDocs(collection(fs, "coupons")),
      bookingsP,
    ]);
    const fresh = !cfgSnap.exists(); // brand-new Firebase project: show the starter content
    const menu = (menuSnap.docs.map((d) => d.data()) as (MenuItem & { sort?: number })[]).sort(
      (a, b) => (a.sort ?? 0) - (b.sort ?? 0)
    );
    const coupons = couponSnap.docs.map((d) => d.data() as Coupon);
    const config = fillDefaults<SiteConfig>(withSettings(cfgSnap.data()), defaultConfig());
    // drop malformed section entries so one bad record cannot crash the whole page
    config.sections = config.sections.filter((x) => isObj(x) && typeof x.type === "string" && isObj(x.data));
    config.sections = config.sections.map(normaliseSection);
    // the old starter line under the menu title was removed — clean it out of already-saved configs too
    config.sections.forEach((x) => {
      if (x.type === "menu" && typeof (x.data as { note?: string }).note === "string" && /^Prices in INR/i.test((x.data as { note: string }).note)) {
        (x.data as { note: string }).note = "";
      }
    });
    loadFailed = false;
    return {
      config,
      menu: fresh && menu.length === 0 ? defaultMenu() : menu,
      coupons: fresh && coupons.length === 0 ? defaultCoupons() : coupons,
      bookings: (bookingSnap?.docs ?? []).map((d) => d.data() as Booking).sort((a, b) => b.createdAt - a.createdAt),
    };
  } catch (e) {
    // Firestore not reachable / not created yet: keep the site and admin usable with starter content
    console.warn("Could not read Firestore.", e);
    loadFailed = true;
    // never replace data already on screen with starter content (an admin save could then overwrite real data)
    if (cache) return cache;
    return { config: defaultConfig(), menu: defaultMenu(), coupons: defaultCoupons(), bookings: [] };
  }
}

async function ensure(): Promise<DB> {
  if (cache) return cache;
  if (!loading) {
    loading = loadFirebase().then((d) => {
      loading = null;
      emit(d);
      return d;
    });
  }
  return loading;
}

async function refresh() {
  emit(await loadFirebase());
}

export function subscribeDB(cb: (db: DB) => void): () => void {
  listeners.add(cb);
  void ensure();
  let alive = true;
  const fs = firestore;
  const noop = () => {};
  let bookingsUnsub: (() => void) | null = null;
  let firstAuth = true;
  const attachBookings = (authed: boolean) => {
    bookingsUnsub?.();
    bookingsUnsub = authed ? onSnapshot(collection(fs, "bookings"), afterFirst(() => void (alive && refresh())), noop) : null;
  };
  const unsubs: (() => void)[] = [
    onSnapshot(doc(fs, "siteConfig", "main"), afterFirst(() => void (alive && refresh())), noop),
    onSnapshot(collection(fs, "menuItems"), afterFirst(() => void (alive && refresh())), noop),
    onSnapshot(collection(fs, "coupons"), afterFirst(() => void (alive && refresh())), noop),
    () => bookingsUnsub?.(),
    onAuthStateChanged(fbAuth, (u) => {
      attachBookings(!!u);
      // a public visitor needs no extra reload; a signed-in admin does (to pick up the bookings)
      const firstCall = firstAuth;
      firstAuth = false;
      if (alive && (!firstCall || u)) void refresh();
    }),
  ];
  return () => {
    alive = false;
    listeners.delete(cb);
    unsubs.forEach((u) => u());
  };
}

/* ---------------- writes ---------------- */

export async function saveConfig(config: SiteConfig): Promise<void> {
  await setDoc(doc(firestore, "siteConfig", "main"), config);
  await refresh();
}

export async function saveMenu(items: MenuItem[]): Promise<void> {
  const fs = firestore;
  const old = await getDocs(collection(fs, "menuItems"));
  const batch = writeBatch(fs);
  old.forEach((d) => {
    if (!items.some((i) => i.id === d.id)) batch.delete(doc(fs, "menuItems", d.id));
  });
  items.forEach((i, idx) => batch.set(doc(fs, "menuItems", i.id), { ...i, sort: idx }));
  await batch.commit();
  await refresh();
}

export async function saveCoupons(items: Coupon[]): Promise<void> {
  const fs = firestore;
  const old = await getDocs(collection(fs, "coupons"));
  const batch = writeBatch(fs);
  old.forEach((d) => {
    if (!items.some((i) => i.id === d.id)) batch.delete(doc(fs, "coupons", d.id));
  });
  items.forEach((i) => batch.set(doc(fs, "coupons", i.id), i));
  await batch.commit();
  await refresh();
}

export async function addBooking(
  b: Omit<Booking, "id" | "createdAt" | "status">
): Promise<void> {
  const booking: Booking = { ...b, id: uid(), createdAt: Date.now(), status: "pending" };
  await setDoc(doc(firestore, "bookings", booking.id), booking);
  await refresh();
}

export async function patchBooking(id: string, patch: Partial<Booking>): Promise<void> {
  await updateDoc(doc(firestore, "bookings", id), patch);
  await refresh();
}

export async function deleteBooking(id: string): Promise<void> {
  await deleteDoc(doc(firestore, "bookings", id));
  await refresh();
}

/* ---------------- auth (Firebase email + password) ---------------- */

type AuthCb = (authed: boolean, email?: string) => void;

export function onAuth(cb: AuthCb): () => void {
  return onAuthStateChanged(fbAuth, (u) => cb(!!u, u?.email ?? undefined));
}

function authMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Wrong email or password.";
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes or reset your password.";
    case "auth/network-request-failed":
      return "Network error — check your internet connection.";
    case "auth/operation-not-allowed":
      return "Email/Password sign-in is not enabled in Firebase Authentication yet.";
    default:
      return e instanceof Error ? e.message : "Login failed";
  }
}

export async function login(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(fbAuth, email.trim(), password);
  } catch (e) {
    throw new Error(authMessage(e));
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(fbAuth, email.trim());
  } catch (e) {
    throw new Error(authMessage(e));
  }
}

export async function logout(): Promise<void> {
  await signOut(fbAuth);
}

/* ---------------- react hook ---------------- */

export function useDB(): DB | null {
  const [state, set] = useState<DB | null>(cache);
  useEffect(() => subscribeDB(set), []);
  return state;
}

export function useAuth(): { ready: boolean; authed: boolean; email?: string } {
  const [s, setS] = useState<{ ready: boolean; authed: boolean; email?: string }>({ ready: false, authed: false });
  useEffect(() => onAuth((authed, email) => setS({ ready: true, authed, email })), []);
  return s;
}
