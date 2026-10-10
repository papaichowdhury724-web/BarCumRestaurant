"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BODY_FONTS, DISPLAY_FONTS, THEME_PRESETS } from "@/lib/defaults";
import { saveConfig } from "@/lib/store";
import { CURRENCY_PRESETS, getCurrency, money } from "@/lib/currency";
import { fontVar } from "@/lib/fonts";
import type { AnimConfig, CurrencyConfig, DB, FooterConfig, HeaderConfig, ThemeConfig } from "@/lib/types";
import { uid } from "@/lib/types";
import { Card, ColorField, Field, MediaField, Panel, Range, RowBtns, SaveBar, Select, TextArea, TextInput, Toggle, useToast } from "../ui";

/* ================================================================
   DASHBOARD
================================================================ */

export function DashboardPanel({ db, onGo }: { db: DB; onGo?: (panel: string) => void }) {
  const on = db.config.sections.filter((s) => s.enabled).length;
  const st = db.config.settings;
  const stats = [
    { l: "Sections live", v: `${on} / ${db.config.sections.length}` },
    { l: "Menu items", v: String(db.menu.filter((m) => m.enabled).length) },
    { l: "Active coupons", v: String(db.coupons.filter((c) => c.active).length) },
    { l: "Bookings pending", v: String(db.bookings.filter((b) => b.status === "pending").length) },
  ];
  const shortcuts: { k: string; l: string; d: string }[] = [
    { k: "settings", l: "Restaurant Settings", d: "Name, contact, hours, social links, booking rules, SEO, banner and wording" },
    { k: "sections", l: "Sections", d: "Add, reorder, hide and edit every part of the page" },
    { k: "menu", l: "Menu", d: "Dishes, prices, photos and tags" },
    { k: "bookings", l: "Bookings", d: "Table reservations from the website" },
  ];
  return (
    <Panel title="Dashboard" desc="Everything about your site at a glance.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.l}>
            <div className="font-d text-4xl text-[#c9a24b]">{s.v}</div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[#8d8270]">{s.l}</div>
          </Card>
        ))}
      </div>

      <Card title="Your restaurant" hint="edit in Restaurant Settings" className="mt-5">
        <div className="grid gap-x-8 gap-y-3 text-[13px] sm:grid-cols-2">
          <div><span className="text-[#8d8270]">Name</span> <span className="ml-2 text-[#ede5d3]">{db.config.siteName}</span></div>
          <div><span className="text-[#8d8270]">Phone</span> <span className="ml-2 text-[#ede5d3]">{st.contact.phone || "—"}</span></div>
          <div><span className="text-[#8d8270]">Online booking</span> <span className="ml-2" style={{ color: st.booking.enabled ? "#5faf82" : "#c98a8a" }}>{st.booking.enabled ? "ON" : "OFF"}</span></div>
          <div><span className="text-[#8d8270]">Announcement bar</span> <span className="ml-2" style={{ color: st.announcement.enabled ? "#5faf82" : "#8d8270" }}>{st.announcement.enabled ? "Shown" : "Hidden"}</span></div>
        </div>
        {onGo && (
          <button
            onClick={() => onGo("settings")}
            className="mt-5 rounded-lg px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em]"
            style={{ background: "#c9a24b", color: "#0e0c09" }}
          >
            Open Restaurant Settings
          </button>
        )}
      </Card>

      {onGo && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {shortcuts.map((x) => (
            <button key={x.k} onClick={() => onGo(x.k)} className="rounded-xl border border-[#26211a] bg-[#131009] p-5 text-left transition-colors hover:border-[#c9a24b]">
              <div className="text-[13px] font-medium text-[#c9a24b]">{x.l} →</div>
              <div className="mt-1.5 text-[12px] leading-relaxed text-[#8d8270]">{x.d}</div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        <Card title="How saving works">
          <ul className="space-y-3 text-[13px] leading-relaxed text-[#cfc4ab]">
            <li><span className="text-[#c9a24b]">✦ Live publish</span> — every “Save & publish” writes straight to the data layer, and the website re-reads it instantly (live listeners keep every open tab in sync).</li>
            <li><span className="text-[#c9a24b]">✦ Preview</span> — each tab has inline previews, and “Open website” in the sidebar shows the real result.</li>
            <li><span className="text-[#c9a24b]">✦ Media</span> — paste any image/video URL, or choose a file. Files are stored as data URLs (best under ~700 KB); for bigger media use a Firebase Storage URL.</li>
            <li><span className="text-[#c9a24b]">✦ Bookings</span> — public visitors can create bookings without login; only your admin account can read and update them.</li>
          </ul>
        </Card>
      </div>
    </Panel>
  );
}

/* ================================================================
   THEME & FONTS
================================================================ */

export function ThemePanel({ db }: { db: DB }) {
  const toast = useToast();
  const [draft, setDraft] = useState<ThemeConfig>(() => JSON.parse(JSON.stringify(db.config.theme)));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(db.config.theme), [draft, db.config.theme]);
  const set = (p: Partial<ThemeConfig>) => setDraft((d) => ({ ...d, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      await saveConfig({ ...db.config, theme: draft });
      toast("Theme published — live on the website");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Theme & Fonts" desc="Colors, type pairing, corner radius and the cart's font size — with a live preview.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card title="Presets">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {THEME_PRESETS.map((p) => {
                const active = draft.preset === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => set({ preset: p.name, accent: p.t.accent!, bg: p.t.bg!, surface: p.t.surface!, text: p.t.text!, muted: p.t.muted! })}
                    className="rounded-lg border p-3 text-left transition-all"
                    style={{ borderColor: active ? "#c9a24b" : "#26211a", background: active ? "rgba(201,162,75,.08)" : "#0e0c09" }}
                  >
                    <div className="flex gap-1.5">
                      {[p.t.bg, p.t.accent, p.t.surface].map((c, i) => (
                        <span key={i} className="h-4 w-4 rounded-full border border-black/40" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="mt-2 text-[12px] text-[#cfc4ab]">{p.name}</div>
                  </button>
                );
              })}
            </div>
          </Card>
          <Card title="Colors">
            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Accent / gold" value={draft.accent} onChange={(v) => set({ accent: v, preset: "Custom" })} />
              <ColorField label="Background" value={draft.bg} onChange={(v) => set({ bg: v, preset: "Custom" })} />
              <ColorField label="Surface" value={draft.surface} onChange={(v) => set({ surface: v, preset: "Custom" })} />
              <ColorField label="Text" value={draft.text} onChange={(v) => set({ text: v, preset: "Custom" })} />
              <ColorField label="Muted text" value={draft.muted} onChange={(v) => set({ muted: v, preset: "Custom" })} />
            </div>
          </Card>
          <Card title="Typography">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display font (headings)">
                <Select options={DISPLAY_FONTS.map((f) => ({ v: f, l: f }))} value={draft.fontDisplay} onChange={(e) => set({ fontDisplay: e.target.value })} />
              </Field>
              <Field label="Body font">
                <Select options={BODY_FONTS.map((f) => ({ v: f, l: f }))} value={draft.fontBody} onChange={(e) => set({ fontBody: e.target.value })} />
              </Field>
            </div>
          </Card>
          <Card title="Shape & cart size">
            <div className="space-y-5">
              <Field label="Corner radius">
                <Range value={draft.radius} min={0} max={24} onChange={(v) => set({ radius: v })} format={(v) => `${v}px`} />
              </Field>
              <Field label="Cart font size" hint="Applies to the whole cart drawer — every label scales with it">
                <Range value={draft.cartFontSize} min={11} max={22} onChange={(v) => set({ cartFontSize: v })} format={(v) => `${v}px`} />
              </Field>
            </div>
          </Card>
        </div>

        {/* live preview */}
        <div>
          <Card title="Live preview">
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: draft.accent + "44", background: draft.bg }}>
              <div className="px-5 py-3 text-[10px] uppercase tracking-[0.3em]" style={{ color: draft.accent }}>
                {draft.preset}
              </div>
              <div className="px-5 pb-2">
                <div className="text-3xl italic" style={{ fontFamily: `var(${fontVar(draft.fontDisplay)}), serif`, color: draft.text }}>
                  Where every plate
                </div>
                <div className="text-3xl" style={{ fontFamily: `var(${fontVar(draft.fontDisplay)}), serif`, color: draft.accent }}>
                  becomes a story
                </div>
              </div>
              <p className="px-5 text-[12px] leading-relaxed" style={{ fontFamily: `var(${fontVar(draft.fontBody, "body")}), sans-serif`, color: draft.muted }}>
                An eight-course cinematic journey through fire, smoke and gold — served in the heart of Gulshan, Dhaka.
              </p>
              <div className="flex gap-2 px-5 py-4">
                <span className="px-4 py-2 text-[10px] uppercase tracking-[0.2em]" style={{ background: draft.accent, color: draft.bg, borderRadius: draft.radius }}>
                  Reserve a Table
                </span>
                <span className="px-4 py-2 text-[10px] uppercase tracking-[0.2em]" style={{ border: `1px solid ${draft.accent}66`, color: draft.text, borderRadius: draft.radius }}>
                  View Menu
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3 text-[12px]" style={{ borderTop: `1px solid ${draft.accent}33`, fontSize: draft.cartFontSize }}>
                <span style={{ color: draft.text }}>Wagyu, Ink & Salt × 2</span>
                <span style={{ color: draft.accent }}>{money(getCurrency(db.config), 7800)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(JSON.parse(JSON.stringify(db.config.theme)))} />
    </Panel>
  );
}

/* ================================================================
   ANIMATIONS
================================================================ */

type Opt<T extends string> = { v: T; l: string };

/* NOTE: defined at module level (not inside the panel) so it is not re-created on every
   render — re-creating it remounted the whole list and threw the page back to the top. */
function OptRow({ label, opts, value, onChange }: { label: string; opts: Opt<string>[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="w-40 text-[12px] text-[#cfc4ab]">{label}</span>
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className="rounded-md border px-3 py-1.5 text-[11px] transition-colors"
            style={{
              borderColor: value === o.v ? "#c9a24b" : "#2b251a",
              background: value === o.v ? "rgba(201,162,75,.14)" : "transparent",
              color: value === o.v ? "#c9a24b" : "#8d8270",
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

const PRELOADER_OPTS: Opt<AnimConfig["preloader"]>[] = [
  { v: "cinematic", l: "Cinematic letter reveal" },
  { v: "logo", l: "Monogram bloom" },
  { v: "counter", l: "000 → 100 counter" },
  { v: "none", l: "No preloader" },
];
const REVEAL_OPTS: Opt<AnimConfig["reveal"]>[] = [
  { v: "fade-up", l: "Fade up" },
  { v: "fade", l: "Soft fade" },
  { v: "slide-left", l: "Slide from left" },
  { v: "slide-right", l: "Slide from right" },
  { v: "zoom", l: "Zoom in" },
  { v: "mask", l: "Mask rise" },
  { v: "parallax", l: "Parallax drift" },
  { v: "none", l: "No scroll animation" },
];
const HERO_OPTS: Opt<AnimConfig["hero"]>[] = [
  { v: "kenburns", l: "Ken Burns slow zoom" },
  { v: "zoomin", l: "Quick zoom in" },
  { v: "fade", l: "Fade in" },
  { v: "none", l: "Static" },
];
const TEXT_OPTS: Opt<AnimConfig["text"]>[] = [
  { v: "mask", l: "Line mask reveal" },
  { v: "letters", l: "Letter stagger" },
  { v: "typewriter", l: "Typewriter" },
  { v: "none", l: "Instant" },
];
const HOVER_OPTS: Opt<AnimConfig["hover"]>[] = [
  { v: "lift", l: "Lift up" },
  { v: "scale", l: "Scale" },
  { v: "glow", l: "Gold glow" },
  { v: "underline", l: "Underline sweep" },
  { v: "tilt", l: "3D tilt" },
  { v: "none", l: "No hover" },
];
const CURSOR_OPTS: Opt<AnimConfig["cursor"]>[] = [
  { v: "ring", l: "Ring + dot (blend)" },
  { v: "dot", l: "Dot only" },
  { v: "glow", l: "Soft glow (hides arrow)" },
  { v: "default-glow", l: "Default cursor + glow" },
  { v: "none", l: "Default cursor only" },
];

export function AnimationsPanel({ db }: { db: DB }) {
  const toast = useToast();
  const [draft, setDraft] = useState<AnimConfig>(() => JSON.parse(JSON.stringify(db.config.animations)));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(db.config.animations), [draft, db.config.animations]);
  const set = (p: Partial<AnimConfig>) => setDraft((d) => ({ ...d, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      await saveConfig({ ...db.config, animations: draft });
      toast("Animation style published — live on the website");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Animations" desc="Control every layer of motion — loading, scroll reveals, hero, text, hover and cursor.">
      <Card title="Motion settings" hint="each setting shows its live preview right below it" className="max-w-4xl">
        <div className="divide-y divide-[#1e1a13]">
          <Block>
            <OptRow label="Loading screen" opts={PRELOADER_OPTS} value={draft.preloader} onChange={(v) => set({ preloader: v as AnimConfig["preloader"] })} />
            <PreloaderPreview kind={draft.preloader} />
          </Block>

          <Block>
            <OptRow label="Scroll reveal" opts={REVEAL_OPTS} value={draft.reveal} onChange={(v) => set({ reveal: v as AnimConfig["reveal"] })} />
            <Field label="Reveal duration (also used by headline text)">
              <Range value={draft.duration} min={0.3} max={1.8} step={0.1} onChange={(v) => set({ duration: v })} format={(v) => `${v.toFixed(1)}s`} />
            </Field>
            <RevealPreview reveal={draft.reveal} duration={draft.duration} />
          </Block>

          <Block>
            <OptRow label="Headline text" opts={TEXT_OPTS} value={draft.text} onChange={(v) => set({ text: v as AnimConfig["text"] })} />
            <TextPreview text={draft.text} duration={draft.duration} />
          </Block>

          <Block>
            <OptRow label="Hero backdrop" opts={HERO_OPTS} value={draft.hero} onChange={(v) => set({ hero: v as AnimConfig["hero"] })} />
            <HeroPreview hero={draft.hero} />
          </Block>

          <Block>
            <OptRow label="Card & button hover" opts={HOVER_OPTS} value={draft.hover} onChange={(v) => set({ hover: v as AnimConfig["hover"] })} />
            <HoverPreview hover={draft.hover} />
          </Block>

          <Block>
            <OptRow label="Custom cursor" opts={CURSOR_OPTS} value={draft.cursor} onChange={(v) => set({ cursor: v as AnimConfig["cursor"] })} />
            <CursorPreview kind={draft.cursor} />
          </Block>

          <Block>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="w-40 text-[12px] text-[#cfc4ab]">Marquee strip</span>
              <Toggle checked={draft.marquee} onChange={(v) => set({ marquee: v })} label={draft.marquee ? "On" : "Off"} />
            </div>
            <Field label="Marquee speed (seconds per loop)">
              <Range value={draft.marqueeSpeed} min={10} max={90} onChange={(v) => set({ marqueeSpeed: v })} format={(v) => `${v}s`} />
            </Field>
            <MarqueePreview on={draft.marquee} speed={draft.marqueeSpeed} />
          </Block>

          <Block>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="w-40 text-[12px] text-[#cfc4ab]">Image parallax</span>
              <Toggle checked={draft.parallax} onChange={(v) => set({ parallax: v })} label={draft.parallax ? "On" : "Off"} />
            </div>
            <p className="text-[11px] leading-relaxed text-[#5f5745]">Images drift slightly while scrolling. It can only be seen on the real website (use “Open website”).</p>
          </Block>
        </div>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(JSON.parse(JSON.stringify(db.config.animations)))} />
    </Panel>
  );
}

/* ---------------- currency ---------------- */

export function CurrencyCard({ db }: { db: DB }) {
  const toast = useToast();
  const [cur, setCur] = useState<CurrencyConfig>(() => getCurrency(db.config));
  const [busy, setBusy] = useState(false);
  const saved = getCurrency(db.config);
  const dirty = JSON.stringify(cur) !== JSON.stringify(saved);
  const set = (p: Partial<CurrencyConfig>) => setCur((c) => ({ ...c, ...p }));
  return (
    <Card title="Currency" hint="Used for every price, coupon and cart total on the website">
      <div className="flex flex-wrap gap-2">
        {CURRENCY_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setCur(p.c)}
            className="rounded-md border px-3 py-1.5 text-[11px]"
            style={{
              borderColor: cur.symbol === p.c.symbol ? "#c9a24b" : "#2b251a",
              background: cur.symbol === p.c.symbol ? "rgba(201,162,75,.14)" : "transparent",
              color: cur.symbol === p.c.symbol ? "#c9a24b" : "#8d8270",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Symbol (type any)" hint="e.g. ₹  $  £  €  Rs.  AED">
          <TextInput value={cur.symbol} maxLength={6} onChange={(e) => set({ symbol: e.target.value })} />
        </Field>
        <Field label="Symbol position">
          <Select options={[{ v: "before", l: "Before  (₹1,200)" }, { v: "after", l: "After  (1,200 ₹)" }]} value={cur.position} onChange={(e) => set({ position: e.target.value as CurrencyConfig["position"] })} />
        </Field>
        <Field label="Number grouping">
          <Select
            options={[
              { v: "en-IN", l: "Indian  (1,00,000)" },
              { v: "en-US", l: "International  (100,000)" },
              { v: "en-GB", l: "UK  (100,000)" },
              { v: "de-DE", l: "European  (100.000)" },
            ]}
            value={cur.locale}
            onChange={(e) => set({ locale: e.target.value as CurrencyConfig["locale"] })}
          />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[12px] text-[#8d8270]">
          Preview: <span className="text-[#c9a24b]">{money(cur, 1200)}</span> · <span className="text-[#c9a24b]">{money(cur, 125000)}</span>
        </span>
        <button
          disabled={!dirty || busy || !cur.symbol.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              await saveConfig({ ...db.config, currency: { ...cur, symbol: cur.symbol.trim() } });
              toast("Currency published — live on the website");
            } catch (e) {
              toast(e instanceof Error ? e.message : "Could not save", false);
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-lg px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] disabled:opacity-40"
          style={{ background: "#c9a24b", color: "#0e0c09" }}
        >
          {busy ? "Saving…" : "Save currency"}
        </button>
      </div>
    </Card>
  );
}

/* ---------------- motion preview ---------------- */

const EASE = [0.19, 1, 0.22, 1] as const;

function Block({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 space-y-3 py-5 first:pt-0 last:pb-0">{children}</div>;
}

function Replay({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[10px] uppercase tracking-[0.16em] text-[#c9a24b] hover:underline">
      ▶ replay
    </button>
  );
}

function PreviewFrame({ children, onReplay, label }: { children: React.ReactNode; onReplay?: () => void; label: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-[#26211a] bg-[#0e0c09]">
      <div className="flex items-center justify-between border-b border-[#1e1a13] px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#6f6653]">{label}</span>
        {onReplay && <Replay onClick={onReplay} />}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

const LINE = "Composed in seven acts";

function RevealPreview({ reveal, duration }: { reveal: AnimConfig["reveal"]; duration: number }) {
  const [k, setK] = useState(0);
  const from =
    reveal === "none"
      ? {}
      : reveal === "fade-up" || reveal === "mask" || reveal === "parallax"
        ? { opacity: 0, y: 40 }
        : reveal === "fade"
          ? { opacity: 0 }
          : reveal === "zoom"
            ? { opacity: 0, scale: 0.9 }
            : reveal === "slide-left"
              ? { opacity: 0, x: -50 }
              : { opacity: 0, x: 50 };
  return (
    <PreviewFrame label="Preview — section appears on scroll" onReplay={() => setK((x) => x + 1)}>
      <div className="overflow-hidden">
        <motion.div
          key={`${reveal}-${duration}-${k}`}
          initial={from}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          transition={{ duration, ease: EASE }}
          className="rounded-lg border border-[#2b251a] bg-[#14110c] p-5 text-center"
        >
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#c9a24b]">Our story</div>
          <div className="font-d mt-1 text-xl text-[#ede5d3]">A theatre of taste</div>
        </motion.div>
      </div>
    </PreviewFrame>
  );
}

function TextPreview({ text, duration }: { text: AnimConfig["text"]; duration: number }) {
  const [k, setK] = useState(0);
  return (
    <PreviewFrame label="Preview — headline" onReplay={() => setK((x) => x + 1)}>
      <div key={`${text}-${duration}-${k}`} className="text-center">
        {text === "none" ? (
          <div className="font-d text-2xl text-[#ede5d3]">{LINE}</div>
        ) : text === "mask" ? (
          <div className="overflow-hidden">
            <motion.div initial={{ y: "105%" }} animate={{ y: 0 }} transition={{ duration: duration * 1.1, delay: 0.1, ease: EASE }} className="font-d text-2xl text-[#ede5d3]">
              {LINE}
            </motion.div>
          </div>
        ) : text === "letters" ? (
          <div className="font-d text-2xl text-[#ede5d3]">
            {LINE.split("").map((ch, i) => (
              <motion.span key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: duration * 0.7, delay: 0.1 + i * 0.03 }}>
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
            ))}
          </div>
        ) : (
          <TypewriterPreview text={LINE} />
        )}
      </div>
    </PreviewFrame>
  );
}

function HeroPreview({ hero }: { hero: AnimConfig["hero"] }) {
  const [k, setK] = useState(0);
  return (
    <PreviewFrame label="Preview — hero backdrop" onReplay={() => setK((x) => x + 1)}>
      <div className="relative h-28 overflow-hidden rounded-lg bg-black">
        <motion.div
          key={`hero-${hero}-${k}`}
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 30% 40%, #c9a24b 0%, #6b4a1c 28%, #1a120a 62%), repeating-linear-gradient(45deg, transparent 0 14px, rgba(0,0,0,.25) 14px 15px)" }}
          initial={hero === "zoomin" ? { scale: 1.4 } : hero === "fade" ? { opacity: 0 } : { scale: 1 }}
          animate={hero === "kenburns" ? { scale: 1.25 } : hero === "zoomin" ? { scale: 1 } : hero === "fade" ? { opacity: 1 } : {}}
          transition={hero === "kenburns" ? { duration: 6, ease: "linear", repeat: Infinity, repeatType: "reverse" } : { duration: 1.6, ease: EASE }}
        />
        <div className="absolute inset-0 flex items-center justify-center font-d text-lg italic text-white/90">Where every plate…</div>
      </div>
    </PreviewFrame>
  );
}

function HoverPreview({ hover }: { hover: AnimConfig["hover"] }) {
  return (
    <PreviewFrame label="Preview — move your mouse over the button">
      <div className="text-center">
        <motion.div
          key={`h-${hover}`}
          className="inline-block cursor-pointer rounded-md px-6 py-3 text-[11px] uppercase tracking-[0.25em]"
          style={{ border: "1px solid #c9a24b", color: "#c9a24b" }}
          whileHover={
            hover === "lift"
              ? { y: -6 }
              : hover === "scale"
                ? { scale: 1.08 }
                : hover === "tilt"
                  ? { rotate: -3, y: -4 }
                  : hover === "glow"
                    ? { boxShadow: "0 0 34px rgba(201,162,75,.55)" }
                    : hover === "underline"
                      ? { borderBottomWidth: 4 }
                      : undefined
          }
          transition={{ duration: 0.3 }}
        >
          Hover me
        </motion.div>
        {hover === "none" && <div className="mt-2 text-[10px] text-[#5f5745]">No hover effect</div>}
      </div>
    </PreviewFrame>
  );
}

function MarqueePreview({ on, speed }: { on: boolean; speed: number }) {
  return (
    <PreviewFrame label="Preview — marquee strip">
      {on ? (
        /* absolutely positioned so the long text can never widen the layout */
        <div className="relative h-8 w-full overflow-hidden">
          <motion.div
            key={`m-${speed}`}
            className="absolute left-0 top-0 whitespace-nowrap font-d text-lg italic text-[#c9a24b]"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: Math.max(3, speed / 4), ease: "linear", repeat: Infinity }}
          >
            {"Fire · Smoke · Glaze · Gold · ".repeat(8)}
          </motion.div>
        </div>
      ) : (
        <div className="text-center text-[11px] text-[#5f5745]">Marquee is off</div>
      )}
    </PreviewFrame>
  );
}

function PreloaderPreview({ kind }: { kind: AnimConfig["preloader"] }) {
  const [k, setK] = useState(0);
  return (
    <PreviewFrame label="Preview — loading screen" onReplay={() => setK((x) => x + 1)}>
      <PreloaderInner key={`${kind}-${k}`} kind={kind} />
    </PreviewFrame>
  );
}

function PreloaderInner({ kind }: { kind: AnimConfig["preloader"] }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (kind !== "counter") return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1900);
      setN(Math.round(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [kind]);
  if (kind === "none") return <div className="text-center text-[11px] text-[#5f5745]">No loading screen</div>;
  if (kind === "counter")
    return (
      <div className="text-center">
        <div className="font-d text-4xl tabular-nums text-[#c9a24b]">{String(n).padStart(3, "0")}</div>
        <div className="mx-auto mt-2 h-px w-40 bg-[#2b251a]"><div className="h-px bg-[#c9a24b]" style={{ width: `${n}%` }} /></div>
      </div>
    );
  if (kind === "logo")
    return (
      <div className="flex justify-center">
        <motion.div initial={{ scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: EASE }} className="flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a24b] font-d text-2xl text-[#c9a24b]" style={{ boxShadow: "0 0 40px rgba(201,162,75,.35)" }}>
          L
        </motion.div>
      </div>
    );
  return (
    <div className="text-center font-d text-2xl tracking-[0.3em] text-[#ede5d3]">
      {"LUMIÈRE".split("").map((ch, i) => (
        <motion.span key={i} initial={{ opacity: 0, y: 14, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}>
          {ch}
        </motion.span>
      ))}
    </div>
  );
}

function CursorPreview({ kind }: { kind: AnimConfig["cursor"] }) {
  return (
    <PreviewFrame label="Preview — move your mouse inside the box">
      <CursorInner kind={kind} />
    </PreviewFrame>
  );
}

function CursorInner({ kind }: { kind: AnimConfig["cursor"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const hideSystem = kind === "ring" || kind === "dot" || kind === "glow";
  const glow = kind === "glow" || kind === "default-glow";
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onMouseLeave={() => setPos(null)}
      className="relative flex h-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#3a3226] text-[11px] text-[#5f5745]"
      style={{ cursor: hideSystem ? "none" : "default" }}
    >
      {kind === "none" ? "Normal system cursor" : pos ? "" : "move mouse here"}
      {kind !== "none" && pos && (
        <>
          {!glow && <span className="pointer-events-none absolute h-2 w-2 rounded-full bg-[#c9a24b]" style={{ left: pos.x - 4, top: pos.y - 4 }} />}
          {(kind === "ring" || glow) && (
            <span
              className="pointer-events-none absolute rounded-full"
              style={{
                width: kind === "default-glow" ? 64 : 40,
                height: kind === "default-glow" ? 64 : 40,
                left: pos.x - (kind === "default-glow" ? 32 : 20),
                top: pos.y - (kind === "default-glow" ? 32 : 20),
                border: glow ? "none" : "1px solid #c9a24b",
                background: glow ? "radial-gradient(circle, rgba(201,162,75,.4), transparent 70%)" : "transparent",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function TypewriterPreview({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const iv = setInterval(() => setN((t) => Math.min(text.length, t + 1)), 45);
    return () => clearInterval(iv);
  }, [text]);
  return (
    <span className="font-d text-2xl text-[#ede5d3]">
      {text.slice(0, n)}
      <span className="text-[#c9a24b]">|</span>
    </span>
  );
}

/* ================================================================
   HEADER
================================================================ */

export function HeaderPanel({ db }: { db: DB }) {
  const toast = useToast();
  const [draft, setDraft] = useState<HeaderConfig>(() => JSON.parse(JSON.stringify(db.config.header)));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(db.config.header), [draft, db.config.header]);
  const set = (p: Partial<HeaderConfig>) => setDraft((d) => ({ ...d, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      await saveConfig({ ...db.config, header: draft });
      toast("Header published — live on the website");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Header" desc="Logo, navigation links (any URL or #anchor) and the booking button. Phone, email and address live in Restaurant Settings.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card title="Brand">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo text"><TextInput value={draft.logoText} onChange={(e) => set({ logoText: e.target.value })} /></Field>
              <Field label="Logo sub-line"><TextInput value={draft.logoSub} onChange={(e) => set({ logoSub: e.target.value })} /></Field>
            </div>
            <div className="mt-4">
              <MediaField label="Logo image (optional — replaces text)" value={draft.logoImage} onChange={(v) => set({ logoImage: v })} hint="Leave empty to use the text logo." />
            </div>
          </Card>
          <Card title="Navigation links">
            <div className="space-y-2">
              {draft.links.map((l, i) => (
                <div key={l.id} className="flex items-center gap-2">
                  <TextInput value={l.label} onChange={(e) => set({ links: draft.links.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)) })} placeholder="Label" className="w-32" />
                  <TextInput value={l.href} onChange={(e) => set({ links: draft.links.map((x) => (x.id === l.id ? { ...x, href: e.target.value } : x)) })} placeholder="#menu or https://…" />
                  <RowBtns
                    onUp={i > 0 ? () => { const ls = [...draft.links]; [ls[i - 1], ls[i]] = [ls[i], ls[i - 1]]; set({ links: ls }); } : undefined}
                    onDown={i < draft.links.length - 1 ? () => { const ls = [...draft.links]; [ls[i + 1], ls[i]] = [ls[i], ls[i + 1]]; set({ links: ls }); } : undefined}
                    onDel={() => set({ links: draft.links.filter((x) => x.id !== l.id) })}
                    disabledUp={i === 0}
                    disabledDown={i === draft.links.length - 1}
                  />
                </div>
              ))}
              <button onClick={() => set({ links: [...draft.links, { id: uid(), label: "New link", href: "#" }] })} className="text-[12px] text-[#c9a24b] hover:underline">+ Add link</button>
            </div>
          </Card>
          <Card title="Booking button & behaviour" hint="phone, email and address are in Restaurant Settings">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Booking button label"><TextInput value={draft.bookLabel} onChange={(e) => set({ bookLabel: e.target.value })} /></Field>
              <div className="flex items-end pb-2">
                <Toggle checked={draft.sticky} onChange={(v) => set({ sticky: v })} label="Solid background on scroll" />
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card title="Live preview">
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: db.config.theme.accent + "44", background: db.config.theme.bg, fontFamily: `var(${fontVar(db.config.theme.fontBody, "body")}), sans-serif` }}>
              <div className="flex items-center justify-between px-4 py-3">
                {draft.logoImage ? (
                  <img src={draft.logoImage} alt="logo" className="h-8 object-contain" />
                ) : (
                  <div>
                    <div className="text-[15px] tracking-[0.18em]" style={{ color: db.config.theme.text, fontFamily: `var(${fontVar(db.config.theme.fontDisplay)}), serif` }}>
                      {draft.logoText || "LUMIÈRE"}
                    </div>
                    <div className="text-[7px] uppercase tracking-[0.3em]" style={{ color: db.config.theme.muted }}>{draft.logoSub}</div>
                  </div>
                )}
                <div className="hidden gap-3 sm:flex">
                  {draft.links.slice(0, 4).map((l) => (
                    <span key={l.id} className="text-[9px] uppercase tracking-[0.18em]" style={{ color: db.config.theme.muted }}>{l.label}</span>
                  ))}
                </div>
                <span className="px-3 py-1.5 text-[8px] uppercase tracking-[0.2em]" style={{ border: `1px solid ${db.config.theme.accent}`, color: db.config.theme.text }}>
                  {draft.bookLabel}
                </span>
              </div>
              <div className="h-16" style={{ background: `linear-gradient(120deg, ${db.config.theme.surface}, ${db.config.theme.bg})` }} />
            </div>
          </Card>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(JSON.parse(JSON.stringify(db.config.header)))} />
    </Panel>
  );
}

/* ================================================================
   FOOTER
================================================================ */

export function FooterPanel({ db }: { db: DB }) {
  const toast = useToast();
  const [draft, setDraft] = useState<FooterConfig>(() => JSON.parse(JSON.stringify(db.config.footer)));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(db.config.footer), [draft, db.config.footer]);
  const set = (p: Partial<FooterConfig>) => setDraft((d) => ({ ...d, ...p }));

  const save = async () => {
    setSaving(true);
    try {
      await saveConfig({ ...db.config, footer: draft });
      toast("Footer published — live on the website");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setSaving(false);
    }
  };

  const th = db.config.theme;

  return (
    <Panel title="Footer" desc="About text, quick links and copyright — plus the giant wordmark. Hours, socials and contact details are in Restaurant Settings.">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card title="About text">
            <Field label="About blurb" hint="Address, phone, email, opening hours, social links and the footer headings are edited in Restaurant Settings.">
              <TextArea rows={3} value={draft.about} onChange={(e) => set({ about: e.target.value })} />
            </Field>
          </Card>
          <Card title="Links & copyright">
            <div className="space-y-2">
              {draft.links.map((l, i) => (
                <div key={l.id} className="flex items-center gap-2">
                  <TextInput value={l.label} onChange={(e) => set({ links: draft.links.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)) })} className="w-40" />
                  <TextInput value={l.href} onChange={(e) => set({ links: draft.links.map((x) => (x.id === l.id ? { ...x, href: e.target.value } : x)) })} />
                  <RowBtns
                    onUp={i > 0 ? () => { const ls = [...draft.links]; [ls[i - 1], ls[i]] = [ls[i], ls[i - 1]]; set({ links: ls }); } : undefined}
                    onDown={i < draft.links.length - 1 ? () => { const ls = [...draft.links]; [ls[i + 1], ls[i]] = [ls[i], ls[i + 1]]; set({ links: ls }); } : undefined}
                    onDel={() => set({ links: draft.links.filter((x) => x.id !== l.id) })}
                    disabledUp={i === 0}
                    disabledDown={i === draft.links.length - 1}
                  />
                </div>
              ))}
              <button onClick={() => set({ links: [...draft.links, { id: uid(), label: "New link", href: "#" }] })} className="text-[12px] text-[#c9a24b] hover:underline">+ Add link</button>
              <div className="pt-2">
                <Field label="Copyright line"><TextInput value={draft.copyright} onChange={(e) => set({ copyright: e.target.value })} /></Field>
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card title="Live preview">
            <div className="overflow-hidden rounded-xl border p-5" style={{ borderColor: th.accent + "44", background: th.surface, fontFamily: `var(${fontVar(th.fontBody, "body")}), sans-serif` }}>
              <div className="text-xl tracking-[0.15em]" style={{ color: th.accent, fontFamily: `var(${fontVar(th.fontDisplay)}), serif` }}>{db.config.siteName}</div>
              <p className="mt-2 text-[10.5px] leading-relaxed" style={{ color: th.muted }}>{draft.about}</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 text-[8px] uppercase tracking-[0.3em]" style={{ color: th.muted }}>{db.config.settings.labels.navigateTitle}</div>
                  {draft.links.slice(0, 3).map((l) => (
                    <div key={l.id} className="text-[11px]" style={{ color: th.text }}>{l.label}</div>
                  ))}
                </div>
                <div>
                  <div className="mb-2 text-[8px] uppercase tracking-[0.3em]" style={{ color: th.muted }}>{db.config.settings.labels.hoursTitle}</div>
                  {db.config.settings.hours.slice(0, 2).map((h) => (
                    <div key={h.id} className="flex justify-between text-[10px]">
                      <span style={{ color: th.muted }}>{h.d}</span>
                      <span style={{ color: th.text }}>{h.t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 border-t pt-3 text-[9px]" style={{ borderColor: th.accent + "33", color: th.muted }}>{draft.copyright}</div>
            </div>
          </Card>
        </div>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(JSON.parse(JSON.stringify(db.config.footer)))} />
    </Panel>
  );
}
