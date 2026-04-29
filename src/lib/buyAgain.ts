import { products, type Product } from "./products";

const KEY = "reef-buy-again-v1";
const MAX = 30;

/** Record product ids the user has interacted with (added to cart / ordered). */
export const trackBuyAgain = (id: string) => {
  if (typeof localStorage === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...arr.filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

export const readBuyAgainIds = (): string[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

/** Resolve to actual products, optionally filtered by a pool. */
export const buyAgainProducts = (pool?: Product[], limit = 10): Product[] => {
  const ids = readBuyAgainIds();
  if (ids.length === 0) return [];
  const map = new Map((pool ?? products).map((p) => [p.id, p] as const));
  const out: Product[] = [];
  for (const id of ids) {
    const p = map.get(id);
    if (p) out.push(p);
    if (out.length >= limit) break;
  }
  return out;
};