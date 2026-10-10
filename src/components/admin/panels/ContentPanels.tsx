"use client";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sectionFactory } from "@/lib/defaults";
import { AUTO_ANCHOR } from "@/lib/settings";
import { getCurrency, moneyText, money } from "@/lib/currency";
import { deleteBooking, patchBooking, saveConfig, saveCoupons, saveMenu } from "@/lib/store";
import type {
  AboutConfig,
  Booking,
  BreakConfig,
  ChefConfig,
  Coupon,
  CustomSectionConfig,
  DB,
  GalleryItem,
  HeroConfig,
  LocationConfig,
  MenuItem,
  MenuConfig,
  OffersConfig,
  ResConfig,
  ResRequired,
  Section,
  SectionType,
  Testimonial,
} from "@/lib/types";
import { uid } from "@/lib/types";
import { AddBtn, Card, Field, MediaField, Panel, Range, RowBtns, SaveBar, Select, TextArea, TextInput, Toggle, useToast } from "../ui";

/* ================================================================
   SECTIONS
================================================================ */

const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero / Opening film",
  about: "About / Story",
  menu: "Menu",
  offers: "Offers & Coupons",
  chef: "Chef / Signature",
  break: "Cinematic Break",
  gallery: "Gallery",
  testimonials: "Guest Words",
  reservation: "Table Booking",
  location: "Location & Hours",
  custom: "Custom Section",
};

/** What each section type shows on the website — displayed when adding a section and inside its editor. */
const SECTION_INFO: Record<SectionType, { desc: string; includes: string[] }> = {
  hero: {
    desc: "The full-screen opening of the website.",
    includes: ["Background video or image", "Dark overlay strength", "Kicker, two-line title and sub line", "Primary + second button (labels and links)"]
  },
  about: {
    desc: "Tell your story with two photos and a few headline numbers.",
    includes: ["Kicker and title", "Story text", "Main + accent photo", "Big outlined word (e.g. “Est.”)", "Stat boxes (add / remove)"],
  },
  menu: {
    desc: "Your dishes, grouped by category, with prices and a hover photo.",
    includes: ["Kicker, title and note", "View-only or ordering (cart) mode", "Dishes themselves are edited in the Menu tab"],
  },
  offers: {
    desc: "Shows your active coupon codes as tickets guests can copy.",
    includes: ["Kicker, title and sub text", "Button (label + link)", "Text shown when no coupon is active", "Coupons are edited in Offers & Coupons"],
  },
  chef: {
    desc: "Introduce the chef / owner with a portrait and a short bio.",
    includes: ["Kicker and title", "Name and role", "Bio text", "Portrait photo"],
  },
  break: {
    desc: "A full-width cinematic photo band with one big line of text.",
    includes: ["Kicker", "The big italic line", "Backdrop photo"],
  },
  gallery: {
    desc: "A photo grid of the restaurant, food and atmosphere.",
    includes: ["Kicker and title", "Any number of photos with captions", "Reorder / remove photos"],
  },
  testimonials: {
    desc: "A rotating slider of guest reviews.",
    includes: ["Kicker and title", "Any number of reviews (name, role, quote)"],
  },
  reservation: {
    desc: "The table-booking form. Bookings arrive in the Bookings tab.",
    includes: ["Kicker, title, sub text and note", "Side photo + caption", "Button and success wording", "Which form fields are required", "Time slots, party size and closed days are in Restaurant Settings → Booking rules"]
  },
  location: {
    desc: "Address, map link, phone and opening hours.",
    includes: ["Kicker and title", "Address / phone / map link (or use the Restaurant Settings ones)", "Button and hours heading wording", "Opening hours + live map come from Restaurant Settings"]
  },
  custom: {
    desc: "A free text + image block for anything else — events, private dining, a wine week.",
    includes: ["Kicker and title", "Text", "Optional image", "Optional button (label + link)", "Flip image to the other side"],
  },
};

export function SectionsPanel({ db }: { db: DB }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Section[]>(() => JSON.parse(JSON.stringify(db.config.sections)));
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(db.config.sections), [draft, db.config.sections]);

  const move = (i: number, dir: -1 | 1) =>
    setDraft((ds) => {
      const j = i + dir;
      if (j < 0 || j >= ds.length) return ds;
      const c = [...ds];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  const dup = (id: string) => {
    const i = draft.findIndex((x) => x.id === id);
    if (i < 0) return;
    const src = draft[i];
    const copy: Section = JSON.parse(JSON.stringify(src));
    copy.id = uid();
    copy.title = src.title + " (copy)";
    copy.anchor = ""; // two sections must never share a link ID
    const data = copy.data as unknown as Record<string, unknown>;
    // inner rows get fresh ids too, so editing the copy never touches the original
    for (const k of Object.keys(data)) {
      const v = data[k];
      if (Array.isArray(v)) data[k] = v.map((r) => (r && typeof r === "object" && "id" in r ? { ...r, id: uid() } : r));
    }
    setDraft([...draft.slice(0, i + 1), copy, ...draft.slice(i + 1)]);
    setOpen(copy.id);
  };
  const upd = (id: string, patch: Partial<Section>) => setDraft((ds) => ds.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const updData = (id: string, patch: Record<string, unknown>) =>
    setDraft((ds) =>
      ds.map((s) =>
        s.id === id ? { ...s, data: { ...(s.data as Record<string, unknown>), ...patch } as Section["data"] } : s
      )
    );

  const save = async () => {
    setSaving(true);
    try {
      await saveConfig({ ...db.config, sections: draft });
      toast("Sections published — live on the website");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setSaving(false);
    }
  };

  const hasHero = draft.some((x) => x.type === "hero");
  const addable = (Object.keys(SECTION_LABELS) as SectionType[]).filter((t) => t !== "hero" || !hasHero);

  return (
    <Panel
      title="Sections"
      desc="Add, remove, reorder and toggle every section of the website. Open “Edit” on a section to change everything inside it. Changes publish when you save."
    >
      <div className="space-y-3">
        {draft.map((s, i) => (
          <div key={s.id} className="overflow-hidden rounded-xl border" style={{ borderColor: open === s.id ? "rgba(201,162,75,.5)" : "#26211a", background: "#131009" }}>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-6 text-center font-mono text-[11px] text-[#5f5745]">{i + 1}</span>
              <span className="rounded-md border border-[#2b251a] px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#c9a24b]">
                {s.type}
              </span>
              <input
                className="a-in max-w-[220px] flex-1"
                value={s.title}
                onChange={(e) => upd(s.id, { title: e.target.value })}
                aria-label="Section name"
              />
              <Toggle checked={s.enabled} onChange={(v) => upd(s.id, { enabled: v })} label={s.enabled ? "Visible" : "Hidden"} />
              <button
                type="button"
                onClick={() => setOpen(open === s.id ? null : s.id)}
                className="rounded-md border border-[#2b251a] px-3 py-1.5 text-[11px] text-[#cfc4ab] hover:border-[#c9a24b]"
              >
                {open === s.id ? "Close" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => dup(s.id)}
                className="rounded-md border border-[#2b251a] px-3 py-1.5 text-[11px] text-[#cfc4ab] hover:border-[#c9a24b]"
                title="Make a copy of this section"
              >
                Duplicate
              </button>
              <RowBtns
                onUp={() => move(i, -1)}
                onDown={() => move(i, 1)}
                onDel={() => {
                  if (window.confirm(`Remove the “${s.title}” section? You can still discard the change before saving.`)) setDraft((ds) => ds.filter((x) => x.id !== s.id));
                }}
                disabledUp={i === 0}
                disabledDown={i === draft.length - 1}
              />
            </div>
            <AnimatePresence initial={false}>
              {open === s.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                  <div className="space-y-5 border-t border-[#26211a] p-5">
                    <div className="rounded-lg border border-[#26211a] bg-[#0e0c09] p-4">
                      <div className="text-[12px] text-[#cfc4ab]">{SECTION_INFO[s.type].desc}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {SECTION_INFO[s.type].includes.map((x) => (
                          <span key={x} className="rounded-full border border-[#2b251a] px-2.5 py-1 text-[10.5px] text-[#8d8270]">
                            {x}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field
                        label="Link ID (for menu links)"
                        hint={
                          AUTO_ANCHOR[s.type]
                            ? `Leave empty for the automatic #${AUTO_ANCHOR[s.type]}. Type e.g. “events” to link to it with #events.`
                            : "Type e.g. “events”, then add a header / footer link to #events to jump here."
                        }
                      >
                        <TextInput value={s.anchor ?? ""} onChange={(e) => upd(s.id, { anchor: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} placeholder={AUTO_ANCHOR[s.type] ?? "my-section"} />
                      </Field>
                    </div>
                    <SectionEditor s={s} upd={upd} updData={updData} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {draft.length === 0 && <p className="rounded-xl border border-dashed border-[#3a3226] p-6 text-center text-[13px] text-[#8d8270]">The website has no sections yet — add one below.</p>}
      </div>

      {adding ? (
        <div className="mt-4 rounded-xl border border-[#26211a] bg-[#131009] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c9a24b]">Choose a section — see what it contains</span>
            <button onClick={() => setAdding(false)} className="text-[12px] text-[#8d8270] hover:text-[#c98a8a]">Cancel</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {addable.map((t) => {
              const info = SECTION_INFO[t];
              return (
                <button
                  key={t}
                  onClick={() => {
                    const ns = sectionFactory[t]();
                    setDraft((ds) => [...ds, ns]);
                    setOpen(ns.id);
                    setAdding(false);
                  }}
                  className="rounded-lg border border-[#2b251a] p-4 text-left transition-colors hover:border-[#c9a24b]"
                >
                  <div className="text-[13px] font-medium text-[#c9a24b]">{SECTION_LABELS[t]}</div>
                  <div className="mt-1 text-[12px] leading-relaxed text-[#cfc4ab]">{info.desc}</div>
                  <ul className="mt-2.5 space-y-1">
                    {info.includes.map((x) => (
                      <li key={x} className="text-[11px] leading-snug text-[#6f6653]">
                        · {x}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <AddBtn onClick={() => setAdding(true)}>Add a new section</AddBtn>
        </div>
      )}

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(JSON.parse(JSON.stringify(db.config.sections)))} />
    </Panel>
  );
}

/* ---------------- per-type editors ---------------- */

function SectionEditor({
  s,
  upd,
  updData,
}: {
  s: Section;
  upd: (id: string, patch: Partial<Section>) => void;
  updData: (id: string, patch: Record<string, unknown>) => void;
}) {
  switch (s.type) {
    case "hero":
      return <HeroEditor d={s.data as HeroConfig} id={s.id} updData={updData} />;
    case "about":
      return <AboutEditor d={s.data as AboutConfig} id={s.id} updData={updData} />;
    case "menu":
      return <MenuEditor d={s.data as MenuConfig} id={s.id} updData={updData} />;
    case "offers":
      return <OffersEditor d={s.data as OffersConfig} id={s.id} updData={updData} />;
    case "chef":
      return <ChefEditor d={s.data as ChefConfig} id={s.id} updData={updData} />;
    case "break":
      return <BreakEditor d={s.data as BreakConfig} id={s.id} updData={updData} />;
    case "gallery":
      return <GalleryEditor d={s.data as { items: GalleryItem[] } & CustomSectionConfig} id={s.id} updData={updData} />;
    case "testimonials":
      return <TestimonialsEditor d={s.data as { items: Testimonial[] } & Partial<CustomSectionConfig>} id={s.id} updData={updData} />;
    case "reservation":
      return <ResEditor d={s.data as ResConfig} id={s.id} updData={updData} />;
    case "location":
      return <LocEditor d={s.data as LocationConfig} id={s.id} updData={updData} />;
    case "custom":
      return <CustomEditor d={s.data as CustomSectionConfig} id={s.id} updData={updData} />;
    default:
      return null;
  }
}

const G = "grid gap-4 md:grid-cols-2";
const DEFAULT_REQUIRED: ResRequired = { name: true, phone: true, email: false, date: true, time: true, guests: true, coupon: false, requests: false };

function HeroEditor({ d, id, updData }: { d: HeroConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-[11px] uppercase tracking-[0.14em] text-[#8d8270]">Backdrop</span>
        <div className="flex overflow-hidden rounded-md border border-[#2b251a]">
          {(["video", "image"] as const).map((m) => (
            <button key={m} type="button" onClick={() => updData(id, { mode: m })} className="px-3 py-1.5 text-[11px] uppercase tracking-[0.12em]" style={{ background: d.mode === m ? "#c9a24b" : "transparent", color: d.mode === m ? "#0e0c09" : "#8d8270" }}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className={G}>
        {d.mode === "video" ? (
          <>
            <MediaField label="Video URL (mp4)" video value={d.videoUrl} onChange={(v) => updData(id, { videoUrl: v })} hint="For large files, host on Firebase Storage and paste the download URL." />
            <MediaField label="Poster image (while video loads)" value={d.posterUrl} onChange={(v) => updData(id, { posterUrl: v })} />
          </>
        ) : (
          <MediaField label="Hero image" value={d.imageUrl} onChange={(v) => updData(id, { imageUrl: v })} />
        )}
        <div>
          <Field label="Dark overlay" hint="How dark to keep the backdrop for text readability">
            <Range value={d.overlay} min={0} max={90} onChange={(v) => updData(id, { overlay: v })} format={(v) => `${v}%`} />
          </Field>
        </div>
      </div>
      <div className={G}>
        <Field label="Kicker line"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Sub line"><TextInput value={d.sub} onChange={(e) => updData(id, { sub: e.target.value })} /></Field>
        <Field label="Title — line one"><TextInput value={d.titleA} onChange={(e) => updData(id, { titleA: e.target.value })} /></Field>
        <Field label="Title — line two (italic accent)"><TextInput value={d.titleB} onChange={(e) => updData(id, { titleB: e.target.value })} /></Field>
        <Field label="Main button label" hint="Empty = no button"><TextInput value={d.cta} onChange={(e) => updData(id, { cta: e.target.value })} /></Field>
        <Field label="Main button link" hint="Any URL or section anchor like #reserve"><TextInput value={d.ctaHref} onChange={(e) => updData(id, { ctaHref: e.target.value })} /></Field>
        <Field label="Second button label" hint="Empty = no second button"><TextInput value={d.cta2 ?? ""} onChange={(e) => updData(id, { cta2: e.target.value })} /></Field>
        <Field label="Second button link"><TextInput value={d.cta2Href ?? ""} onChange={(e) => updData(id, { cta2Href: e.target.value })} placeholder="#menu" /></Field>
      </div>
      <p className="text-[11px] text-[#5f5745]">The tagline on the right edge and the “Scroll” word come from Restaurant Settings.</p>
    </div>
  );
}

function AboutEditor({ d, id, updData }: { d: AboutConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Title"><TextInput value={d.title} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
      </div>
      <Field label="Story text"><TextArea rows={4} value={d.text} onChange={(e) => updData(id, { text: e.target.value })} /></Field>
      <Field label="Big outlined word behind the photos" hint="e.g. “Est.” — empty hides it"><TextInput value={d.badge ?? ""} onChange={(e) => updData(id, { badge: e.target.value })} maxLength={12} /></Field>
      <div className={G}>
        <MediaField label="Main image" value={d.image} onChange={(v) => updData(id, { image: v })} />
        <MediaField label="Accent image" value={d.image2} onChange={(v) => updData(id, { image2: v })} />
      </div>
      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-[#8d8270]">Stats</span>
        {d.stats.map((st) => (
          <div key={st.id} className="flex items-center gap-2">
            <TextInput value={st.value} onChange={(e) => updData(id, { stats: d.stats.map((x) => (x.id === st.id ? { ...x, value: e.target.value } : x)) })} className="w-24" placeholder="12" />
            <TextInput value={st.label} onChange={(e) => updData(id, { stats: d.stats.map((x) => (x.id === st.id ? { ...x, label: e.target.value } : x)) })} placeholder="Years of craft" />
            <button type="button" onClick={() => updData(id, { stats: d.stats.filter((x) => x.id !== st.id) })} className="text-[#c98a8a] hover:underline">✕</button>
          </div>
        ))}
        <button type="button" onClick={() => updData(id, { stats: [...d.stats, { id: uid(), value: "00", label: "New stat" }] })} className="text-[12px] text-[#c9a24b] hover:underline">+ Add stat</button>
      </div>
    </div>
  );
}

function MenuEditor({ d, id, updData }: { d: MenuConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className={G}>
      <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
      <Field label="Title"><TextInput value={d.title} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
      <Field label="Note under title"><TextInput value={d.note} onChange={(e) => updData(id, { note: e.target.value })} /></Field>
      <div className="md:col-span-2 rounded-lg border border-[#26211a] p-4">
        <Toggle checked={d.ordering === true} onChange={(v) => updData(id, { ordering: v })} label={d.ordering === true ? "Ordering ON — “+ Add” buttons and cart board are shown" : "View-only menu — no “+ Add”, no cart"} />
        <p className="mt-2 text-[11px] text-[#5f5745]">Keep this OFF if the website is only for showing the menu.</p>
      </div>
      <p className="md:col-span-2 text-[12px] text-[#5f5745]">Dishes are managed in the “Menu” tab — this section renders them automatically.</p>
    </div>
  );
}

function OffersEditor({ d, id, updData }: { d: OffersConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Title"><TextInput value={d.title} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
      </div>
      <Field label="Sub text"><TextInput value={d.sub} onChange={(e) => updData(id, { sub: e.target.value })} /></Field>
      <div className={G}>
        <Field label="Button label" hint="Empty = no button"><TextInput value={d.ctaLabel ?? ""} onChange={(e) => updData(id, { ctaLabel: e.target.value })} /></Field>
        <Field label="Button link"><TextInput value={d.ctaHref ?? ""} onChange={(e) => updData(id, { ctaHref: e.target.value })} placeholder="#reserve" /></Field>
      </div>
      <Field label="Text when there is no active coupon"><TextInput value={d.emptyText ?? ""} onChange={(e) => updData(id, { emptyText: e.target.value })} /></Field>
      <p className="text-[12px] text-[#5f5745]">The coupon codes shown here are managed in the “Offers & Coupons” tab.</p>
    </div>
  );
}

function ChefEditor({ d, id, updData }: { d: ChefConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Title"><TextInput value={d.title} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
        <Field label="Chef name"><TextInput value={d.name} onChange={(e) => updData(id, { name: e.target.value })} /></Field>
        <Field label="Role"><TextInput value={d.role} onChange={(e) => updData(id, { role: e.target.value })} /></Field>
      </div>
      <Field label="Bio"><TextArea rows={4} value={d.text} onChange={(e) => updData(id, { text: e.target.value })} /></Field>
      <MediaField label="Portrait" value={d.image} onChange={(v) => updData(id, { image: v })} />
    </div>
  );
}

function BreakEditor({ d, id, updData }: { d: BreakConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="The line (big italic quote)"><TextInput value={d.line} onChange={(e) => updData(id, { line: e.target.value })} /></Field>
      </div>
      <MediaField label="Backdrop image" value={d.image} onChange={(v) => updData(id, { image: v })} />
      <p className="text-[12px] text-[#5f5745]">Full-bleed band with letterbox bars, parallax and a slow zoom — a cinematic pause between sections.</p>
    </div>
  );
}

function GalleryEditor({ d, id, updData }: { d: { items: GalleryItem[] } & CustomSectionConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Title"><TextInput value={d.title} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
      </div>
      <div className="space-y-3">
        {d.items.map((g, i) => (
          <div key={g.id} className="rounded-lg border border-[#26211a] p-3">
            <div className="flex items-center gap-2">
              <TextInput value={g.caption} onChange={(e) => updData(id, { items: d.items.map((x) => (x.id === g.id ? { ...x, caption: e.target.value } : x)) })} placeholder="Caption" />
              <RowBtns
                onUp={i > 0 ? () => { const it = [...d.items]; [it[i - 1], it[i]] = [it[i], it[i - 1]]; updData(id, { items: it }); } : undefined}
                onDown={i < d.items.length - 1 ? () => { const it = [...d.items]; [it[i + 1], it[i]] = [it[i], it[i + 1]]; updData(id, { items: it }); } : undefined}
                onDel={() => updData(id, { items: d.items.filter((x) => x.id !== g.id) })}
                disabledUp={i === 0}
                disabledDown={i === d.items.length - 1}
              />
            </div>
            <div className="mt-2">
              <MediaField label="Image" value={g.url} onChange={(v) => updData(id, { items: d.items.map((x) => (x.id === g.id ? { ...x, url: v } : x)) })} />
            </div>
          </div>
        ))}
        <AddBtn onClick={() => updData(id, { items: [...d.items, { id: uid(), url: "", caption: "New moment" }] })}>Add gallery image</AddBtn>
      </div>
    </div>
  );
}

function TestimonialsEditor({ d, id, updData }: { d: { items: Testimonial[] } & Partial<CustomSectionConfig>; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker ?? ""} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Title"><TextInput value={d.title ?? ""} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
      </div>
      {d.items.map((t) => (
        <div key={t.id} className="rounded-lg border border-[#26211a] p-4">
          <div className="flex gap-2">
            <TextInput value={t.name} onChange={(e) => updData(id, { items: d.items.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)) })} placeholder="Name" />
            <TextInput value={t.role} onChange={(e) => updData(id, { items: d.items.map((x) => (x.id === t.id ? { ...x, role: e.target.value } : x)) })} placeholder="Role / source" />
            <button type="button" onClick={() => updData(id, { items: d.items.filter((x) => x.id !== t.id) })} className="text-[#c98a8a] hover:underline">✕</button>
          </div>
          <TextArea rows={3} className="mt-2" value={t.text} onChange={(e) => updData(id, { items: d.items.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)) })} placeholder="The quote" />
        </div>
      ))}
      <AddBtn onClick={() => updData(id, { items: [...d.items, { id: uid(), name: "New guest", role: "", text: "" }] })}>Add testimonial</AddBtn>
    </div>
  );
}

function ResEditor({ d, id, updData }: { d: ResConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  const req: ResRequired = { ...DEFAULT_REQUIRED, ...(d.required || {}) };
  return (
    <div className="space-y-4">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Title"><TextInput value={d.title} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
      </div>
      <Field label="Sub text"><TextInput value={d.sub} onChange={(e) => updData(id, { sub: e.target.value })} /></Field>
      <Field label="Note (shown under the photo)"><TextInput value={d.note} onChange={(e) => updData(id, { note: e.target.value })} /></Field>
      <div className={G}>
        <Field label="Photo caption" hint="Written over the photo — empty hides it"><TextInput value={d.caption ?? ""} onChange={(e) => updData(id, { caption: e.target.value })} /></Field>
        <Field label="Submit button label"><TextInput value={d.submitLabel ?? ""} onChange={(e) => updData(id, { submitLabel: e.target.value })} /></Field>
        <Field label="“Booked” heading"><TextInput value={d.successTitle ?? ""} onChange={(e) => updData(id, { successTitle: e.target.value })} /></Field>
      </div>
      <MediaField label="Side image" value={d.image} onChange={(v) => updData(id, { image: v })} />
      <div className="rounded-lg border border-[#2b251a] p-4">
        <div className="mb-1 text-[13px] font-medium text-[#ede5d3]">Required fields <span style={{ color: "#e5484d" }}>*</span></div>
        <p className="mb-3 text-[12px] text-[#5f5745]">Turn ON the details a guest must fill before booking. Those fields get a red star on the website and the booking will not go through until they are filled.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["name", "Full name"],
              ["phone", "Phone number"],
              ["email", "Email"],
              ["date", "Date"],
              ["time", "Time"],
              ["guests", "Number of guests"],
              ["coupon", "Coupon code"],
              ["requests", "Special requests"],
            ] as [keyof ResRequired, string][]
          ).map(([k, label]) => (
            <Toggle key={k} label={label} checked={!!req[k]} onChange={(v) => updData(id, { required: { ...req, [k]: v } })} />
          ))}
        </div>
      </div>
      <p className="text-[12px] text-[#5f5745]">Bookings submitted here appear in the “Bookings” tab. Time slots, maximum guests, earliest day, closed weekdays and the on/off switch are in Restaurant Settings → Booking rules.</p>
    </div>
  );
}

function LocEditor({ d, id, updData }: { d: LocationConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Title"><TextInput value={d.title} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
        <Field label="Address" hint="Leave empty to use the address from Restaurant Settings"><TextInput value={d.address} onChange={(e) => updData(id, { address: e.target.value })} /></Field>
        <Field label="Phone" hint="Leave empty to use the phone from Restaurant Settings"><TextInput value={d.phone} onChange={(e) => updData(id, { phone: e.target.value })} /></Field>
        <Field label="Google Maps URL" hint="Leave empty to use the one from Restaurant Settings"><TextInput value={d.mapsUrl} onChange={(e) => updData(id, { mapsUrl: e.target.value })} /></Field>
        <Field label="Maps button label"><TextInput value={d.mapsLabel ?? ""} onChange={(e) => updData(id, { mapsLabel: e.target.value })} /></Field>
        <Field label="Opening-hours box heading"><TextInput value={d.hoursTitle ?? ""} onChange={(e) => updData(id, { hoursTitle: e.target.value })} /></Field>
      </div>
      <p className="text-[12px] text-[#5f5745]">Opening hours and the embedded live map are edited in Restaurant Settings → Contact, hours & social.</p>
    </div>
  );
}

function CustomEditor({ d, id, updData }: { d: CustomSectionConfig; id: string; updData: (i: string, p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <div className={G}>
        <Field label="Kicker"><TextInput value={d.kicker} onChange={(e) => updData(id, { kicker: e.target.value })} /></Field>
        <Field label="Title"><TextInput value={d.title} onChange={(e) => updData(id, { title: e.target.value })} /></Field>
        <Field label="Button label"><TextInput value={d.cta} onChange={(e) => updData(id, { cta: e.target.value })} /></Field>
        <Field label="Button link (any URL or #anchor)"><TextInput value={d.ctaUrl} onChange={(e) => updData(id, { ctaUrl: e.target.value })} /></Field>
      </div>
      <Field label="Text"><TextArea rows={4} value={d.text} onChange={(e) => updData(id, { text: e.target.value })} /></Field>
      <MediaField label="Image" value={d.image} onChange={(v) => updData(id, { image: v })} />
      <Toggle checked={d.flip} onChange={(v) => updData(id, { flip: v })} label="Flip layout (image on the right)" />
    </div>
  );
}

/* ================================================================
   MENU
================================================================ */

const TAGS: { v: MenuItem["tag"]; l: string }[] = [
  { v: "none", l: "No tag" },
  { v: "new", l: "New" },
  { v: "chef", l: "Chef's" },
  { v: "spicy", l: "Spicy" },
  { v: "veg", l: "Veg" },
];

export function MenuPanel({ db }: { db: DB }) {
  const toast = useToast();
  const cur = getCurrency(db.config);
  const [draft, setDraft] = useState<MenuItem[]>(() => JSON.parse(JSON.stringify(db.menu)));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(db.menu), [draft, db.menu]);
  const cats = useMemo(() => Array.from(new Set(draft.map((m) => m.category))), [draft]);

  const patch = (id: string, p: Partial<MenuItem>) => setDraft((ds) => ds.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const move = (i: number, dir: -1 | 1) =>
    setDraft((ds) => {
      const j = i + dir;
      if (j < 0 || j >= ds.length) return ds;
      const c = [...ds];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const save = async () => {
    setSaving(true);
    try {
      await saveMenu(draft.map((m) => ({ ...m, category: m.category.trim() || "Menu" })));
      toast("Menu published — live on the website");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Menu" desc="Every dish on the website. Add, edit, tag, reorder and hide items — categories come from the items themselves.">
      <div className="grid gap-4 xl:grid-cols-2">
        {draft.map((m, i) => (
          <Card key={m.id} className={m.enabled ? "" : "opacity-55"}>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="w-full space-y-2 sm:w-[250px] sm:shrink-0">
                <MediaField label="Photo" value={m.image} onChange={(v) => patch(m.id, { image: v })} />
              </div>
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="flex items-center gap-2">
                  <TextInput value={m.name} onChange={(e) => patch(m.id, { name: e.target.value })} placeholder="Dish name" />
                  <TextInput value={m.price} onChange={(e) => patch(m.id, { price: e.target.value })} placeholder={`Price (${cur.symbol})`} className="w-28" />
                </div>
                <TextArea rows={2} value={m.desc} onChange={(e) => patch(m.id, { desc: e.target.value })} placeholder="Description" />
                <div className="flex flex-wrap items-center gap-2">
                  <input className="a-in w-36" list="menu-cats" value={m.category} onChange={(e) => patch(m.id, { category: e.target.value })} placeholder="Category" aria-label="Category" />
                  <datalist id="menu-cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
                  <Select options={TAGS} value={m.tag} onChange={(e) => patch(m.id, { tag: e.target.value as MenuItem["tag"] })} />
                  <span className="ml-auto" />
                  <Toggle checked={m.enabled} onChange={(v) => patch(m.id, { enabled: v })} label={m.enabled ? "Live" : "Hidden"} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#5f5745]">Shown as “{moneyText(cur, m.price || "…")}” in {m.category || "—"}</span>
                  <RowBtns onUp={() => move(i, -1)} onDown={() => move(i, 1)} onDel={() => setDraft((ds) => ds.filter((x) => x.id !== m.id))} disabledUp={i === 0} disabledDown={i === draft.length - 1} />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <AddBtn onClick={() => setDraft((ds) => [...ds, { id: uid(), name: "New dish", desc: "Describe the plate, its fire and its finish…", price: "1,000", category: cats[0] || "Starters", image: "", tag: "none", enabled: true }])}>
          Add dish
        </AddBtn>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(JSON.parse(JSON.stringify(db.menu)))} />
    </Panel>
  );
}

/* ================================================================
   OFFERS & COUPONS
================================================================ */

export function OffersPanel({ db }: { db: DB }) {
  const toast = useToast();
  const cur = getCurrency(db.config);
  const [draft, setDraft] = useState<Coupon[]>(() => JSON.parse(JSON.stringify(db.coupons)));
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(db.coupons), [draft, db.coupons]);
  const patch = (id: string, p: Partial<Coupon>) => setDraft((ds) => ds.map((c) => (c.id === id ? { ...c, ...p } : c)));

  const save = async () => {
    setSaving(true);
    try {
      await saveCoupons(draft);
      toast("Offers published — live on the website");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Offers & Coupons" desc="Create promo codes guests can see on the website and apply in their cart before reserving.">
      <div className="grid gap-4 lg:grid-cols-2">
        {draft.map((c, i) => (
          <Card key={c.id} className={c.active ? "" : "opacity-55"}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TextInput value={c.code} onChange={(e) => patch(c.id, { code: e.target.value.toUpperCase() })} className="font-mono" placeholder="CODE" />
                <Select options={[{ v: "percent", l: "% off" }, { v: "flat", l: `${cur.symbol} flat off` }]} value={c.type} onChange={(e) => patch(c.id, { type: e.target.value as Coupon["type"] })} />
                <TextInput type="number" value={String(c.value)} onChange={(e) => patch(c.id, { value: Number(e.target.value) || 0 })} className="w-24" />
                <span className="ml-auto" />
                <RowBtns onUp={undefined} onDown={undefined} onDel={() => setDraft((ds) => ds.filter((x) => x.id !== c.id))} />
              </div>
              <div className="flex gap-2">
                <TextInput type="number" value={String(c.minSpend)} onChange={(e) => patch(c.id, { minSpend: Number(e.target.value) || 0 })} placeholder={`Min spend (${cur.symbol})`} />
                <TextInput type="date" value={c.expires} onChange={(e) => patch(c.id, { expires: e.target.value })} />
              </div>
              <TextInput value={c.desc} onChange={(e) => patch(c.id, { desc: e.target.value })} placeholder="What guests see" />
              <div className="flex items-center justify-between">
                <Toggle checked={c.active} onChange={(v) => patch(c.id, { active: v })} label={c.active ? "Active — visible on site" : "Paused"} />
                <span className="text-[11px] text-[#5f5745]">#{i + 1}</span>
              </div>
              {/* ticket preview */}
              <div className="ticket px-4 py-3" style={{ borderRadius: 6 }}>
                <div className="font-d text-lg tracking-[0.1em] text-[#c9a24b]">{c.code || "CODE"}</div>
                <div className="text-[12px] italic text-[#cfc4ab]">{c.type === "percent" ? `${c.value}% off` : `${money(cur, c.value)} off`}{c.desc ? ` — ${c.desc}` : ""}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <AddBtn onClick={() => setDraft((ds) => [...ds, { id: uid(), code: "WELCOME10", type: "percent", value: 10, minSpend: 0, desc: "A warm welcome for first-time guests", active: true, expires: "" }])}>
          Add coupon
        </AddBtn>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(JSON.parse(JSON.stringify(db.coupons)))} />
    </Panel>
  );
}

/* ================================================================
   BOOKINGS
================================================================ */

const STATUS_STYLE: Record<Booking["status"], string> = {
  pending: "#d9a93f",
  confirmed: "#5faf82",
  cancelled: "#c96a6a",
};

export function BookingsPanel({ db }: { db: DB }) {
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | Booking["status"]>("all");
  const list = db.bookings.filter((b) => filter === "all" || b.status === filter);

  return (
    <Panel title="Bookings" desc="Every table reservation submitted from the website. Status changes are pushed instantly.">
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "pending", "confirmed", "cancelled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="rounded-lg border px-4 py-2 text-[11px] uppercase tracking-[0.16em] transition-colors"
            style={{
              borderColor: filter === f ? "#c9a24b" : "#2b251a",
              color: filter === f ? "#0e0c09" : "#8d8270",
              background: filter === f ? "#c9a24b" : "transparent",
            }}
          >
            {f}
            <span className="ml-2 opacity-70">{f === "all" ? db.bookings.length : db.bookings.filter((b) => b.status === f).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Card>
          <p className="text-center text-[13px] text-[#8d8270]">
            No {filter === "all" ? "" : filter + " "}bookings yet. Reservations from the website will land here the moment they arrive.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-[#26211a] bg-[#131009] px-5 py-4">
              <div className="min-w-[150px]">
                <div className="font-d text-[17px] text-[#ede5d3]">{b.name}</div>
                <div className="mt-0.5 text-[11px] text-[#8d8270]">{b.phone}{b.email ? ` · ${b.email}` : ""}</div>
              </div>
              <div className="text-[13px] text-[#cfc4ab]">
                <span className="text-[#c9a24b]">{b.date || "—"} · {b.time}</span>
                <span className="text-[#8d8270]"> · {b.guests} {b.guests === 1 ? "guest" : "guests"}</span>
              </div>
              {b.requests && <div className="max-w-[260px] text-[12px] italic text-[#8d8270]">“{b.requests}”</div>}
              {b.coupon && <span className="rounded-md border border-[#3a3226] px-2 py-1 font-mono text-[11px] text-[#c9a24b]">Coupon {b.coupon}</span>}
              <div className="ml-auto flex items-center gap-3">
                <span className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em]" style={{ color: STATUS_STYLE[b.status], border: `1px solid ${STATUS_STYLE[b.status]}55` }}>
                  {b.status}
                </span>
                <Select
                  options={[{ v: "pending", l: "Pending" }, { v: "confirmed", l: "Confirmed" }, { v: "cancelled", l: "Cancelled" }]}
                  value={b.status}
                  onChange={async (e) => {
                    try {
                      await patchBooking(b.id, { status: e.target.value as Booking["status"] });
                      toast(`Booking ${e.target.value}`);
                    } catch (ex) {
                      toast(ex instanceof Error ? ex.message : "Could not update the booking", false);
                    }
                  }}
                  className="w-32"
                />
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete the booking from ${b.name || "this guest"}? This cannot be undone.`)) return;
                    try {
                      await deleteBooking(b.id);
                      toast("Booking removed", false);
                    } catch (ex) {
                      toast(ex instanceof Error ? ex.message : "Could not delete the booking", false);
                    }
                  }}
                  className="text-[#c98a8a] hover:underline"
                  aria-label="Delete booking"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
