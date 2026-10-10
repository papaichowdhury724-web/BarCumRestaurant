"use client";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ---------------- toast ---------------- */

const ToastCtx = createContext<(msg: string, ok?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; ok: boolean }[]>([]);
  const push = useCallback((msg: string, ok = true) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[99] flex -translate-x-1/2 flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="rounded-lg px-5 py-3 text-[13px] shadow-2xl"
              style={{
                background: "#171310",
                border: `1px solid ${t.ok ? "rgba(201,162,75,.5)" : "rgba(220,90,90,.5)"}`,
                color: "#ede5d3",
              }}
            >
              <span className="mr-2">{t.ok ? "✦" : "!"}</span>
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- layout bits ---------------- */

export function Panel({ title, desc, children, actions }: { title: string; desc?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-d text-3xl text-[#ede5d3]">{title}</h1>
          {desc && <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-[#8d8270]">{desc}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, hint, children, className = "", pad = true }: { title?: string; hint?: string; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <div className={`min-w-0 rounded-xl border border-[#26211a] bg-[#131009] ${className}`}>
      {title && (
        <div className="flex items-baseline justify-between gap-3 border-b border-[#26211a] px-5 py-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c9a24b]">{title}</span>
          {hint && <span className="text-[11px] text-[#6f6653]">{hint}</span>}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </div>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-[#8d8270]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[#5f5745]">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`a-in font-b ${props.className ?? ""}`} />;
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`a-in font-b ${props.className ?? ""}`} />;
}
export function Select({ options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { v: string; l: string }[] }) {
  return (
    <select {...props} className={`a-in font-b ${props.className ?? ""}`}>
      {options.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="group flex items-center gap-2.5">
      <span
        className="relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-300"
        style={{ background: checked ? "#c9a24b" : "#2b251a", border: "1px solid #3a3226" }}
      >
        <span
          className="absolute h-[15px] w-[15px] rounded-full bg-[#0e0c09] transition-all duration-300"
          style={{ left: checked ? 20 : 3, background: checked ? "#0e0c09" : "#8d8270" }}
        />
      </span>
      {label && <span className="text-[12px] text-[#cfc4ab]">{label}</span>}
    </button>
  );
}

export function Range({
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 appearance-none rounded-full"
        style={{
          background: `linear-gradient(to right, #c9a24b ${((value - min) / (max - min)) * 100}%, #2b251a ${((value - min) / (max - min)) * 100}%)`,
        }}
      />
      <span className="w-14 text-right text-[12px] tabular-nums text-[#cfc4ab]">{format ? format(value) : value}</span>
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="a-in" title={label} />
      <div className="flex-1">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#8d8270]">{label}</div>
        <input className="a-in w-full font-mono text-[12px]" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

/* ---------------- media field (URL or file) ---------------- */

export function MediaField({
  label,
  value,
  onChange,
  video = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  video?: boolean;
  hint?: string;
}) {
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const big = value.startsWith("data:") && value.length > 900_000;

  const onFile = (f: File) => {
    setBusy(true);
    const r = new FileReader();
    r.onload = () => {
      onChange(String(r.result));
      setBusy(false);
    };
    r.onerror = () => setBusy(false);
    r.readAsDataURL(f);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8d8270]">{label}</span>
        <div className="flex overflow-hidden rounded-md border border-[#2b251a]">
          {(["url", "upload"] as const).map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className="px-2.5 py-1 text-[10px] uppercase tracking-[0.12em]"
              style={{ background: tab === tb ? "#c9a24b" : "transparent", color: tab === tb ? "#0e0c09" : "#8d8270" }}
            >
              {tb === "url" ? "Use URL" : "Choose file"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 space-y-2">
          {tab === "url" ? (
            <TextInput
              placeholder={video ? "https://…/video.mp4" : "https://…/image.jpg"}
              value={value.startsWith("data:") ? "" : value}
              onChange={(e) => onChange(e.target.value)}
            />
          ) : (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept={video ? "video/*" : "image/*"}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
              <button type="button" onClick={() => fileRef.current?.click()} className="a-in w-full text-center text-[#cfc4ab] hover:border-[#c9a24b]">
                {busy ? "Reading file…" : video ? "Choose video file" : "Choose image file"}
              </button>
              {value.startsWith("data:") && (
                <button type="button" onClick={() => onChange("")} className="mt-1.5 text-[11px] text-[#c98a8a] underline">
                  Remove uploaded file
                </button>
              )}
            </div>
          )}
          {hint && <p className="text-[11px] leading-relaxed text-[#5f5745]">{hint}</p>}
          {big && (
            <p className="text-[11px] leading-relaxed text-[#c98a8a]">
              This file is large. Firestore documents are capped at 1 MB — prefer a Firebase Storage URL for production.
            </p>
          )}
        </div>
        <div className="h-[74px] w-[104px] shrink-0 overflow-hidden rounded-md border border-[#2b251a] bg-black/40">
          {value ? (
            video ? (
              <video src={value} className="h-full w-full object-cover" muted />
            ) : (
              <img src={value} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-[#4c463a]">preview</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- move / remove rows ---------------- */

export function RowBtns({
  onUp,
  onDown,
  onDel,
  disabledUp,
  disabledDown,
}: {
  onUp?: () => void;
  onDown?: () => void;
  onDel?: () => void;
  disabledUp?: boolean;
  disabledDown?: boolean;
}) {
  const b = "flex h-7 w-7 items-center justify-center rounded-md border border-[#2b251a] text-[#8d8270] transition-colors hover:border-[#c9a24b] hover:text-[#c9a24b] disabled:opacity-30 disabled:hover:border-[#2b251a] disabled:hover:text-[#8d8270]";
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={b} disabled={disabledUp} onClick={onUp} aria-label="Move up">
        ↑
      </button>
      <button type="button" className={b} disabled={disabledDown} onClick={onDown} aria-label="Move down">
        ↓
      </button>
      <button
        type="button"
        className={`${b} hover:border-[#c98a8a] hover:text-[#c98a8a]`}
        onClick={onDel}
        aria-label="Remove"
      >
        ✕
      </button>
    </div>
  );
}

export function AddBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-dashed border-[#3a3226] py-3 text-[12px] uppercase tracking-[0.2em] text-[#8d8270] transition-colors hover:border-[#c9a24b] hover:text-[#c9a24b]"
    >
      + {children}
    </button>
  );
}

/* ---------------- save bar ---------------- */

export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset?: () => void;
}) {
  return (
    <div
      className="sticky bottom-0 z-40 mt-8 flex items-center justify-between gap-4 rounded-xl border px-5 py-4 backdrop-blur-md"
      style={{ background: "rgba(14,12,9,.85)", borderColor: dirty ? "rgba(201,162,75,.55)" : "#26211a" }}
    >
      <span className="text-[12px] text-[#8d8270]">
        {dirty ? (
          <span className="text-[#c9a24b]">● Unsaved changes — save to push them live</span>
        ) : (
          <span>✓ Everything is live on the website</span>
        )}
      </span>
      <div className="flex gap-2">
        {onReset && dirty && (
          <button onClick={onReset} className="rounded-lg border border-[#2b251a] px-4 py-2.5 text-[12px] text-[#cfc4ab] hover:border-[#c98a8a]">
            Discard
          </button>
        )}
        <button
          onClick={onSave}
          disabled={!dirty || saving}
          className="rounded-lg px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.18em] transition-all disabled:opacity-40"
          style={{ background: "#c9a24b", color: "#0e0c09" }}
        >
          {saving ? "Saving…" : "Save & publish"}
        </button>
      </div>
    </div>
  );
}
