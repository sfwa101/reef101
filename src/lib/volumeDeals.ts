import type { Product } from "./products";

export type VolumeDeal = { buy: number; save: number };

const ALLOW: Record<string, VolumeDeal> = {
  water: { buy: 6, save: 18 },
  diapers: { buy: 3, save: 45 },
  shampoo: { buy: 2, save: 20 },
  cookies: { buy: 3, save: 15 },
  juice: { buy: 3, save: 18 },
  pasta: { buy: 4, save: 16 },
  rice: { buy: 2, save: 35 },
  cereal: { buy: 2, save: 25 },
};

export const volumeDealFor = (p: Product): VolumeDeal | null => {
  if (ALLOW[p.id]) return ALLOW[p.id];
  const sub = p.subCategory ?? "";
  if (["مياه", "مناديل", "حفاضات"].some((k) => sub.includes(k))) {
    return { buy: 3, save: 15 };
  }
  return null;
};

export const productsWithVolumeDeals = (pool: Product[]): Product[] =>
  pool.filter((p) => volumeDealFor(p) !== null).slice(0, 10);
