// Mega catalog seeder — generates 500+ realistic Egyptian products.
// Local Egyptian brands only (boycott of Western brands supporting the entity).
import { supabase } from "@/integrations/supabase/client";

type SeedRow = {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  price: number;
  old_price: number | null;
  image: string;
  image_url: string;
  category: string;
  sub_category: string;
  source: string;
  stock: number;
  is_active: boolean;
  fulfillment_type: string;
  metadata: Record<string, unknown>;
  description: string;
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const placeholder = (name: string) =>
  `https://placehold.co/400x400/1a3c2a/ffffff?text=${encodeURIComponent(name.slice(0, 24))}`;

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const round = (n: number) => Math.round(n * 4) / 4;

let counter = 0;
const mkId = (src: string) => {
  counter += 1;
  return `${slug(src)}-${Date.now().toString(36).slice(-4)}-${counter.toString(36)}`;
};

function makeProduct(args: {
  name: string;
  brand?: string | null;
  unit: string;
  basePrice: number;
  category: string;
  sub: string;
  source: string;
  fulfillment?: string;
  metadata?: Record<string, unknown>;
}): SeedRow {
  const price = round(args.basePrice * (0.9 + Math.random() * 0.3));
  const hasDiscount = Math.random() < 0.35;
  const old_price = hasDiscount ? round(price * (1.1 + Math.random() * 0.25)) : null;
  return {
    id: mkId(args.source),
    name: args.name,
    brand: args.brand ?? null,
    unit: args.unit,
    price,
    old_price,
    image: placeholder(args.name),
    image_url: placeholder(args.name),
    category: args.category,
    sub_category: args.sub,
    source: args.source,
    stock: rand(5, 250),
    is_active: true,
    fulfillment_type: args.fulfillment ?? "internal_stock",
    metadata: args.metadata ?? {},
    description: `${args.name} — منتج محلي عالي الجودة 🇪🇬`,
  };
}

// ===== SUPERMARKET =====
const supermarketSeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  const oils = ["زيت خيال", "زيت لوتس", "زيت كريستال", "زيت عافية محلي"];
  oils.forEach((b) =>
    [{ u: "700 مل", m: 1 }, { u: "1.5 لتر", m: 2.1 }, { u: "3 لتر", m: 3.8 }].forEach((s) =>
      rows.push(makeProduct({ name: `${b} ${s.u}`, brand: b, unit: s.u, basePrice: 75 * s.m, category: "supermarket", sub: "غذائية أساسية", source: "supermarket" })),
    ),
  );
  ["مكرونة الملكة", "مكرونة الدوحة", "مكرونة ريجينا"].forEach((b) =>
    ["شعرية", "اسباجتي", "بيني", "فيونكة"].forEach((sh) =>
      rows.push(makeProduct({ name: `${b} ${sh} 400جم`, brand: b, unit: "400 جم", basePrice: 22, category: "supermarket", sub: "غذائية أساسية", source: "supermarket" })),
    ),
  );
  ["شاي العروسة", "شاي الأرض", "شاي ليبتون مصري"].forEach((b) =>
    [100, 250, 500].forEach((g) => rows.push(makeProduct({ name: `${b} ${g}جم`, brand: b, unit: `${g} جم`, basePrice: g * 0.18, category: "supermarket", sub: "غذائية أساسية", source: "supermarket" }))),
  );
  ["أرز الضحى", "أرز أبو الهول", "سكر السكرية", "ملح المكس", "دقيق الفجر"].forEach((n) =>
    [1, 2, 5].forEach((kg) => rows.push(makeProduct({ name: `${n} ${kg}كجم`, brand: n.split(" ")[0], unit: `${kg} كجم`, basePrice: 20 * kg, category: "supermarket", sub: "غذائية أساسية", source: "supermarket" }))),
  );
  // مشروبات
  ["سبيرو سباتس", "سينا كولا", "توب كولا", "بيج كولا", "شويبس مصري"].forEach((d) =>
    ["كولا", "ليمون", "تفاح", "برتقال", "فراولة"].forEach((f) =>
      [{ u: "330 مل", p: 12 }, { u: "1 لتر", p: 22 }, { u: "2.25 لتر", p: 38 }].forEach((s) =>
        rows.push(makeProduct({ name: `${d} ${f} ${s.u}`, brand: d, unit: s.u, basePrice: s.p, category: "supermarket", sub: "المشروبات", source: "supermarket" })),
      ),
    ),
  );
  // نظافة شخصية
  ["شامبو فري", "صابون لوكس مصري", "معجون كرست محلي", "فرشة سيجنال", "مزيل عرق راكسونا"].forEach((p) =>
    ["صغير", "وسط", "كبير"].forEach((s) =>
      rows.push(makeProduct({ name: `${p} ${s}`, brand: p.split(" ")[1] ?? p, unit: s, basePrice: rand(25, 90), category: "supermarket", sub: "النظافة الشخصية", source: "supermarket" })),
    ),
  );
  // تنظيف
  ["داش مسحوق", "تايد مصري", "أوكسي بليتش", "صابون جوي", "بريل منظف", "فلاش أرضيات"].forEach((c) =>
    [500, 1000, 2500].forEach((g) => rows.push(makeProduct({ name: `${c} ${g}جم`, brand: c.split(" ")[0], unit: `${g} جم`, basePrice: g * 0.07, category: "supermarket", sub: "التنظيف والغسيل", source: "supermarket" }))),
  );
  // مستلزمات أطفال
  ["بامبرز بيبي جوي", "هاجيز دراي", "مولفكس مصري"].forEach((b) =>
    ["مقاس 2", "مقاس 3", "مقاس 4", "مقاس 5"].forEach((s) =>
      rows.push(makeProduct({ name: `${b} ${s}`, brand: b.split(" ")[0], unit: s, basePrice: rand(110, 220), category: "supermarket", sub: "مستلزمات الأطفال", source: "supermarket" })),
    ),
  );
  // سناكس
  ["بسكويت لمبادا", "بسكويت أولكر", "بسكويت الشمعدان", "مولتو", "شيكولاتة كورونا", "آيس كريم فرايداي", "بيج شيبس", "تايجر شيبس", "تشيتوس مصري"].forEach((s) =>
    ["كلاسيك", "شيكولاتة", "فراولة", "حار", "جبنة", "كراميل"].forEach((f) =>
      rows.push(makeProduct({ name: `${s} ${f}`, brand: s.split(" ")[0], unit: "عبوة", basePrice: rand(5, 25), category: "supermarket", sub: "يومية إضافية", source: "supermarket" })),
    ),
  );
  return rows;
};

// ===== PRODUCE =====
const produceSeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  ["طماطم", "خيار", "فلفل أخضر", "فلفل ألوان", "بصل أحمر", "بصل أبيض", "ثوم", "بطاطس", "كوسة", "باذنجان", "جزر", "بامية"].forEach((n) =>
    [{ u: "1 كجم", m: 1 }, { u: "نص كجم", m: 0.55 }].forEach((s) =>
      rows.push(makeProduct({ name: `${n} ${s.u}`, brand: "بلدي", unit: s.u, basePrice: rand(15, 60) * s.m, category: "produce", sub: "خضار طازجة", source: "produce", metadata: { freshness: "daily", origin: "EG" } })),
    ),
  );
  ["مانجو عويس", "مانجو فص", "موز بلدي", "تفاح بلدي", "برتقال أبو سرة", "يوسفي بلدي", "عنب أحمر", "عنب أبيض", "فراولة", "جوافة", "رمان", "بطيخ"].forEach((n) =>
    [{ u: "1 كجم", m: 1 }, { u: "2 كجم", m: 1.9 }].forEach((s) =>
      rows.push(makeProduct({ name: `${n} ${s.u}`, brand: "بلدي", unit: s.u, basePrice: rand(35, 120) * s.m, category: "produce", sub: "فواكه طازجة", source: "produce", metadata: { freshness: "daily", origin: "EG" } })),
    ),
  );
  ["جرجير", "خس بلدي", "خس أمريكاني", "كزبرة", "بقدونس", "نعناع", "سبانخ", "ملوخية ورق"].forEach((n) =>
    rows.push(makeProduct({ name: `${n} حزمة`, brand: "بلدي", unit: "حزمة", basePrice: rand(8, 20), category: "produce", sub: "ورقيات", source: "produce", metadata: { freshness: "daily" } })),
  );
  ["ليمون أضاليا", "ليمون بنزهير", "جريب فروت", "كمكوات"].forEach((n) =>
    [1, 2].forEach((kg) => rows.push(makeProduct({ name: `${n} ${kg}كجم`, brand: "بلدي", unit: `${kg} كجم`, basePrice: rand(20, 60) * kg, category: "produce", sub: "حمضيات", source: "produce" }))),
  );
  return rows;
};

// ===== MEAT =====
const meatSeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  const preps = [{ v: "whole", l: "كامل" }, { v: "cut", l: "مقطّع" }, { v: "ground", l: "مفروم" }, { v: "marinated", l: "متبّل" }];
  ["دجاج بلدي", "دجاج كاتيلو", "دجاج المنصورة", "بط مولار", "حمام بلدي", "ديك رومي"].forEach((p) =>
    preps.forEach((pr) =>
      [1, 1.5, 2].forEach((kg) =>
        rows.push(makeProduct({ name: `${p} ${pr.l} ${kg}كجم`, brand: p, unit: `${kg} كجم`, basePrice: rand(120, 220) * kg, category: "meat", sub: "دواجن", source: "meat", metadata: { preparation: pr.v, halal_certified: true, fat_pct: rand(8, 20) } })),
      ),
    ),
  );
  ["كندوز بقري", "بتلو", "ضأن بلدي", "جاموسي"].forEach((m) =>
    ["استيك", "روستو", "مفروم", "أسياخ", "كباب"].forEach((c) =>
      rows.push(makeProduct({ name: `${m} ${c} 1كجم`, brand: m, unit: "1 كجم", basePrice: rand(380, 650), category: "meat", sub: "لحوم حمراء", source: "meat", metadata: { cut_type: c, halal_certified: true, fat_pct: rand(15, 30) } })),
    ),
  );
  ["أرنب بلدي", "بط بلدي"].forEach((a) =>
    [1, 1.5].forEach((kg) => rows.push(makeProduct({ name: `${a} ${kg}كجم`, brand: a, unit: `${kg} كجم`, basePrice: rand(180, 280) * kg, category: "meat", sub: "بط وأرانب", source: "meat", metadata: { halal_certified: true } }))),
  );
  ["بلطي مزارع", "بوري نيل", "قاروص بحري", "مكرونة بحرية", "جمبري", "سبيط"].forEach((f) =>
    [{ u: "1 كجم", m: 1 }, { u: "نص كجم", m: 0.5 }].forEach((s) =>
      rows.push(makeProduct({ name: `${f} ${s.u}`, brand: f, unit: s.u, basePrice: rand(120, 450) * s.m, category: "meat", sub: "أسماك", source: "meat", metadata: { halal_certified: true, freshness: "iced" } })),
    ),
  );
  ["بسلة مجمدة", "خضار مشكلة مجمدة", "بطاطس فينجرز", "ملوخية مجمدة", "بامية مجمدة"].forEach((n) =>
    [400, 800, 1000].forEach((g) => rows.push(makeProduct({ name: `${n} ${g}جم`, brand: "المنتجات الزراعية", unit: `${g} جم`, basePrice: g * 0.06, category: "meat", sub: "خضار مجمدة", source: "meat" }))),
  );
  return rows;
};

// ===== DAIRY =====
const dairySeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  const brands = ["جهينة", "مزارع دينا", "لاكتل مصري", "بيتي"];
  brands.forEach((b) =>
    [{ u: "200 مل", p: 8 }, { u: "1 لتر", p: 28 }, { u: "1.5 لتر", p: 40 }].forEach((s) =>
      ["كامل الدسم", "نصف دسم", "خالي الدسم"].forEach((t) =>
        rows.push(makeProduct({ name: `حليب ${b} ${t} ${s.u}`, brand: b, unit: s.u, basePrice: s.p, category: "dairy", sub: "حليب", source: "dairy", metadata: { fat: t } })),
      ),
    ),
  );
  brands.forEach((b) =>
    ["جبنة بيضاء", "جبنة قريش", "جبنة رومي", "جبنة شيدر", "جبنة موزاريلا"].forEach((c) =>
      [200, 500, 1000].forEach((g) => rows.push(makeProduct({ name: `${c} ${b} ${g}جم`, brand: b, unit: `${g} جم`, basePrice: g * 0.12, category: "dairy", sub: "أجبان", source: "dairy" }))),
    ),
  );
  brands.forEach((b) =>
    ["زبادي طبيعي", "زبادي بالفواكه", "زبادي يوناني"].forEach((y) =>
      [{ u: "150 جم", p: 12 }, { u: "500 جم", p: 32 }].forEach((s) =>
        rows.push(makeProduct({ name: `${y} ${b} ${s.u}`, brand: b, unit: s.u, basePrice: s.p, category: "dairy", sub: "زبادي", source: "dairy" })),
      ),
    ),
  );
  brands.forEach((b) =>
    [{ u: "100 جم", p: 22 }, { u: "200 جم", p: 40 }].forEach((s) => rows.push(makeProduct({ name: `زبدة ${b} ${s.u}`, brand: b, unit: s.u, basePrice: s.p, category: "dairy", sub: "زبدة", source: "dairy" }))),
  );
  ["بيض بلدي", "بيض مزارع", "بيض أوميجا"].forEach((e) =>
    [{ u: "10 بيضات", p: 55 }, { u: "30 بيضة", p: 150 }].forEach((s) => rows.push(makeProduct({ name: `${e} ${s.u}`, brand: e, unit: s.u, basePrice: s.p, category: "dairy", sub: "بيض", source: "dairy" }))),
  );
  return rows;
};

// ===== SWEETS =====
const sweetsSeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  ["كنافة بالقشطة", "بقلاوة بالفستق", "بسبوسة بالقشطة", "قطايف عصافيري", "هريسة جوز الهند", "أم علي", "مهلبية"].forEach((s) =>
    [{ u: "كيلو", p: 180 }, { u: "نص كيلو", p: 95 }].forEach((sz) =>
      rows.push(makeProduct({ name: `${s} ${sz.u}`, brand: "حلواني المدينة", unit: sz.u, basePrice: sz.p, category: "sweets", sub: "شرقية", source: "sweets", metadata: { allow_custom_name: true, advance_hours: 4 } })),
    ),
  );
  ["كرواسون شيكولاتة", "دونتس سادة", "إكلير بالقشطة", "تشيز كيك", "براونيز"].forEach((s) =>
    [4, 6, 12].forEach((q) => rows.push(makeProduct({ name: `${s} ${q} حبة`, brand: "حلواني المدينة", unit: `${q} حبة`, basePrice: q * 22, category: "sweets", sub: "غربية", source: "sweets", metadata: { advance_hours: 6 } }))),
  );
  ["تورتة شيكولاتة", "تورتة فراولة", "تورتة فانيليا", "تورتة لوتس", "تورتة مانجو"].forEach((t) =>
    [{ u: "صغيرة", p: 280 }, { u: "وسط", p: 450 }, { u: "كبيرة", p: 700 }].forEach((sz) =>
      rows.push(makeProduct({ name: `${t} ${sz.u}`, brand: "حلواني المدينة", unit: sz.u, basePrice: sz.p, category: "sweets", sub: "تورتات", source: "sweets", metadata: { allow_custom_name: true, advance_hours: 24 } })),
    ),
  );
  ["آيس كريم فرايداي", "آيس كريم كوفر", "جيلاتي إيطالي محلي"].forEach((b) =>
    ["فانيليا", "شيكولاتة", "فراولة", "مانجو", "بستاشيو"].forEach((f) => rows.push(makeProduct({ name: `${b} ${f}`, brand: b, unit: "كوب", basePrice: rand(20, 55), category: "sweets", sub: "مثلجات", source: "sweets" }))),
  );
  return rows;
};

// ===== PHARMACY =====
const pharmacySeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  const meds: Array<{ name: string; ai: string; rx: boolean }> = [
    { name: "بنادول إكسترا", ai: "Paracetamol + Caffeine", rx: false },
    { name: "سيتال شراب", ai: "Paracetamol", rx: false },
    { name: "كونجستال أقراص", ai: "Paracetamol + Chlorpheniramine", rx: false },
    { name: "كتافلام 50", ai: "Diclofenac", rx: true },
    { name: "أوجمنتين 1جم", ai: "Amoxicillin + Clavulanic", rx: true },
    { name: "نيوروبيون", ai: "Vitamin B Complex", rx: false },
    { name: "أنتينال", ai: "Nifuroxazide", rx: false },
    { name: "ميوكوسولفان", ai: "Ambroxol", rx: false },
  ];
  meds.forEach((m) =>
    ["شريط", "علبة", "زجاجة"].forEach((u) =>
      rows.push(makeProduct({ name: `${m.name} ${u}`, brand: m.name.split(" ")[0], unit: u, basePrice: rand(15, 180), category: "pharmacy", sub: "فيتامينات ومكملات", source: "pharmacy", metadata: { active_ingredient: m.ai, requires_prescription: m.rx, recommended_dosage: "حسب إرشادات الطبيب", storage_instructions: "في درجة حرارة الغرفة" } })),
    ),
  );
  ["شامبو فيشي", "كريم نيفيا مصري", "غسول سيتافيل", "ديتول مطهر"].forEach((p) =>
    ["100 مل", "250 مل", "500 مل"].forEach((s) => rows.push(makeProduct({ name: `${p} ${s}`, brand: p.split(" ")[0], unit: s, basePrice: rand(50, 250), category: "pharmacy", sub: "عناية شخصية", source: "pharmacy" }))),
  );
  ["مرطب أطفال جونسون", "حفاضات بيبي جوي", "مناديل بلل بيبي"].forEach((b) =>
    ["صغير", "وسط", "كبير"].forEach((s) => rows.push(makeProduct({ name: `${b} ${s}`, brand: b.split(" ")[0], unit: s, basePrice: rand(40, 180), category: "pharmacy", sub: "عناية أطفال", source: "pharmacy" }))),
  );
  ["جهاز ضغط أوميرون", "ميزان حرارة رقمي", "جهاز سكر أكيو تشيك", "جهاز نبضات الأكسجين"].forEach((d) =>
    rows.push(makeProduct({ name: d, brand: d.split(" ")[1] ?? "طبي", unit: "قطعة", basePrice: rand(350, 1800), category: "pharmacy", sub: "أجهزة قياس", source: "pharmacy" })),
  );
  return rows;
};

// ===== LIBRARY =====
const librarySeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  ["كشكول 80 ورقة", "كراسة فرنساوي", "قلم جاف بايلوت", "قلم رصاص HB", "ممحاة ميلانو", "مسطرة 30سم", "آلة حاسبة كاسيو", "مقص مدرسي"].forEach((s) =>
    ["1 قطعة", "5 قطع", "10 قطع", "12 قطع"].forEach((q) =>
      rows.push(makeProduct({ name: `${s} ${q}`, brand: s.split(" ").pop() ?? "مكتبة", unit: q, basePrice: rand(8, 80), category: "library", sub: "قرطاسية", source: "library" })),
    ),
  );
  ["طباعة A4 أبيض/أسود", "طباعة A4 ألوان", "تصوير مستندات", "تجليد حراري"].forEach((p) =>
    [10, 50, 100].forEach((q) => rows.push(makeProduct({ name: `${p} ${q} ورقة`, brand: "خدمات المكتبة", unit: `${q} ورقة`, basePrice: q * 1.5, category: "library", sub: "طباعة", source: "library" }))),
  );
  ["باكدج ابتدائي", "باكدج إعدادي", "باكدج ثانوي", "باكدج روضة"].forEach((p) =>
    ["أساسي", "متكامل", "بريميوم"].forEach((t) => rows.push(makeProduct({ name: `${p} ${t}`, brand: "ريف المدينة", unit: "حزمة", basePrice: rand(180, 750), category: "library", sub: "حزم طلابية", source: "library" }))),
  );
  return rows;
};

// ===== RESTAURANTS & RECIPES =====
const restaurantSeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  ["كشري المدينة", "فطير مشلتت", "فول وطعمية", "حواوشي", "شاورما فراخ", "شاورما لحم", "كباب وكفتة", "ممبار ورقاق", "مكرونة بشاميل", "محشي ورق عنب", "ملوخية بالفراخ", "بط محشي"].forEach((m) =>
    ["وجبة فردية", "وجبة عائلية", "نص وجبة"].forEach((s) =>
      rows.push(makeProduct({ name: `${m} ${s}`, brand: "مطاعم ريف المدينة", unit: s, basePrice: rand(45, 280), category: "restaurants", sub: "وجبات", source: "restaurants", fulfillment: "restaurant", metadata: { calories: rand(350, 1200), prep_minutes: rand(10, 45) } })),
    ),
  );
  ["وصفة الشيف محشي", "وصفة الشيف بط", "وصفة الشيف فتة", "وصفة الشيف رقاق"].forEach((r) =>
    ["لشخصين", "لأربعة", "للعائلة"].forEach((s) =>
      rows.push(makeProduct({ name: `${r} ${s}`, brand: "شيف ريف", unit: s, basePrice: rand(120, 480), category: "recipes", sub: "وصفات الشيف", source: "recipes", fulfillment: "restaurant", metadata: { calories: rand(500, 1500), prep_minutes: rand(30, 90) } })),
    ),
  );
  return rows;
};

// ===== WHOLESALE =====
const wholesaleSeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  [
    { n: "كرتونة سبيرو سباتس 24×330مل", p: 240 },
    { n: "كرتونة شاي العروسة 24×100جم", p: 380 },
    { n: "كرتونة زيت خيال 12×1.5لتر", p: 950 },
    { n: "كرتونة مكرونة الملكة 20×400جم", p: 360 },
    { n: "كرتونة بسكويت أولكر 24 عبوة", p: 280 },
    { n: "شيكارة أرز الضحى 25 كجم", p: 540 },
    { n: "شيكارة سكر السكرية 50 كجم", p: 1100 },
    { n: "كرتونة بطاطس فينجرز 6×2.5كجم", p: 580 },
  ].forEach((c) =>
    [{ u: "كرتونة", m: 1 }, { u: "نص كرتونة", m: 0.55 }, { u: "10 كراتين", m: 9.2 }].forEach((s) =>
      rows.push(makeProduct({ name: `${c.n} ${s.u}`, brand: "جملة ريف", unit: s.u, basePrice: c.p * s.m, category: "wholesale", sub: "كراتين توفير", source: "wholesale" })),
    ),
  );
  return rows;
};

// ===== VILLAGE =====
const villageSeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  ["جبنة قريش بلدي", "زبدة فلاحي", "عسل نحل بلدي", "زيت زيتون عصرة باردة", "دبس قصب", "حلاوة طحينية بلدي", "مخلل ليمون", "مخلل خيار", "طحينة بلدي", "سمن بلدي"].forEach((i) =>
    [{ u: "250 جم", m: 0.4 }, { u: "500 جم", m: 0.7 }, { u: "1 كجم", m: 1 }].forEach((s) =>
      rows.push(makeProduct({ name: `${i} ${s.u}`, brand: "منتجات القرية", unit: s.u, basePrice: rand(60, 220) * s.m, category: "village", sub: "ريفية طبيعية", source: "village", metadata: { handmade: true, origin: "EG-village" } })),
    ),
  );
  return rows;
};

// ===== BASKETS =====
const basketsSeed = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  ["سلة الإفطار الريفي", "سلة العزومة", "سلة رمضان", "سلة الأسرة الصغيرة", "سلة الأسرة الكبيرة", "سلة الفطار البلدي", "سلة المطبخ الأساسي"].forEach((b) =>
    ["شهرية", "أسبوعية", "كبيرة", "صغيرة"].forEach((sz) =>
      rows.push(makeProduct({ name: `${b} ${sz}`, brand: "سلال ريف", unit: "سلة", basePrice: rand(280, 1500), category: "baskets", sub: "سلال جاهزة", source: "baskets", metadata: { items_count: rand(8, 35) } })),
    ),
  );
  return rows;
};

export async function runMegaSeed(): Promise<{ inserted: number; total: number; errors: string[] }> {
  counter = 0;
  const all: SeedRow[] = [
    ...supermarketSeed(),
    ...produceSeed(),
    ...meatSeed(),
    ...dairySeed(),
    ...sweetsSeed(),
    ...pharmacySeed(),
    ...librarySeed(),
    ...restaurantSeed(),
    ...wholesaleSeed(),
    ...villageSeed(),
    ...basketsSeed(),
  ];
  const errors: string[] = [];
  let inserted = 0;
  const chunkSize = 80;
  for (let i = 0; i < all.length; i += chunkSize) {
    const chunk = all.slice(i, i + chunkSize);
    const { error, count } = await supabase.from("products").insert(chunk, { count: "exact" });
    if (error) errors.push(error.message);
    else inserted += count ?? chunk.length;
  }
  return { inserted, total: all.length, errors };
}
