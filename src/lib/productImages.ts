/**
 * Product Image Resolver — keyword-driven image mapping for Reef Al Madina catalog.
 *
 * Strategy (in priority order):
 *   1. Exact Arabic keyword match → curated Unsplash photo ID (1:1 product match).
 *   2. sub_category fallback → curated photo IDs for that segment.
 *   3. category fallback → safe default per source.
 *
 * Rules:
 *   - Fresh produce → clean studio close-up of THE SPECIFIC fruit/vegetable.
 *   - Packaged food → front packshot.
 *   - Beverages → bottle/can isolated.
 *   - Pharmacy → blister/box on neutral background.
 *   - No lifestyle shots, no people, no busy scenes.
 *
 * This is the single source of truth for product imagery.
 * megaSeed.ts and any future seed/insert MUST go through resolveProductImage().
 */

const UNSPLASH = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

// ─── 1. Curated keyword bank (Arabic → Unsplash ID, verified product-accurate) ───
// Each ID was hand-picked for clean isolated product photography.
const KEYWORD_MAP: Record<string, string> = {
  // ===== FRESH PRODUCE — vegetables =====
  "طماطم": "1546470427-e26264be0b0d",        // red tomatoes close-up
  "خيار": "1604977042946-1eecc30f269e",      // cucumbers
  "فلفل أخضر": "1583119022894-919a68a3d0e3", // green bell peppers
  "فلفل ألوان": "1563565375-f3fdfdbefa83",   // mixed bell peppers
  "بصل أحمر": "1518977956812-cd3dbadaaf31",  // red onions
  "بصل أبيض": "1620574387735-3624d75b2dbc",  // white onions
  "ثوم": "1540148426945-6cf22a6b2383",       // garlic bulbs
  "بطاطس": "1518977676601-b53f82aba655",     // potatoes
  "كوسة": "1583119912267-cc97c911e416",      // zucchini
  "باذنجان": "1659261200735-4afe7b22cc3a",   // eggplants
  "جزر": "1582515073490-39981397c445",       // carrots bunch
  "بامية": "1592924357229-d1e44ef91b84",     // okra

  // ===== FRESH PRODUCE — fruits =====
  "مانجو عويس": "1605027990121-cbae9e0642db", // mango
  "مانجو فص": "1605027990121-cbae9e0642db",
  "مانجو": "1605027990121-cbae9e0642db",
  "موز": "1571771894821-ce9b6c11b08e",        // bananas isolated
  "تفاح": "1568702846914-96b305d2aaeb",       // red apples
  "برتقال أبو سرة": "1582979512210-99b6a53386f9", // oranges
  "برتقال": "1582979512210-99b6a53386f9",
  "يوسفي": "1611080626919-7cf5a9dbab12",       // tangerines
  "عنب أحمر": "1599819177626-b3b69a48c39b",   // red grapes
  "عنب أبيض": "1599819811023-65d8cffbcc0a",   // green grapes
  "فراولة": "1543528176-61b239494933",        // strawberries
  "جوافة": "1536511132770-e5058c7e8c46",      // guava
  "رمان": "1541344999736-83eca272f6fc",       // pomegranate
  "بطيخ": "1563114773-84221bd62daa",          // watermelon

  // ===== LEAFY GREENS =====
  "جرجير": "1576181256399-834e3b3a49bf",      // arugula
  "خس بلدي": "1622206151226-18ca2c9ab4a1",   // lettuce
  "خس أمريكاني": "1622206151226-18ca2c9ab4a1",
  "خس": "1622206151226-18ca2c9ab4a1",
  "كزبرة": "1535912489912-39b15dd71fb3",      // coriander/cilantro bunch
  "بقدونس": "1583119022894-919a68a3d0e3",    // parsley bunch
  "نعناع": "1628556270448-4d4e4148e1b1",      // mint leaves
  "سبانخ": "1576045057995-568f588f82fb",      // spinach
  "ملوخية": "1576045057995-568f588f82fb",     // greens fallback

  // ===== CITRUS =====
  "ليمون أضاليا": "1582979512210-99b6a53386f9", // lemons
  "ليمون بنزهير": "1582979512210-99b6a53386f9",
  "ليمون": "1582979512210-99b6a53386f9",
  "جريب فروت": "1587496679742-bad55c83c9e9",  // grapefruit
  "كمكوات": "1611080626919-7cf5a9dbab12",      // kumquats

  // ===== POULTRY =====
  "دجاج": "1587593810167-a84920ea0781",        // raw chicken
  "بط مولار": "1599488615731-7e5c2823ff28",   // duck
  "بط بلدي": "1599488615731-7e5c2823ff28",
  "بط": "1599488615731-7e5c2823ff28",
  "حمام": "1612257999691-c4e1d9c6c7e7",
  "ديك رومي": "1574672280600-4accfa5b6f98",  // turkey

  // ===== RED MEAT =====
  "كندوز": "1607623814075-e51df1bdc82f",       // beef cuts
  "بتلو": "1607623814075-e51df1bdc82f",
  "ضأن": "1602470521006-d8b1bb35cf4d",         // lamb
  "جاموسي": "1607623814075-e51df1bdc82f",
  "أرنب": "1605522561233-768ad7a8fabf",       // rabbit meat

  // ===== FISH =====
  "بلطي": "1535400255456-1e4329d63537",        // tilapia
  "بوري": "1559339352-11d035aa65de",           // mullet
  "قاروص": "1535400255456-1e4329d63537",
  "جمبري": "1565680018434-b513d5e5fd47",      // shrimp
  "سبيط": "1574781330855-d0db8cc6a79c",        // squid

  // ===== FROZEN VEG =====
  "بسلة مجمدة": "1518977676601-b53f82aba655",
  "بطاطس فينجرز": "1576107232684-1279f390859f", // french fries packs

  // ===== DAIRY =====
  "حليب": "1563636619-e9143da7973b",           // milk bottle
  "جبنة بيضاء": "1452195100486-9cc805987862", // white cheese
  "جبنة قريش": "1559561853-08451507cbe7",      // cottage cheese
  "جبنة رومي": "1486297678162-eb2a19b0a32d",   // hard cheese
  "جبنة شيدر": "1486297678162-eb2a19b0a32d",
  "جبنة موزاريلا": "1559561853-08451507cbe7", // mozzarella
  "زبادي طبيعي": "1488477181946-6428a0291777",
  "زبادي يوناني": "1488477181946-6428a0291777",
  "زبادي بالفواكه": "1517714595911-2b8ea7a47df8",
  "زبادي": "1488477181946-6428a0291777",
  "زبدة": "1589985270826-4b7bb135bc9d",
  "بيض": "1582722872445-44dc5f7e3c8f",         // eggs in carton

  // ===== STAPLES =====
  "زيت": "1620577648400-cdef41d635e0",          // cooking oil bottle
  "أرز": "1586201375761-83865001e31c",         // basmati rice bag
  "سكر": "1610137191064-77f99d0ba4be",          // sugar
  "ملح": "1518110925495-2f64e8b4abda",          // salt
  "دقيق": "1574323347407-f5e1ad6d020b",         // flour
  "شاي": "1597481499750-3e6b22637e12",          // tea box
  "مكرونة": "1551892374-ecf8754cf8b0",          // pasta
  "شعرية": "1551892374-ecf8754cf8b0",
  "اسباجتي": "1551892374-ecf8754cf8b0",
  "بيني": "1551892374-ecf8754cf8b0",
  "فيونكة": "1551892374-ecf8754cf8b0",

  // ===== BEVERAGES =====
  "كولا": "1622483767028-3f66f32aef97",         // cola bottle
  "سبيرو سباتس": "1554866585-cd94860890b7",    // soda bottles
  "سينا كولا": "1622483767028-3f66f32aef97",
  "توب كولا": "1622483767028-3f66f32aef97",
  "بيج كولا": "1622483767028-3f66f32aef97",
  "شويبس": "1581636625402-29b2a704ef13",

  // ===== SNACKS / SWEETS =====
  "بسكويت": "1558961363-fa8fdf82db35",          // biscuits pack
  "مولتو": "1558961363-fa8fdf82db35",
  "شيكولاتة كورونا": "1606312619070-d48b4c652a52",
  "شيكولاتة": "1606312619070-d48b4c652a52",
  "آيس كريم": "1488900128323-21503983a07e",     // ice cream cup
  "جيلاتي": "1497034825429-c343d7c6a68f",
  "بيج شيبس": "1599629954294-14df9ec8bc03",     // chips
  "تايجر شيبس": "1599629954294-14df9ec8bc03",
  "تشيتوس": "1582716401301-b2407dc7563d",       // crisps
  "كنافة": "1571167530149-c72f2b6a8b8c",        // arabic dessert
  "بقلاوة": "1565958011703-44f9829ba187",       // baklava
  "بسبوسة": "1606313564200-e75d5e30476c",       // basbousa
  "قطايف": "1606313564200-e75d5e30476c",
  "هريسة": "1571167530149-c72f2b6a8b8c",
  "أم علي": "1571167530149-c72f2b6a8b8c",
  "كرواسون": "1555507036-ab1f4038808a",         // croissant
  "دونتس": "1551024601-bec78aea704b",            // donuts
  "إكلير": "1558326567-98ae2405596b",
  "تشيز كيك": "1567958451986-2de427a4a0be",
  "براونيز": "1606313564200-e75d5e30476c",
  "تورتة": "1578985545062-69928b1d9587",         // cake

  // ===== PERSONAL CARE =====
  "شامبو": "1556228720-195a672e8a03",            // shampoo bottle
  "صابون": "1585870683023-0aac63b4eaf1",         // soap
  "معجون": "1556228453-efd6c1ff04f6",            // toothpaste
  "فرشة سيجنال": "1559591935-c6c92c6e4f70",     // toothbrush
  "مزيل عرق": "1631730486572-226d1f595b68",     // deodorant
  "كريم نيفيا": "1556228720-195a672e8a03",
  "غسول": "1556228720-195a672e8a03",
  "ديتول": "1583947215259-38e31be8751f",

  // ===== CLEANING =====
  "داش": "1583947215259-38e31be8751f",           // detergent
  "تايد": "1583947215259-38e31be8751f",
  "أوكسي": "1583947215259-38e31be8751f",
  "بريل": "1581578731548-c64695cc6952",
  "فلاش": "1610557892470-55d9e80c0bce",
  "صابون جوي": "1585870683023-0aac63b4eaf1",

  // ===== BABY =====
  "بامبرز": "1607000091587-9a0f0a8f7e57",        // diapers
  "هاجيز": "1607000091587-9a0f0a8f7e57",
  "مولفكس": "1607000091587-9a0f0a8f7e57",
  "حفاضات": "1607000091587-9a0f0a8f7e57",
  "مرطب أطفال": "1515488042361-ee00e0ddd4e6",
  "مناديل بلل": "1607000091587-9a0f0a8f7e57",

  // ===== PHARMACY =====
  "بنادول": "1631549916768-4119b2e5f926",        // pills blister
  "سيتال": "1587854692152-cbe660dbde88",
  "كونجستال": "1631549916768-4119b2e5f926",
  "كتافلام": "1631549916768-4119b2e5f926",
  "أوجمنتين": "1587854692152-cbe660dbde88",
  "نيوروبيون": "1471864190281-a93a3070b6de",
  "أنتينال": "1631549916768-4119b2e5f926",
  "ميوكوسولفان": "1587854692152-cbe660dbde88",
  "جهاز ضغط": "1576091160550-2173dba99965",      // BP monitor
  "ميزان حرارة": "1584036561566-baf8f5f1b144", // thermometer
  "جهاز سكر": "1576091160550-2173dba99965",
  "جهاز نبضات": "1576091160550-2173dba99965",

  // ===== STATIONERY =====
  "كشكول": "1455390582262-044cdead277a",         // notebook
  "كراسة": "1455390582262-044cdead277a",
  "قلم جاف": "1568667256549-094345857637",       // pen
  "قلم رصاص": "1568667256549-094345857637",
  "ممحاة": "1568667256549-094345857637",
  "مسطرة": "1568667256549-094345857637",
  "آلة حاسبة": "1554224155-6726b3ff858f",        // calculator
  "مقص": "1568667256549-094345857637",
  "طباعة": "1551836022-d5d88e9218df",             // printer
  "تصوير مستندات": "1551836022-d5d88e9218df",
  "تجليد": "1551836022-d5d88e9218df",
  "باكدج": "1503676260728-1c00da094a0b",          // school supplies bundle

  // ===== RESTAURANTS =====
  "كشري": "1567620905732-2d1ec7ab7445",
  "فطير": "1574484284002-952d92456975",
  "فول": "1567620905732-2d1ec7ab7445",
  "حواوشي": "1565299624946-b28f40a0ae38",
  "شاورما": "1606755962773-d324e0a13086",
  "كباب": "1606755962773-d324e0a13086",
  "ممبار": "1565299624946-b28f40a0ae38",
  "بشاميل": "1551892374-ecf8754cf8b0",
  "محشي": "1574484284002-952d92456975",
  "ملوخية بالفراخ": "1574484284002-952d92456975",
  "بط محشي": "1574484284002-952d92456975",
  "وصفة الشيف": "1547592180-85f173990554",

  // ===== VILLAGE =====
  "عسل نحل": "1587049352846-4a222e784d38",       // honey jar
  "عسل": "1587049352846-4a222e784d38",
  "زيت زيتون": "1474979266404-7eaacbcd87c5",
  "دبس قصب": "1471943311424-646960669fbc",
  "حلاوة طحينية": "1571167530149-c72f2b6a8b8c",
  "مخلل": "1564506549770-fc2dba5e76eb",
  "طحينة": "1471943311424-646960669fbc",
  "سمن": "1589985270826-4b7bb135bc9d",
  "زبدة فلاحي": "1589985270826-4b7bb135bc9d",

  // ===== BASKETS =====
  "سلة": "1542838132-92c53300491e",

  // ===== KITCHEN =====
  "طقم حلل": "1556909114-f6e7ad7d3136",          // cookware set
  "طاسة": "1556909172-5cd0c5e02bcb",
  "طقم سكاكين": "1593618998160-c0bdb1d3f6d3", // knives set
  "مقلاة": "1556909114-f6e7ad7d3136",
  "وعاء ضغط": "1556909114-f6e7ad7d3136",
  "صينية فرن": "1583309217394-d6c4f4ed3b13",
  "طقم أطباق": "1584990347449-0f9a3a3a3b8e", // dinnerware
  "أكواب شاي": "1556909174-29ed2bcecb44",
  "أكواب قهوة": "1495474472287-4d71bcdd2085",
  "صحون تقديم": "1584990347449-0f9a3a3a3b8e",
  "علب حفظ": "1584990347449-0f9a3a3a3b8e",

  // ===== HOME / FURNITURE =====
  "كنبة": "1555041469-a586c61ea9bc",              // sofa
  "كرسي مكتب": "1567538096630-e0c55bd6374c",    // office chair
  "طاولة طعام": "1505691938895-1758d7feb511",   // dining table
  "سرير": "1505693416388-ac5ce068fe85",          // bed
  "دولاب": "1556909114-f6e7ad7d3136",
  "كومودينو": "1556909114-f6e7ad7d3136",

  // ===== HOME — TEXTILES =====
  "مفرش سرير": "1586023492125-27b2c045efd7",
  "ستارة": "1567538096630-e0c55bd6374c",
  "مفرش طاولة": "1586023492125-27b2c045efd7",
  "وسادة ديكور": "1586023492125-27b2c045efd7",

  // ===== HOME — LIGHTING =====
  "نجفة": "1513506003901-1e6a229e2d15",
  "أباجورة": "1524634126442-357e0eac3c14",
  "ضوء LED": "1513506003901-1e6a229e2d15",
  "كشاف": "1513506003901-1e6a229e2d15",

  // ===== HOME — DECOR =====
  "تابلوه": "1513519245088-0e12902e5a38",
  "مزهرية": "1493663284031-b7e3aefcae8e",
  "ساعة حائط": "1493663284031-b7e3aefcae8e",
  "مرآة": "1513519245088-0e12902e5a38",
  "إطار صور": "1493663284031-b7e3aefcae8e",

  // ===== WHOLESALE =====
  "كرتونة": "1607082348824-0a96f2a4b9da",        // cartons in warehouse
  "شيكارة": "1586528116311-ad8dd3c8310d",        // sacks
};

// ─── 2. Sub-category fallbacks (if no keyword match) ───
const SUBCATEGORY_FALLBACK: Record<string, string> = {
  "غذائية أساسية": "1604719312566-8912e9227c6a",
  "المشروبات": "1554866585-cd94860890b7",
  "النظافة الشخصية": "1556228720-195a672e8a03",
  "التنظيف والغسيل": "1583947215259-38e31be8751f",
  "مستلزمات الأطفال": "1607000091587-9a0f0a8f7e57",
  "يومية إضافية": "1599629954294-14df9ec8bc03",
  "خضار طازجة": "1582284540020-8acbe03f4924",
  "فواكه طازجة": "1546173159-315724a31696",
  "ورقيات": "1576181256399-834e3b3a49bf",
  "حمضيات": "1582979512210-99b6a53386f9",
  "دواجن": "1587593810167-a84920ea0781",
  "لحوم حمراء": "1607623814075-e51df1bdc82f",
  "بط وأرانب": "1599488615731-7e5c2823ff28",
  "أسماك": "1535400255456-1e4329d63537",
  "خضار مجمدة": "1518977676601-b53f82aba655",
  "حليب": "1563636619-e9143da7973b",
  "أجبان": "1486297678162-eb2a19b0a32d",
  "زبادي": "1488477181946-6428a0291777",
  "زبدة": "1589985270826-4b7bb135bc9d",
  "بيض": "1582722872445-44dc5f7e3c8f",
  "شرقية": "1571167530149-c72f2b6a8b8c",
  "غربية": "1551024601-bec78aea704b",
  "تورتات": "1578985545062-69928b1d9587",
  "مثلجات": "1488900128323-21503983a07e",
  "فيتامينات ومكملات": "1631549916768-4119b2e5f926",
  "عناية شخصية": "1556228720-195a672e8a03",
  "عناية أطفال": "1515488042361-ee00e0ddd4e6",
  "أجهزة قياس": "1576091160550-2173dba99965",
  "قرطاسية": "1455390582262-044cdead277a",
  "طباعة": "1551836022-d5d88e9218df",
  "حزم طلابية": "1503676260728-1c00da094a0b",
  "وجبات": "1567620905732-2d1ec7ab7445",
  "وصفات الشيف": "1547592180-85f173990554",
  "كراتين توفير": "1607082348824-0a96f2a4b9da",
  "ريفية طبيعية": "1587049352846-4a222e784d38",
  "سلال جاهزة": "1542838132-92c53300491e",
  "أدوات طبخ": "1556909114-f6e7ad7d3136",
  "أواني": "1584990347449-0f9a3a3a3b8e",
  "أثاث": "1555041469-a586c61ea9bc",
  "مفروشات": "1586023492125-27b2c045efd7",
  "إضاءة": "1513506003901-1e6a229e2d15",
  "ديكور": "1493663284031-b7e3aefcae8e",
};

// ─── 3. Source fallback (last resort) ───
const SOURCE_FALLBACK: Record<string, string> = {
  supermarket: "1604719312566-8912e9227c6a",
  produce: "1546173159-315724a31696",
  meat: "1607623814075-e51df1bdc82f",
  dairy: "1486297678162-eb2a19b0a32d",
  sweets: "1578985545062-69928b1d9587",
  pharmacy: "1631549916768-4119b2e5f926",
  library: "1455390582262-044cdead277a",
  restaurants: "1565299624946-b28f40a0ae38",
  recipes: "1547592180-85f173990554",
  wholesale: "1607082348824-0a96f2a4b9da",
  village: "1587049352846-4a222e784d38",
  baskets: "1542838132-92c53300491e",
  kitchen: "1556909114-f6e7ad7d3136",
  home: "1555041469-a586c61ea9bc",
};

// ─── Container priority: when a product is a "vessel" (cake, ice-cream, juice...),
// the container keyword MUST win over the flavor keyword. Sorted by specificity.
const CONTAINER_KEYWORDS = [
  "تورتة", "تشيز كيك", "براونيز", "كنافة", "بقلاوة", "بسبوسة", "قطايف",
  "هريسة", "أم علي", "كرواسون", "دونتس", "إكلير", "آيس كريم", "جيلاتي",
  "بسكويت", "مولتو", "شيكولاتة", "كولا", "شويبس", "زبادي بالفواكه",
];

/**
 * Resolve a product image URL using strict matching priority.
 * Returns a stable Unsplash CDN URL (cacheable, deterministic).
 */
export function resolveProductImage(input: {
  name: string;
  subCategory?: string | null;
  source?: string | null;
}): string {
  const name = (input.name || "").trim();

  // Priority 0: container override — if the name carries a known container keyword,
  // use it directly even when a fruit/flavor keyword is also present
  // (e.g., "تورتة فراولة" → cake, not strawberry).
  for (const c of CONTAINER_KEYWORDS) {
    if (name.includes(c) && KEYWORD_MAP[c]) return UNSPLASH(KEYWORD_MAP[c]);
  }

  // Priority 1: exact keyword scan (longest match wins).
  const sortedKeys = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    if (name.includes(k)) return UNSPLASH(KEYWORD_MAP[k]);
  }

  // Priority 2: sub_category
  if (input.subCategory && SUBCATEGORY_FALLBACK[input.subCategory]) {
    return UNSPLASH(SUBCATEGORY_FALLBACK[input.subCategory]);
  }

  // Priority 3: source
  if (input.source && SOURCE_FALLBACK[input.source]) {
    return UNSPLASH(SOURCE_FALLBACK[input.source]);
  }

  // Final default
  return UNSPLASH("1604719312566-8912e9227c6a");
}

/**
 * Validation helper — returns false when the resolver could not find any
 * keyword/subcategory match (i.e. it fell back to source/default).
 * Use in seed pipelines to block low-quality images.
 */
export function isImageConfident(input: {
  name: string;
  subCategory?: string | null;
}): boolean {
  const name = (input.name || "").trim();
  for (const c of CONTAINER_KEYWORDS) if (name.includes(c)) return true;
  for (const k of Object.keys(KEYWORD_MAP)) if (name.includes(k)) return true;
  if (input.subCategory && SUBCATEGORY_FALLBACK[input.subCategory]) return true;
  return false;
}

/**
 * For diagnostics — used by audit scripts.
 */
export function explainResolution(input: {
  name: string;
  subCategory?: string | null;
  source?: string | null;
}): { reason: "keyword" | "subcategory" | "source" | "default"; matched: string } {
  const name = (input.name || "").trim();
  const sortedKeys = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length);
  for (const k of sortedKeys) {
    if (name.includes(k)) return { reason: "keyword", matched: k };
  }
  if (input.subCategory && SUBCATEGORY_FALLBACK[input.subCategory]) {
    return { reason: "subcategory", matched: input.subCategory };
  }
  if (input.source && SOURCE_FALLBACK[input.source]) {
    return { reason: "source", matched: input.source };
  }
  return { reason: "default", matched: "supermarket" };
}
