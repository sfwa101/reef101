/**
 * Butchery / Seafood smart prep engine
 * ------------------------------------------------
 * Per-subCategory rule sets describing:
 *   - weight options (with price multiplier)
 *   - prep options (cleaning / cutting / cooking)
 *   - addons that may be enabled or disabled by the chosen prep
 *   - packaging choices
 *   - SLA tier driven dynamically from the prep
 *   - a paired "chef recipe" upsell
 *   - a generic cross-sell list
 *
 * The data is intentionally generic (per subCategory) with optional
 * per-product overrides so we cover every meat SKU without per-row data.
 */

import type { Product } from "./products";

export type PrepTier = "raw" | "clean" | "cook";
export type SlaTier = "fast" | "mid" | "slow";

export type PrepOption = {
  id: string;
  label: string;
  /** extra cost on top of base */
  price: number;
  /** SLA bucket — drives delivery ETA and color */
  tier: PrepTier;
  /** ids of addons that become unavailable when this prep is chosen */
  disables?: string[];
  /** ids of addons that are revealed only when this prep is chosen */
  reveals?: string[];
  /** soft note rendered under the picker */
  note?: string;
};

export type PrepAddon = {
  id: string;
  label: string;
  price: number;
  /** Hidden until a prep with `reveals` listing this id is selected */
  conditional?: boolean;
};

export type WeightOption = {
  id: string;
  label: string;
  /** multiplier applied to base price */
  factor: number;
};

export type PackagingOption = {
  id: string;
  label: string;
  price: number;
  hint?: string;
};

export type CrossSell = {
  id: string;
  label: string;
  price: number;
  emoji: string;
};

export type RecipeUpsell = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  emoji: string;
};

export type ButcheryRules = {
  /** Educational tags shown under the title */
  facts: string[];
  weights: WeightOption[];
  preps: PrepOption[];
  addons: PrepAddon[];
  packaging: PackagingOption[];
  crossSell: CrossSell[];
  recipe?: RecipeUpsell;
};

export const slaMeta: Record<SlaTier, {
  label: string;
  message: string;
  /** hex-ish HSL ring + soft bg used by the modal */
  ringClass: string;
  bgClass: string;
  textClass: string;
  emoji: string;
}> = {
  fast: {
    label: "خلال ساعة",
    message: "يصلك طازجاً بدون تأخير",
    ringClass: "ring-emerald-500/60",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-700",
    emoji: "⚡️",
  },
  mid: {
    label: "خلال ساعتين",
    message: "نُحضّر طلبك بعناية ثم نوصله",
    ringClass: "ring-amber-500/60",
    bgClass: "bg-amber-500/10",
    textClass: "text-amber-700",
    emoji: "🔪",
  },
  slow: {
    label: "خلال 4 ساعات",
    message: "يتم التحضير والتتبيل خصيصاً لك لضمان أفضل طعم",
    ringClass: "ring-rose-500/60",
    bgClass: "bg-rose-500/10",
    textClass: "text-rose-700",
    emoji: "🔥",
  },
};

/* ===== Reusable building blocks ===== */

const baseWeights: WeightOption[] = [
  { id: "0.5", label: "نصف كيلو", factor: 0.5 },
  { id: "1", label: "1 كيلو", factor: 1 },
  { id: "2", label: "2 كيلو", factor: 2 },
  { id: "3", label: "3 كيلو", factor: 3 },
];

const seafoodWeights: WeightOption[] = [
  { id: "0.5", label: "نصف كيلو", factor: 0.5 },
  { id: "1", label: "1 كيلو", factor: 1 },
  { id: "2", label: "2 كيلو", factor: 2 },
];

const packagingStd: PackagingOption[] = [
  { id: "normal", label: "تغليف عادي", price: 0, hint: "مجاني" },
  { id: "vacuum", label: "تغليف فاكيوم", price: 15, hint: "أفضل للتخزين بالفريزر" },
];

/* ===== Per-subCategory rules ===== */

const redMeatRules: ButcheryRules = {
  facts: ["طازج اليوم", "مذبوح بلدي", "مناسب للشواء والطهي"],
  weights: baseWeights,
  preps: [
    { id: "raw",   label: "نيء كما هو",       price: 0,  tier: "raw" },
    { id: "cubes", label: "تقطيع مكعبات",     price: 10, tier: "clean" },
    { id: "strips",label: "تقطيع شرائح/شاورما", price: 15, tier: "clean", note: "تقطيع رفيع جداً للشاورما" },
    { id: "mince", label: "فرم اللحم",        price: 12, tier: "clean", reveals: ["lyya"], disables: ["soup-bone"] },
    { id: "marinate", label: "تتبيل + تجهيز للشواء", price: 25, tier: "cook" },
  ],
  addons: [
    { id: "soup-bone", label: "إضافة عظم للشوربة", price: 8 },
    { id: "lyya",      label: "إضافة لية للفرم",   price: 15, conditional: true },
    { id: "fat-trim",  label: "تنظيف الدهون الزائدة", price: 5 },
  ],
  packaging: packagingStd,
  crossSell: [
    { id: "spices-bbq", label: "توابل شواء", price: 35, emoji: "🌶️" },
    { id: "charcoal",   label: "فحم طبيعي",  price: 45, emoji: "🔥" },
    { id: "lemon",      label: "ليمون طازج", price: 12, emoji: "🍋" },
  ],
  recipe: {
    id: "recipe-kebab",
    title: "كباب لحم بلدي على الفحم",
    subtitle: "وصفة شيف ريف · المكونات كاملة كباقة",
    price: 380,
    emoji: "🍢",
  },
};

const poultryRules: ButcheryRules = {
  facts: ["دجاج بلدي", "مذبوح اليوم", "خالٍ من الهرمونات"],
  weights: [
    { id: "half", label: "نصف دجاجة", factor: 0.5 },
    { id: "whole", label: "دجاجة كاملة", factor: 1 },
    { id: "two", label: "دجاجتين", factor: 2 },
  ],
  preps: [
    { id: "whole",   label: "كاملة بدون تقطيع", price: 0,  tier: "raw" },
    { id: "8pcs",    label: "تقطيع 8 قطع",      price: 8,  tier: "clean" },
    { id: "fillet",  label: "فيليه/تسليخ",      price: 18, tier: "clean", disables: ["bones"] },
    { id: "marinate-grill", label: "تتبيل مشوي", price: 25, tier: "cook", reveals: ["spice-mix"] },
    { id: "marinate-fry",   label: "تتبيل بانيه", price: 22, tier: "cook", reveals: ["breading"] },
  ],
  addons: [
    { id: "bones",     label: "احتفظ بالعظم للشوربة", price: 0 },
    { id: "skin-off",  label: "إزالة الجلد", price: 5 },
    { id: "spice-mix", label: "مزيج بهارات شيف ريف", price: 10, conditional: true },
    { id: "breading",  label: "تغطية بقشرة بقسماط", price: 12, conditional: true },
  ],
  packaging: packagingStd,
  crossSell: [
    { id: "potato",  label: "بطاطس طازجة", price: 18, emoji: "🥔" },
    { id: "lemon",   label: "ليمون طازج",  price: 12, emoji: "🍋" },
    { id: "garlic",  label: "ثوم بلدي",    price: 8,  emoji: "🧄" },
  ],
  recipe: {
    id: "recipe-chicken-tray",
    title: "صينية دجاج بالبطاطس من مطبخ ريف",
    subtitle: "اشترِ المكونات كاملة كباقة جاهزة",
    price: 245,
    emoji: "🍗",
  },
};

const mincedRules: ButcheryRules = {
  facts: ["لحم بلدي مفروم اليوم", "مناسب للحشو والكفتة"],
  weights: baseWeights,
  preps: [
    { id: "fine",      label: "فرم ناعم",        price: 0,  tier: "clean" },
    { id: "double",    label: "فرم مضاعف الناعمة", price: 8,  tier: "clean" },
    { id: "kofta",     label: "تجهيز كفتة بالبهارات", price: 20, tier: "cook" },
    { id: "burger",    label: "تشكيل أقراص برجر",  price: 18, tier: "cook" },
  ],
  addons: [
    { id: "lyya",     label: "إضافة لية", price: 15 },
    { id: "onion",    label: "بصل وثوم مع الفرم", price: 6 },
    { id: "parsley",  label: "بقدونس مفروم", price: 5 },
  ],
  packaging: packagingStd,
  crossSell: [
    { id: "burger-bun", label: "خبز برجر طازج", price: 25, emoji: "🍞" },
    { id: "cheese",     label: "جبنة شيدر",     price: 35, emoji: "🧀" },
    { id: "spices-bbq", label: "توابل شواء",    price: 35, emoji: "🌶️" },
  ],
};

const fishRules: ButcheryRules = {
  facts: ["صيد اليوم", "من بحيرات وبحار طازجة"],
  weights: seafoodWeights,
  preps: [
    { id: "raw",       label: "بدون تنظيف",          price: 0,  tier: "raw" },
    { id: "cleaned",   label: "تنظيف فقط",           price: 8,  tier: "clean" },
    { id: "fillet",    label: "فيليه (إزالة الشوك)", price: 18, tier: "clean", disables: ["head"] },
    { id: "grill-radda", label: "مشوي ردة",          price: 25, tier: "cook", reveals: ["radda-mix"] },
    { id: "grill-oil", label: "مشوي زيت وليمون",     price: 25, tier: "cook" },
    { id: "fried",     label: "مقلي جاهز",           price: 28, tier: "cook" },
  ],
  addons: [
    { id: "head",       label: "احتفظ بالرأس", price: 0 },
    { id: "scales-off", label: "إزالة القشور", price: 5 },
    { id: "radda-mix",  label: "خلطة ردة بلدي", price: 8, conditional: true },
  ],
  packaging: packagingStd,
  crossSell: [
    { id: "tahina",  label: "طحينة بلدي", price: 28, emoji: "🥣" },
    { id: "lemon",   label: "ليمون طازج", price: 12, emoji: "🍋" },
    { id: "rice",    label: "أرز صيادية", price: 35, emoji: "🍚" },
  ],
  recipe: {
    id: "recipe-sayadia",
    title: "سمك صيادية بالأرز",
    subtitle: "وصفة بحرية كاملة بالمكونات",
    price: 220,
    emoji: "🐟",
  },
};

const seafoodRules: ButcheryRules = {
  ...fishRules,
  facts: ["مأكولات بحرية مختارة", "مجمدة فور الصيد"],
  preps: [
    { id: "raw",     label: "كما هو",        price: 0,  tier: "raw" },
    { id: "cleaned", label: "تنظيف وتقشير",  price: 12, tier: "clean" },
    { id: "grilled", label: "مشوي جاهز",     price: 30, tier: "cook" },
    { id: "fried",   label: "مقلي مقرمش",    price: 30, tier: "cook" },
  ],
};

const frozenRules: ButcheryRules = {
  facts: ["مجمد بأحدث تقنيات الحفظ", "لا يحتاج تحضير مسبق"],
  weights: [
    { id: "1pack", label: "عبوة", factor: 1 },
    { id: "2pack", label: "عبوتين", factor: 2 },
    { id: "3pack", label: "3 عبوات", factor: 3 },
  ],
  preps: [
    { id: "frozen", label: "كما هو مجمد", price: 0, tier: "raw" },
  ],
  addons: [],
  packaging: [
    { id: "normal", label: "تغليف عادي مبرّد", price: 0, hint: "مجاني" },
  ],
  crossSell: [
    { id: "oil",   label: "زيت قلي",   price: 28, emoji: "🫒" },
    { id: "spices",label: "توابل عامة", price: 22, emoji: "🧂" },
  ],
};

/* ===== Lookup ===== */

const subCatMap: Record<string, ButcheryRules> = {
  "لحوم حمراء": redMeatRules,
  "دواجن":      poultryRules,
  "مفرومات":    mincedRules,
  "أسماك":      fishRules,
  "بحريات":     seafoodRules,
  "مجمدات":     frozenRules,
};

/** Optional per-product overrides keyed by product.id */
const productOverrides: Record<string, Partial<ButcheryRules>> = {};

export const isButcheryProduct = (source: string) => source === "meat";

export const getButcheryRules = (p: Product): ButcheryRules | null => {
  if (!isButcheryProduct(p.source)) return null;
  const sub = (p.subCategory ?? "") as keyof typeof subCatMap;
  const base = subCatMap[sub] ?? redMeatRules;
  const override = productOverrides[p.id];
  return override ? { ...base, ...override } : base;
};

/** Compute final unit price for a butchery line */
export const computeButcheryPrice = (
  basePrice: number,
  weight: WeightOption,
  prep: PrepOption,
  addonIds: string[],
  rules: ButcheryRules,
  packagingId: string,
) => {
  const addonsCost = rules.addons
    .filter((a) => addonIds.includes(a.id))
    .reduce((s, a) => s + a.price, 0);
  const pkg = rules.packaging.find((p) => p.id === packagingId);
  return Math.round(basePrice * weight.factor + prep.price + addonsCost + (pkg?.price ?? 0));
};

/** Highest tier wins (raw < clean < cook). Used when multiple preps stack — currently single. */
export const slaForPrep = (prep: PrepOption): SlaTier => {
  if (prep.tier === "cook") return "slow";
  if (prep.tier === "clean") return "mid";
  return "fast";
};