/* Maps font family names (loaded in src/app/layout.tsx via next/font)
   to the CSS variables they expose on <html>. */

const DISPLAY_VARS: Record<string, string> = {
  "Playfair Display": "--fd-playfair",
  "Cormorant Garamond": "--fd-cormorant",
  Marcellus: "--fd-marcellus",
  Cinzel: "--fd-cinzel",
  "Bodoni Moda": "--fd-bodoni",
  "DM Serif Display": "--fd-dmserif",
  Italiana: "--fd-italiana",
};

const BODY_VARS: Record<string, string> = {
  Jost: "--fb-jost",
  Manrope: "--fb-manrope",
  Lato: "--fb-lato",
  "Nunito Sans": "--fb-nunito",
  Montserrat: "--fb-monts",
  Spectral: "--fb-spectral",
};

export function fontVar(name: string, kind: "display" | "body" = "display"): string {
  const map = kind === "display" ? DISPLAY_VARS : BODY_VARS;
  return map[name] || (kind === "display" ? DISPLAY_VARS["Playfair Display"] : BODY_VARS.Jost);
}
