import type { CurrencyConfig, SiteConfig } from "./types";

export const DEFAULT_CURRENCY: CurrencyConfig = { symbol: "₹", position: "before", locale: "en-IN" };

export const CURRENCY_PRESETS: { label: string; c: CurrencyConfig }[] = [
  { label: "₹ Indian Rupee", c: { symbol: "₹", position: "before", locale: "en-IN" } },
  { label: "$ US Dollar", c: { symbol: "$", position: "before", locale: "en-US" } },
  { label: "£ British Pound", c: { symbol: "£", position: "before", locale: "en-GB" } },
  { label: "€ Euro", c: { symbol: "€", position: "after", locale: "de-DE" } },
];

export const getCurrency = (cfg: SiteConfig): CurrencyConfig => ({ ...DEFAULT_CURRENCY, ...(cfg.currency ?? {}) });

/** Format a money amount with the configured symbol + digit grouping. */
export function money(c: CurrencyConfig, amount: number | string): string {
  const n = typeof amount === "number" ? amount : Number(String(amount).replace(/[^0-9.]/g, ""));
  const body = typeof amount === "string" && Number.isNaN(n) ? amount : n.toLocaleString(c.locale);
  return c.position === "after" ? `${body} ${c.symbol}` : `${c.symbol}${body}`;
}

/** For menu prices already typed by the admin (e.g. "1,200") — keep text as typed, just add the symbol. */
export function moneyText(c: CurrencyConfig, text: string): string {
  return c.position === "after" ? `${text} ${c.symbol}` : `${c.symbol}${text}`;
}
