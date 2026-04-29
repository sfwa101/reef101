// Premium Farm-to-Table boutique metadata for the Village section.
// Stays in the frontend layer — pure metadata keyed by product id.

export type HealthTag =
  | "keto"
  | "gluten-free"
  | "diabetic"
  | "high-protein"
  | "organic";

export const HEALTH_TAGS: { id: HealthTag; label: string; emoji: string }[] = [
  { id: "keto",         label: "كيتو دايت",          emoji: "🥩" },
  { id: "gluten-free",  label: "خالي من الجلوتين",   emoji: "🚫" },
  { id: "diabetic",     label: "صديق لمرضى السكري",  emoji: "🩸" },
  { id: "high-protein", label: "عالي البروتين",      emoji: "💪" },
  { id: "organic",      label: "عضوي 100%",          emoji: "🌱" },
];

export type TrustBadge = "vegan" | "first-press" | "raw" | "no-sugar" | "free-range";

export const TRUST_BADGE_META: Record<TrustBadge, { label: string; emoji: string }> = {
  vegan:        { label: "نباتي",        emoji: "🌿" },
  "first-press":{ label: "عصرة أولى",    emoji: "💧" },
  raw:          { label: "خام طبيعي",    emoji: "🍯" },
  "no-sugar":   { label: "بدون سكر",     emoji: "🚫🍬" },
  "free-range": { label: "تربية حرة",    emoji: "🐓" },
};

export type VillageMeta = {
  /** lifestyle/health tags for the smart filter bar */
  tags: HealthTag[];
  /** small badges over the image */
  trust: TrustBadge[];
  /** traceability line under the product name */
  source: string;
  /** nutrition facts (collapsible accordion) */
  nutrition?: { protein?: string; carbs?: string; fat?: string; calories?: string; notes?: string };
  /** limited batch — when set, shows scarcity & pre-order CTA */
  batch?: {
    remaining: number;
    /** day of week the next batch ships, e.g. "الجمعة" */
    nextBatchDay?: string;
    /** label for CTA, default: "احجز حصتك الآن" */
    ctaLabel?: string;
  };
  /** eligible for the weekly subscription "Make it a Routine" */
  routine?: { discountPct: number; defaultFrequency: "weekly" | "biweekly" };
};

export const VILLAGE_META: Record<string, VillageMeta> = {
  honey: {
    tags: ["organic", "gluten-free"],
    trust: ["raw", "vegan"],
    source: "مناحل ريف المدينة — حصاد هذا الموسم",
    nutrition: { calories: "304 ك.س / 100غ", carbs: "82غ", protein: "0.3غ", fat: "0غ", notes: "سكريات طبيعية فقط — لا إضافات." },
    batch: { remaining: 7, ctaLabel: "احجز جرة" },
  },
  ghee: {
    tags: ["keto", "gluten-free", "high-protein"],
    trust: ["raw", "first-press"],
    source: "مزرعة ريف المدينة — يُخض كل جمعة",
    nutrition: { calories: "900 ك.س / 100غ", fat: "100غ", carbs: "0غ", protein: "0غ", notes: "مصدر دهون كيتو نقي." },
    batch: { remaining: 3, nextBatchDay: "الجمعة", ctaLabel: "احجز حصتك الآن" },
    routine: { discountPct: 5, defaultFrequency: "biweekly" },
  },
  "village-cheese": {
    tags: ["high-protein", "diabetic", "gluten-free"],
    trust: ["raw"],
    source: "مزرعة ريف المدينة — إنتاج اليوم",
    nutrition: { calories: "98 ك.س / 100غ", protein: "11غ", fat: "4غ", carbs: "3غ" },
    routine: { discountPct: 5, defaultFrequency: "weekly" },
  },
  olives: {
    tags: ["keto", "gluten-free", "organic"],
    trust: ["vegan", "first-press"],
    source: "بساتين الريف — تخمير طبيعي 90 يوم",
    nutrition: { calories: "115 ك.س / 100غ", fat: "11غ", carbs: "6غ", protein: "0.8غ" },
  },
  molasses: {
    tags: ["organic", "gluten-free"],
    trust: ["vegan", "raw"],
    source: "معاصر القصب — عصرة أولى",
    nutrition: { calories: "290 ك.س / 100غ", carbs: "75غ", protein: "0غ", fat: "0غ", notes: "مصدر طبيعي للحديد." },
    batch: { remaining: 12 },
  },
  "village-eggs": {
    tags: ["keto", "high-protein", "gluten-free", "diabetic"],
    trust: ["free-range"],
    source: "مزرعة ريف المدينة — جُمع اليوم",
    nutrition: { calories: "70 ك.س / حبة", protein: "6غ", fat: "5غ", carbs: "0.5غ", notes: "دجاج حر يتغذى على الحبوب الطبيعية." },
    routine: { discountPct: 5, defaultFrequency: "weekly" },
  },
};

export const villageMetaFor = (id: string): VillageMeta | undefined => VILLAGE_META[id];
