import type { Product } from "./products";

/**
 * Supermarket dual-nav taxonomy.
 *  - 7 main groups (color-coded with pastel tint + accent hue)
 *  - Each main group has sub-categories with a matcher function
 *
 * Matchers prefer existing `subCategory` / `category` strings, then fall back
 * to keyword search on `name` so the existing seeded products map immediately
 * without DB changes. Anything in a group that doesn't match a sub falls into
 * a generated "أخرى" sub (rendered only if non-empty).
 */

export type SupermarketColor = {
  /** pastel tint (HSL string) used as active main-chip background */
  tint: string;
  /** strong hue used for active sub underline + active-chip text */
  hue: string;
  /** soft ring color for the main rail card */
  ring: string;
};

export type SupermarketSub = {
  id: string;
  name: string;
  match: (p: Product) => boolean;
};

export type SupermarketGroup = {
  id: string;
  name: string;
  emoji: string;
  color: SupermarketColor;
  subs: SupermarketSub[];
};

const has = (p: Product, ...kw: string[]) =>
  kw.some((k) => p.name.includes(k) || (p.subCategory ?? "").includes(k));

export const supermarketTaxonomy: SupermarketGroup[] = [
  {
    id: "essentials",
    name: "غذائية أساسية",
    emoji: "🥗",
    color: { tint: "142 50% 90%", hue: "142 60% 35%", ring: "142 40% 80%" },
    subs: [
      { id: "produce", name: "خضار وفواكه", match: (p) => p.category === "الخضار والفواكه" },
      { id: "dairy", name: "ألبان وأجبان", match: (p) => p.category === "الألبان والبيض" && p.subCategory !== "بيض" },
      { id: "eggs", name: "بيض", match: (p) => p.subCategory === "بيض" || has(p, "بيض") },
      { id: "meat", name: "لحوم ودواجن", match: (p) => p.category === "اللحوم والدواجن" },
      { id: "seafood", name: "أسماك وبحريات", match: (p) => has(p, "سمك", "جمبري", "بحريات") },
      { id: "bakery", name: "خبز ومخبوزات", match: (p) => p.category === "المخبوزات" || has(p, "خبز", "ساوردو") },
      { id: "grains", name: "أرز ومكرونة ودقيق", match: (p) => has(p, "أرز", "مكرونة", "دقيق", "سباجيتي") },
      { id: "canned", name: "معلبات ومحفوظات", match: (p) => has(p, "معلب", "محفوظ", "تونة", "فول") },
      { id: "spices", name: "بهارات وصلصات", match: (p) => has(p, "بهار", "صلصة", "زيت", "خل", "ملح") },
      { id: "snacks", name: "سناكات وحلويات", match: (p) => has(p, "كوكيز", "شيبس", "حلوى", "بسكويت", "جرانولا") },
    ],
  },
  {
    id: "drinks",
    name: "المشروبات",
    emoji: "🥤",
    color: { tint: "198 60% 88%", hue: "198 70% 40%", ring: "198 50% 78%" },
    subs: [
      { id: "water", name: "مياه", match: (p) => has(p, "مياه", "ماء") },
      { id: "juice", name: "عصائر", match: (p) => has(p, "عصير") },
      { id: "soda", name: "غازية", match: (p) => has(p, "غازية", "كولا", "صودا") },
      { id: "tea", name: "شاي", match: (p) => has(p, "شاي") },
      { id: "coffee", name: "قهوة", match: (p) => has(p, "قهوة", "بن", "نسكافيه") },
    ],
  },
  {
    id: "personal",
    name: "النظافة الشخصية",
    emoji: "🧴",
    color: { tint: "262 50% 90%", hue: "262 55% 50%", ring: "262 40% 80%" },
    subs: [
      { id: "soap", name: "صابون", match: (p) => has(p, "صابون") },
      { id: "shampoo", name: "شامبو", match: (p) => has(p, "شامبو") },
      { id: "toothpaste", name: "معجون أسنان", match: (p) => has(p, "معجون") },
      { id: "toothbrush", name: "فرشاة أسنان", match: (p) => has(p, "فرشاة") },
      { id: "deo", name: "مزيل عرق", match: (p) => has(p, "مزيل", "عرق") },
      { id: "tissues-p", name: "مناديل ورقية", match: (p) => p.name.includes("مناديل ورقية") },
      { id: "shave", name: "حلاقة", match: (p) => has(p, "حلاقة", "ذقن") },
    ],
  },
  {
    id: "cleaning",
    name: "التنظيف والمنزل",
    emoji: "🧽",
    color: { tint: "212 60% 90%", hue: "212 70% 42%", ring: "212 50% 80%" },
    subs: [
      { id: "dish", name: "جلي", match: (p) => has(p, "جلي") },
      { id: "laundry", name: "غسيل", match: (p) => has(p, "غسيل", "مسحوق") },
      { id: "floor", name: "أرضيات", match: (p) => has(p, "أرضيات", "تنظيف") },
      { id: "trash", name: "أكياس قمامة", match: (p) => has(p, "قمامة") },
      { id: "sponge", name: "إسفنج", match: (p) => has(p, "إسفنج") },
      { id: "kitchen-paper", name: "مناديل مطبخ", match: (p) => p.name.includes("مناديل مطبخ") },
      { id: "toilet", name: "ورق تواليت", match: (p) => has(p, "تواليت") },
    ],
  },
  {
    id: "baby",
    name: "مستلزمات الأطفال",
    emoji: "🍼",
    color: { tint: "340 65% 92%", hue: "340 70% 52%", ring: "340 50% 82%" },
    subs: [
      { id: "diapers", name: "حفاضات", match: (p) => has(p, "حفاض") },
      { id: "wet-wipes", name: "مناديل مبللة", match: (p) => has(p, "مبللة") },
      { id: "baby-milk", name: "حليب أطفال", match: (p) => p.name.includes("حليب أطفال") },
      { id: "baby-food", name: "أغذية أطفال", match: (p) => p.category === "أطعمة الأطفال" && !has(p, "حفاض") },
    ],
  },
  {
    id: "health",
    name: "الصحة البسيطة",
    emoji: "💊",
    color: { tint: "22 70% 90%", hue: "22 75% 48%", ring: "22 55% 80%" },
    subs: [
      { id: "vitamins", name: "فيتامينات", match: (p) => has(p, "فيتامين") },
      { id: "painkillers", name: "مسكنات", match: (p) => has(p, "مسكن") },
      { id: "bandages", name: "لاصقات جروح", match: (p) => has(p, "لاصق", "جروح") },
      { id: "antiseptics", name: "مطهرات", match: (p) => has(p, "مطهر") },
    ],
  },
  {
    id: "extras",
    name: "يومية إضافية",
    emoji: "🔋",
    color: { tint: "44 70% 88%", hue: "44 75% 40%", ring: "44 55% 78%" },
    subs: [
      { id: "batteries", name: "بطاريات", match: (p) => has(p, "بطار") },
      { id: "food-bags", name: "أكياس حفظ طعام", match: (p) => p.name.includes("أكياس حفظ") },
      { id: "foil", name: "ورق ألمنيوم", match: (p) => has(p, "ألمنيوم", "قصدير") },
      { id: "kitchen-tools", name: "أدوات مطبخ صغيرة", match: (p) => p.category === "أدوات منزلية" || has(p, "أواني") },
    ],
  },
];

/** Pool of products eligible for the supermarket page. */
export const supermarketPool = (all: Product[]) =>
  all.filter(
    (p) =>
      p.source !== "wholesale" &&
      p.source !== "kitchen" &&
      p.source !== "recipes" &&
      p.source !== "restaurants" &&
      p.source !== "sweets" &&
      p.source !== "baskets" &&
      p.source !== "village" &&
      p.source !== "library",
  );

/** Group products into the taxonomy tree, dropping empty subs. */
export type GroupedProducts = {
  group: SupermarketGroup;
  subs: { sub: SupermarketSub; items: Product[] }[];
}[];

export const groupBySupermarketTaxonomy = (
  pool: Product[],
  query: string,
): GroupedProducts => {
  const q = query.trim();
  const filter = (p: Product) =>
    !q || p.name.includes(q) || (p.brand ?? "").includes(q);

  const used = new Set<string>();
  const out: GroupedProducts = [];

  for (const group of supermarketTaxonomy) {
    const subs: { sub: SupermarketSub; items: Product[] }[] = [];
    for (const sub of group.subs) {
      const items = pool.filter(
        (p) => !used.has(p.id) && sub.match(p) && filter(p),
      );
      items.forEach((p) => used.add(p.id));
      if (items.length) subs.push({ sub, items });
    }
    if (subs.length) out.push({ group, subs });
  }
  return out;
};

/** Lookup helper used by ScrollSpy to derive the active main group from a sub id. */
export const groupForSub = (subId: string) =>
  supermarketTaxonomy.find((g) => g.subs.some((s) => s.id === subId));
