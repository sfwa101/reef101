// All products are now sourced from the Supabase database.
// This module bootstraps a synchronous in-memory cache from a one-time fetch
// at module load, while also exposing realtime updates via React hooks.
//
// Legacy synchronous helpers (products, getById, bySource, ...) keep working
// for existing callers — they read from the cache that is hydrated on first
// fetch. For reactive UI, prefer the new `useProducts`, `useProduct`, and
// `useProductsBySource` hooks (in src/hooks/useProductsDb.ts).

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProductVariant = {
  id: string;
  label: string;
  priceDelta: number;
};
export type ProductAddon = {
  id: string;
  label: string;
  price: number;
};

export type ProductSource =
  | "supermarket" | "kitchen" | "dairy" | "produce" | "recipes"
  | "pharmacy" | "library" | "wholesale" | "home"
  | "village" | "baskets" | "restaurants" | "meat" | "sweets";

export type Product = {
  id: string;
  name: string;
  brand?: string;
  unit: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating?: number;
  category: string;
  subCategory?: string;
  source: ProductSource;
  badge?: "best" | "trending" | "premium" | "new";
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  perishable?: boolean;
  /** Polymorphic per-source metadata (pharmacy fields, meat prep, etc). */
  metadata?: Record<string, any>;
  /** Long-form description (used on PDP). */
  description?: string;
};

// Normalize a DB row → Product
type DbRow = {
  id: string; name: string; brand: string | null; unit: string;
  price: number; old_price: number | null;
  image: string | null; image_url: string | null;
  rating: number | null; category: string; sub_category: string | null;
  source: string; badge: string | null;
  variants: unknown; addons: unknown;
  perishable: boolean | null; is_active: boolean;
  metadata: unknown; description: string | null;
};

const FALLBACK_IMG =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E";

function rowToProduct(row: DbRow): Product {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand ?? undefined,
    unit: row.unit,
    price: Number(row.price),
    oldPrice: row.old_price != null ? Number(row.old_price) : undefined,
    image: row.image_url || row.image || FALLBACK_IMG,
    rating: row.rating != null ? Number(row.rating) : undefined,
    category: row.category,
    subCategory: row.sub_category ?? undefined,
    source: (row.source as ProductSource) ?? "supermarket",
    badge: (row.badge as Product["badge"]) ?? undefined,
    variants: (row.variants as ProductVariant[] | null) ?? undefined,
    addons: (row.addons as ProductAddon[] | null) ?? undefined,
    perishable: row.perishable ?? undefined,
    metadata: (row.metadata && typeof row.metadata === "object")
      ? (row.metadata as Record<string, any>)
      : undefined,
    description: row.description ?? undefined,
  };
}

// In-memory cache (mutable). Hydrated lazily on first CLIENT-SIDE import.
// IMPORTANT: This cache must NEVER be populated during SSR. The module is
// shared across server requests, so populating it on the server would (a)
// leak data between users and (b) cause hydration mismatches because the
// client always starts empty and only fills after mount.
const cache: Product[] = [];
let hydrated = false;
let hydratePromise: Promise<Product[]> | null = null;
const listeners = new Set<() => void>();

const isBrowser = typeof window !== "undefined";

function notify() {
  for (const fn of listeners) fn();
}

async function fetchAll(): Promise<Product[]> {
  // Hard guard: never fetch from the server runtime — cache is browser-only.
  if (!isBrowser) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id,name,brand,unit,price,old_price,image,image_url,rating,category,sub_category,source,badge,variants,addons,perishable,is_active,metadata,description")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(2000);
  if (error) {
    console.error("[products] fetch failed, using static fallback:", error);
    const { FALLBACK_PRODUCTS } = await import("./products.fallback");
    cache.length = 0;
    cache.push(...FALLBACK_PRODUCTS);
    hydrated = true;
    notify();
    return cache;
  }
  const rows = (data ?? []) as DbRow[];
  // Empty DB also degrades gracefully (e.g. cold seed, RLS blocks read).
  if (rows.length === 0) {
    const { FALLBACK_PRODUCTS } = await import("./products.fallback");
    cache.length = 0;
    cache.push(...FALLBACK_PRODUCTS);
    hydrated = true;
    notify();
    return cache;
  }
  const list = rows.map(rowToProduct);
  cache.length = 0;
  cache.push(...list);
  hydrated = true;
  notify();
  return list;
}

export function ensureProductsLoaded(): Promise<Product[]> {
  if (!isBrowser) return Promise.resolve([]);
  if (hydrated) return Promise.resolve(cache);
  if (!hydratePromise) hydratePromise = fetchAll();
  return hydratePromise;
}

// Kick off hydration eagerly on first import (browser only).
// Also subscribe to realtime changes so any insert/update/delete from the
// admin panel is reflected instantly across all connected clients.
let realtimeStarted = false;
function startRealtime() {
  if (realtimeStarted || typeof window === "undefined") return;
  realtimeStarted = true;
  try {
    supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          // Refetch on any change; cheap enough for a catalog of this size.
          fetchAll().catch((e) => console.error("[products] realtime refetch failed", e));
        },
      )
      .subscribe();
  } catch (e) {
    console.error("[products] realtime subscribe failed", e);
  }
}

if (typeof window !== "undefined") {
  ensureProductsLoaded();
  startRealtime();

  // Refetch when the tab becomes visible again (covers cases where realtime
  // socket was paused while backgrounded) and when network is restored.
  const refresh = () => {
    fetchAll().catch((e) => console.error("[products] visibility refetch failed", e));
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refresh();
  });
  window.addEventListener("focus", refresh);
  window.addEventListener("online", refresh);
}

/** Synchronous snapshot — empty until hydration completes. */
export const products: Product[] = cache;

// Dynamically-registered products (e.g. wholesale variants).
const extraProducts: Product[] = [];
export const registerProducts = (items: Product[]) => {
  for (const item of items) {
    if (!extraProducts.some((p) => p.id === item.id) && !cache.some((p) => p.id === item.id)) {
      extraProducts.push(item);
    }
  }
};

export const getById = (id: string) =>
  cache.find((p) => p.id === id) ?? extraProducts.find((p) => p.id === id);

export const byBadge = (badge: Product["badge"]) =>
  cache.filter((p) => p.badge === badge);

export const bySource = (source: Product["source"]) =>
  cache.filter((p) => p.source === source);

export const bySourceAndCategory = (source: Product["source"], category: string) =>
  cache.filter((p) => p.source === source && p.category === category);

/* ============ Perishability ============ */
const PERISHABLE_SOURCES: Product["source"][] = [
  "produce", "dairy", "meat", "kitchen", "recipes", "restaurants", "baskets",
];

export const isPerishable = (p: Product): boolean => {
  if (typeof p.perishable === "boolean") return p.perishable;
  if (PERISHABLE_SOURCES.includes(p.source)) return true;
  if (p.category === "المجمدات") return true;
  if (p.source === "sweets" && (p.subCategory === "تورتات" || p.subCategory === "مثلجات")) return true;
  return false;
};

export const productAvailableInZone = (
  p: Product,
  zoneAcceptsPerishables: boolean,
): boolean => zoneAcceptsPerishables || !isPerishable(p);

/* ============ React hooks ============
 * Reactive views over the same in-memory cache. Re-render when the cache is
 * (re)hydrated or when realtime changes are pushed via subscribeProducts().
 */
export function useProducts(): { products: Product[]; loading: boolean } {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    ensureProductsLoaded();
    return () => { listeners.delete(fn); };
  }, []);
  return { products: cache, loading: !hydrated };
}

export function useProduct(id: string | undefined): Product | undefined {
  const { products: all } = useProducts();
  if (!id) return undefined;
  return all.find((p) => p.id === id) ?? extraProducts.find((p) => p.id === id);
}

export function useProductsBySource(source: ProductSource): Product[] {
  const { products: all } = useProducts();
  return all.filter((p) => p.source === source);
}

/** Force a refetch (admin panel calls this after mutations). */
export async function refetchProducts(): Promise<void> {
  hydratePromise = fetchAll();
  await hydratePromise;
}

/**
 * Lightweight subscription that returns an incrementing version each time the
 * products cache is refreshed (initial hydration + realtime updates + manual
 * refetches). Components that read the synchronous `products` snapshot can
 * call this to re-render whenever data changes, without restructuring to use
 * `useProducts()`.
 */
export function useProductsVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const fn = () => setVersion((v) => v + 1);
    listeners.add(fn);
    ensureProductsLoaded();
    return () => { listeners.delete(fn); };
  }, []);
  return version;
}
