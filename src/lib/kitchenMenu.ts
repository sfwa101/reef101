import pChicken from "@/assets/p-grilled-chicken.jpg";
import pSalmon from "@/assets/p-salmon.jpg";
import pRisotto from "@/assets/p-risotto.jpg";
import pBowl from "@/assets/p-bowl.jpg";
import pBeef from "@/assets/p-beef.jpg";

export type Nutrition = { kcal: number; protein: number; carbs: number; fat?: number };

export type SizeOption = { id: string; label: string; price: number }; // absolute price (radio)
export type AddonOption = { id: string; label: string; price: number };

export type KitchenMeal = {
  id: string;
  name: string;
  short: string;
  description: string;
  image: string;
  rating: number;
  badge?: "best" | "healthy" | "new" | "premium";
  category: "grills" | "sandwiches" | "crepes" | "family";
  nutrition: Nutrition;
  sizes: SizeOption[];
  addons: AddonOption[];
};

export type WeeklyMeal = KitchenMeal & {
  /** 0=Sun, 1=Mon, ... 6=Sat — day this meal is served */
  day: number;
};

const baseAddons: AddonOption[] = [
  { id: "cheese-sauce", label: "صوص جبنة", price: 15 },
  { id: "fries", label: "بطاطس مقلية", price: 25 },
  { id: "jalapeno", label: "هالبينو", price: 10 },
  { id: "extra-bread", label: "خبز إضافي", price: 8 },
  { id: "soft-drink", label: "مشروب غازي", price: 18 },
];

/** "Always-available" meals — daily menu */
export const dailyMeals: KitchenMeal[] = [
  {
    id: "k-grill-chicken",
    name: "دجاج مشوي بالأعشاب",
    short: "وجبة كاملة طازجة",
    description: "صدور دجاج بلدي متبلة بأعشاب البحر المتوسط، مشوية على الفحم وتقدّم مع أرز بسمتي وسلطة.",
    image: pChicken,
    rating: 4.9,
    badge: "best",
    category: "grills",
    nutrition: { kcal: 620, protein: 48, carbs: 55, fat: 18 },
    sizes: [
      { id: "half", label: "نص دجاجة", price: 145 },
      { id: "full", label: "دجاجة كاملة", price: 245 },
    ],
    addons: baseAddons,
  },
  {
    id: "k-shawarma",
    name: "ساندويتش شاورما لحم",
    short: "خبز صاج طازج",
    description: "شرائح لحم متبلة بطريقتنا الخاصة مع طحينة وخضار طازجة في خبز الصاج.",
    image: pBeef,
    rating: 4.8,
    badge: "best",
    category: "sandwiches",
    nutrition: { kcal: 540, protein: 32, carbs: 48, fat: 22 },
    sizes: [
      { id: "single", label: "وجبة سنجل", price: 95 },
      { id: "double", label: "وجبة دبل", price: 145 },
    ],
    addons: baseAddons,
  },
  {
    id: "k-mixed-grill",
    name: "مشكّل مشاوي على الفحم",
    short: "كفتة + كباب + شيش طاووق",
    description: "تشكيلة فاخرة من المشاوي مع أرز وخبز وسلطات شرقية وصوصات منوّعة.",
    image: pBeef,
    rating: 4.9,
    badge: "premium",
    category: "family",
    nutrition: { kcal: 980, protein: 72, carbs: 60, fat: 45 },
    sizes: [
      { id: "p2", label: "لشخصين", price: 420 },
      { id: "p4", label: "لأربعة أفراد", price: 780 },
    ],
    addons: baseAddons,
  },
  {
    id: "k-crepe-nutella",
    name: "كريب نوتيلا بالموز",
    short: "حلو ودافئ",
    description: "كريب فرنسي رقيق محشو بالنوتيلا وشرائح الموز الطازج ومكسرات.",
    image: pBowl,
    rating: 4.7,
    badge: "new",
    category: "crepes",
    nutrition: { kcal: 520, protein: 9, carbs: 78, fat: 18 },
    sizes: [
      { id: "reg", label: "وسط", price: 75 },
      { id: "lg", label: "كبير", price: 110 },
    ],
    addons: [
      { id: "ice-cream", label: "كرة آيس كريم", price: 22 },
      { id: "extra-nutella", label: "نوتيلا إضافية", price: 15 },
      { id: "strawberry", label: "فراولة طازجة", price: 18 },
    ],
  },
  {
    id: "k-crepe-cheese",
    name: "كريب جبنة وزعتر مالح",
    short: "إفطار خفيف",
    description: "كريب مالح بالموتزاريلا والزعتر الأخضر الطازج وزيت الزيتون.",
    image: pRisotto,
    rating: 4.6,
    category: "crepes",
    nutrition: { kcal: 410, protein: 16, carbs: 42, fat: 18 },
    sizes: [
      { id: "reg", label: "وسط", price: 65 },
      { id: "lg", label: "كبير", price: 95 },
    ],
    addons: baseAddons,
  },
  {
    id: "k-club-sandwich",
    name: "كلوب ساندويتش",
    short: "ثلاث طبقات شهيّة",
    description: "خبز توست محمّص مع دجاج مشوي وبيكون تركي وخس وطماطم وصوص خاص.",
    image: pChicken,
    rating: 4.7,
    category: "sandwiches",
    nutrition: { kcal: 680, protein: 38, carbs: 52, fat: 28 },
    sizes: [
      { id: "single", label: "وجبة سنجل", price: 110 },
      { id: "double", label: "وجبة دبل", price: 165 },
    ],
    addons: baseAddons,
  },
];

/** Pre-booking weekly menu — must order before deadline */
export const weeklyMeals: WeeklyMeal[] = [
  {
    id: "w-sun-molokhia",
    day: 0,
    name: "ملوخية بالأرانب",
    short: "أكلة الأحد البلدية",
    description: "ملوخية ناعمة على طريقة الجدة مع أرانب مشوية وأرز بالشعيرية.",
    image: pChicken,
    rating: 4.9,
    badge: "healthy",
    category: "family",
    nutrition: { kcal: 720, protein: 52, carbs: 65, fat: 22 },
    sizes: [{ id: "p1", label: "وجبة فردية", price: 145 }, { id: "p4", label: "عائلي 4 أفراد", price: 520 }],
    addons: baseAddons,
  },
  {
    id: "w-mon-fattah",
    day: 1,
    name: "فتّة لحم بقري",
    short: "خاص بالاثنين",
    description: "فتّة بالخل والثوم مع لحم بقري طري، صلصة طماطم، وخبز محمّص.",
    image: pBeef,
    rating: 4.8,
    badge: "best",
    category: "family",
    nutrition: { kcal: 850, protein: 48, carbs: 70, fat: 32 },
    sizes: [{ id: "p1", label: "وجبة فردية", price: 165 }, { id: "p4", label: "عائلي 4 أفراد", price: 580 }],
    addons: baseAddons,
  },
  {
    id: "w-tue-stuffed",
    day: 2,
    name: "محشي ورق عنب وكوسة",
    short: "مزيج بلدي",
    description: "محشي ورق عنب وكوسة بالأرز واللحم المفروم مع صلصة الطماطم البلدية.",
    image: pRisotto,
    rating: 4.9,
    badge: "premium",
    category: "family",
    nutrition: { kcal: 680, protein: 28, carbs: 78, fat: 20 },
    sizes: [{ id: "p1", label: "وجبة فردية", price: 135 }, { id: "p4", label: "عائلي 4 أفراد", price: 480 }],
    addons: baseAddons,
  },
  {
    id: "w-wed-salmon",
    day: 3,
    name: "سلمون بالزبدة والليمون",
    short: "بحري الأربعاء",
    description: "فيليه سلمون نرويجي مشوي بالزبدة والثوم يقدم مع كينوا وخضار سوتيه.",
    image: pSalmon,
    rating: 4.9,
    badge: "premium",
    category: "grills",
    nutrition: { kcal: 610, protein: 42, carbs: 35, fat: 28 },
    sizes: [{ id: "p1", label: "وجبة فردية", price: 245 }],
    addons: baseAddons,
  },
  {
    id: "w-thu-koshary",
    day: 4,
    name: "كشري بلدي فاخر",
    short: "كلاسيك الخميس",
    description: "أرز وعدس ومكرونة بصلصة الطماطم الحارة والبصل المقرمش والحمص.",
    image: pBowl,
    rating: 4.8,
    badge: "best",
    category: "family",
    nutrition: { kcal: 720, protein: 22, carbs: 110, fat: 14 },
    sizes: [{ id: "med", label: "وسط", price: 65 }, { id: "lg", label: "كبير", price: 95 }],
    addons: baseAddons,
  },
  {
    id: "w-fri-mandi",
    day: 5,
    name: "مندي لحم خروف",
    short: "وليمة الجمعة",
    description: "أرز بسمتي مدخّن مع لحم خروف طري على الطريقة اليمنية مع شطّة.",
    image: pBeef,
    rating: 4.9,
    badge: "premium",
    category: "family",
    nutrition: { kcal: 920, protein: 58, carbs: 80, fat: 38 },
    sizes: [{ id: "p1", label: "وجبة فردية", price: 220 }, { id: "p4", label: "عائلي 4 أفراد", price: 780 }],
    addons: baseAddons,
  },
  {
    id: "w-sat-grill",
    day: 6,
    name: "مشاوي مشكّلة على الفحم",
    short: "سبت العائلة",
    description: "كفتة وكباب وشيش طاووق على الفحم مع خبز وأرز وسلطات وصوصات.",
    image: pChicken,
    rating: 4.8,
    badge: "best",
    category: "grills",
    nutrition: { kcal: 880, protein: 64, carbs: 55, fat: 36 },
    sizes: [{ id: "p2", label: "لشخصين", price: 420 }, { id: "p4", label: "لأربعة أفراد", price: 780 }],
    addons: baseAddons,
  },
];

/**
 * Booking deadline: order must be placed by 22:00 (10 PM) the day BEFORE the meal day.
 * Returns the deadline Date for a given target day-of-week (0..6) relative to "now".
 */
export const getBookingDeadline = (targetDay: number, now: Date = new Date()): Date => {
  // find the next occurrence of targetDay (today counts only if deadline not passed)
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  let diff = (targetDay - d.getDay() + 7) % 7;
  if (diff === 0) diff = 7; // always upcoming week if same-day already late (we'll adjust)
  // Try this week first if deadline not passed
  const thisWeek = new Date(d);
  thisWeek.setDate(d.getDate() + ((targetDay - d.getDay() + 7) % 7));
  thisWeek.setHours(0, 0, 0, 0);
  const deadline = new Date(thisWeek);
  deadline.setDate(deadline.getDate() - 1);
  deadline.setHours(22, 0, 0, 0);
  if (deadline.getTime() > now.getTime()) return deadline;
  // else next week
  const nextWeek = new Date(thisWeek);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const dl2 = new Date(nextWeek);
  dl2.setDate(dl2.getDate() - 1);
  dl2.setHours(22, 0, 0, 0);
  return dl2;
};

export const dayNamesAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const dayShortAr = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

export const categoryLabels: Record<KitchenMeal["category"], string> = {
  grills: "مشويات",
  sandwiches: "ساندوتشات",
  crepes: "كريبات",
  family: "وجبات عائلية",
};

export const badgeLabel: Record<NonNullable<KitchenMeal["badge"]>, string> = {
  best: "الأكثر مبيعاً",
  healthy: "صحي",
  new: "جديد",
  premium: "فاخر",
};