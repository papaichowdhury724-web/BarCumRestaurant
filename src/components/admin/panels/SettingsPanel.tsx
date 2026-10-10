"use client";
import { useMemo, useState } from "react";
import { saveConfig } from "@/lib/store";
import { mapEmbedSrc } from "@/lib/url";
import type { DB, FooterSocial, RestaurantSettings } from "@/lib/types";
import { uid } from "@/lib/types";
import { AddBtn, Card, Field, MediaField, Panel, RowBtns, SaveBar, Select, TextArea, TextInput, Toggle, useToast } from "../ui";
import { CurrencyCard } from "./DesignPanels";

/* ================================================================
   RESTAURANT SETTINGS — everything about the restaurant that is not a "section":
   name, contact, hours, socials, booking rules, SEO, banner, wording.
================================================================ */

type TabKey = "general" | "contact" | "booking" | "texts" | "extras";

const TABS: { k: TabKey; l: string }[] = [
  { k: "general", l: "General & SEO" },
  { k: "contact", l: "Contact, hours & social" },
  { k: "booking", l: "Booking rules" },
  { k: "texts", l: "Site texts" },
  { k: "extras", l: "Banner & buttons" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SOCIAL_OPTS = [
  { v: "instagram", l: "Instagram" },
  { v: "facebook", l: "Facebook" },
  { v: "twitter", l: "X / Twitter" },
  { v: "youtube", l: "YouTube" },
  { v: "tiktok", l: "TikTok" },
  { v: "website", l: "Website" },
];

interface Draft {
  siteName: string;
  tagline: string;
  settings: RestaurantSettings;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function SettingsPanel({ db }: { db: DB }) {
  const toast = useToast();
  const snapshot = (): Draft => clone({ siteName: db.config.siteName, tagline: db.config.tagline, settings: db.config.settings });
  const [draft, setDraft] = useState<Draft>(snapshot);
  const [tab, setTab] = useState<TabKey>("general");
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify({ siteName: db.config.siteName, tagline: db.config.tagline, settings: db.config.settings }), [draft, db.config]);

  const st = draft.settings;
  const setSt = (p: Partial<RestaurantSettings>) => setDraft((d) => ({ ...d, settings: { ...d.settings, ...p } }));
  const patch = <K extends keyof RestaurantSettings>(k: K, p: Partial<RestaurantSettings[K]>) =>
    setDraft((d) => ({ ...d, settings: { ...d.settings, [k]: { ...d.settings[k], ...p } } }));

  const save = async () => {
    const name = draft.siteName.trim();
    if (!name) return toast("The restaurant name cannot be empty", false);
    if (st.booking.enabled && st.booking.timeSlots.length === 0) {
      setTab("booking");
      return toast("Add at least one booking time slot, or switch online booking off", false);
    }
    if (st.contact.mapEmbed.trim() && !mapEmbedSrc(st.contact.mapEmbed)) {
      setTab("contact");
      return toast("The map embed is not a Google Maps embed link — see the hint under the field", false);
    }
    setSaving(true);
    try {
      const clean: RestaurantSettings = {
        ...st,
        contact: { ...st.contact, mapEmbed: st.contact.mapEmbed.trim() },
        booking: { ...st.booking, maxGuests: Math.max(1, Math.min(60, Math.round(st.booking.maxGuests) || 8)), leadDays: Math.max(0, Math.min(365, Math.round(st.booking.leadDays) || 0)) },
        labels: { ...st.labels, marquee: st.labels.marquee.map((x) => x.trim()).filter(Boolean) },
      };
      const tagline = draft.tagline.trim();
      await saveConfig({ ...db.config, siteName: name, tagline, settings: clean });
      setDraft(clone({ siteName: name, tagline, settings: clean })); // show the trimmed values, so the bar reads "everything is live"
      toast("Restaurant settings published — live on the website");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Restaurant Settings" desc="Everything about the restaurant itself — name, contact, hours, social links, booking rules, search-engine details, banner and the small wording on the site. Section content is edited in “Sections”.">
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.k}
            type="button"
            onClick={() => setTab(t.k)}
            className="rounded-lg border px-4 py-2 text-[12px] transition-colors"
            style={{ borderColor: tab === t.k ? "#c9a24b" : "#2b251a", background: tab === t.k ? "rgba(201,162,75,.14)" : "transparent", color: tab === t.k ? "#c9a24b" : "#8d8270" }}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="space-y-5">
          <Card title="Name & tagline" hint="header, footer wordmark, loading screen, browser tab">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Restaurant name"><TextInput value={draft.siteName} onChange={(e) => setDraft((d) => ({ ...d, siteName: e.target.value }))} /></Field>
              <Field label="Tagline" hint="Also shown as the vertical text on the hero"><TextInput value={draft.tagline} onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))} /></Field>
            </div>
          </Card>
          <Card title="Search & sharing (SEO)" hint="what Google and social apps show">
            <div className="space-y-4">
              <Field label="Browser tab / Google title" hint="Leave empty to use “Name — Tagline”">
                <TextInput value={st.seo.title} onChange={(e) => patch("seo", { title: e.target.value })} placeholder={`${draft.siteName}${draft.tagline ? " — " + draft.tagline : ""}`} />
              </Field>
              <Field label="Description" hint="One or two sentences (about 150 characters)">
                <TextArea rows={2} value={st.seo.description} onChange={(e) => patch("seo", { description: e.target.value })} />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <MediaField label="Favicon (small tab icon)" value={st.seo.favicon} onChange={(v) => patch("seo", { favicon: v })} hint="Square image, e.g. 64×64 PNG" />
                <MediaField label="Share image" value={st.seo.ogImage} onChange={(v) => patch("seo", { ogImage: v })} hint="Shown when the link is shared. Use an image URL (uploaded files are not used for sharing)." />
              </div>
              <p className="text-[11px] leading-relaxed text-[#5f5745]">Note: this site loads its content in the visitor’s browser, so Google reads these when it runs the page, but some social apps only see the starter title from the code. Changing the starter title in <span className="font-mono">src/app/layout.tsx</span> covers those.</p>
            </div>
          </Card>
          <CurrencyCard db={db} />
        </div>
      )}

      {tab === "contact" && (
        <div className="space-y-5">
          <Card title="Contact details" hint="used by the header, footer, location section and floating buttons">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><TextInput value={st.contact.phone} onChange={(e) => patch("contact", { phone: e.target.value })} placeholder="+880 1712 345 678" /></Field>
              <Field label="WhatsApp number" hint="With country code, e.g. 8801712345678 (for the WhatsApp button)"><TextInput value={st.contact.whatsapp} onChange={(e) => patch("contact", { whatsapp: e.target.value })} /></Field>
              <Field label="Email"><TextInput type="email" value={st.contact.email} onChange={(e) => patch("contact", { email: e.target.value })} /></Field>
              <Field label="Google Maps link" hint="The “Open in Google Maps” button opens this"><TextInput value={st.contact.mapsUrl} onChange={(e) => patch("contact", { mapsUrl: e.target.value })} /></Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Address"><TextArea rows={2} value={st.contact.address} onChange={(e) => patch("contact", { address: e.target.value })} /></Field>
              <Field label="Embedded map (optional)" hint="Google Maps → Share → Embed a map → paste the link or the whole <iframe> code. Shows a live map in the Location section.">
                <TextArea rows={3} value={st.contact.mapEmbed} onChange={(e) => patch("contact", { mapEmbed: e.target.value })} placeholder='<iframe src="https://www.google.com/maps/embed?pb=…"></iframe>' />
              </Field>
              {st.contact.mapEmbed.trim() && !mapEmbedSrc(st.contact.mapEmbed) && <p className="text-[11px] text-[#c98a8a]">That is not a Google Maps embed link, so it will not be shown.</p>}
            </div>
          </Card>

          <Card title="Opening hours" hint="shown in the footer and the Location section">
            <div className="space-y-2">
              {st.hours.map((h, i) => (
                <div key={h.id} className="flex items-center gap-2">
                  <TextInput value={h.d} onChange={(e) => setSt({ hours: st.hours.map((x) => (x.id === h.id ? { ...x, d: e.target.value } : x)) })} className="flex-1" placeholder="Days" />
                  <TextInput value={h.t} onChange={(e) => setSt({ hours: st.hours.map((x) => (x.id === h.id ? { ...x, t: e.target.value } : x)) })} className="w-40" placeholder="18:00 — 23:00" />
                  <RowBtns
                    onUp={() => setSt({ hours: move(st.hours, i, -1) })}
                    onDown={() => setSt({ hours: move(st.hours, i, 1) })}
                    onDel={() => setSt({ hours: st.hours.filter((x) => x.id !== h.id) })}
                    disabledUp={i === 0}
                    disabledDown={i === st.hours.length - 1}
                  />
                </div>
              ))}
              <AddBtn onClick={() => setSt({ hours: [...st.hours, { id: uid(), d: "New day", t: "18:00 — 23:00" }] })}>Add hours row</AddBtn>
            </div>
          </Card>

          <Card title="Social links" hint="icons in the footer">
            <div className="space-y-2">
              {st.socials.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Select
                    options={SOCIAL_OPTS}
                    value={s.icon}
                    onChange={(e) => setSt({ socials: st.socials.map((x) => (x.id === s.id ? { ...x, icon: e.target.value as FooterSocial["icon"], label: SOCIAL_OPTS.find((o) => o.v === e.target.value)?.l ?? e.target.value } : x)) })}
                    className="w-36"
                  />
                  <TextInput value={s.url} onChange={(e) => setSt({ socials: st.socials.map((x) => (x.id === s.id ? { ...x, url: e.target.value } : x)) })} placeholder="https://instagram.com/yourpage" />
                  <RowBtns
                    onUp={() => setSt({ socials: move(st.socials, i, -1) })}
                    onDown={() => setSt({ socials: move(st.socials, i, 1) })}
                    onDel={() => setSt({ socials: st.socials.filter((x) => x.id !== s.id) })}
                    disabledUp={i === 0}
                    disabledDown={i === st.socials.length - 1}
                  />
                </div>
              ))}
              <AddBtn onClick={() => setSt({ socials: [...st.socials, { id: uid(), label: "Instagram", url: "https://instagram.com", icon: "instagram" }] })}>Add social link</AddBtn>
            </div>
          </Card>
        </div>
      )}

      {tab === "booking" && (
        <div className="space-y-5">
          <Card title="Online table booking">
            <Toggle checked={st.booking.enabled} onChange={(v) => patch("booking", { enabled: v })} label={st.booking.enabled ? "ON — guests can book on the website" : "OFF — the form is replaced by a “please call us” message"} />
          </Card>
          <Card title="Time slots" hint="the times guests can pick">
            <SlotEditor slots={st.booking.timeSlots} onChange={(timeSlots) => patch("booking", { timeSlots })} />
          </Card>
          <Card title="Limits">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Maximum guests per booking" hint="1 – 60. Bigger parties can call you.">
                <TextInput type="number" min={1} max={60} value={String(st.booking.maxGuests)} onChange={(e) => patch("booking", { maxGuests: Number(e.target.value) })} />
              </Field>
              <Field label="Earliest bookable day" hint="0 = guests may book for today; 1 = from tomorrow…">
                <TextInput type="number" min={0} max={365} value={String(st.booking.leadDays)} onChange={(e) => patch("booking", { leadDays: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="mt-5">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8d8270]">Closed on</div>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((w, i) => {
                  const on = st.booking.closedDays.includes(i);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => patch("booking", { closedDays: on ? st.booking.closedDays.filter((x) => x !== i) : [...st.booking.closedDays, i].sort() })}
                      className="rounded-md border px-3.5 py-2 text-[12px] transition-colors"
                      style={{ borderColor: on ? "#c98a8a" : "#2b251a", background: on ? "rgba(201,138,138,.14)" : "transparent", color: on ? "#c98a8a" : "#8d8270" }}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-[#5f5745]">Guests cannot book a closed weekday. Which details are required, and the wording of the form, are in Sections → Table Booking.</p>
            </div>
          </Card>
        </div>
      )}

      {tab === "texts" && (
        <div className="space-y-5">
          <Card title="Footer & navigation wording">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Footer “Navigate” heading"><TextInput value={st.labels.navigateTitle} onChange={(e) => patch("labels", { navigateTitle: e.target.value })} /></Field>
              <Field label="Footer “Hours” heading"><TextInput value={st.labels.hoursTitle} onChange={(e) => patch("labels", { hoursTitle: e.target.value })} /></Field>
              <Field label="Footer “Contact” heading"><TextInput value={st.labels.contactTitle} onChange={(e) => patch("labels", { contactTitle: e.target.value })} /></Field>
              <Field label="Footer line at the bottom right" hint="Leave empty to hide"><TextInput value={st.labels.footerTagline} onChange={(e) => patch("labels", { footerTagline: e.target.value })} /></Field>
              <Field label="Hero “Scroll” word"><TextInput value={st.labels.scrollCue} onChange={(e) => patch("labels", { scrollCue: e.target.value })} /></Field>
              <Field label="Loading-screen line" hint="Shown after the counter, e.g. “preparing the table”. Empty = nothing."><TextInput value={st.labels.preloaderText} onChange={(e) => patch("labels", { preloaderText: e.target.value })} /></Field>
            </div>
            <div className="mt-4">
              <Toggle checked={st.labels.showAdminLink} onChange={(v) => patch("labels", { showAdminLink: v })} label="Show the small “Admin” link in the footer and mobile menu" />
              <p className="mt-1.5 text-[11px] text-[#5f5745]">Switch it off for visitors; you can still open the admin at <span className="font-mono">/admin</span>.</p>
            </div>
          </Card>

          <Card title="Scrolling word strip" hint="the marquee between the last section and the footer">
            <div className="space-y-2">
              {st.labels.marquee.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TextInput value={w} onChange={(e) => patch("labels", { marquee: st.labels.marquee.map((x, k) => (k === i ? e.target.value : x)) })} />
                  <RowBtns
                    onUp={() => patch("labels", { marquee: move(st.labels.marquee, i, -1) })}
                    onDown={() => patch("labels", { marquee: move(st.labels.marquee, i, 1) })}
                    onDel={() => patch("labels", { marquee: st.labels.marquee.filter((_, k) => k !== i) })}
                    disabledUp={i === 0}
                    disabledDown={i === st.labels.marquee.length - 1}
                  />
                </div>
              ))}
              <AddBtn onClick={() => patch("labels", { marquee: [...st.labels.marquee, "New word"] })}>Add word</AddBtn>
              <p className="text-[11px] text-[#5f5745]">Turn the strip on/off and set its speed in Animations.</p>
            </div>
          </Card>

          <Card title="Menu ordering & cart wording" hint="only visible when ordering is ON in the Menu section">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="“Add” button"><TextInput value={st.labels.addLabel} onChange={(e) => patch("labels", { addLabel: e.target.value })} /></Field>
              <Field label="“Add” button on phones"><TextInput value={st.labels.addToCartLabel} onChange={(e) => patch("labels", { addToCartLabel: e.target.value })} /></Field>
              <Field label="Floating cart button"><TextInput value={st.labels.boardButton} onChange={(e) => patch("labels", { boardButton: e.target.value })} /></Field>
              <Field label="Cart title"><TextInput value={st.labels.boardTitle} onChange={(e) => patch("labels", { boardTitle: e.target.value })} /></Field>
              <Field label="Empty-cart title"><TextInput value={st.labels.boardEmptyTitle} onChange={(e) => patch("labels", { boardEmptyTitle: e.target.value })} /></Field>
              <Field label="Empty-cart button"><TextInput value={st.labels.boardBrowse} onChange={(e) => patch("labels", { boardBrowse: e.target.value })} /></Field>
            </div>
            <div className="mt-4 space-y-4">
              <Field label="Empty-cart message"><TextArea rows={2} value={st.labels.boardEmptyText} onChange={(e) => patch("labels", { boardEmptyText: e.target.value })} /></Field>
              <Field label="Note at the bottom of the cart" hint="Leave empty to hide"><TextArea rows={2} value={st.labels.boardNote} onChange={(e) => patch("labels", { boardNote: e.target.value })} /></Field>
            </div>
          </Card>
        </div>
      )}

      {tab === "extras" && (
        <div className="space-y-5">
          <Card title="Announcement bar" hint="a thin strip at the very top of the website">
            <div className="space-y-4">
              <Toggle checked={st.announcement.enabled} onChange={(v) => patch("announcement", { enabled: v })} label={st.announcement.enabled ? "Shown on the website" : "Hidden"} />
              <Field label="Message"><TextInput value={st.announcement.text} onChange={(e) => patch("announcement", { text: e.target.value })} placeholder="Open on Eid — book your table early!" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Link label" hint="Optional"><TextInput value={st.announcement.linkLabel} onChange={(e) => patch("announcement", { linkLabel: e.target.value })} placeholder="Reserve now" /></Field>
                <Field label="Link"><TextInput value={st.announcement.linkUrl} onChange={(e) => patch("announcement", { linkUrl: e.target.value })} placeholder="#reserve" /></Field>
              </div>
              <Toggle checked={st.announcement.dismissible} onChange={(v) => patch("announcement", { dismissible: v })} label="Let visitors close it (✕)" />
            </div>
          </Card>
          <Card title="Floating contact buttons" hint="round buttons at the bottom right">
            <div className="space-y-3">
              <Toggle checked={st.floating.whatsapp} onChange={(v) => patch("floating", { whatsapp: v })} label="WhatsApp chat button (needs the WhatsApp number)" />
              <Toggle checked={st.floating.call} onChange={(v) => patch("floating", { call: v })} label="Call button (needs the phone number)" />
              {st.floating.whatsapp && !st.contact.whatsapp.replace(/\D/g, "") && <p className="text-[11px] text-[#c98a8a]">Add the WhatsApp number in “Contact, hours & social” or the button will not appear.</p>}
              {st.floating.call && !st.contact.phone.trim() && <p className="text-[11px] text-[#c98a8a]">Add the phone number in “Contact, hours & social” or the button will not appear.</p>}
            </div>
          </Card>
        </div>
      )}

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setDraft(snapshot())} />
    </Panel>
  );
}

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const c = [...list];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
}

function SlotEditor({ slots, onChange }: { slots: string[]; onChange: (s: string[]) => void }) {
  const [t, setT] = useState("20:00");
  const sorted = [...slots].sort();
  const add = () => {
    if (!/^\d{2}:\d{2}$/.test(t) || slots.includes(t)) return;
    onChange([...slots, t].sort());
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {sorted.map((s) => (
          <span key={s} className="flex items-center gap-2 rounded-md border border-[#2b251a] px-3 py-1.5 text-[12px] text-[#cfc4ab]">
            {s}
            <button type="button" onClick={() => onChange(slots.filter((x) => x !== s))} aria-label={`Remove ${s}`} className="text-[#c98a8a] hover:underline">✕</button>
          </span>
        ))}
        {sorted.length === 0 && <span className="text-[12px] text-[#c98a8a]">No time slots yet.</span>}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <TextInput type="time" value={t} onChange={(e) => setT(e.target.value)} className="w-36" />
        <button type="button" onClick={add} className="rounded-lg border border-[#3a3226] px-4 py-2.5 text-[12px] text-[#c9a24b] hover:border-[#c9a24b]">+ Add time</button>
        <button type="button" onClick={() => onChange(Array.from({ length: 10 }, (_, i) => `${String(18 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`))} className="ml-auto text-[11px] text-[#8d8270] hover:text-[#c9a24b]">Reset to 18:00 – 22:30</button>
      </div>
    </div>
  );
}
