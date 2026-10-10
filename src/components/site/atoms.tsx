"use client";
import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { fontVar } from "@/lib/fonts";
import type { AnimConfig, DB, ThemeConfig } from "@/lib/types";
import { getCurrency, money, moneyText } from "@/lib/currency";

/* ================= context ================= */

export const SiteCtx = createContext<{
  db: DB;
  t: ThemeConfig;
  a: AnimConfig;
} | null>(null);

export const useSite = () => useContext(SiteCtx)!;

/** Currency helpers driven by the admin "Currency" setting. */
export function useMoney() {
  const { db } = useSite();
  const c = getCurrency(db.config);
  return { c, fmt: (n: number | string) => money(c, n), text: (t: string) => moneyText(c, t) };
}

/* ================= reveal on scroll ================= */

export function Reveal({
  children,
  delay = 0,
  className = "",
  amount,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  amount?: number;
}) {
  const { a } = useSite();
  const d = a.duration;
  if (a.reveal === "none") return <div className={className}>{children}</div>;
  const base = {
    "fade-up": { opacity: 0, y: 46 },
    fade: { opacity: 0 },
    "slide-left": { opacity: 0, x: -56 },
    "slide-right": { opacity: 0, x: 56 },
    zoom: { opacity: 0, scale: 0.92 },
    mask: { opacity: 0, y: 60 },
    parallax: { opacity: 0, y: 90 },
  }[a.reveal];
  return (
    <motion.div
      className={className}
      initial={base}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: amount ?? 0.2 }}
      transition={{ duration: d, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ================= animated text ================= */

export function RevealText({
  text,
  className = "",
  delay = 0,
  as: Tag = "h2",
  delayStep = 0.045,
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  delayStep?: number;
}) {
  const { a } = useSite();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const [typed, setTyped] = useState(0);
  const d = a.duration;

  useEffect(() => {
    if (a.text !== "typewriter" || !inView) return;
    setTyped(0);
    const iv = setInterval(() => {
      setTyped((t) => {
        if (t >= text.length) {
          clearInterval(iv);
          return t;
        }
        return t + 1;
      });
    }, 34);
    return () => clearInterval(iv);
  }, [a.text, inView, text]);

  const TagComp = Tag as "div";

  if (a.text === "none")
    return (
      <TagComp ref={ref} className={className}>
        {text}
      </TagComp>
    );

  if (a.text === "typewriter")
    return (
      <TagComp ref={ref} className={className}>
        {text.slice(0, inView ? typed : 0)}
        <span className="acc" style={{ opacity: inView && typed < text.length ? 1 : 0 }}>
          |
        </span>
      </TagComp>
    );

  if (a.text === "letters") {
    const words = text.split(" ");
    let idx = 0;
    return (
      <TagComp ref={ref} className={className} aria-label={text}>
        {words.map((w, wi) => (
          <Fragment key={wi}>
            {wi > 0 && " "}
            <span className="inline-block whitespace-nowrap">
              {w.split("").map((ch, ci) => {
                const i = idx++;
                return (
                  <span key={ci} className="inline-block overflow-hidden align-bottom">
                    <motion.span
                      className="inline-block"
                      initial={{ y: "105%", opacity: 0.4 }}
                      animate={inView ? { y: "0%", opacity: 1 } : {}}
                      transition={{ duration: d, delay: delay + i * delayStep, ease: [0.19, 1, 0.22, 1] }}
                    >
                      {ch}
                    </motion.span>
                  </span>
                );
              })}
            </span>
          </Fragment>
        ))}
      </TagComp>
    );
  }

  /* mask (line reveal) */
  return (
    <TagComp ref={ref} className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <motion.span
            className="inline-block"
            initial={{ y: "112%" }}
            animate={inView ? { y: "0%" } : {}}
            transition={{ duration: d * 1.1, delay: delay + i * delayStep * 2, ease: [0.19, 1, 0.22, 1] }}
          >
            {w}
          </motion.span>
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </TagComp>
  );
}

/* ================= parallax wrapper ================= */

/** Scroll-linked parallax runs JS on every scroll frame. That is smooth with a mouse / on desktop
 *  but is the main source of scroll stutter on phones, so it is off on touch devices.
 *  Set to true if you want the parallax back on phones too. */
const PARALLAX_ON_TOUCH = false;

/** true when scroll-linked parallax should run (desktop with a real mouse, or PARALLAX_ON_TOUCH). */
export function useParallaxOn() {
  const { a } = useSite();
  const [fine] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
  return a.parallax && (fine || PARALLAX_ON_TOUCH);
}

function ParallaxMove({ children, speed, target }: { children: ReactNode; speed: number; target: RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <motion.div style={{ y, willChange: "transform" }}>{children}</motion.div>
  );
}

export function Parallax({
  children,
  speed = 0.18,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const on = useParallaxOn();
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={className}>
      {on ? (
        <ParallaxMove speed={speed} target={ref}>
          {children}
        </ParallaxMove>
      ) : (
        children
      )}
    </div>
  );
}

/* ================= device helpers ================= */

/** true only on devices with a real mouse (hides the custom cursor on phones/tablets). */
export function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const on = () => setFine(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return fine;
}

/* ================= floating gold embers (hero) ================= */

export function Embers({ count = 18 }: { count?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(window.innerWidth < 768 ? Math.round(count * 0.55) : count);
  }, [count]);
  // deterministic pseudo-random so server/client markup never differs
  const items = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const r = (k: number) => {
          const x = Math.sin((i + 1) * 9301 + k * 49297) * 233280;
          return x - Math.floor(x);
        };
        return { left: r(1) * 100, size: 2 + r(2) * 4, dur: 9 + r(3) * 11, delay: -r(4) * 18, drift: (r(5) - 0.5) * 120 };
      }),
    [n]
  );
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden" aria-hidden>
      {items.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            animationDuration: `${e.dur}s`,
            animationDelay: `${e.delay}s`,
            ["--drift" as string]: `${e.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ================= count-up number ================= */

export function CountUp({ value, duration = 1.6 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const m = /^(\D*)(\d+)(.*)$/.exec(value);
  const target = m ? parseInt(m[2], 10) : 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!m || !inView) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target, duration]);
  if (!m) return <span ref={ref}>{value}</span>;
  const shown = inView ? String(n).padStart(m[2].length, "0") : "0".repeat(m[2].length);
  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      {m[1]}
      {shown}
      {m[3]}
    </span>
  );
}

/* ================= back to top ================= */

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 700);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 24, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.8 }}
          whileHover={{ y: -4 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="fixed bottom-5 left-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full backdrop-blur md:bottom-8 md:left-8"
          style={{ border: "1px solid var(--accent)", background: "color-mix(in srgb, var(--bg) 70%, transparent)", color: "var(--accent)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ================= custom cursor ================= */

export function CustomCursor() {
  const { a } = useSite();
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, { stiffness: 260, damping: 26, mass: 0.6 });
  const ringY = useSpring(dotY, { stiffness: 260, damping: 26, mass: 0.6 });
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const fine = useFinePointer();

  useEffect(() => {
    if (a.cursor === "none" || !fine) return;
    const keepSystemCursor = a.cursor === "default-glow";
    if (!keepSystemCursor) document.documentElement.classList.add("cursor-off");
    const move = (e: MouseEvent) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      setVisible(true);
      const t = e.target as HTMLElement;
      setHovering(!!t.closest("a,button,[data-cursor],input,select,textarea,label"));
    };
    window.addEventListener("mousemove", move);
    return () => {
      document.documentElement.classList.remove("cursor-off");
      window.removeEventListener("mousemove", move);
    };
  }, [a.cursor, fine, dotX, dotY]);

  if (a.cursor === "none" || !fine) return null;
  const size = a.cursor === "dot" ? 8 : a.cursor === "default-glow" ? 64 : 40;
  const glowOnly = a.cursor === "glow" || a.cursor === "default-glow";
  return (
    <>
      {!glowOnly && (
        <motion.div
          className="cursor-el"
          style={{
            x: dotX,
            y: dotY,
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            background: "var(--accent)",
            opacity: visible ? 1 : 0,
          }}
        />
      )}
      {a.cursor !== "dot" && (
        <motion.div
          className="cursor-el"
          style={{
            x: ringX,
            y: ringY,
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            border: glowOnly ? "none" : "1px solid var(--accent)",
            background:
              glowOnly
                ? "radial-gradient(circle, color-mix(in srgb, var(--accent) 25%, transparent), transparent 70%)"
                : "transparent",
            mixBlendMode: a.cursor === "ring" ? "difference" : "normal",
            opacity: visible ? (hovering ? 1 : 0.75) : 0,
            pointerEvents: "none",
          }}
          animate={{ scale: hovering && a.cursor !== "default-glow" ? 1.7 : 1 }}
          transition={{ duration: 0.25 }}
        />
      )}
    </>
  );
}

/* ================= preloader ================= */

export function Preloader({ name, kind, text, onDone }: { name: string; kind: AnimConfig["preloader"]; text?: string; onDone: () => void }) {
  const dur = kind === "cinematic" ? 2.6 : 1.9;
  const [n, setN] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (dur * 1000));
      setN(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const done = setTimeout(() => doneRef.current(), dur * 1000 + 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [dur]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#070605]"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="absolute inset-0 noise" />
      {kind === "counter" ? (
        <div className="font-d text-[22vw] leading-none" style={{ color: "#F3ECDD", fontVariantNumeric: "tabular-nums" }}>
          {n.toString().padStart(3, "0")}
        </div>
      ) : kind === "logo" ? (
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
          className="font-d text-7xl md:text-8xl tracking-[0.18em]"
          style={{ color: "#C9A24B" }}
        >
          {name.slice(0, 1)}
        </motion.div>
      ) : (
        <>
          <div className="flex overflow-hidden">
            {name.split("").map((ch, i) => (
              <span key={i} className="inline-block overflow-hidden">
                <motion.span
                  className="font-d inline-block text-5xl md:text-7xl tracking-[0.14em]"
                  style={{ color: "#F3ECDD" }}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.07, ease: [0.19, 1, 0.22, 1] }}
                >
                  {ch}
                </motion.span>
              </span>
            ))}
          </div>
          <motion.div
            className="mt-8 h-px bg-[var(--accent)]"
            initial={{ width: 0 }}
            animate={{ width: "min(420px, 70vw)" }}
            transition={{ duration: 1.6, ease: "easeInOut" }}
          />
          <div className="mt-4 text-[11px] tracking-[0.4em] uppercase" style={{ color: "#968B78" }}>
            {n.toString().padStart(3, "0")}{text ? ` — ${text}` : ""}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ================= marquee ================= */

export function Marquee({ reverse = false, items }: { reverse?: boolean; items?: string[] }) {
  const { a, db } = useSite();
  const list = (items ?? db.config.settings.labels.marquee).filter((w) => w.trim());
  if (!a.marquee || list.length === 0) return null;
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {list.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className="font-d px-6 text-2xl md:text-3xl tracking-wide whitespace-nowrap tx italic">
            {w}
          </span>
          <span className="acc text-xs">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div
      className="overflow-hidden border-y py-4 select-none"
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
    >
      <div
        className="marquee-track"
        style={{ animationDuration: `${a.marqueeSpeed}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

/* ================= scroll progress ================= */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const sx = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[80] h-[2px] origin-left"
      style={{ scaleX: sx, background: "var(--accent)" }}
    />
  );
}

/* ================= section shell ================= */

export function SectionHead({
  kicker,
  title,
  sub,
  align = "left",
}: {
  kicker?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center mx-auto max-w-3xl" : "max-w-3xl"}>
      {kicker && (
        <Reveal>
          <div className={`flex items-center gap-4 ${align === "center" ? "justify-center" : ""}`}>
            <span className="h-px w-10" style={{ background: "var(--accent)" }} />
            <span className="tx acc text-[11px] font-b uppercase tracking-[0.42em]">{kicker}</span>
          </div>
        </Reveal>
      )}
      <Reveal delay={0.08}>
        <RevealText
          as="h2"
          text={title}
          className="font-d mt-5 text-4xl md:text-6xl leading-[1.04] tx"
        />
      </Reveal>
      {sub && (
        <Reveal delay={0.16}>
          <p className="txm font-b mt-5 max-w-xl text-[15px] leading-relaxed md:mx-auto" style={{ marginInline: align === "center" ? "auto" : undefined }}>
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ================= hover helper (framer) ================= */

export function hoverProps(mode: AnimConfig["hover"]) {
  switch (mode) {
    case "lift":
      return { whileHover: { y: -6 } };
    case "scale":
      return { whileHover: { scale: 1.035 } };
    case "glow":
      return { whileHover: { scale: 1.02, boxShadow: "0 18px 60px -12px color-mix(in srgb, var(--accent) 45%, transparent)" } };
    case "tilt":
      return { whileHover: { rotateX: -4, rotateY: 3, y: -4, transformStyle: "preserve-3d" } };
    case "underline":
      return {};
    default:
      return {};
  }
}

export function hoverClass(mode: AnimConfig["hover"]) {
  return mode === "underline" ? "u-hover" : "";
}

/* ================= misc ================= */

/** Full-screen film-grain overlay. It makes dark areas look speckled/hazy and costs GPU on phones,
 *  so it is off. Set to true to bring the grain back. (The preloader keeps its own grain.) */
const FILM_GRAIN = false;

export function Noise() {
  if (!FILM_GRAIN) return null;
  return <div className="noise" aria-hidden />;
}

export function useThemeApply(t: ThemeConfig) {
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--bg", t.bg);
    r.style.setProperty("--surface", t.surface);
    r.style.setProperty("--accent", t.accent);
    r.style.setProperty("--text", t.text);
    r.style.setProperty("--muted", t.muted);
    r.style.setProperty("--radius", `${t.radius}px`);
    r.style.setProperty("--cart-fs", `${t.cartFontSize}px`);
    r.style.setProperty("--line", `color-mix(in srgb, ${t.accent} 26%, transparent)`);
    r.style.setProperty("--site-display", `var(${fontVar(t.fontDisplay, "display")}), Georgia, serif`);
    r.style.setProperty("--site-body", `var(${fontVar(t.fontBody, "body")}), system-ui, sans-serif`);
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
  }, [t]);
}

export function isDark(hex: string) {
  try {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b < 140;
  } catch {
    return true;
  }
}
