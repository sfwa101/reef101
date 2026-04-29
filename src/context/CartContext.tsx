import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products";
import { trackBuyAgain } from "@/lib/buyAgain";

/**
 * Optional per-line meta. Used by the sweets section to attach a chosen
 * pickup date/time slot on Type C (pre-order) bookings, but generic enough
 * that other sections can extend it (e.g. kitchen scheduled meals).
 */
export type CartLineMeta = {
  bookingDate?: string;
  bookingSlot?: string;
  bookingNote?: string;
  variantId?: string;
  addonIds?: string[];
  unitPrice?: number;
  payDeposit?: boolean;
  shipMode?: "split" | "wait";
  /** Line kind: regular purchase, library borrow, or print job. */
  kind?: "buy" | "borrow" | "print";
  /** Borrow metadata */
  borrowDuration?: "3d" | "7d" | "14d";
  borrowDays?: number;
  borrowDeposit?: number;
  /** Print metadata */
  printConfig?: {
    pages: number;
    copies: number;
    colorMode: "bw" | "color";
    sided: "single" | "double";
    binding: "none" | "spiral" | "plastic" | "thermal";
    fileName?: string;
    filePath?: string;
  };
  /** Estimated prep time (hours) — used for print jobs */
  prepHours?: number;
};

type CartLine = { product: Product; qty: number; meta?: CartLineMeta };

type CartActions = {
  add: (p: Product, qty?: number, meta?: CartLineMeta) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  updateMeta: (id: string, meta: CartLineMeta) => void;
  clear: () => void;
};

type CartCtxValue = {
  /** Subscribe to the whole lines array. Triggers on any cart change. */
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => CartLine[];
  /** Stable ref of actions. */
  actions: CartActions;
};

const Ctx = createContext<CartCtxValue | null>(null);
const STORAGE_KEY = "reef-cart-v1";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Store lines in a ref so updates do not trigger provider re-renders.
  // Components subscribe via useSyncExternalStore with a selector, so each
  // component only re-renders when its slice of state actually changes.
  const linesRef = useRef<CartLine[]>([]);
  const listenersRef = useRef<Set<() => void>>(new Set());

  const emit = useCallback(() => {
    listenersRef.current.forEach((l) => l());
  }, []);

  const setLines = useCallback(
    (updater: (prev: CartLine[]) => CartLine[]) => {
      linesRef.current = updater(linesRef.current);
      emit();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(linesRef.current));
      } catch {
        /* ignore quota errors */
      }
    },
    [emit],
  );

  // Hydrate from localStorage on mount (client-only — SSR-safe)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        linesRef.current = parsed.filter(
          (l) => l && l.product && typeof l.qty === "number",
        );
        emit();
      }
    } catch {
      /* ignore */
    }
  }, [emit]);

  const actions = useMemo<CartActions>(
    () => ({
      add: (p, qty = 1, meta) => {
        trackBuyAgain(p.id);
        setLines((prev) => {
          const i = prev.findIndex((l) => l.product.id === p.id);
          if (i >= 0) {
            const next = prev.slice();
            next[i] = {
              ...next[i],
              qty: next[i].qty + qty,
              meta: meta ? { ...next[i].meta, ...meta } : next[i].meta,
            };
            return next;
          }
          return [...prev, { product: p, qty, meta }];
        });
      },
      remove: (id) =>
        setLines((prev) => prev.filter((l) => l.product.id !== id)),
      setQty: (id, qty) =>
        setLines((prev) =>
          prev
            .map((l) => (l.product.id === id ? { ...l, qty } : l))
            .filter((l) => l.qty > 0),
        ),
      updateMeta: (id, meta) =>
        setLines((prev) =>
          prev.map((l) =>
            l.product.id === id ? { ...l, meta: { ...l.meta, ...meta } } : l,
          ),
        ),
      clear: () => setLines(() => []),
    }),
    [setLines],
  );

  const value = useMemo<CartCtxValue>(
    () => ({
      subscribe: (cb) => {
        listenersRef.current.add(cb);
        return () => {
          listenersRef.current.delete(cb);
        };
      },
      getSnapshot: () => linesRef.current,
      actions,
    }),
    [actions],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

const useCtx = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("Cart hooks must be used within CartProvider");
  return v;
};

const EMPTY_LINES: CartLine[] = [];
const serverSnapshot = () => EMPTY_LINES;

/**
 * Subscribe to a derived slice of cart state.
 * The component only re-renders when the selected value actually changes
 * (Object.is comparison).
 */
function useCartSelector<T>(selector: (lines: CartLine[]) => T): T {
  const { subscribe, getSnapshot } = useCtx();
  // Cache the last selection so identical objects (e.g. find() returning
  // the same line ref) don't cause spurious updates between snapshots.
  const lastRef = useRef<{ lines: CartLine[]; value: T } | null>(null);
  const getSelected = () => {
    const lines = getSnapshot();
    if (lastRef.current && lastRef.current.lines === lines) {
      return lastRef.current.value;
    }
    const value = selector(lines);
    if (lastRef.current && Object.is(lastRef.current.value, value)) {
      // Keep stable reference so React bails out
      lastRef.current = { lines, value: lastRef.current.value };
      return lastRef.current.value;
    }
    lastRef.current = { lines, value };
    return value;
  };
  return useSyncExternalStore(subscribe, getSelected, serverSnapshot as () => T);
}

/** Full lines array. Use sparingly — re-renders on every cart change. */
export const useCartLines = () => useCartSelector((lines) => lines);

export const useCartCount = () =>
  useCartSelector((lines) => lines.reduce((s, l) => s + l.qty, 0));

export const useCartTotal = () =>
  useCartSelector((lines) =>
    lines.reduce(
      (s, l) => s + l.qty * (l.meta?.unitPrice ?? l.product.price),
      0,
    ),
  );

/** Per-product qty selector — ideal for ProductCard. */
export const useCartLineQty = (productId: string) =>
  useCartSelector(
    (lines) => lines.find((l) => l.product.id === productId)?.qty ?? 0,
  );

/** Stable cart actions. Never causes a re-render. */
export const useCartActions = (): CartActions => useCtx().actions;

/**
 * Backwards-compat hook: returns the same shape as the original useCart().
 * Components that read `lines`, `count`, `total` will re-render on cart changes
 * (same as before). Prefer the granular selectors above for hot paths.
 */
export const useCart = () => {
  const lines = useCartLines();
  const count = useCartCount();
  const total = useCartTotal();
  const actions = useCartActions();
  return { lines, count, total, ...actions };
};
