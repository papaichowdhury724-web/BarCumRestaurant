"use client";
import { useContext, useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  BackToTop,
  CustomCursor,
  Marquee,
  Noise,
  Preloader,
  ScrollProgress,
  Reveal,
  SiteCtx,
  hoverProps,
  isDark,
  useThemeApply,
} from "./atoms";
import { SectionView } from "./sections";
import { CartProvider } from "./Cart";
import { useDB } from "@/lib/store";
import { AUTO_ANCHOR, cleanAnchor, floatingButtons } from "@/lib/settings";
import { isExternal, safeUrl, telHref } from "@/lib/url";
import type { Section } from "@/lib/types";

export default function Home() {
  const db = useDB();
  if (!db) return <BootScreen />;
  return <SiteRoot db={db} />;
}

function BootScreen() {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#070605]">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border border-transparent border-t-[#C9A24B]" style={{ animationDuration: "1.1s" }} />
          <div className="absolute inset-2 rounded-full border border-[#2a2318]" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.5em] text-[#968B78]">Setting the table</div>
      </div>
    </div>
  );
}

/** Unique, URL-safe anchor for every visible section (two sections of one type never share an id). */
function sectionAnchors(sections: Section[]): Record<string, string | undefined> {
  const used = new Set<string>();
  const out: Record<string, string | undefined> = {};
  // explicit anchors first so an automatic one can never steal them
  sections.forEach((s) => {
    const a = cleanAnchor(s.anchor ?? "");
    if (a && !used.has(a)) {
      used.add(a);
      out[s.id] = a;
    }
  });
  sections.forEach((s) => {
    if (out[s.id]) return;
    const a = AUTO_ANCHOR[s.type];
    if (a && !used.has(a)) {
      used.add(a);
      out[s.id] = a;
    }
  });
  return out;
}

function setMeta(sel: string, make: () => HTMLElement, attr: string, value: string) {
  let el = document.head.querySelector<HTMLElement>(sel);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = make();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function useSeo(db: NonNullable<ReturnType<typeof useDB>>) {
  const { siteName, tagline, theme } = db.config;
  const { seo } = db.config.settings;
  useEffect(() => {
    const title = seo.title.trim() || `${siteName}${tagline ? " — " + tagline : ""}`;
    document.title = title;
    const meta = (key: "name" | "property", val: string) => () => {
      const m = document.createElement("meta");
      m.setAttribute(key, val);
      return m;
    };
    const desc = seo.description.trim();
    setMeta('meta[name="description"]', meta("name", "description"), "content", desc);
    setMeta('meta[property="og:title"]', meta("property", "og:title"), "content", title);
    setMeta('meta[property="og:description"]', meta("property", "og:description"), "content", desc);
    setMeta('meta[property="og:image"]', meta("property", "og:image"), "content", /^https?:/i.test(seo.ogImage) ? seo.ogImage : "");
    setMeta('meta[name="theme-color"]', meta("name", "theme-color"), "content", theme.bg);
    setMeta(
      'link[rel="icon"]',
      () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "icon");
        return l;
      },
      "href",
      seo.favicon.trim()
    );
  }, [siteName, tagline, theme.bg, seo.title, seo.description, seo.favicon, seo.ogImage]);
}

function SiteRoot({ db }: { db: NonNullable<ReturnType<typeof useDB>> }) {
  const t = db.config.theme;
  const a = db.config.animations;
  const st = db.config.settings;
  useThemeApply(t);
  useSeo(db);
  const [ready, setReady] = useState(a.preloader === "none");
  const [preloading, setPreloading] = useState(a.preloader !== "none");

  const sections = db.config.sections.filter((s) => s.enabled);
  const anchors = sectionAnchors(sections);

  return (
    <SiteCtx.Provider value={{ db, t, a }}>
      <CartProvider menu={db.menu}>
        <div className="relative min-h-screen font-b tx">
          <CinematicBackdrop />
          <ScrollProgress />
          <Noise />
          <CustomCursor />
          <AnnouncementBar />
          <Header anchors={anchors} />
          <main>
            {sections.length === 0 ? <HeroFallback /> : null}
            {sections.map((s) => (
              <SectionView key={s.id} s={s} ready={ready} anchor={anchors[s.id]} />
            ))}
            <Marquee />
          </main>
          <Footer />
          <FloatingButtons />
          <BackToTop />
          <AnimatePresence>
            {preloading && (
              <Preloader
                name={db.config.siteName}
                kind={a.preloader}
                text={st.labels.preloaderText.trim()}
                onDone={() => {
                  setPreloading(false);
                  setReady(true);
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </CartProvider>
    </SiteCtx.Provider>
  );
}

/* ================= announcement bar + floating contact buttons ================= */

function AnnouncementBar() {
  const { db } = useCtx();
  const an = db.config.settings.announcement;
  const text = an.text.trim();
  const key = `ann:${text}|${an.linkUrl}`;
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    try {
      setClosed(sessionStorage.getItem(key) === "1");
    } catch {
      setClosed(false);
    }
  }, [key]);
  const show = an.enabled && !!text && !closed;
  useEffect(() => {
    document.documentElement.style.setProperty("--bar-h", show ? "38px" : "0px");
    return () => document.documentElement.style.setProperty("--bar-h", "0px");
  }, [show]);
  if (!show) return null;
  const href = an.linkLabel.trim() ? safeUrl(an.linkUrl) : "";
  return (
    <div
      className="fixed inset-x-0 top-0 z-[61] flex h-[38px] items-center justify-center gap-3 px-10 text-center font-b text-[11.5px] tracking-wide"
      style={{ background: "var(--accent)", color: "var(--bg)" }}
      role="status"
    >
      <span className="truncate">{text}</span>
      {href && (
        <a href={href} {...(isExternal(href) ? { target: "_blank", rel: "noreferrer" } : {})} className="shrink-0 font-semibold uppercase tracking-[0.18em] underline underline-offset-4">
          {an.linkLabel}
        </a>
      )}
      {an.dismissible && (
        <button
          onClick={() => {
            setClosed(true);
            try {
              sessionStorage.setItem(key, "1");
            } catch {
              /* private mode: just hide it for now */
            }
          }}
          aria-label="Close announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-[14px] opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function FloatingButtons() {
  const { db } = useCtx();
  const list = floatingButtons(db.config.settings);
  if (list.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-4 z-[70] flex flex-col gap-3 md:bottom-8 md:right-8">
      {list.map((b) => (
        <a
          key={b.kind}
          href={b.href}
          {...(b.kind === "whatsapp" ? { target: "_blank", rel: "noreferrer" } : {})}
          aria-label={b.label}
          title={b.label}
          className="flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition-transform hover:-translate-y-1"
          style={{ background: b.kind === "whatsapp" ? "#25D366" : "var(--accent)", color: b.kind === "whatsapp" ? "#fff" : "var(--bg)" }}
        >
          {b.kind === "whatsapp" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.7A8 8 0 1 1 21 12Z" />
              <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.4" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
            </svg>
          )}
        </a>
      ))}
    </div>
  );
}

function HeroFallback() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <div className="font-d acc text-5xl italic">The house is preparing…</div>
    </div>
  );
}

/* ================= cinematic scroll backdrop ================= */

function CinematicBackdrop() {
  const { scrollYProgress } = useScroll();
  const g1y = useTransform(scrollYProgress, [0, 1], ["-14%", "42%"]);
  const g1x = useTransform(scrollYProgress, [0, 1], ["-8%", "26%"]);
  const g1o = useTransform(scrollYProgress, [0, 0.45, 1], [0.55, 0.3, 0.65]);
  const g2y = useTransform(scrollYProgress, [0, 1], ["46%", "-22%"]);
  const g2x = useTransform(scrollYProgress, [0, 1], ["34%", "-10%"]);
  const g2o = useTransform(scrollYProgress, [0, 0.55, 1], [0.16, 0.42, 0.22]);
  const g3y = useTransform(scrollYProgress, [0, 1], ["30%", "-14%"]);
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "var(--bg)" }} aria-hidden>
      <motion.div
        style={{
          y: g1y,
          x: g1x,
          opacity: g1o,
          willChange: "transform, opacity",
          background: "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 20%, transparent), transparent 72%)",
        }}
        className="absolute -left-[18%] top-[-12%] h-[75vh] w-[75vw] rounded-full"
      />
      <motion.div
        style={{
          y: g2y,
          x: g2x,
          opacity: g2o,
          willChange: "transform, opacity",
          background: "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 15%, transparent), transparent 70%)",
        }}
        className="absolute -right-[20%] bottom-[-15%] h-[65vh] w-[65vw] rounded-full"
      />
      <motion.div
        style={{
          y: g3y,
          opacity: 0.12,
          willChange: "transform, opacity",
          background: "radial-gradient(closest-side, color-mix(in srgb, var(--accent) 24%, transparent), transparent 75%)",
        }}
        className="absolute left-[38%] top-[30%] h-[46vh] w-[46vw] rounded-full"
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(130% 95% at 50% 42%, transparent 42%, color-mix(in srgb, var(--bg) 80%, transparent) 100%)",
        }}
      />
    </div>
  );
}

/* ================= HEADER ================= */

function Header({ anchors }: { anchors: Record<string, string | undefined> }) {
  const { db, a } = useCtx();
  const h = db.config.header;
  const st = db.config.settings;
  const sections = db.config.sections.filter((x) => x.enabled);
  const heroId = sections.find((x) => x.type === "hero");
  const reserve = sections.find((x) => x.type === "reservation");
  const logoHref = heroId && anchors[heroId.id] ? "#" + anchors[heroId.id] : "#";
  // the "Book" button goes to the booking form; with no booking section it falls back to calling
  const bookHref = reserve && anchors[reserve.id] ? "#" + anchors[reserve.id] : st.contact.phone.replace(/\D/g, "") ? telHref(st.contact.phone) : "#";
  const phone = st.contact.phone.trim();
  const [scrolled, setScrolled] = useState(false);
  const [mob, setMob] = useState(false);
  const hoverP = hoverProps(a.hover);
  useScrollFlag(setScrolled);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
        className="fixed inset-x-0 z-[60] transition-[background,border-color] duration-500"
        style={{
          top: "var(--bar-h, 0px)",
          ...(scrolled && h.sticky
            ? { background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line)" }
            : { background: "transparent" }),
        }}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4 md:px-14 md:py-5">
          <a href={logoHref} className="group flex items-center gap-3">
            {h.logoImage ? (
              <img src={h.logoImage} alt={h.logoText} className="h-10 w-auto object-contain" />
            ) : (
              <div>
                <div className="font-d tx text-2xl tracking-[0.18em] transition-colors duration-300 group-hover:acc">
                  {h.logoText}
                </div>
                <div className="txm text-[8.5px] uppercase tracking-[0.42em]">{h.logoSub}</div>
              </div>
            )}
          </a>
          <nav className="hidden items-center gap-8 xl:flex">
            {h.links.map((l) => (
              <a key={l.id} href={safeUrl(l.href)} className="u-hover txm hover:acc font-b text-[11px] uppercase tracking-[0.3em] transition-colors duration-300">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-6 xl:flex">
            {phone && (
              <a href={telHref(phone)} className="txm font-b text-[12px] tracking-wide transition-colors hover:acc">
                {phone}
              </a>
            )}
            <motion.a href={bookHref} {...hoverP} className="btn-gold font-b px-6 py-3 text-[10.5px] uppercase tracking-[0.28em]">
              {h.bookLabel}
            </motion.a>
          </div>
          <button className="p-2 -mr-2 xl:hidden" onClick={() => setMob(true)} aria-label="Open menu">
            <div className="flex w-7 flex-col gap-1.5">
              <span className="h-px w-full bg-[var(--text)]" />
              <span className="h-px w-4 bg-[var(--accent)]" />
              <span className="h-px w-full bg-[var(--text)]" />
            </div>
          </button>
        </div>
      </motion.header>

      {/* mobile overlay */}
      <AnimatePresence>
        {mob && (
          <>
            <motion.div
              key="msh"
              className="fixed inset-0 z-[84] bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMob(false)}
            />
            <motion.div
              key="mp"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="bg-surf brd fixed right-0 top-0 z-[85] flex h-full w-[min(320px,88vw)] flex-col overflow-y-auto p-7 sm:p-8"
            >
              <div className="font-d acc mb-10 text-2xl tracking-[0.15em]">{h.logoText}</div>
              {h.links.map((l, i) => (
                <motion.a
                  key={l.id}
                  href={safeUrl(l.href)}
                  onClick={() => setMob(false)}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="font-d tx border-b py-4 text-2xl italic"
                  style={{ borderColor: "var(--line)" }}
                >
                  {l.label}
                </motion.a>
              ))}
              <a href={bookHref} onClick={() => setMob(false)} className="btn-gold font-b mt-8 py-4 text-center text-[11px] uppercase tracking-[0.3em]">
                {h.bookLabel}
              </a>
              {st.labels.showAdminLink && (
                <a
                  href="/admin"
                  className="btn-ghost font-b mt-3 flex items-center justify-center gap-2.5 py-3.5 text-[10px] uppercase tracking-[0.3em]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  Admin Console
                </a>
              )}
              <div className="txm mt-auto space-y-1 pt-8 text-xs">
                <div>{st.contact.phone}</div>
                <div>{st.contact.email}</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function useCtx() {
  return useContext(SiteCtx)!;
}
function useScrollFlag(set: (v: boolean) => void) {
  useEffect(() => {
    const on = () => set(window.scrollY > 50);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [set]);
}

/* ================= FOOTER ================= */

const SOCIAL_ICONS: Record<string, string> = {
  instagram: "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3.5A4.5 4.5 0 1 1 7.5 13 4.5 4.5 0 0 1 12 8.5Zm0 2A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5ZM16.6 6a1.1 1.1 0 1 1-1.1 1.1A1.1 1.1 0 0 1 16.6 6Z",
  facebook: "M14 3h3v4h-3c-.6 0-1 .4-1 1v3h4l-.5 4H13v7H9v-7H6v-4h3V8a5 5 0 0 1 5-5Z",
  twitter: "M4 4l7.1 9.3L4.4 20h2.5l5.3-5.6L16.4 20H20l-7.4-9.7L18.9 4h-2.5l-4.8 5.1L8 4H4Z",
  youtube: "M21.6 8.2a2.5 2.5 0 0 0-1.8-1.8C18.2 6 12 6 12 6s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 8.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 3.8 2.5 2.5 0 0 0 1.8 1.8C5.8 18 12 18 12 18s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-3.8ZM10 15V9l5.2 3Z",
  tiktok: "M16.6 3c.3 2.1 1.7 3.8 3.9 4v3a7.7 7.7 0 0 1-3.9-1.1v5.7a5.6 5.6 0 1 1-5.6-5.6c.3 0 .7 0 1 .1v3.1a2.6 2.6 0 1 0 1.7 2.4V3h2.9Z",
  website: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Zm7 8h-3a13 13 0 0 0-1.2-5.2A7 7 0 0 1 19 11Zm-3.4-6.5A15 15 0 0 1 16.5 11h-4.9a15 15 0 0 1 .9-6.5 7.2 7.2 0 0 1 2.1 0ZM12 5a13 13 0 0 0-.6 4H6.3A7 7 0 0 1 12 5Zm-5.7 4h2.5A15 15 0 0 1 8.5 11h-3a7 7 0 0 1 .8-2ZM5.6 13h3.2a13 13 0 0 0 1.2 4.9A7 7 0 0 1 5.6 13Zm3.9 5.5A15 15 0 0 1 8.5 13h4.9a15 15 0 0 1-1 5.5 7 7 0 0 1-2.9 0Zm4.1-.6a13 13 0 0 0 1.2-4.9h3.3a7 7 0 0 1-4.5 4.9Z",
};

function Footer() {
  const { db } = useCtx();
  const f = db.config.footer;
  const st = db.config.settings;
  const L = st.labels;
  const name = db.config.siteName;
  const on = isDark(db.config.theme.bg) ? "text-[#f3ecdd]" : "text-[#1c1710]";
  const c = st.contact;
  return (
    <footer className="relative overflow-hidden" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
      <div className="mx-auto max-w-[1500px] px-6 pt-20 md:px-14">
        <div className="grid gap-12 pb-16 md:grid-cols-2 lg:grid-cols-4">
          <Reveal>
            <div>
              <div className="font-d acc text-3xl tracking-[0.16em]">{name}</div>
              <p className="txm font-b mt-5 max-w-xs text-[13px] leading-[1.9]">{f.about}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {st.socials
                  .filter((s) => safeUrl(s.url) !== "#")
                  .map((s) => (
                    <a
                      key={s.id}
                      href={safeUrl(s.url)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      className="txm flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:acc"
                      style={{ border: "1px solid var(--line)" }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d={SOCIAL_ICONS[s.icon] || SOCIAL_ICONS.website} />
                      </svg>
                    </a>
                  ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div>
              <div className="txm mb-5 text-[10px] uppercase tracking-[0.4em]">{L.navigateTitle}</div>
              <div className="space-y-3">
                {f.links.map((l) => (
                  <a key={l.id} href={safeUrl(l.href)} className="u-hover font-b tx block w-fit text-[14px] transition-colors hover:acc">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div>
              <div className="txm mb-5 text-[10px] uppercase tracking-[0.4em]">{L.hoursTitle}</div>
              <div className="space-y-3">
                {st.hours.map((h) => (
                  <div key={h.id} className="flex items-baseline justify-between gap-4">
                    <span className="txm font-b text-[12px]">{h.d}</span>
                    <span className="font-d tx text-[15px]">{h.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.24}>
            <div>
              <div className="txm mb-5 text-[10px] uppercase tracking-[0.4em]">{L.contactTitle}</div>
              <div className="tx space-y-3 font-b text-[14px]">
                {c.address && <p className="txm leading-relaxed">{c.address}</p>}
                {c.phone && (
                  <a href={telHref(c.phone)} className="u-hover font-b block w-fit transition-colors hover:acc">
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email.trim()}`} className="u-hover font-b block w-fit break-all transition-colors hover:acc">
                    {c.email}
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
      <div className="relative">
        <div
          className={`font-d pointer-events-none select-none overflow-hidden whitespace-nowrap text-center leading-[0.82] ${on} txt-outline font-bold`}
          style={{ fontSize: `${Math.min(21, 150 / Math.max(name.length, 1))}vw` }}
          aria-hidden
        >
          {name}
        </div>
        <div className="txm relative z-10 mx-auto -mt-10 flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-6 pb-8 text-[11px] tracking-wide md:px-14">
          <span className="flex items-center gap-3">
            {f.copyright}
            {L.showAdminLink && (
              <a href="/admin" className="u-hover hover:acc text-[10px] uppercase tracking-[0.25em]">
                · Admin
              </a>
            )}
          </span>
          {L.footerTagline.trim() && <span className="acc tracking-[0.3em] uppercase">{L.footerTagline}</span>}
        </div>
      </div>
    </footer>
  );
}
