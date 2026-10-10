import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Cormorant_Garamond, Marcellus, Cinzel, Bodoni_Moda, DM_Serif_Display, Italiana } from "next/font/google";
import { Jost, Manrope, Lato, Nunito_Sans, Montserrat, Spectral } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", variable: "--fd-playfair" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], preload: false, display: "swap", variable: "--fd-cormorant" });
const marcellus = Marcellus({ subsets: ["latin"], preload: false, display: "swap", weight: "400", variable: "--fd-marcellus" });
const cinzel = Cinzel({ subsets: ["latin"], preload: false, display: "swap", variable: "--fd-cinzel" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], preload: false, display: "swap", variable: "--fd-bodoni" });
const dmserif = DM_Serif_Display({ subsets: ["latin"], preload: false, display: "swap", weight: "400", variable: "--fd-dmserif" });
const italiana = Italiana({ subsets: ["latin"], preload: false, display: "swap", weight: "400", variable: "--fd-italiana" });

const jost = Jost({ subsets: ["latin"], display: "swap", variable: "--fb-jost" });
const manrope = Manrope({ subsets: ["latin"], preload: false, display: "swap", variable: "--fb-manrope" });
const lato = Lato({ subsets: ["latin"], preload: false, display: "swap", weight: ["400", "700"], variable: "--fb-lato" });
const nunito = Nunito_Sans({ subsets: ["latin"], preload: false, display: "swap", variable: "--fb-nunito" });
const monts = Montserrat({ subsets: ["latin"], preload: false, display: "swap", variable: "--fb-monts" });
const spectral = Spectral({ subsets: ["latin"], preload: false, display: "swap", weight: ["300", "400", "600"], variable: "--fb-spectral" });

const fontClasses = [
  playfair.variable,
  cormorant.variable,
  marcellus.variable,
  cinzel.variable,
  bodoni.variable,
  dmserif.variable,
  italiana.variable,
  jost.variable,
  manrope.variable,
  lato.variable,
  nunito.variable,
  monts.variable,
  spectral.variable,
].join(" ");

export const metadata: Metadata = {
  title: "LUMIÈRE — Cinematic Fine Dining",
  description:
    "Explore the menu, offers and reserve your table.",
};

export const viewport: Viewport = {
  themeColor: "#0b0a08",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontClasses} style={{ background: "#0b0a08" }}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
