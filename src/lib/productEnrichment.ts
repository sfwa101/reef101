/**
 * Per-product trust badges, chef descriptions, smart related products, and
 * extra gallery images. Falls back gracefully when no enrichment exists for
 * a given product id.
 */
import type { Product } from "./products";
import { products } from "./products";

export type TrustBadge = {
  emoji: string;
  label: string;
};

/** Trust badges by source — applied to every product of that source unless overridden. */
const SOURCE_BADGES: Record<Product["source"], TrustBadge[]> = {
  produce:     [{ emoji: "🌿", label: "طبيعي 100%" }, { emoji: "🚚", label: "حصاد اليوم" }],
  dairy:       [{ emoji: "🐄", label: "من المزرعة" }, { emoji: "❄️", label: "سلسلة تبريد" }],
  meat:        [{ emoji: "🔪", label: "ذبح اليوم" }, { emoji: "✅", label: "حلال موثّق" }, { emoji: "❄️", label: "مبرّد لا مجمّد" }],
  village:     [{ emoji: "🌾", label: "بلدي أصيل" }, { emoji: "🏡", label: "من القرية" }, { emoji: "🚫", label: "بدون مواد حافظة" }],
  kitchen:     [{ emoji: "👨‍🍳", label: "تحضير شيف" }, { emoji: "🔥", label: "ساخن طازج" }],
  recipes:     [{ emoji: "📋", label: "وصفة شيف" }, { emoji: "🥗", label: "متوازن غذائياً" }],
  pharmacy:    [{ emoji: "💊", label: "أصلي 100%" }, { emoji: "🏥", label: "معتمد طبياً" }],
  library:     [{ emoji: "📚", label: "خامة فاخرة" }],
  wholesale:   [{ emoji: "💰", label: "سعر الجملة" }],
  baskets:     [{ emoji: "🎁", label: "تشكيلة مختارة" }, { emoji: "💚", label: "وفّر أكثر" }],
  restaurants: [{ emoji: "🍽️", label: "من المطعم" }, { emoji: "🔥", label: "ساخن طازج" }],
  sweets:      [{ emoji: "🍰", label: "تحضير يومي" }, { emoji: "🌟", label: "خامات فاخرة" }],
  supermarket: [{ emoji: "✅", label: "أصلي" }],
  home:        [{ emoji: "✅", label: "ضمان جودة" }],
};

/** Per-product overrides — most powerful, takes priority. */
const PRODUCT_BADGES: Record<string, TrustBadge[]> = {
  honey:        [{ emoji: "🐝", label: "خام طبيعي" }, { emoji: "🚫", label: "بدون سكر مضاف" }, { emoji: "🏺", label: "بلدي 100%" }],
  ghee:         [{ emoji: "🐄", label: "بقري بلدي" }, { emoji: "🌾", label: "تقليدي" }, { emoji: "❄️", label: "يخض كل جمعة" }],
  "village-cheese": [{ emoji: "🐄", label: "حليب طازج" }, { emoji: "🌾", label: "بلدي" }, { emoji: "🚫", label: "بدون مواد حافظة" }],
  eggs:         [{ emoji: "🐔", label: "تربية حرة" }, { emoji: "🌾", label: "علف طبيعي" }],
  "village-eggs": [{ emoji: "🐔", label: "بلدي حر" }, { emoji: "🥚", label: "طازج اليوم" }],
  beef:         [{ emoji: "🔪", label: "ذبح اليوم" }, { emoji: "✅", label: "حلال موثّق" }, { emoji: "❄️", label: "مبرّد لا مجمّد" }],
  "meat-veal":  [{ emoji: "🔪", label: "ذبح اليوم" }, { emoji: "✅", label: "حلال موثّق" }, { emoji: "🥩", label: "بتلو فاخر" }],
  "meat-lamb":  [{ emoji: "🐑", label: "ضأن بلدي" }, { emoji: "✅", label: "حلال موثّق" }, { emoji: "❄️", label: "مبرّد لا مجمّد" }],
  salmon:       [{ emoji: "🐟", label: "سلمون نرويجي" }, { emoji: "❄️", label: "طازج مبرّد" }],
  "meat-fish":  [{ emoji: "🌊", label: "صيد اليوم" }, { emoji: "❄️", label: "طازج مبرّد" }],
  oil:          [{ emoji: "🫒", label: "بكر ممتاز" }, { emoji: "🌿", label: "عصرة باردة" }],
  coffee:       [{ emoji: "☕", label: "محمصة طازج" }, { emoji: "🇧🇷", label: "حبوب فاخرة" }],
  rice:         [{ emoji: "🌾", label: "بسمتي ممتاز" }, { emoji: "🇮🇳", label: "هندي أصلي" }],
  vitamin:      [{ emoji: "🇩🇪", label: "ألماني الصنع" }, { emoji: "🏥", label: "معتمد طبياً" }],
  bread:        [{ emoji: "🥖", label: "خميرة طبيعية" }, { emoji: "🔥", label: "خبيز اليوم" }],
};

export const trustBadgesFor = (p: Product): TrustBadge[] => {
  return PRODUCT_BADGES[p.id] ?? SOURCE_BADGES[p.source] ?? [];
};

/* ============= Chef descriptions / nutrition copy ============= */

export type ChefBlock = {
  /** "وصف الشيف" or "القيمة الغذائية" */
  title: string;
  body: string;
  emoji: string;
};

const CHEF_BLOCKS: Record<string, ChefBlock> = {
  beef:    { emoji: "👨‍🍳", title: "وصف الشيف", body: "لحم بقري طازج مثالي للستيك والشواء على الفحم — اتركه يرتاح 5 دقائق بعد الطهي ليحتفظ بعصارته. يحتوي على بروتين عالي الجودة (~26 جم/100جم) ومثالي للرياضيين." },
  "meat-veal": { emoji: "👨‍🍳", title: "وصف الشيف", body: "بتلو طري بلون وردي فاخر — مناسب للأسكالوب والإسكالوب الإيطالي. اطهيه على نار متوسطة لتحتفظ بطراوته. منخفض الدهون وغني بالحديد." },
  "meat-lamb": { emoji: "👨‍🍳", title: "وصف الشيف", body: "ضأن بلدي رضيع — مثالي للمندي والخروف المحشي. يتبّل بالكمون والقرفة وزيت الزيتون. غني بفيتامين B12 والزنك." },
  chicken: { emoji: "👨‍🍳", title: "وصف الشيف", body: "دجاج مشوي بأعشاب الزعتر والروزماري — وجبة متوازنة تحتوي على ~32 جم بروتين. مثالي بعد التمرين أو لأنظمة الكيتو والبروتين العالي." },
  salmon:  { emoji: "🐟", title: "القيمة الغذائية", body: "سلمون نرويجي غني بالأوميجا 3 (~2.3جم/حصة) وفيتامين D وB12 — مفيد لصحة القلب والمخ. وجبة كاملة لأصحاب الحميات." },
  honey:   { emoji: "🍯", title: "وصف الشيف", body: "عسل نحل بلدي خام — لم يتم تسخينه أو فلترته صناعياً. ملعقة صغيرة قبل النوم تحسّن جودته. مناسب لمرضى السكري بكميات معتدلة (مؤشر جلايسيمي 35-58)." },
  ghee:    { emoji: "🌾", title: "وصف الشيف", body: "سمن بقري مخضوض في الجرّة — مثالي للأرز البخاري والكنافة والحلويات الشرقية. خالٍ من اللاكتوز ومناسب للكيتو. نقطة دخان عالية (250°م) مثالي للقلي." },
  "village-cheese": { emoji: "🧀", title: "وصف الشيف", body: "جبنة قريش بلدية طازجة — مصدر ممتاز للكالسيوم والبروتين (~14جم/100جم). تتبّل بزيت الزيتون والزعتر للإفطار، أو تستخدم في السلطات والشوربات." },
  eggs:    { emoji: "🥚", title: "القيمة الغذائية", body: "بيض بلدي حر — أعلى في الأوميجا 3 وفيتامين A من البيض التجاري. حصة (بيضتان) = 12جم بروتين كامل، مثالي للإفطار الصحي والرياضيين." },
  rice:    { emoji: "🍚", title: "وصف الشيف", body: "أرز بسمتي طويل الحبة من سفوح الهيمالايا — خفّفه نقعاً 30 دقيقة قبل الطبخ ليأتي مفلفل. مؤشر جلايسيمي منخفض (~50) أفضل من الأرز الأبيض العادي." },
  oil:     { emoji: "🫒", title: "القيمة الغذائية", body: "زيت زيتون بكر ممتاز عصرة باردة — غني بـ Polyphenols ومضادات الأكسدة. ملعقتان يومياً يخفضان الكوليسترول الضار. مثالي للسلطات والتغميس." },
  yogurt:  { emoji: "🥛", title: "القيمة الغذائية", body: "زبادي يوناني مصفى — مضاعف البروتين (~10جم/كوب) ومنخفض السكر. ممتاز كوجبة بعد التمرين أو ضمن حميات إنقاص الوزن." },
  bread:   { emoji: "🥖", title: "وصف الشيف", body: "خبز ساوردو حرفي مخمّر 24 ساعة — هضم أسهل من الخبز التجاري لاحتوائه على بكتيريا نافعة. مؤشر جلايسيمي أقل (~54)." },
  banana:  { emoji: "🍌", title: "القيمة الغذائية", body: "موز إكوادوري — مصدر طبيعي للبوتاسيوم (~422 ملج) والطاقة السريعة. مثالي قبل التمرين أو وجبة خفيفة بين الوجبات." },
  apple:   { emoji: "🍎", title: "القيمة الغذائية", body: "تفاح أحمر مستورد — مصدر ممتاز للألياف القابلة للذوبان (4جم/تفاحة) ومضادات أكسدة. مثالي للسناك ولأصحاب حميات إنقاص الوزن." },
  vitamin: { emoji: "💊", title: "النصيحة الطبية", body: "فيتامين د3 يدعم صحة العظام والمناعة — حبة يومياً مع وجبة دسمة لأقصى امتصاص. يُنصح بفحص مستوى الفيتامين كل 6 أشهر." },
  coffee:  { emoji: "☕", title: "وصف الباريستا", body: "حبوب عربية محمصة وسط — تطحن قبل التحضير مباشرة لأفضل نكهة. مثالية للإسبرسو وقهوة الفلتر. كافيين معتدل (~95 ملج/كوب)." },
};

export const chefBlockFor = (p: Product): ChefBlock | null => {
  return CHEF_BLOCKS[p.id] ?? null;
};

/* ============= Smart related products ("يكمل تجربتك") ============= */

const RELATED_MAP: Record<string, string[]> = {
  // dairy + bakery pairs
  "village-cheese": ["bread", "honey", "olives", "village-eggs"],
  cheese:        ["bread", "olives", "butter"],
  butter:        ["bread", "honey", "milk"],
  milk:          ["coffee", "cereal", "cookies"],
  yogurt:        ["honey", "banana", "strawberry"],
  eggs:          ["bread", "butter", "cheese"],
  "village-eggs": ["village-cheese", "honey", "ghee"],

  // meat + sides
  beef:          ["rice", "oil", "meat-frozen-veg"],
  "meat-veal":   ["rice", "oil", "village-cheese"],
  "meat-lamb":   ["rice", "ghee", "honey"],
  "chicken-raw": ["rice", "oil", "meat-frozen-veg"],
  chicken:       ["rice", "juice", "icecream"],
  salmon:        ["rice", "oil", "lettuce"],

  // pantry + drinks
  rice:          ["oil", "ghee", "beef"],
  pasta:         ["oil", "cheese", "vitamin"],
  oil:           ["pasta", "rice", "lettuce"],
  bread:         ["butter", "cheese", "honey"],
  coffee:        ["milk", "cookies", "cereal"],
  cereal:        ["milk", "honey", "banana"],

  // village
  honey:         ["village-cheese", "bread", "yogurt"],
  ghee:          ["rice", "honey", "village-cheese"],
  olives:        ["bread", "village-cheese", "oil"],
  molasses:      ["bread", "ghee", "village-cheese"],

  // produce
  banana:        ["yogurt", "milk", "honey"],
  apple:         ["yogurt", "honey", "cookies"],
  strawberry:    ["yogurt", "icecream", "honey"],
  lettuce:       ["oil", "tomato", "cucumber"],
  tomato:        ["cucumber", "oil", "lettuce"],

  // library
  notebook:      ["pens", "stationery", "book"],
  pens:          ["notebook", "stationery"],
  stationery:    ["notebook", "pens", "book"],
  book:          ["notebook", "pens"],

  // sweets
  "cake-choco":  ["sweet-baklava", "coffee", "icecream"],
  "cake-cheese": ["coffee", "strawberry", "sweet-macaron"],
  "sweet-konafa": ["coffee", "icecream"],
  icecream:      ["sweet-donuts", "strawberry", "cake-choco"],

  // pharmacy
  vitamin:       ["honey", "yogurt", "village-eggs"],
};

/** Strip variant/addon suffixes back to base product id. */
const baseId = (id: string): string => id.split("__")[0];

/** Default fallback: pick 4 different products from same source. */
const fallbackRelated = (p: Product, excludeId: string): Product[] => {
  return products
    .filter((x) => x.source === p.source && x.id !== excludeId && x.id !== p.id)
    .slice(0, 4);
};

export const relatedProductsFor = (p: Product, max = 4): Product[] => {
  const ids = RELATED_MAP[baseId(p.id)] ?? [];
  const found: Product[] = [];
  for (const id of ids) {
    const item = products.find((x) => x.id === id);
    if (item && item.id !== p.id) found.push(item);
    if (found.length >= max) break;
  }
  if (found.length < max) {
    const fill = fallbackRelated(p, p.id).filter(
      (x) => !found.some((f) => f.id === x.id),
    );
    found.push(...fill.slice(0, max - found.length));
  }
  return found.slice(0, max);
};
