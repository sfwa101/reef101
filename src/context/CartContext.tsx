import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/products";

/**
 * Optional per-line meta. Used by the sweets section to attach a chosen
 * pickup date/time slot on Type C (pre-order) bookings, but generic enough
 * that other sections can extend it (e.g. kitchen scheduled meals).
 */
export type CartLineMeta = {
  /** ISO date (YYYY-MM-DD) chosen for pickup/delivery */
  bookingDate?: string;
  /** Slot id from sweetsFulfillment.bookingTimeSlots */
  bookingSlot?: string;
  /** Free-form note kept on the line (e.g. "اكتب اسم العميل على التورتة") */
  bookingNote?: string;
  /** Selected variant id (e.g. small/medium/large) */
  variantId?: string;
  /** Selected add-on ids */
  addonIds?: string[];
  /** Final unit price after variant + addons (overrides product.price for totals if set) */
  unitPrice?: number;
  /** Pay 50% deposit now for this booking line (Type C only) */
  payDeposit?: boolean;
  /**
   * Shipment preference for booking lines:
   *  - "split" → instant items now, booking later (default)
   *  - "wait"  → hold all items and deliver together on booking date
   */
  shipMode?: "split" | "wait";
};

type CartLine = { product: Product; qty: number; meta?: CartLineMeta };

type CartCtx = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (p: Product, qty?: number, meta?: CartLineMeta) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  updateMeta: (id: string, meta: CartLineMeta) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "reef-cart-v1";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>([]);

  // Hydrate from localStorage on mount (client-only — SSR-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLines(parsed.filter((l) => l && l.product && typeof l.qty === "number"));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota errors */
    }
  }, [lines]);

  const add = useCallback((p: Product, qty = 1, meta?: CartLineMeta) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = {
          ...next[i],
          qty: next[i].qty + qty,
          // Latest booking meta wins so the user can update their slot
          meta: meta ? { ...next[i].meta, ...meta } : next[i].meta,
        };
        return next;
      }
      return [...prev, { product: p, qty, meta }];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, qty } : l))
        .filter((l) => l.qty > 0)
    );
  }, []);

  const updateMeta = useCallback((id: string, meta: CartLineMeta) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === id ? { ...l, meta: { ...l.meta, ...meta } } : l,
      ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = lines.reduce(
      (s, l) => s + l.qty * (l.meta?.unitPrice ?? l.product.price),
      0,
    );
    return { lines, count, total, add, remove, setQty, updateMeta, clear };
  }, [lines, add, remove, setQty, updateMeta, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCart = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
};