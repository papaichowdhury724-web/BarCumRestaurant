"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useTransform } from "framer-motion";
import { CountUp, Embers, Parallax, Reveal, RevealText, SectionHead, hoverProps, useMoney, useParallaxOn, useSite } from "./atoms";
import { useCart } from "./Cart";
import { addBooking } from "@/lib/store";
import { findCoupon, isLive } from "@/lib/coupons";
import { WEEKDAY_NAMES, dateStr, weekdayOf } from "@/lib/settings";
import { isExternal, mapEmbedSrc, safeUrl, telHref } from "@/lib/url";
import type {
  AboutConfig,
  BreakConfig,
  ChefConfig,
  CustomSectionConfig,
  HeroConfig,
  LocationConfig,
  MenuConfig,
  OffersConfig,
  ResConfig,
  Section,
  ResField,
  ResRequired,
} from "@/lib/types";

/* ================= HERO ================= */

/** Same autoplaying muted loop as before, but it pauses while the hero is off-screen,
 *  so the phone is not decoding a 1080p video behind the rest of the page. */
function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.01 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} className="h-full w-full object-cover" src={src} poster={poster} preload="auto" autoPlay muted loop playsInline disablePictureInPicture />;
}

export function HeroSec({ s, ready, anchor }: { s: Section; ready: boolean; anchor?: string }) {
  const { a, db } = useSite();
  const d = s.data as HeroConfig;
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroP } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parallaxOn = useParallaxOn();
  const heroY = useTransform(heroP, [0, 1], ["0%", "22%"]);
  const heroDim = useTransform(heroP, [0, 0.8], [0, 0.35]);
  const media = (() => {
    switch (a.hero) {
      case "kenburns":
        return { initial: { scale: 1.18 }, animate: { scale: 1 }, transition: { duration: 9, ease: "easeOut" as const } };
      case "zoomin":
        return { initial: { scale: 0.9 }, animate: { scale: 1 }, transition: { duration: 2.4, ease: "easeOut" as const } };
      case "fade":
        return { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1.8 } };
      default:
        return {};
    }
  })();
  return (
    <section id={anchor} ref={heroRef} className="relative h-[100svh] min-h-[620px] w-full overflow-hidden">
      <motion.div className="absolute -inset-y-[15%] inset-x-0" style={{ y: parallaxOn ? heroY : 0, willChange: "transform" }}>
        <motion.div className="h-full w-full" {...media}>
          {d.mode === "video" && d.videoUrl ? (
            <HeroVideo key={d.videoUrl} src={d.videoUrl} poster={d.posterUrl || undefined} />
          ) : (
            <img
              key={d.imageUrl}
              className="h-full w-full object-cover"
              src={d.imageUrl || d.posterUrl || undefined}
              alt=""
              fetchPriority="high"
              decoding="async"
            />
          )}
        </motion.div>
      </motion.div>
      <motion.div className="absolute inset-0 bg-black" style={{ opacity: heroDim }} />
      <Embers />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, var(--bg) ${30 + d.overlay * 0.4}%, transparent) 0%, color-mix(in srgb, var(--bg) ${d.overlay * 0.5}%, transparent) 55%, var(--bg) 100%)`,
        }}
      />
      {/* vertical side text */}
      {db.config.tagline && (
      <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
        <div className="txm text-[10px] tracking-[0.5em] uppercase [writing-mode:vertical-rl]">
          {db.config.tagline}
        </div>
      </div>
      )}
      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-24 md:px-14 lg:px-24">
        <div className="max-w-4xl">
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: "110%" }}
              animate={ready ? { y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.19, 1, 0.22, 1] }}
              className="flex items-center gap-4"
            >
              <span className="h-px w-12" style={{ background: "var(--accent)" }} />
              <span className="acc text-[11px] font-b uppercase tracking-[0.45em]">{d.kicker}</span>
            </motion.div>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: "110%" }}
              animate={ready ? { y: 0 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="font-d mt-6 text-[2.6rem] leading-[1.04] tx min-[400px]:text-5xl sm:text-7xl lg:text-8xl"
            >
              {d.titleA}
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: "110%" }}
              animate={ready ? { y: 0 } : {}}
              transition={{ duration: 1, delay: 0.45, ease: [0.19, 1, 0.22, 1] }}
              className="font-d acc mt-1 text-[2.6rem] italic leading-[1.04] min-[400px]:text-5xl sm:text-7xl lg:text-8xl"
            >
              {d.titleB}
            </motion.div>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.7 }}
            className="txm font-b mt-7 max-w-xl text-[15px] leading-relaxed"
          >
            {d.sub}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.85 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            {d.cta?.trim() && (
              <a href={safeUrl(d.ctaHref || "#reserve")} className="btn-gold font-b px-8 py-4 text-[12px] uppercase tracking-[0.28em]">
                {d.cta}
              </a>
            )}
            {d.cta2?.trim() && (
              <a href={safeUrl(d.cta2Href || "#menu")} className="btn-ghost font-b px-8 py-4 text-[12px] uppercase tracking-[0.28em]">
                {d.cta2}
              </a>
            )}
          </motion.div>
        </div>
      </div>
      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="txm text-[9px] uppercase tracking-[0.5em]">{db.config.settings.labels.scrollCue}</span>
        <div className="h-12 w-px overflow-hidden" style={{ background: "var(--line)" }}>
          <motion.div
            className="w-full"
            style={{ background: "var(--accent)", height: "40%" }}
            animate={{ y: ["-100%", "260%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* ================= ABOUT ================= */

export function AboutSec({ s, anchor }: { s: Section; anchor?: string }) {
  const d = s.data as AboutConfig;
  return (
    <section id={anchor} className="relative mx-auto max-w-7xl px-6 py-28 md:px-14 md:py-36">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <Parallax speed={0.12} className="relative z-10 w-[82%]">
            <Reveal>
              <div className="overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                <img src={d.image || undefined} alt={d.title} loading="lazy" decoding="async" className="h-[420px] w-full object-cover md:h-[520px]" />
              </div>
            </Reveal>
          </Parallax>
          <Parallax speed={0.22} className="absolute -bottom-10 right-0 z-20 w-[52%]">
            <Reveal delay={0.15}>
              <div className="brd overflow-hidden bg-surf p-2" style={{ borderRadius: "var(--radius)" }}>
                <img src={d.image2 || undefined} alt="" loading="lazy" decoding="async" className="h-[220px] w-full object-cover md:h-[280px]" />
              </div>
            </Reveal>
          </Parallax>
          {d.badge?.trim() && (
            <div
              className="pointer-events-none absolute -left-4 -top-8 z-30 hidden font-d txt-outline text-[120px] leading-none md:block"
              aria-hidden
            >
              {d.badge}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center pb-16">
          <SectionHead kicker={d.kicker} title={d.title} />
          <Reveal delay={0.15}>
            <p className="txm font-b mt-7 text-[15px] leading-[1.9]">{d.text}</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {(d.stats || []).map((st, i) => (
              <Reveal key={st.id} delay={0.1 + i * 0.1}>
                <div className="brd bg-surf px-4 py-6 text-center" style={{ borderRadius: "var(--radius)" }}>
                  <div className="font-d acc text-3xl md:text-4xl"><CountUp value={st.value} /></div>
                  <div className="txm mt-2 text-[10px] uppercase tracking-[0.22em]">{st.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= MENU ================= */

const TAG_LABEL: Record<string, string> = { chef: "Chef's", new: "New", spicy: "Spicy", veg: "Veg" };

export function MenuSec({ s, onAdd, anchor }: { s: Section; onAdd: (id: string) => void; anchor?: string }) {
  const { db, a } = useSite();
  const L = db.config.settings.labels;
  const { text: priceText } = useMoney();
  const d = s.data as MenuConfig;
  const ordering = d.ordering === true;
  const items = db.menu.filter((m) => m.enabled);
  const cats = useMemo(() => {
    const seen: string[] = [];
    items.forEach((i) => {
      if (!seen.includes(i.category)) seen.push(i.category);
    });
    return seen;
  }, [items]);
  const [cat, setCat] = useState(0);
  const active = cats[Math.min(cat, cats.length - 1)] || "";
  const list = items.filter((i) => i.category === active);
  const [hover, setHover] = useState(0);
  const cur = list[Math.min(hover, list.length - 1)];
  const hoverPropsCfg = hoverProps(a.hover);

  return (
    <section
      id={anchor}
      className="relative py-28 md:py-36"
      style={{ background: "color-mix(in srgb, var(--surface) 82%, transparent)" }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-14">
        <SectionHead kicker={d.kicker} title={d.title} sub={d.note} align="center" />
        {/* category tabs */}
        <Reveal delay={0.1}>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {cats.map((c, i) => (
              <button
                key={c}
                onClick={() => {
                  setCat(i);
                  setHover(0);
                }}
                className="font-b px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] transition-colors duration-300"
                style={{
                  borderRadius: "var(--radius)",
                  border: "1px solid " + (i === Math.min(cat, cats.length - 1) ? "var(--accent)" : "var(--line)"),
                  color: i === Math.min(cat, cats.length - 1) ? "var(--bg)" : "var(--muted)",
                  background: i === Math.min(cat, cats.length - 1) ? "var(--accent)" : "transparent",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* sticky image */}
          <div className="relative hidden lg:block">
            <div className="sticky top-28">
              <div className="relative h-[520px] overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={cur?.id + active}
                    src={cur?.image || undefined}
                    alt={cur?.name}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 p-6" style={{ background: "linear-gradient(transparent, color-mix(in srgb, var(--bg) 88%, transparent))" }}>
                  <div className="font-d acc text-2xl italic">{cur?.name}</div>
                  <div className="txm mt-1 text-xs tracking-wide">{cur?.desc}</div>
                </div>
              </div>
            </div>
          </div>

          {/* list */}
          <div>
            {list.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: a.duration, delay: i * 0.06, ease: [0.19, 1, 0.22, 1] }}
                onMouseEnter={() => setHover(i)}
                className="group border-b py-7"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-baseline gap-4">
                  <h3 className="font-d tx group-hover:acc text-2xl transition-colors duration-300 md:text-[26px]">
                    {m.name}
                  </h3>
                  {m.tag !== "none" && (
                    <span className="brd acc px-2 py-0.5 text-[9px] uppercase tracking-[0.2em]">{TAG_LABEL[m.tag]}</span>
                  )}
                  <span className="mx-2 mb-1 hidden flex-1 border-b border-dotted sm:block" style={{ borderColor: "var(--line)" }} />
                  <span className="font-d acc ml-auto whitespace-nowrap text-xl sm:ml-0">{priceText(m.price)}</span>
                  {ordering && (
                  <motion.button
                    {...hoverPropsCfg}
                    onClick={() => onAdd(m.id)}
                    aria-label={`${L.addLabel.replace(/^\+\s*/, "")} ${m.name}`.trim()}
                    className="btn-ghost font-b hidden shrink-0 px-4 py-2 text-[10px] uppercase tracking-[0.25em] opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block"
                  >
                    {L.addLabel}
                  </motion.button>
                  )}
                </div>
                <p className="txm font-b mt-2 max-w-lg text-[13px] leading-relaxed">{m.desc}</p>
                {ordering && (
                <button
                  onClick={() => onAdd(m.id)}
                  className="btn-ghost font-b mt-3 px-4 py-2 text-[10px] uppercase tracking-[0.25em] sm:hidden"
                >
                  {L.addToCartLabel}
                </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================= OFFERS ================= */

export function OffersSec({ s, anchor }: { s: Section; anchor?: string }) {
  const { db } = useSite();
  const { fmt } = useMoney();
  const d = s.data as OffersConfig;
  const [copied, setCopied] = useState<string | null>(null);
  const active = db.coupons.filter((c) => isLive(c));
  const copy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1600);
  };
  return (
    <section id={anchor} className="mx-auto max-w-7xl px-6 py-28 md:px-14 md:py-36">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead kicker={d.kicker} title={d.title} sub={d.sub} />
        {d.ctaLabel?.trim() && (
          <Reveal delay={0.2}>
            <a href={safeUrl(d.ctaHref || "#reserve")} className="btn-ghost font-b px-7 py-3.5 text-[11px] uppercase tracking-[0.28em]">
              {d.ctaLabel}
            </a>
          </Reveal>
        )}
      </div>
      {active.length === 0 ? (
        <p className="txm mt-14 text-sm">{d.emptyText ?? "No active offers right now — check back soon."}</p>
      ) : (
        <div className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {active.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.08}>
              <div className="ticket px-7 py-8" style={{ borderRadius: "var(--radius)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-d acc text-3xl tracking-[0.08em]">{c.code}</div>
                    <div className="font-d tx mt-2 text-lg italic">
                      {c.type === "percent" ? `${c.value}% off` : `${fmt(c.value)} off`}
                    </div>
                  </div>
                  <button
                    onClick={() => copy(c.code)}
                    className="btn-gold font-b shrink-0 px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
                  >
                    {copied === c.code ? "Copied ✓" : "Copy"}
                  </button>
                </div>
                <p className="txm font-b mt-4 text-[13px] leading-relaxed">{c.desc}</p>
                <div className="txm mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[10px] uppercase tracking-[0.2em]">
                  {c.minSpend > 0 ? <span>Min. spend {fmt(c.minSpend)}</span> : <span>No minimum</span>}
                  {c.expires && <span>Valid till {c.expires}</span>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}

/* ================= CHEF ================= */

export function ChefSec({ s, anchor }: { s: Section; anchor?: string }) {
  const d = s.data as ChefConfig;
  return (
    <section id={anchor} className="py-28 md:py-36" style={{ background: "color-mix(in srgb, var(--surface) 78%, transparent)" }}>
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:px-14 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <SectionHead kicker={d.kicker} title={d.title} />
          <Reveal delay={0.12}>
            <p className="txm font-b mt-7 text-[15px] leading-[1.9]">{d.text}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-10 flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ border: "1px solid var(--accent)" }}>
                <span className="font-d acc text-xl">{d.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("")}</span>
              </div>
              <div>
                <div className="font-d tx text-xl">{d.name}</div>
                <div className="txm text-[11px] uppercase tracking-[0.3em]">{d.role}</div>
              </div>
            </div>
          </Reveal>
        </div>
        <Parallax speed={0.1} className="order-1 lg:order-2">
          <Reveal>
            <div className="relative">
              <div className="brd absolute -inset-3 -z-0" style={{ borderRadius: "var(--radius)", transform: "translate(14px,14px)" }} />
              <div className="relative overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                <img src={d.image || undefined} alt={d.name} loading="lazy" decoding="async" className="h-[440px] w-full object-cover md:h-[540px]" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(200deg, transparent 55%, color-mix(in srgb, var(--bg) 75%, transparent))" }} />
              </div>
            </div>
          </Reveal>
        </Parallax>
      </div>
    </section>
  );
}

/* ================= GALLERY ================= */

export function GallerySec({ s, anchor }: { s: Section; anchor?: string }) {
  const { a } = useSite();
  const d = s.data as { items: { id: string; url: string; caption: string }[] } & CustomSectionConfig;
  const items = (d.items || []).filter((g) => g.url);
  return (
    <section id={anchor} className="mx-auto max-w-7xl px-6 py-28 md:px-14 md:py-36">
      <SectionHead kicker={d.kicker} title={d.title} align="center" />
      <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-3" style={{ gridAutoRows: "minmax(160px, 22vw)" }}>
        {items.map((g, i) => (
          <Reveal key={g.id} delay={i * 0.06} className={i % 5 === 0 ? "md:row-span-2" : i % 7 === 3 ? "md:col-span-2" : ""}>
            <div className="group relative h-full w-full overflow-hidden" style={{ borderRadius: "var(--radius)" }} data-cursor>
              <img
                src={g.url}
                alt={g.caption}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "linear-gradient(transparent 45%, color-mix(in srgb, var(--bg) 85%, transparent))" }} />
              <div className="absolute bottom-4 left-4 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="font-d tx text-lg italic">{g.caption}</span>
              </div>
              <span className="font-d acc absolute right-4 top-3 text-lg opacity-0 transition-opacity duration-500 group-hover:opacity-70">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ================= TESTIMONIALS ================= */

export function TestimonialsSec({ s, anchor }: { s: Section; anchor?: string }) {
  const d = s.data as { items: { id: string; name: string; role: string; text: string }[] } & Partial<CustomSectionConfig>;
  const items = d.items || [];
  const [i, setI] = useState(0);
  const idx = Math.min(i, items.length - 1);
  useEffect(() => {
    if (items.length < 2) return;
    const iv = setInterval(() => setI((v) => (v + 1) % items.length), 6000);
    return () => clearInterval(iv);
  }, [items.length]);
  const cur = items[idx];
  if (!cur) return null;
  return (
    <section id={anchor} className="py-28 md:py-36" style={{ background: "color-mix(in srgb, var(--surface) 82%, transparent)" }}>
      <div className="mx-auto max-w-4xl px-6 text-center">
        {(d.kicker || d.title) && (
          <div className="mb-10">
            <SectionHead kicker={d.kicker} title={d.title ?? ""} align="center" />
          </div>
        )}
        <div className="font-d acc mx-auto text-7xl leading-none md:text-8xl" aria-hidden>
          “
        </div>
        <div className="relative min-h-[220px] md:min-h-[200px]">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={cur.id}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -26 }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            >
              <p className="font-d tx text-2xl leading-snug md:text-[32px]">{cur.text}</p>
              <div className="mt-8">
                <div className="font-d acc text-lg italic">{cur.name}</div>
                <div className="txm mt-1 text-[11px] uppercase tracking-[0.3em]">{cur.role}</div>
              </div>
            </motion.blockquote>
          </AnimatePresence>
        </div>
        <div className="mt-10 flex items-center justify-center gap-3">
          {items.map((t, k) => (
            <button
              key={t.id}
              onClick={() => setI(k)}
              aria-label={`Testimonial ${k + 1}`}
              className="h-1.5 transition-all duration-500"
              style={{
                width: k === idx ? 40 : 14,
                background: k === idx ? "var(--accent)" : "var(--line)",
                borderRadius: 99,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= RESERVATION ================= */

const DEFAULT_REQUIRED: ResRequired = { name: true, phone: true, email: false, date: true, time: true, guests: true, coupon: false, requests: false };
const RES_FIELDS: { k: ResField; label: string }[] = [
  { k: "name", label: "full name" },
  { k: "phone", label: "phone number" },
  { k: "email", label: "email" },
  { k: "date", label: "date" },
  { k: "time", label: "time" },
  { k: "guests", label: "guests" },
  { k: "coupon", label: "coupon code" },
  { k: "requests", label: "special requests" },
];
const EMPTY_FORM = { name: "", phone: "", email: "", date: "", time: "", guests: 2, requests: "", coupon: "" };

export function ReservationSec({ s, anchor }: { s: Section; anchor?: string }) {
  const { db } = useSite();
  const st = db.config.settings;
  const bk = st.booking;
  const d = s.data as ResConfig;
  const slots = useMemo(() => Array.from(new Set(bk.timeSlots.filter((t) => /^\d{2}:\d{2}$/.test(t)))).sort(), [bk.timeSlots]);
  const maxGuests = Math.max(1, Math.min(60, Math.round(bk.maxGuests) || 8));
  const leadDays = Math.max(0, Math.round(bk.leadDays) || 0);
  const closed = bk.closedDays;
  const firstSlot = slots.includes("20:00") ? "20:00" : slots[0] ?? "";
  const [form, setForm] = useState({ ...EMPTY_FORM, time: firstSlot });
  const [sent, setSent] = useState<null | { name: string; date: string; time: string; guests: number; phone: string }>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const req = { ...DEFAULT_REQUIRED, ...(d.required || {}) };
  const star = (k: ResField) => (req[k] ? <span aria-hidden style={{ color: "#e5484d" }}> *</span> : null);
  const minDate = dateStr(leadDays);
  // the time the guest sees: keep their pick if it still exists, otherwise the first slot
  const timeValue = slots.includes(form.time) || form.time === "" ? form.time : firstSlot;
  const guestOpts = Array.from({ length: maxGuests }, (_, i) => i + 1);
  const guestsValue = Math.min(Math.max(1, form.guests), maxGuests);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = { ...form, time: timeValue, guests: guestsValue };
    const missing = RES_FIELDS.filter(
      (f) => req[f.k] && (f.k === "guests" ? !values.guests : !String(values[f.k as keyof typeof values] ?? "").trim())
    ).map((f) => f.label);
    if (missing.length) return setErr(`Please fill: ${missing.join(", ")}.`);
    if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim())) return setErr("Please enter a valid email address.");
    if (values.phone.trim() && values.phone.replace(/\D/g, "").length < 6) return setErr("Please enter a valid phone number.");
    if (values.date) {
      if (values.date < minDate) return setErr(leadDays > 0 ? `Tables can be booked from ${minDate} onwards.` : "Please pick today or a later date.");
      const wd = weekdayOf(values.date);
      if (wd < 0) return setErr("Please pick a valid date.");
      if (closed.includes(wd)) return setErr(`We are closed on ${WEEKDAY_NAMES[wd]}s — please choose another day.`);
    }
    const code = values.coupon.trim();
    if (code && !findCoupon(db.coupons, code)) return setErr("That coupon code is not valid or has expired. Remove it or check the spelling.");
    setErr("");
    setBusy(true);
    try {
      await addBooking({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        date: values.date,
        time: values.time,
        guests: values.guests,
        requests: values.requests.trim(),
        coupon: code.toUpperCase(),
      });
      setSent({ name: values.name, date: values.date, time: values.time, guests: values.guests, phone: values.phone.trim() });
    } catch {
      setErr("Sorry, we could not save your reservation. Please try again or call us.");
    } finally {
      setBusy(false);
    }
  };

  const callBlock = (
    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
      <h3 className="font-d acc text-3xl italic">Online booking is paused</h3>
      <p className="txm font-b mt-4 max-w-sm text-sm leading-relaxed">Please call us to reserve your table.</p>
      {st.contact.phone.trim() && (
        <a href={telHref(st.contact.phone)} className="btn-gold font-b mt-8 px-8 py-4 text-[12px] uppercase tracking-[0.28em]">
          {st.contact.phone}
        </a>
      )}
    </div>
  );

  return (
    <section id={anchor} className="mx-auto max-w-7xl px-6 py-28 md:px-14 md:py-36">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div className="flex flex-col justify-center">
          <SectionHead kicker={d.kicker} title={d.title} sub={d.sub} />
          {d.image && (
            <Reveal delay={0.15}>
              <div className="relative mt-10 overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                <img src={d.image} alt="" loading="lazy" decoding="async" className="h-64 w-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--bg) 80%, transparent))" }} />
                {d.caption?.trim() && <div className="absolute bottom-4 left-5 font-d tx italic text-xl">{d.caption}</div>}
              </div>
            </Reveal>
          )}
          {d.note && (
            <Reveal delay={0.2}>
              <p className="txm font-b mt-6 text-[13px] leading-relaxed" style={{ borderLeft: "2px solid var(--accent)", paddingLeft: 16 }}>
                {d.note}
              </p>
            </Reveal>
          )}
        </div>

        <Reveal delay={0.1}>
          <div className="bg-surf brd p-7 md:p-10" style={{ borderRadius: "var(--radius)" }}>
            {!bk.enabled ? (
              callBlock
            ) : slots.length === 0 ? (
              callBlock
            ) : (
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex min-h-[430px] flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ border: "1px solid var(--accent)" }}
                  >
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6">
                      <motion.path
                        d="M4 12.5 9.5 18 20 6.5"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.7, delay: 0.35 }}
                      />
                    </svg>
                  </motion.div>
                  <h3 className="font-d acc mt-8 text-4xl italic">{d.successTitle || "Table reserved"}</h3>
                  <p className="txm font-b mt-4 max-w-sm text-sm leading-relaxed">
                    Thank you{sent.name.trim() ? `, ${sent.name.trim().split(" ")[0]}` : ""}. Your table for {sent.guests}
                    {sent.date ? ` on ${sent.date}` : ""}
                    {sent.time ? ` at ${sent.time}` : ""} is requested. {sent.phone ? `We will call ${sent.phone} to confirm` : "We will contact you to confirm"} the evening's details.
                  </p>
                  <button
                    onClick={() => {
                      setSent(null);
                      setForm({ ...EMPTY_FORM, time: firstSlot });
                    }}
                    className="btn-ghost font-b mt-9 px-7 py-3 text-[11px] uppercase tracking-[0.28em]"
                  >
                    Make another reservation
                  </button>
                </motion.div>
              ) : (
                <motion.form key="f" onSubmit={submit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-5 sm:grid-cols-2">
                  <label className="block min-w-0">
                    <span className="txm font-b mb-1.5 block text-[10.5px] uppercase tracking-[0.2em]">Full name{star("name")}</span>
                    <input className="f-in font-b" type="text" placeholder="Full name" maxLength={80} required={req.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </label>
                  <label className="block min-w-0">
                    <span className="txm font-b mb-1.5 block text-[10.5px] uppercase tracking-[0.2em]">Phone number{star("phone")}</span>
                    <input className="f-in font-b" type="tel" inputMode="tel" placeholder="Phone number" maxLength={24} required={req.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </label>
                  <label className="block min-w-0 sm:col-span-2">
                    <span className="txm font-b mb-1.5 block text-[10.5px] uppercase tracking-[0.2em]">Email{star("email")}</span>
                    <input className="f-in font-b" type="email" placeholder={req.email ? "Email address" : "Email (optional)"} maxLength={120} required={req.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </label>
                  <label className="block min-w-0">
                    <span className="txm font-b mb-1.5 block text-[10.5px] uppercase tracking-[0.2em]">Date{star("date")}</span>
                    <input className="f-in font-b" type="date" min={minDate} required={req.date} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    {closed.length > 0 && (
                      <span className="txm mt-1 block text-[10.5px]">Closed on {closed.map((c) => WEEKDAY_NAMES[c]).filter(Boolean).join(", ")}</span>
                    )}
                  </label>
                  <label className="block min-w-0">
                    <span className="txm font-b mb-1.5 block text-[10.5px] uppercase tracking-[0.2em]">Time{star("time")}</span>
                    <select className="f-in font-b" value={timeValue} onChange={(e) => setForm({ ...form, time: e.target.value })}>
                      {!req.time && <option value="">Any time</option>}
                      {slots.map((tm) => (
                        <option key={tm} value={tm}>
                          {tm}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="txm font-b mb-1.5 block text-[10.5px] uppercase tracking-[0.2em]">Guests{star("guests")}</span>
                    <select className="f-in font-b" value={guestsValue} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })}>
                      {guestOpts.map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "guest" : "guests"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="txm font-b mb-1.5 block text-[10.5px] uppercase tracking-[0.2em]">Coupon{star("coupon")}</span>
                    <input
                      className="f-in font-b"
                      placeholder={req.coupon ? "Coupon code" : "Coupon code (optional)"}
                      maxLength={30}
                      required={req.coupon}
                      value={form.coupon}
                      onChange={(e) => setForm({ ...form, coupon: e.target.value.toUpperCase() })}
                    />
                  </label>
                  <label className="block min-w-0 sm:col-span-2">
                    <span className="txm font-b mb-1.5 block text-[10.5px] uppercase tracking-[0.2em]">Special requests{star("requests")}</span>
                    <textarea
                      className="f-in font-b"
                      rows={3}
                      maxLength={500}
                      placeholder="Occasion, allergies, seating preference…"
                      required={req.requests}
                      value={form.requests}
                      onChange={(e) => setForm({ ...form, requests: e.target.value })}
                    />
                  </label>
                  {err && (
                    <p key={err} role="alert" className="shake font-b sm:col-span-2 text-[13px]" style={{ color: "#e5484d" }}>
                      {err}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="btn-gold font-b sm:col-span-2 py-4 text-[12px] uppercase tracking-[0.3em] disabled:opacity-50"
                  >
                    {busy ? "Reserving…" : d.submitLabel || "Confirm reservation"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= CINEMATIC BREAK ================= */

export function BreakSec({ s, anchor }: { s: Section; anchor?: string }) {
  const d = s.data as BreakConfig;
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const parallaxOn = useParallaxOn();
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  return (
    <section id={anchor} ref={ref} className="relative h-[75svh] min-h-[420px] overflow-hidden">
      <motion.div className="absolute -inset-y-[14%] inset-x-0" style={{ y: parallaxOn ? y : 0, willChange: "transform" }}>
        <motion.img
          src={d.image || undefined}
          alt=""
          loading="lazy"
          decoding="async"
          initial={{ scale: 1.28 }}
          animate={inView ? { scale: 1.06 } : {}}
          transition={{ duration: 9, ease: "easeOut" }}
          className="h-full w-full object-cover"
        />
      </motion.div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, color-mix(in srgb, var(--bg) 82%, transparent), color-mix(in srgb, var(--bg) 45%, transparent) 40%, color-mix(in srgb, var(--bg) 82%, transparent))",
        }}
      />
      {/* letterbox bars */}
      <motion.div
        className="absolute inset-x-0 top-0 z-10"
        style={{ background: "var(--bg)" }}
        initial={{ height: 0 }}
        animate={{ height: inView ? "11vh" : 0 }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-10"
        style={{ background: "var(--bg)" }}
        initial={{ height: 0 }}
        animate={{ height: inView ? "11vh" : 0 }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
      />
      <div className="relative z-[5] flex h-full items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          {d.kicker && (
            <Reveal>
              <div className="flex items-center justify-center gap-4">
                <span className="h-px w-10" style={{ background: "var(--accent)" }} />
                <span className="acc text-[10px] font-b uppercase tracking-[0.5em]">{d.kicker}</span>
                <span className="h-px w-10" style={{ background: "var(--accent)" }} />
              </div>
            </Reveal>
          )}
          <RevealText as="p" text={d.line} delay={0.25} className="font-d tx mt-6 text-3xl italic leading-[1.15] md:text-6xl" />
        </div>
      </div>
    </section>
  );
}

/* ================= LOCATION ================= */

export function LocationSec({ s, anchor }: { s: Section; anchor?: string }) {
  const { db } = useSite();
  const st = db.config.settings;
  const d = s.data as LocationConfig;
  // a value typed in this section wins; otherwise the one from Restaurant Settings is used
  const address = d.address?.trim() || st.contact.address;
  const phone = d.phone?.trim() || st.contact.phone;
  const mapsUrl = safeUrl(d.mapsUrl?.trim() || st.contact.mapsUrl);
  const embed = mapEmbedSrc(st.contact.mapEmbed);
  const hours = st.hours;
  return (
    <section id={anchor} className="py-28 md:py-36" style={{ background: "color-mix(in srgb, var(--surface) 78%, transparent)" }}>
      <div className="mx-auto grid max-w-7xl gap-14 px-6 md:px-14 lg:grid-cols-2">
        <div>
          <SectionHead kicker={d.kicker} title={d.title} />
          {address && (
            <Reveal delay={0.12}>
              <p className="txm font-b mt-7 max-w-md text-[15px] leading-[1.9]">{address}</p>
            </Reveal>
          )}
          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-wrap gap-4">
              {mapsUrl !== "#" && (
                <a href={mapsUrl} {...(isExternal(mapsUrl) ? { target: "_blank", rel: "noreferrer" } : {})} className="btn-gold font-b px-7 py-3.5 text-[11px] uppercase tracking-[0.28em]">
                  {d.mapsLabel || "Open in Google Maps"}
                </a>
              )}
              {phone.trim() && (
                <a href={telHref(phone)} className="btn-ghost font-b px-7 py-3.5 text-[11px] uppercase tracking-[0.28em]">
                  {phone}
                </a>
              )}
            </div>
          </Reveal>
          {embed && (
            <Reveal delay={0.24}>
              <div className="brd mt-10 overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
                <iframe src={embed} title="Map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[300px] w-full border-0" allowFullScreen />
              </div>
            </Reveal>
          )}
        </div>
        {hours.length > 0 && (
          <Reveal delay={0.15}>
            <div className="brd bg-base p-8" style={{ borderRadius: "var(--radius)" }}>
              <div className="txm mb-6 text-[11px] uppercase tracking-[0.4em]">{d.hoursTitle ?? "Hours of service"}</div>
              <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                {hours.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-4 py-4">
                    <span className="font-b tx text-sm">{h.d}</span>
                    <span className="font-d acc text-lg">{h.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ================= CUSTOM ================= */

export function CustomSec({ s, anchor }: { s: Section; anchor?: string }) {
  const d = s.data as CustomSectionConfig;
  return (
    <section id={anchor} className="mx-auto max-w-7xl px-6 py-24 md:px-14 md:py-32">
      <div className={`grid items-center gap-12 ${d.image ? "lg:grid-cols-2" : "mx-auto max-w-3xl"} ${d.flip ? "lg:[direction:rtl]" : ""}`}>
        {d.image && (
          <Reveal className="[direction:ltr]">
            <div className="overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
              <img src={d.image} alt={d.title} loading="lazy" decoding="async" className="h-[380px] w-full object-cover md:h-[460px]" />
            </div>
          </Reveal>
        )}
        <div className="[direction:ltr]">
          <SectionHead kicker={d.kicker} title={d.title} />
          <Reveal delay={0.12}>
            <p className="txm font-b mt-6 max-w-lg text-[15px] leading-[1.9]">{d.text}</p>
          </Reveal>
          {d.cta && (
            <Reveal delay={0.2}>
              <a href={safeUrl(d.ctaUrl)} {...(isExternal(safeUrl(d.ctaUrl)) ? { target: "_blank", rel: "noreferrer" } : {})} className="btn-ghost font-b mt-8 inline-block px-7 py-3.5 text-[11px] uppercase tracking-[0.28em]">
                {d.cta}
              </a>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

/* ================= dispatcher ================= */

export function SectionView({ s, ready, anchor }: { s: Section; ready: boolean; anchor?: string }) {
  switch (s.type) {
    case "hero":
      return <HeroSec s={s} ready={ready} anchor={anchor} />;
    case "about":
      return <AboutSec s={s} anchor={anchor} />;
    case "menu":
      return <MenuRouter s={s} anchor={anchor} />;
    case "offers":
      return <OffersSec s={s} anchor={anchor} />;
    case "chef":
      return <ChefSec s={s} anchor={anchor} />;
    case "break":
      return <BreakSec s={s} anchor={anchor} />;
    case "gallery":
      return <GallerySec s={s} anchor={anchor} />;
    case "testimonials":
      return <TestimonialsSec s={s} anchor={anchor} />;
    case "reservation":
      return <ReservationSec s={s} anchor={anchor} />;
    case "location":
      return <LocationSec s={s} anchor={anchor} />;
    case "custom":
      return <CustomSec s={s} anchor={anchor} />;
    default:
      return null;
  }
}

function MenuRouter({ s, anchor }: { s: Section; anchor?: string }) {
  const cart = useCart();
  return <MenuSec s={s} onAdd={cart.add} anchor={anchor} />;
}
