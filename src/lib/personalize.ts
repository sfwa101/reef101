import { products, type Product } from "./products";

export type TimeSlot = "breakfast" | "lunch" | "dinner" | "latenight";

export const getTimeSlot = (d = new Date()): TimeSlot => {
  const h = d.getHours();
  if (h >= 5 && h < 11) return "breakfast";
  if (h >= 11 && h < 16) return "lunch";
  if (h >= 16 && h < 22) return "dinner";
  return "latenight";
};

export const slotMeta: Record<TimeSlot, { title: string; subtitle: string; emoji: string; cta: string }> = {
  breakfast: { title: "إفطار اليوم", subtitle: "ابدأ يومك بطاقة وحيوية", emoji: "🌅", cta: "اطلب فطورك" },
  lunch:     { title: "غداء اليوم",  subtitle: "وجبات شهية مختارة لك", emoji: "🍽️", cta: "اطلب الغداء" },
  dinner:    { title: "عشاء اليوم",  subtitle: "ختام لذيذ ليومك",       emoji: "🌙", cta: "اطلب العشاء" },
  latenight: { title: "سهرة الليلة", subtitle: "خفيف ولذيذ مع السهر",   emoji: "✨", cta: "اطلب الآن" },
};

export const getSmartGreeting = (d = new Date()): string => {
  const h = d.getHours();
  if (h >= 4 && h < 11) return "صباح الخير";
  if (h >= 11 && h < 14) return "أهلًا بك";
  if (h >= 14 && h < 17) return "نهارك سعيد";
  if (h >= 17 && h < 20) return "مساء الخير";
  if (h >= 20 && h < 24) return "مساء النور";
  return "ساعة سعيدة";
};

export const getWelcomeLine = (d = new Date()): string => {
  const slot = getTimeSlot(d);
  const lines: Record<TimeSlot, string[]> = {
    breakfast: ["ماذا نحضّر لإفطارك؟", "بداية يوم منعشة تستحقها", "فطور دافئ يبدأ من هنا"],
    lunch:     ["وقت الغداء، نختار لك الأشهى", "وجبة سريعة أم جلسة عائلية؟", "غداؤك جاهز بنقرات"],
    dinner:    ["عشاء هادئ يليق بمساءك", "لمسة دافئة لنهاية اليوم", "اختر عشاءك المفضل"],
    latenight: ["خفيف ولذيذ لساعات السهر", "مزاج السهرة يبدأ من ريف", "وجبات الليل بين يديك"],
  };
  const arr = lines[slot];
  // Stable per-day pick
  const idx = (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % arr.length;
  return arr[idx];
};

/** Map time slots to product categories / sources / keywords */
const slotKeywords: Record<TimeSlot, { sources: Product["source"][]; nameMatch: RegExp; categories: string[] }> = {
  breakfast: {
    sources: ["dairy", "produce", "supermarket", "baskets"],
    nameMatch: /إفطار|فطور|حليب|بيض|جبن|عسل|زبادي|خبز|كرواس|جرانولا|قهوة|عصير|زبدة|كورن|موز|تفاح/i,
    categories: ["الألبان والبيض", "المخبوزات", "الخضار والفواكه", "المشروبات"],
  },
  lunch: {
    sources: ["kitchen", "restaurants", "meat", "supermarket"],
    nameMatch: /دجاج|لحم|أرز|مكرونة|كشري|برجر|بيتزا|شاورما|سمك|مشاوي|سلطة/i,
    categories: ["وجبات", "مطاعم", "اللحوم والدواجن", "البقالة الجافة"],
  },
  dinner: {
    sources: ["kitchen", "restaurants", "recipes", "village"],
    nameMatch: /عشاء|سلمون|سلطة|ريزوتو|بول|سوشي|مشوي|شوربة/i,
    categories: ["وجبات", "مطاعم", "وصفات", "خيرات الريف"],
  },
  latenight: {
    sources: ["sweets", "supermarket", "restaurants", "kitchen"],
    nameMatch: /آيس|جيلاتو|كيك|كوكيز|شوكولاتة|بيتزا|برجر|دونتس|ماكرون|قهوة|عصير|كنافة/i,
    categories: ["حلويات", "المشروبات", "مطاعم"],
  },
};

/** Score a product for the given user/time context. Higher = better. */
const scoreFor = (
  p: Product,
  ctx: {
    slot: TimeSlot;
    likes: string[];
    dislikes: string[];
    tags: string[];
    gender: string | null;
    age: number | null;
  },
) => {
  const k = slotKeywords[ctx.slot];
  let s = 0;
  if (k.sources.includes(p.source)) s += 4;
  if (k.nameMatch.test(p.name)) s += 5;
  if (k.categories.includes(p.category)) s += 3;

  const text = `${p.name} ${p.category} ${p.subCategory ?? ""} ${p.brand ?? ""}`.toLowerCase();
  for (const like of ctx.likes) if (like && text.includes(like.toLowerCase())) s += 6;
  for (const dis of ctx.dislikes) if (dis && text.includes(dis.toLowerCase())) s -= 10;

  // Lifestyle tags
  for (const t of ctx.tags) {
    const tag = t.toLowerCase();
    if (tag.includes("صحي") || tag.includes("دايت") || tag.includes("رياض")) {
      if (/سلطة|بول|سلمون|شوفان|جرانولا|زبادي|فواكه|خضار/i.test(p.name)) s += 4;
      if (/آيس|كيك|دونتس|شوكولاتة|بقلاوة/i.test(p.name)) s -= 3;
    }
    if (tag.includes("عائل") || tag.includes("منزل")) {
      if (p.source === "baskets" || /سلة|عائل|كجم|عبوة/i.test(p.name + " " + p.unit)) s += 3;
    }
    if (tag.includes("سريع") || tag.includes("عمل")) {
      if (p.source === "kitchen" || p.source === "restaurants") s += 3;
    }
    if (tag.includes("عضوي") || tag.includes("بلدي")) {
      if (/بلدي|طبيعي|عضوي|ريف/i.test(p.name + " " + (p.brand ?? ""))) s += 4;
    }
  }

  // Age hints
  if (ctx.age != null) {
    if (ctx.age < 25 && /برجر|بيتزا|دونتس|آيس|بوبا|سوشي/i.test(p.name)) s += 2;
    if (ctx.age >= 45 && /عسل|زيتون|شوفان|أعشاب|قهوة|تمر|بلدي/i.test(p.name)) s += 2;
  }

  // Light gender nudges (very subtle, both directions remain visible)
  if (ctx.gender === "female" && /حلويات|تشيز|ماكرون|عناية|شامبو|فواكه|سلطة/i.test(p.name + " " + p.category)) s += 1;
  if (ctx.gender === "male"   && /لحم|مشاوي|برجر|بروتين|قهوة/i.test(p.name + " " + p.category)) s += 1;

  // Quality boosters
  if (p.badge === "best") s += 1.5;
  if (p.badge === "premium") s += 1;
  if (p.oldPrice && p.oldPrice > p.price) s += 1.5;
  if (p.rating) s += (p.rating - 4.5) * 2;

  return s;
};

const calcAge = (birthDate?: string | null): number | null => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
};

export type PersonalizeInput = {
  birth_date?: string | null;
  gender?: string | null;
  lifestyle_tags?: string[] | null;
  likes?: string[] | null;
  dislikes?: string[] | null;
};

export const personalizedProducts = (
  profile: PersonalizeInput | null | undefined,
  opts: { limit?: number; slot?: TimeSlot; pool?: Product[] } = {},
): Product[] => {
  const slot = opts.slot ?? getTimeSlot();
  const ctx = {
    slot,
    likes: profile?.likes ?? [],
    dislikes: profile?.dislikes ?? [],
    tags: profile?.lifestyle_tags ?? [],
    gender: profile?.gender ?? null,
    age: calcAge(profile?.birth_date),
  };
  const pool = opts.pool ?? products;
  const scored = pool
    .map((p) => ({ p, s: scoreFor(p, ctx) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
  return scored.slice(0, opts.limit ?? 10);
};

export const productsForSlot = (slot: TimeSlot, limit = 10): Product[] => {
  const k = slotKeywords[slot];
  const matched = products.filter(
    (p) =>
      k.sources.includes(p.source) ||
      k.nameMatch.test(p.name) ||
      k.categories.includes(p.category),
  );
  return matched
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);
};

export const smartOffers = (
  profile: PersonalizeInput | null | undefined,
  limit = 10,
): Product[] => {
  const discounted = products.filter((p) => p.oldPrice && p.oldPrice > p.price);
  // If user has a "saver" / low-budget profile, sort by largest discount first
  const budget = (profile as { budget_range?: string | null } | null | undefined)?.budget_range ?? "";
  const saver = /اقتصادي|توفير|محدود|low|saver/i.test(budget);
  if (saver) {
    return discounted
      .map((p) => ({ p, d: p.oldPrice ? (p.oldPrice - p.price) / p.oldPrice : 0 }))
      .sort((a, b) => b.d - a.d)
      .slice(0, limit)
      .map((x) => x.p);
  }
  return personalizedProducts(profile, { pool: discounted, limit });
};

/* ============================================================================
 * Smart category ordering — based on occupation / lifestyle tags.
 * Returns a comparator that sorts a list of category ids (matching the
 * `id` field used in HomePage's allStores list) by personal relevance.
 * ========================================================================== */

type Occupation = string | null | undefined;

const RANK_BY_PROFILE = (
  occupation: Occupation,
  tags: string[],
): Record<string, number> => {
  const occ = (occupation ?? "").toLowerCase();
  const tagText = tags.join(" ").toLowerCase();
  const rank: Record<string, number> = {};

  const boost = (id: string, n: number) => {
    rank[id] = (rank[id] ?? 0) + n;
  };

  // Default baseline: keep the editorial order roughly intact
  ["supermarket", "produce", "dairy", "kitchen", "recipes", "subscription",
   "wholesale", "pharmacy", "library", "home"].forEach((id, i) => {
    rank[id] = -i; // first items already preferred
  });

  if (/منزل|ربة|أم|housewife|home/i.test(occ) || /عائل|منزل|طبخ/.test(tagText)) {
    boost("home", 50); boost("supermarket", 40); boost("kitchen", 30);
    boost("produce", 20); boost("dairy", 15);
  }
  if (/طالب|student|دراس/i.test(occ) || /سهر|سريع|اقتصادي/.test(tagText)) {
    boost("subscription", 50); boost("kitchen", 40); boost("recipes", 25);
    boost("library", 30);
  }
  if (/موظف|عمل|employee|engineer|doctor|طبيب|مهندس/i.test(occ)) {
    boost("kitchen", 40); boost("recipes", 30); boost("subscription", 25);
    boost("supermarket", 15);
  }
  if (/شيف|chef|طاه/i.test(occ) || /طبخ|طهي/.test(tagText)) {
    boost("recipes", 50); boost("produce", 40); boost("dairy", 25);
  }
  if (/تاجر|محل|متجر|wholesale/i.test(occ) || /جملة/.test(tagText)) {
    boost("wholesale", 80);
  }
  if (/أب|والد|أم|طفل|أطفال|family|parent/.test(tagText)) {
    boost("library", 30); boost("pharmacy", 20);
  }

  return rank;
};

export const rankCategoriesForProfile = (
  profile: { occupation?: string | null; lifestyle_tags?: string[] | null } | null | undefined,
): Record<string, number> =>
  RANK_BY_PROFILE(profile?.occupation, profile?.lifestyle_tags ?? []);

/* ============================================================================
 * Rotating search placeholders — used in HomePage hero search bar.
 * ========================================================================== */
export const SEARCH_PLACEHOLDERS: string[] = [
  "ابحث عن خضار طازج…",
  "ابحث عن وصفات الشيف…",
  "ابحث عن منتجات الألبان…",
  "ابحث عن سلال الأسبوع…",
  "ابحث عن وجبات سريعة…",
  "ابحث عن خصومات اليوم…",
  "ابحث عن خيرات الريف…",
];