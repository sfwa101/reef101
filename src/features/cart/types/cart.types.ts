import type { Product } from "@/lib/products";
import type { CartLineMeta } from "@/context/CartContext";
import type { VendorKey } from "@/lib/restaurants";

export type Addr = {
  id: string;
  label: string;
  city: string;
  district: string | null;
  street: string | null;
  building: string | null;
  is_default: boolean;
};

export type CartLine = { product: Product; qty: number; meta?: CartLineMeta };

export type VendorGroup = {
  key: string;
  vendor: VendorKey;
  lines: CartLine[];
  subtotal: number;
  cashback: number;
};

export type SweetsBucket = {
  type: "A" | "B" | "C";
  lines: { product: Product; qty: number; meta?: { date?: string; slot?: string; note?: string } }[];
  subtotal: number;
};

export type AppliedPromo = { code: string; pct: number } | null;

/** Identifiers must match the existing paymentOptions list verbatim. */
export type PaymentId = "wallet" | "cash" | "vodafone-cash" | "instapay";

export const WA_NUMBER = "201080068689";
export const HOME_PRODUCERS_WA = "201080068690";
export const GIFT_BONUS = 200;
