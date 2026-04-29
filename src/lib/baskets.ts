/**
 * Smart Baskets engine
 * --------------------
 * - Defines the contents of each prebuilt basket (id → product+qty).
 * - Smart Swap rules (hybrid):
 *     1) per-product overrides (most accurate)
 *     2) fall-back to subCategory/source-based logical alternatives
 * - Subscription tier discounts.
 * - Profile-based recommendation (household_size).
 * - Persistent state for: customizations, build-your-own-box, subscriptions —
 *   stored in localStorage with versioned keys so we can migrate to Lovable
 *   Cloud later without losing UX.
 */

import { products, type Product } from "./products";

/* ===== Basket contents ===== */

export type BasketItem = { productId: string; qty: number };

export const basketContents: Record<string, BasketItem[]> = {
  "basket-week": [
    { productId: "tomato", qty: 2 },
    { productId: "cucumber", qty: 1 },
    { productId: "banana", qty: 2 },
    { productId: "apple", qty: 1 },
    { productId: "milk", qty: 2 },
    { productId: "eggs", qty: 1 },
    { productId: "cheese", qty: 1 },
    { productId: "bread", qty: 2 },
    { productId: "rice", qty: 1 },
    { productId: "pasta", qty: 1 },
    { productId: "juice", qty: 1 },
    { productId: "oil", qty: 1 },
  ],
  "basket-fruit": [
    { productId: "banana", qty: 2 },
    { productId: "apple", qty: 2 },
    { productId: "orange", qty: 2 },
    { productId: "strawberry", qty: 1 },
  ],
  "basket-veg": [
    { productId: "tomato", qty: 2 },
    { productId: "cucumber", qty: 2 },
    { productId: "lettuce", qty: 2 },
  ],
  "basket-breakfast": [
    { productId: "milk", qty: 1 },
    { productId: "eggs", qty: 1 },
    { productId: "cheese", qty: 1 },
    { productId: "butter", qty: 1 },
    { productId: "honey", qty: 1 },
    { productId: "bread", qty: 1 },
  ],
  "basket-bbq": [
    { productId: "beef", qty: 1 },
    { productId: "chicken-raw", qty: 1 },
    { productId: "oil", qty: 1 },
  ],
};

/* ===== Marketing meta (scarcity + social proof) — deterministic by id ===== */

export type BasketMarketing = {
  badge: string;
  badgeTone: "amber" | "emerald" | "rose" | "violet";
  soldThisWeek: number;
  remaining: number;
  recommendedFor?: { minHousehold?: number; maxHousehold?: number; reason: string };
};

export const basketMarketing: Record<string, BasketMarketing> = {
  "basket-week": {
    badge: "الأكثر طلبًا للعائلات",
    badgeTone: "amber",
    soldThisWeek: 184,
    remaining: 7,
    recommendedFor: { minHousehold: 4, reason: "تكفي عائلة من 4 أفراد لأسبوع كامل" },
  },
  "basket-fruit": {
    badge: "صحية ومتنوعة",
    badgeTone: "emerald",
    soldThisWeek: 98,
    remaining: 14,
  },
  "basket-veg": {
    badge: "طازج اليوم",
    badgeTone: "emerald",
    soldThisWeek: 76,
    remaining: 21,
  },
  "basket-breakfast": {
    badge: "بداية يوم مثالية",
    badgeTone: "amber",
    soldThisWeek: 142,
    remaining: 9,
    recommendedFor: { maxHousehold: 3, reason: "إفطار مثالي لشخصين أو ثلاثة" },
  },
  "basket-bbq": {
    badge: "للعزائم والمناسبات",
    badgeTone: "rose",
    soldThisWeek: 31,
    remaining: 4,
    recommendedFor: { minHousehold: 5, reason: "تكفي مجموعة كبيرة" },
  },
};

/* ===== Smart Swap rules (hybrid) ===== */

/**
 * Per-product alternative ids (highest priority).
 * Use this when the obvious replacement is a different SKU/variant of the
 * same product (e.g. orange → mandarin) rather than any item in the same
 * subCategory.
 */
export const productSwapOverrides: Record<string, string[]> = {
  orange:      ["apple", "strawberry", "banana"],
  apple:       ["banana", "orange", "strawberry"],
  banana:      ["apple", "orange", "strawberry"],
  strawberry:  ["apple", "orange", "banana"],
  tomato:      ["cucumber", "lettuce"],
  cucumber:    ["tomato", "lettuce"],
  lettuce:     ["cucumber", "tomato"],
  milk:        ["yogurt", "cheese"],
  cheese:      ["yogurt", "butter", "village-cheese"],
  yogurt:      ["milk", "cheese"],
  butter:      ["ghee", "cheese"],
  eggs:        ["village-eggs", "cheese"],
  bread:       ["cookies", "cereal"],
  rice:        ["pasta"],
  pasta:       ["rice"],
  oil:         ["butter", "ghee"],
  juice:       ["water", "coffee"],
  beef:        ["chicken-raw"],
  "chicken-raw": ["beef"],
  honey:       ["molasses", "butter"],
};

/** Find logical swap candidates for a product. Returns up to 4 products. */
export const swapsFor = (productId: string): Product[] => {
  const src = products.find((p) => p.id === productId);
  if (!src) return [];

  // 1) explicit overrides first
  const explicit = (productSwapOverrides[productId] ?? [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  // 2) fall back to same subCategory in same source
  const fallback = products.filter(
    (p) =>
      p.id !== productId &&
      p.source === src.source &&
      p.subCategory === src.subCategory &&
      !explicit.some((e) => e.id === p.id),
  );

  return [...explicit, ...fallback].slice(0, 4);
};

/* ===== Hydration helpers ===== */

export const productById = (id: string) => products.find((p) => p.id === id) ?? null;

export type HydratedBasketItem = {
  product: Product;
  qty: number;
  /** Original product if this slot has been swapped */
  originalId: string;
};

/**
 * Apply a swap map (originalId → replacementId) to a basket's contents,
 * yielding the live list of products + qty + price.
 */
export const hydrateBasket = (
  basketId: string,
  swaps: Record<string, string> = {},
): HydratedBasketItem[] => {
  const contents = basketContents[basketId] ?? [];
  return contents
    .map((it) => {
      const replacementId = swaps[it.productId] ?? it.productId;
      const product = productById(replacementId);
      if (!product) return null;
      return { product, qty: it.qty, originalId: it.productId };
    })
    .filter((x): x is HydratedBasketItem => Boolean(x));
};

/** Sum of base price (no discount) for a hydrated basket. */
export const sumBasketRetail = (items: HydratedBasketItem[]) =>
  items.reduce((s, it) => s + it.product.price * it.qty, 0);

/* ===== Subscription tiers ===== */

export type SubFrequencyId = "weekly" | "biweekly" | "monthly";

export const subFrequencies: {
  id: SubFrequencyId;
  label: string;
  shortLabel: string;
  /** Extra discount on top of the basket's price */
  discountPct: number;
  /** Cashback % credited to wallet on each delivery */
  cashbackPct: number;
  /** Days between deliveries */
  cadenceDays: number;
}[] = [
  { id: "weekly",   label: "كل أسبوع",       shortLabel: "أسبوعي",      discountPct: 15, cashbackPct: 8, cadenceDays: 7 },
  { id: "biweekly", label: "كل أسبوعين",     shortLabel: "كل أسبوعين", discountPct: 10, cashbackPct: 6, cadenceDays: 14 },
  { id: "monthly",  label: "شهري",            shortLabel: "شهري",        discountPct: 5,  cashbackPct: 4, cadenceDays: 30 },
];

export const findFrequency = (id: SubFrequencyId) =>
  subFrequencies.find((f) => f.id === id) ?? subFrequencies[0];

/* ===== Build Your Own Box ===== */

export const BUILD_BOX_THRESHOLDS = [
  { min: 300, label: "خصم البداية",    discountPct: 5 },
  { min: 500, label: "خصم الجملة",    discountPct: 10 },
  { min: 800, label: "خصم العائلة",    discountPct: 15 },
  { min: 1200, label: "خصم VIP",      discountPct: 20 },
] as const;

export const tierForSubtotal = (subtotal: number) => {
  let active = null as null | (typeof BUILD_BOX_THRESHOLDS)[number];
  for (const t of BUILD_BOX_THRESHOLDS) if (subtotal >= t.min) active = t;
  return active;
};

export const nextTierForSubtotal = (subtotal: number) =>
  BUILD_BOX_THRESHOLDS.find((t) => subtotal < t.min) ?? null;

/* ===== Cart auto-upgrade detector ===== */

/**
 * Detect if a cart of single items "looks like" a prebuilt basket.
 * Returns the basket + savings if the user has at least 3 of the
 * basket's contents AND the subtotal of those items >= 300 EGP.
 */
export type AutoUpgradeSuggestion = {
  basket: Product;
  matchingIds: string[];
  cartSubtotal: number;
  savings: number;
};

export const detectBasketUpgrade = (
  cart: { product: Product; qty: number }[],
): AutoUpgradeSuggestion | null => {
  const cartIds = new Set(cart.map((l) => l.product.id));
  const cartSub = cart.reduce((s, l) => s + l.product.price * l.qty, 0);
  if (cartSub < 300) return null;

  let best: AutoUpgradeSuggestion | null = null;
  for (const basketId of Object.keys(basketContents)) {
    const basket = productById(basketId);
    if (!basket) continue;
    const matching = basketContents[basketId]
      .map((it) => it.productId)
      .filter((id) => cartIds.has(id));
    if (matching.length < 3) continue;

    const matchingSub = cart
      .filter((l) => matching.includes(l.product.id))
      .reduce((s, l) => s + l.product.price * l.qty, 0);
    const savings = Math.max(0, matchingSub - basket.price);
    if (savings <= 0) continue;
    if (!best || savings > best.savings) {
      best = { basket, matchingIds: matching, cartSubtotal: matchingSub, savings };
    }
  }
  return best;
};

/* ===== Local persistence keys ===== */

export const STORAGE = {
  buildBox: "reef-buildbox-v1",
  subscriptions: "reef-subscriptions-v1",
  basketCustomizations: "reef-basket-customizations-v1",
  giftMeta: "reef-gift-meta-v1",
} as const;

/* ===== Subscription store (localStorage) ===== */

export type SubscriptionRecord = {
  id: string;
  basketId: string;
  basketName: string;
  basketImage: string;
  basketPrice: number;
  frequency: SubFrequencyId;
  /** ISO date of next delivery */
  nextDelivery: string;
  /** Per-line swaps active for this subscription */
  swaps: Record<string, string>;
  /** Whether the customer has paused this subscription */
  paused: boolean;
  /** ISO timestamp when this was created */
  createdAt: string;
  /** Has the customer chosen "gift" mode (recipient address etc.) */
  giftMode?: boolean;
};

export const loadSubs = (): SubscriptionRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE.subscriptions);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveSubs = (subs: SubscriptionRecord[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE.subscriptions, JSON.stringify(subs));
  } catch {
    /* ignore quota */
  }
};

/** Hours remaining before a subscription's next delivery. */
export const hoursToDelivery = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60));
};

/** Locked window: 24h before delivery the basket cannot be edited. */
export const LOCK_WINDOW_HOURS = 24;
export const isLocked = (iso: string) => hoursToDelivery(iso) < LOCK_WINDOW_HOURS;
