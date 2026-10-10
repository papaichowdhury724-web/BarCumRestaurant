"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { login, logout, resetPassword, useAuth, useDB } from "@/lib/store";
import { BookingsPanel, MenuPanel, OffersPanel, SectionsPanel } from "./panels/ContentPanels";
import { AnimationsPanel, DashboardPanel, FooterPanel, HeaderPanel, ThemePanel } from "./panels/DesignPanels";
import { SettingsPanel } from "./panels/SettingsPanel";
import { TextInput, ToastProvider, useToast } from "./ui";

type PanelKey = "dashboard" | "settings" | "sections" | "menu" | "offers" | "bookings" | "header" | "footer" | "theme" | "animations";

const NAV: { k: PanelKey; l: string; ic: string }[] = [
  { k: "dashboard", l: "Dashboard", ic: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z" },
  { k: "settings", l: "Restaurant Settings", ic: "M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" },
  { k: "sections", l: "Sections", ic: "M4 5h16v4H4V5Zm0 6h16v4H4v-4Zm0 6h16v2H4v-2Z" },
  { k: "menu", l: "Menu", ic: "M7 3v8M5 3v8M9 3v8M7 11v10m7-18c2 0 3 2 3 5s-1 5-3 5-3-2-3-5 1-5 3-5Zm0 10v10" },
  { k: "offers", l: "Offers & Coupons", ic: "M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Zm10-2v12" },
  { k: "bookings", l: "Bookings", ic: "M8 3v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" },
  { k: "header", l: "Header", ic: "M4 5h16v5H4V5Zm0 7h16v7H4v-7Z" },
  { k: "footer", l: "Footer", ic: "M4 12h16v7H4v-7Zm2-8h12v3H6V4Z" },
  { k: "theme", l: "Theme & Fonts", ic: "M12 3a9 9 0 1 0 9 9h-9V3Zm7.5 2.5L14 14" },
  { k: "animations", l: "Animations", ic: "M5 12c2-6 4 6 7 0s5 0 7 0" },
];

export default function AdminApp() {
  return (
    <ToastProvider>
      <Inner />
    </ToastProvider>
  );
}

function Inner() {
  const db = useDB();
  const { authed, email, ready } = useAuth();
  const [panel, setPanelRaw] = useState<PanelKey>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const skipGuard = useRef(false);

  const go = (k: PanelKey) => {
    skipGuard.current = true;
    setPanelRaw(k);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setTimeout(() => (skipGuard.current = false), 500);
  };

  /* Admin: no smooth-scroll, and never let an edit throw the page back to the top */
  useEffect(() => {
    document.documentElement.classList.add("admin-mode");
    let lastY = window.scrollY;
    let busy = false;
    const onScroll = () => {
      if (!busy) lastY = window.scrollY;
    };
    const guard = () => {
      if (skipGuard.current) return;
      const y = lastY;
      busy = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!skipGuard.current && y > 120 && window.scrollY < y - 120) {
            window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
          }
          busy = false;
        })
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("input", guard, true);
    document.addEventListener("change", guard, true);
    document.addEventListener("click", guard, true);
    return () => {
      document.documentElement.classList.remove("admin-mode");
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("input", guard, true);
      document.removeEventListener("change", guard, true);
      document.removeEventListener("click", guard, true);
    };
  }, []);

  if (!db || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0c09]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#2b251a] border-t-[#c9a24b]" />
      </div>
    );
  }
  if (!authed) return <Login name={db.config.siteName} />;

  return (
    <div className="flex min-h-screen bg-[#0e0c09] font-b text-[#ede5d3]">
      {/* sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[60] flex w-[248px] flex-col border-r border-[#211c14] bg-[#100e0a] transition-transform duration-300 lg:translate-x-0 ${navOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="border-b border-[#211c14] px-6 py-6">
          <div className="font-d text-xl tracking-[0.2em] text-[#c9a24b]">{db.config.siteName}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.4em] text-[#6f6653]">Admin Console</div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((n) => (
            <button
              key={n.k}
              onClick={() => go(n.k)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors"
              style={{
                background: panel === n.k ? "rgba(201,162,75,.12)" : "transparent",
                color: panel === n.k ? "#c9a24b" : "#9a8f7a",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.ic} />
              </svg>
              {n.l}
            </button>
          ))}
        </nav>
        <div className="space-y-2 border-t border-[#211c14] p-4">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg px-3 py-2 text-center text-[12px] uppercase tracking-[0.2em] transition-colors"
            style={{ border: "1px solid #2b251a", color: "#cfc4ab" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.borderColor = "#c9a24b")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.borderColor = "#2b251a")}
          >
            ↗ Open website
          </a>
          <div className="truncate px-1 text-[11px] text-[#6f6653]">{email}</div>
          <button onClick={() => void logout()} className="w-full rounded-lg border border-[#2b251a] py-2 text-[11px] uppercase tracking-[0.2em] text-[#9a8f7a] hover:border-[#c98a8a] hover:text-[#c98a8a]">
            Log out
          </button>
        </div>
      </aside>

      {/* mobile: dim overlay + top bar with menu button (sidebar stays vertical) */}
      {navOpen && <div className="fixed inset-0 z-[55] bg-black/60 lg:hidden" onClick={() => setNavOpen(false)} />}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-[#211c14] bg-[#100e0a]/95 px-4 py-3 backdrop-blur lg:hidden">
        <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-md border border-[#2b251a]">
          <span className="h-px w-4 bg-[#c9a24b]" />
          <span className="h-px w-4 bg-[#c9a24b]" />
          <span className="h-px w-4 bg-[#c9a24b]" />
        </button>
        <span className="font-d text-[15px] tracking-[0.15em] text-[#c9a24b]">{db.config.siteName}</span>
        <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[#8d8270]">{NAV.find((n) => n.k === panel)?.l}</span>
      </div>

      <main className="min-w-0 flex-1 px-4 pb-16 pt-20 md:px-8 lg:ml-[248px] lg:pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={panel}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          >
            {panel === "dashboard" && <DashboardPanel db={db} onGo={(k) => go(k as PanelKey)} />}
            {panel === "settings" && <SettingsPanel db={db} />}
            {panel === "sections" && <SectionsPanel db={db} key={"sec" + db.config.sections.length} />}
            {panel === "menu" && <MenuPanel db={db} key={"menu" + db.menu.length} />}
            {panel === "offers" && <OffersPanel db={db} key={"off" + db.coupons.length} />}
            {panel === "bookings" && <BookingsPanel db={db} />}
            {panel === "header" && <HeaderPanel db={db} />}
            {panel === "footer" && <FooterPanel db={db} />}
            {panel === "theme" && <ThemePanel db={db} />}
            {panel === "animations" && <AnimationsPanel db={db} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ---------------- login ---------------- */

function Login({ name }: { name: string }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await login(email, pass);
      toast("Welcome back — the house is yours");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0908] px-6 font-b">
      <div className="noise" />
      <div className="absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #c9a24b, transparent 70%)" }} />
      <div className="absolute -right-40 bottom-1/4 h-[380px] w-[380px] rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #c9a24b, transparent 70%)" }} />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }} className="relative w-full max-w-[400px]">
        <div className="mb-10 text-center">
          <div className="font-d text-4xl tracking-[0.25em] text-[#ede5d3]">{name}</div>
          <div className="mt-3 text-[10px] uppercase tracking-[0.5em] text-[#c9a24b]">Admin Console</div>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#26211a] bg-[#131009]/90 p-8 backdrop-blur">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[#8d8270]">Email</label>
            <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" autoComplete="email" className="!py-3" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[#8d8270]">Password</label>
            <TextInput type="password" required value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="!py-3" />
          </div>
          {err && <p className="text-[12px] text-[#c98a8a]">{err}</p>}
          <button
            disabled={busy}
            className="w-full rounded-lg py-3.5 text-[12px] font-semibold uppercase tracking-[0.3em] transition-all disabled:opacity-50"
            style={{ background: "#c9a24b", color: "#0e0c09" }}
          >
            {busy ? "Signing in…" : "Enter the house"}
          </button>
          <button
            type="button"
            onClick={async () => {
              setErr("");
              if (!email.trim()) return setErr("Type your email above first, then press “Forgot password”.");
              try {
                await resetPassword(email);
                toast("Password reset email sent — check your inbox");
              } catch (ex) {
                setErr(ex instanceof Error ? ex.message : "Could not send reset email");
              }
            }}
            className="block w-full text-center text-[11px] text-[#8d8270] hover:text-[#c9a24b]"
          >
            Forgot password?
          </button>
        </form>
        <a href="/" className="mt-6 block text-center text-[11px] uppercase tracking-[0.3em] text-[#6f6653] hover:text-[#c9a24b]">
          ← Back to website
        </a>
      </motion.div>
    </div>
  );
}
