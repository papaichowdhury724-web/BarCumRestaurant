/* Small helpers for links/embeds typed by the admin. */

/** Make an admin-typed link safe + usable: "#menu", "/x", "https://…", "tel:…", "mailto:…".
    "instagram.com/x" becomes "https://instagram.com/x"; anything unsafe (javascript:) becomes "#". */
export function safeUrl(raw: string | undefined | null): string {
  const u = (raw ?? "").trim();
  if (!u) return "#";
  if (u.startsWith("#") || u.startsWith("/")) return u;
  if (/^(https?:|tel:|mailto:|sms:|whatsapp:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return "#"; // javascript:, data:, … are not allowed
  if (/^[^\s/]+\.[^\s/]+/.test(u)) return "https://" + u;
  return "#";
}

export const isExternal = (u: string) => /^https?:\/\//i.test(u);

/** Phone number → value usable in tel: links. */
export const telHref = (phone: string | undefined) => "tel:" + (phone ?? "").replace(/[^\d+]/g, "");

/** Accepts a Google Maps embed link or the whole <iframe …> code and returns a safe src (or ""). */
export function mapEmbedSrc(raw: string | undefined): string {
  let v = (raw ?? "").trim();
  if (!v) return "";
  const m = /src\s*=\s*["']([^"']+)["']/i.exec(v);
  if (m) v = m[1];
  v = v.replace(/&amp;/g, "&");
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(v) ? v : "";
}

/** YouTube / Vimeo page link → embeddable iframe src (or ""). */
export function videoEmbedSrc(raw: string | undefined): string {
  const v = (raw ?? "").trim();
  let m = /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/i.exec(v);
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`;
  m = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(v);
  if (m) return `https://player.vimeo.com/video/${m[1]}`;
  return "";
}
