import type { Coupon } from "./types";

/** Today as yyyy-mm-dd in the visitor's own timezone. */
export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A coupon is valid through the end of its "expires" day. */
export const isExpired = (c: Coupon, today = todayStr()) => !!c.expires && c.expires < today;

export const isLive = (c: Coupon, today = todayStr()) => c.active && !isExpired(c, today);

export function findCoupon(coupons: Coupon[], code: string): Coupon | undefined {
  const k = code.trim().toUpperCase();
  return k ? coupons.find((c) => c.code.trim().toUpperCase() === k && isLive(c)) : undefined;
}
