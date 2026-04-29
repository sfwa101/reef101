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
  /** nutrition facts */
  nutrition?: { protein?: string; carbs?: string; fat?: string; calories?: string; notes?: string };
  /** limited batch — when set, shows scarcity & pre-order CTA */
  batch?: {
    remaining: number;
    /** total batch size — used to compute the scarcity progress bar */
    total?: number;
    /** day of week the next batch ships, e.g. "الجمعة" */
    nextBatchDay?: string;
    /** label for CTA, default: "احجز حصتك الآن" */
    ctaLabel?: string;
  };
  /** eligible for the weekly subscription "Make it a Routine" */
  routine?: { discountPct: number; defaultFrequency: "weekly" | "biweekly" };
  /** narrative paragraph for the "Origin Story" section on product page */
  story?: string;
  /** storage / shelf-life badges (e.g. ❄️ يحفظ مبرداً) */
  storage?: { icon: string; label: string }[];
};

export const VILLAGE_META: Record<string, VillageMeta> = {
  honey: {
    tags: ["organic", "gluten-free"],
    trust: ["raw", "vegan"],
    source: "مناحل ريف المدينة — حصاد هذا الموسم",
    nutrition: { calories: "304 ك.س / 100غ", carbs: "82غ", protein: "0.3غ", fat: "0غ", notes: "سكريات طبيعية فقط — لا إضافات." },
    batch: { remaining: 7, total: 30, ctaLabel: "احجز جرة" },
    story: "يُجمع هذا العسل من مناحلنا الخاصة في ريف المدينة، بعيداً عن أي تلوث أو رش زراعي. لا نسخّنه ولا نفلتره صناعياً، ليصلك بكامل إنزيماته وحبوب اللقاح كما خرج من الخلية تماماً.",
    storage: [
      { icon: "🌡️", label: "يحفظ في درجة حرارة الغرفة" },
      { icon: "⏳", label: "صالح حتى 24 شهراً" },
      { icon: "🚫", label: "بدون مواد حافظة" },
    ],
  },
  ghee: {
    tags: ["keto", "gluten-free", "high-protein"],
    trust: ["raw", "first-press"],
    source: "مزرعة ريف المدينة — يُخض كل جمعة",
    nutrition: { calories: "900 ك.س / 100غ", fat: "100غ", carbs: "0غ", protein: "0غ", notes: "مصدر دهون كيتو نقي." },
    batch: { remaining: 3, total: 10, nextBatchDay: "الجمعة", ctaLabel: "احجز حصتك الآن" },
    routine: { discountPct: 10, defaultFrequency: "biweekly" },
    story: "نخض السمن البلدي بالطريقة التقليدية كل صباح جمعة من زبد بقراتنا الحرّة. عملية يدوية بحتة تحتفظ بالنكهة الذهبية الأصيلة ورائحة المراعي.",
    storage: [
      { icon: "❄️", label: "يحفظ مبرداً بعد الفتح" },
      { icon: "⏳", label: "صالح لمدة 6 أشهر" },
      { icon: "🚫", label: "بدون مواد حافظة" },
    ],
  },
  "village-cheese": {
    tags: ["high-protein", "diabetic", "gluten-free"],
    trust: ["raw"],
    source: "مزرعة ريف المدينة — إنتاج اليوم",
    nutrition: { calories: "98 ك.س / 100غ", protein: "11غ", fat: "4غ", carbs: "3غ" },
    routine: { discountPct: 10, defaultFrequency: "weekly" },
    batch: { remaining: 18, total: 40 },
    story: "جبنة قريش بلدية طازجة تُصنع يومياً من حليب بقراتنا الحرّة، بدون أي إضافات أو مواد حافظة. تصلك خلال ساعات من الإنتاج لتحتفظ بطعمها الطازج.",
    storage: [
      { icon: "❄️", label: "يحفظ مبرداً" },
      { icon: "⏳", label: "صالح لمدة 14 يوماً" },
      { icon: "🚫", label: "بدون مواد حافظة" },
    ],
  },
  olives: {
    tags: ["keto", "gluten-free", "organic"],
    trust: ["vegan", "first-press"],
    source: "بساتين الريف — تخمير طبيعي 90 يوم",
    nutrition: { calories: "115 ك.س / 100غ", fat: "11غ", carbs: "6غ", protein: "0.8غ" },
    story: "زيتون بلدي يُقطف يدوياً من بساتيننا، ويُخمَّر طبيعياً في ماء وملح بحري لمدة 90 يوماً كاملة، بدون أي خل صناعي أو مواد حافظة.",
    storage: [
      { icon: "🌡️", label: "يحفظ في مكان بارد" },
      { icon: "⏳", label: "صالح حتى 12 شهراً" },
    ],
  },
  molasses: {
    tags: ["organic", "gluten-free"],
    trust: ["vegan", "raw"],
    source: "معاصر القصب — عصرة أولى",
    nutrition: { calories: "290 ك.س / 100غ", carbs: "75غ", protein: "0غ", fat: "0غ", notes: "مصدر طبيعي للحديد." },
    batch: { remaining: 12, total: 25 },
    story: "عسل أسود من العصرة الأولى لقصب السكر الطازج. يُطهى ببطء على نار هادئة دون إضافة سكر، ليحتفظ بمعادنه الطبيعية وخاصة الحديد.",
    storage: [
      { icon: "🌡️", label: "يحفظ في درجة حرارة الغرفة" },
      { icon: "⏳", label: "صالح حتى 18 شهراً" },
    ],
  },
  "village-eggs": {
    tags: ["keto", "high-protein", "gluten-free", "diabetic"],
    trust: ["free-range"],
    source: "مزرعة ريف المدينة — جُمع اليوم",
    nutrition: { calories: "70 ك.س / حبة", protein: "6غ", fat: "5غ", carbs: "0.5غ", notes: "دجاج حر يتغذى على الحبوب الطبيعية." },
    routine: { discountPct: 10, defaultFrequency: "weekly" },
    batch: { remaining: 22, total: 60 },
    story: "بيض من دجاج حرّ يتجول طوال اليوم في مزرعتنا، يتغذى على الحبوب والأعشاب الطبيعية فقط، بدون هرمونات أو مضادات حيوية.",
    storage: [
      { icon: "❄️", label: "يحفظ مبرداً" },
      { icon: "⏳", label: "صالح لمدة 21 يوماً" },
    ],
  },
};

export const villageMetaFor = (id: string): VillageMeta | undefined => VILLAGE_META[id];
