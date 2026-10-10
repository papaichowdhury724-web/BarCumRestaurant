"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MenuItem } from "@/lib/types";
import { useMoney, useSite } from "./atoms";
import { cleanAnchor, floatingButtons } from "@/lib/settings";
import { safeUrl } from "@/lib/url";

interface CartItem {
  id: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (id: string) => void;
  dec: (id: string) => void;
  rem: (id: string) => void;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
}

const CartC = createContext<CartState | null>(null);
export const useCart = () => useContext(CartC)!;

const priceOf = (m: MenuItem | undefined) => (m ? Number(m.price.replace(/[^0-9.]/g, "")) || 0 : 0);

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function CartProvider({ children, menu }: { children: React.ReactNode; menu: MenuItem[] }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const { db } = useSite();
  const orderingOn = db.config.sections.some((x) => x.type === "menu" && x.enabled && (x.data as { ordering?: boolean }).ordering === true);

  const add = (id: string) => {
    setItems((xs) => {
      const ex = xs.find((x) => x.id === id);
      if (ex) return xs.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x));
      return [...xs, { id, qty: 1 }];
    });
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
  };
  const dec = (id: string) =>
    setItems((xs) => xs.flatMap((x) => (x.id === id ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])));
  const rem = (id: string) => setItems((xs) => xs.filter((x) => x.id !== id));

  const { subtotal, count } = useMemo(() => {
    let s = 0;
    let c = 0;
    items.forEach((it) => {
      const m = menu.find((x) => x.id === it.id && x.enabled);
      if (!m) return; // dish was hidden or deleted after it was added
      s += priceOf(m) * it.qty;
      c += it.qty;
    });
    return { subtotal: s, count: c };
  }, [items, menu]);

  const value: CartState = { items, add, dec, rem, count, subtotal, open, setOpen };

  return (
    <CartC.Provider value={value}>
      {children}
      {orderingOn && <BoardFab pulse={pulse} />}
      {orderingOn && <BoardDrawer />}
    </CartC.Provider>
  );
}

/* ---------------- floating plate button ---------------- */

function BoardFab({ pulse }: { pulse: boolean }) {
  const { count, setOpen, subtotal } = useCart();
  const { fmt } = useMoney();
  const { db } = useSite();
  // sit above the round WhatsApp / call buttons when they are shown
  const lift = floatingButtons(db.config.settings).length * 60;
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.button
          key="fab"
          initial={{ y: 90, opacity: 0, rotate: -8 }}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: pulse ? 1.08 : 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          onClick={() => setOpen(true)}
          className="font-b fixed right-6 z-[75] flex items-center gap-3 px-5 py-4 text-[11px] uppercase tracking-[0.24em]"
          style={{
            bottom: 24 + lift,
            background: "var(--accent)",
            color: "var(--bg)",
            borderRadius: "var(--radius)",
            boxShadow: "0 22px 55px -12px color-mix(in srgb, var(--accent) 60%, transparent)",
          }}
        >
          <span className="relative flex h-5 w-5 items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4.5" />
            </svg>
          </span>
          {db.config.settings.labels.boardButton} · {count}
          <span className="opacity-80">{fmt(subtotal)}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ---------------- the tasting board ---------------- */

function Plate({ src, name }: { src: string; name: string }) {
  return (
    <span
      className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
      style={{ border: "1px solid var(--accent)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--surface) 90%, transparent), 0 0 0 4px color-mix(in srgb, var(--accent) 40%, transparent)" }}
    >
      <img src={src || undefined} alt={name} loading="lazy" decoding="async" className="h-[46px] w-[46px] rounded-full object-cover" />
    </span>
  );
}

function BoardDrawer() {
  const { db } = useSite();
  const { fmt } = useMoney();
  const cart = useCart();
  const menuSec = db.config.sections.find((x) => x.type === "menu" && x.enabled);
  const menuAnchor = cleanAnchor(menuSec?.anchor ?? "");
  const menuHref = safeUrl("#" + (menuAnchor || "menu"));
  const { theme } = db.config;
  const L = db.config.settings.labels;

  return (
    <AnimatePresence>
      {cart.open && (
        <>
          <motion.div
            key="sh"
            className="cart-backdrop fixed inset-0 z-[78]"
            style={{ background: "color-mix(in srgb, var(--bg) 72%, transparent)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => cart.setOpen(false)}
          />
          <motion.aside
            key="dr"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 210, damping: 29 }}
            className="fixed right-0 top-0 z-[79] flex h-full w-full max-w-[430px] flex-col overflow-hidden"
            style={{
              background: "var(--surface)",
              borderLeft: "1px solid var(--line)",
              fontSize: theme.cartFontSize,
            }}
          >
            {/* ambient glow header */}
            <div className="relative shrink-0 px-7 pb-6 pt-7" style={{ borderBottom: "1px solid var(--line)" }}>
              <div
                className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[420px] -translate-x-1/2"
                style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 22%, transparent), transparent 75%)" }}
              />
              <div className="relative flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-full" style={{ border: "1px solid var(--accent)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.4" className="spin-slow">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    </span>
                    <div className="font-d tx text-[1.5em] italic">{L.boardTitle}</div>
                  </div>
                  <div className="txm mt-3 flex items-center gap-3 text-[0.66em] uppercase tracking-[0.34em]">
                    <span className="h-px w-8" style={{ background: "var(--accent)" }} />
                    {cart.count === 0 ? "Nothing chosen yet" : `${cart.count} ${cart.count === 1 ? "course" : "courses"} on your board`}
                  </div>
                </div>
                <button
                  onClick={() => cart.setOpen(false)}
                  aria-label="Close board"
                  className="txm group flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:acc"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.6" className="transition-transform duration-500 group-hover:rotate-90">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6">
              {cart.count === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                    className="relative flex h-24 w-24 items-center justify-center rounded-full"
                    style={{ border: "1px solid var(--line)" }}
                  >
                    <span className="absolute inset-3 rounded-full" style={{ border: "1px dashed var(--line)" }} />
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.2" opacity="0.7">
                      <circle cx="12" cy="12" r="8" />
                      <circle cx="12" cy="12" r="3.5" />
                    </svg>
                  </motion.span>
                  <div className="font-d tx mt-7 text-[1.5em] italic">{L.boardEmptyTitle}</div>
                  {L.boardEmptyText.trim() && <p className="txm mt-3 max-w-[240px] text-[0.85em] leading-relaxed">{L.boardEmptyText}</p>}
                  <a
                    href={menuHref}
                    onClick={() => cart.setOpen(false)}
                    className="btn-gold font-b mt-8 px-7 py-3.5 text-[0.7em] uppercase tracking-[0.28em]"
                  >
                    {L.boardBrowse}
                  </a>
                </div>
              ) : (
                <div className="space-y-7">
                  <AnimatePresence initial={false}>
                    {cart.items.map((it, idx) => {
                      const m = db.menu.find((x) => x.id === it.id && x.enabled);
                      if (!m) return null;
                      const price = priceOf(m);
                      return (
                        <motion.div
                          key={it.id}
                          layout
                          initial={{ opacity: 0, x: 40 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 40 }}
                          transition={{ duration: 0.45, delay: idx * 0.04, ease: [0.19, 1, 0.22, 1] }}
                          className="group flex gap-5"
                          style={{ borderBottom: "1px solid var(--line)", paddingBottom: "1.4rem" }}
                        >
                          <div className="flex flex-col items-center gap-2.5 pt-0.5">
                            <span className="acc font-d text-[0.9em] italic" style={{ fontVariantNumeric: "tabular-nums" }}>
                              {ROMAN[idx] ?? idx + 1}
                            </span>
                            <Plate src={m.image} name={m.name} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-d tx text-[1.15em] italic leading-snug transition-colors duration-300 group-hover:acc">
                                {m.name}
                              </h4>
                              <button
                                onClick={() => cart.rem(it.id)}
                                aria-label="Remove course"
                                className="txm mt-1 shrink-0 text-[0.8em] opacity-40 transition-opacity hover:acc group-hover:opacity-100"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="txm mt-1 line-clamp-2 text-[0.8em] leading-relaxed">{m.desc}</p>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-4" style={{ border: "1px solid var(--line)", borderRadius: 999 }}>
                                <button onClick={() => cart.dec(it.id)} className="txm px-3.5 py-1.5 text-[0.85em] transition-colors hover:acc" aria-label="Less">
                                  −
                                </button>
                                <span className="tx w-5 text-center text-[0.85em]" style={{ fontVariantNumeric: "tabular-nums" }}>
                                  {it.qty}
                                </span>
                                <button onClick={() => cart.add(it.id)} className="txm px-3.5 py-1.5 text-[0.85em] transition-colors hover:acc" aria-label="More">
                                  +
                                </button>
                              </div>
                              <span className="font-d acc text-[1.05em]" style={{ fontVariantNumeric: "tabular-nums" }}>
                                {fmt(price * it.qty)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {cart.count > 0 && (
              <motion.div
                key="total"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="shrink-0 px-7 pb-7 pt-5"
                style={{ borderTop: "1px solid var(--line)", background: "color-mix(in srgb, var(--bg) 45%, transparent)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1" style={{ background: "var(--line)" }} />
                  <span className="txm text-[0.64em] uppercase tracking-[0.4em]">Your board</span>
                  <span className="h-px flex-1" style={{ background: "var(--line)" }} />
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div className="txm text-[0.8em] uppercase tracking-[0.2em]">
                    {cart.count} {cart.count === 1 ? "course" : "courses"}
                  </div>
                  <div className="font-d tx text-[1.9em] leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {fmt(cart.subtotal)}
                  </div>
                </div>
                {L.boardNote.trim() && <p className="txm mt-4 text-center text-[0.7em] leading-relaxed">{L.boardNote}</p>}
              </motion.div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
