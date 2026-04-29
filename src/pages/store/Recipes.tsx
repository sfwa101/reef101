import BackHeader from "@/components/BackHeader";
import BottomCTA from "@/components/BottomCTA";
import { useCart } from "@/context/CartContext";
import { useMemo, useState, useEffect } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import {
  Clock, Users, Flame, X, Minus, Plus, Check, Calendar, Sparkles,
  Sun, Sunset, Moon, Flame as FlameIcon, TrendingUp, Timer, Zap, BadgePercent, Truck,
  Lock, PlayCircle, ChefHat, Utensils, ShoppingBasket, Repeat,
} from "lucide-react";
import { fmtMoney, toLatin } from "@/lib/format";
import { type Product, getById } from "@/lib/products";
import { toast } from "sonner";

// ===== Recipe definitions (richer than products list — per section) =====
type Recipe = {
  id: string;
  name: string;
  section: "إفطار" | "غداء" | "عشاء";
  category: string; // e.g. "صحي", "عائلي", "سريع", "نباتي", "للأطفال"
  image: string;
  basePrice: number;
  baseServings: number;
  cookTime: number;
  calories: number;
  ingredients: { id: string; name: string; cost: number; essential?: boolean }[];
};

// ===== Per-recipe content: nutrition, steps, video, kitchen tools =====
type Nutrition = { protein: number; carbs: number; fat: number; fiber: number };
type ToolItem = {
  id: string;
  name: string;
  /** Product id in Kitchen-Tools store, if available for purchase */
  productId?: string;
  /** Fallback product id used automatically when productId is out-of-stock */
  fallbackId?: string;
  /** Suggested retail price (EGP) when available */
  price?: number;
  /** Image url (optional) */
  image?: string;
  /** Cheaper / acceptable alternatives (text only) */
  alternatives?: string[];
};
type RecipeContent = {
  nutrition: Nutrition;
  prepTime: number;     // minutes (separate from cookTime)
  difficulty: "سهل" | "متوسط" | "متقدم";
  videoUrl?: string;    // mp4 / youtube embed
  steps: string[];
  tools: ToolItem[];
};

// Default tool catalog — products that exist (or could exist) in "ادوات المطبخ".
// `fallbackId` is auto-substituted when `productId` is out-of-stock.
const TOOLS = {
  pan:       { id: "t-pan",       name: "مقلاة تيفال ٢٤سم",       productId: "kt-pan-24",                              alternatives: ["أي مقلاة قاعها سميك"] },
  nonstick:  { id: "t-nonstick",  name: "مقلاة جرانيت غير لاصقة", productId: "kt-pan-granite", fallbackId: "kt-pan-24", alternatives: ["مقلاة تيفال عادية"] },
  pot:       { id: "t-pot",       name: "حلة استانلس ٤ لتر",       productId: "kt-pot-4l",                              alternatives: ["أي حلة بقاع سميك"] },
  ovenTray:  { id: "t-tray",      name: "صينية فرن مينا",          productId: "kt-tray-bake",                           alternatives: ["صينية ألومنيوم"] },
  grill:     { id: "t-grill",     name: "مشواية حديد مضلعة",       productId: "kt-grill-pan", fallbackId: "kt-tray-bake", alternatives: ["صينية فرن", "شواية كهربائية"] },
  blender:   { id: "t-blender",   name: "خلاط كهربائي ٧٠٠وات",     productId: "kt-blender",   fallbackId: "kt-whisk",     alternatives: ["مضرب يدوي", "محضر طعام"] },
  bowl:      { id: "t-bowl",      name: "بول تقديم سيراميك",       productId: "kt-bowl-cer",                            alternatives: ["أي بول عميق"] },
  knife:     { id: "t-knife",     name: "سكين شيف ٢٠سم",           productId: "kt-knife-chef",                          alternatives: ["أي سكين حاد"] },
  board:     { id: "t-board",     name: "لوح تقطيع خشبي",          productId: "kt-board",                               alternatives: ["لوح بلاستيك"] },
  whisk:     { id: "t-whisk",     name: "مضرب يدوي",               productId: "kt-whisk",                               alternatives: ["شوكة كبيرة"] },
  measuring: { id: "t-measure",   name: "أكواب وملاعق قياس",        productId: "kt-measure",                             alternatives: ["تقدير يدوي"] },
} satisfies Record<string, ToolItem>;

const RECIPE_CONTENT: Record<string, RecipeContent> = {
  "r-eggs": {
    nutrition: { protein: 22, carbs: 6, fat: 24, fiber: 2 },
    prepTime: 5, difficulty: "سهل",
    videoUrl: "https://www.youtube.com/embed/PUP7U5vTMM0",
    steps: [
      "اخفقي البيض مع الملح والفلفل في بول.",
      "سخّني المقلاة على نار متوسطة وأضيفي زيت الزيتون.",
      "اسكبي البيض ثم وزّعي الخضار والجبنة فوقه.",
      "اطوي الأومليت بلطف بعد ٣ دقائق وقدميه ساخنًا.",
    ],
    tools: [TOOLS.nonstick, TOOLS.whisk, TOOLS.bowl],
  },
  "r-cereal": {
    nutrition: { protein: 14, carbs: 58, fat: 9, fiber: 7 },
    prepTime: 5, difficulty: "سهل",
    steps: [
      "ضعي الزبادي اليوناني في قاع البول.",
      "أضيفي الجرانولا فوقه ثم الفواكه الموسمية.",
      "زيّني بالعسل والمكسرات وقدميه فورًا.",
    ],
    tools: [TOOLS.bowl, TOOLS.measuring],
  },
  "r-bread": {
    nutrition: { protein: 16, carbs: 36, fat: 22, fiber: 6 },
    prepTime: 5, difficulty: "سهل",
    steps: [
      "حمّصي شرائح الخبز قليلًا.",
      "اهرسي الأفوكادو مع الملح والليمون.",
      "وزّعي الأفوكادو على الخبز ثم شرائح الحلوم والطماطم.",
    ],
    tools: [TOOLS.knife, TOOLS.board, TOOLS.nonstick],
  },
  "r-chicken": {
    nutrition: { protein: 42, carbs: 38, fat: 18, fiber: 5 },
    prepTime: 15, difficulty: "متوسط",
    videoUrl: "https://www.youtube.com/embed/g0sXuc0wO5o",
    steps: [
      "تبّلي صدور الدجاج بالأعشاب والثوم والليمون لمدة ١٥ دقيقة.",
      "حمّري الدجاج على المشواية ٤ دقائق لكل جانب.",
      "اطهي الأرز البسمتي مع رشة ملح وزيت زيتون.",
      "حمّصي الخضار في الفرن مع زيت الزيتون لمدة ٢٠ دقيقة.",
      "قدّمي الدجاج فوق الأرز مع الخضار والصلصة الجانبية.",
    ],
    tools: [TOOLS.grill, TOOLS.pot, TOOLS.ovenTray, TOOLS.knife],
  },
  "r-pasta": {
    nutrition: { protein: 18, carbs: 62, fat: 24, fiber: 4 },
    prepTime: 8, difficulty: "سهل",
    videoUrl: "https://www.youtube.com/embed/Q6xpxDZUz4M",
    steps: [
      "اسلقي الباستا في ماء مملح حتى تنضج (al dente).",
      "حمّري الفطر مع الثوم في زيت زيتون.",
      "أضيفي الكريمة وحرّكي حتى تكثف الصلصة.",
      "أضيفي الباستا والبارميزان وحرّكي قبل التقديم.",
    ],
    tools: [TOOLS.pot, TOOLS.nonstick, TOOLS.measuring],
  },
  "r-bowl": {
    nutrition: { protein: 16, carbs: 48, fat: 18, fiber: 9 },
    prepTime: 10, difficulty: "سهل",
    steps: [
      "اطهي الكينوا حسب التعليمات واتركيها لتبرد قليلًا.",
      "حمّصي الحمص والخضار في الفرن مع زيت الزيتون.",
      "رتّبي البول: أوراق خضراء، كينوا، حمص، خضار، فيتا.",
      "أضيفي تتبيلة الطحينة وحبة البركة قبل التقديم.",
    ],
    tools: [TOOLS.bowl, TOOLS.ovenTray, TOOLS.pot],
  },
  "r-salmon": {
    nutrition: { protein: 38, carbs: 22, fat: 26, fiber: 4 },
    prepTime: 10, difficulty: "متوسط",
    videoUrl: "https://www.youtube.com/embed/scnq9oCXLwM",
    steps: [
      "تبّلي السلمون بالملح والفلفل والليمون.",
      "اشوي السلمون على نار متوسطة ٤ دقائق لكل جانب.",
      "اسلقي البطاطس الصغيرة ثم حمّريها بالزبدة والأعشاب.",
      "اشوي الأسباراجوس سريعًا وقدميه بجانب السلمون.",
    ],
    tools: [TOOLS.grill, TOOLS.nonstick, TOOLS.pot],
  },
  "r-risotto": {
    nutrition: { protein: 18, carbs: 72, fat: 22, fiber: 3 },
    prepTime: 10, difficulty: "متقدم",
    videoUrl: "https://www.youtube.com/embed/q5dQVb3qQ4M",
    steps: [
      "حمّري الكراث والثوم في الزبدة.",
      "أضيفي الأرز وحرّكي دقيقتين ثم اسكبي النبيذ.",
      "أضيفي مرق الخضار تدريجيًا مع التحريك المستمر.",
      "أضيفي الفطر والبارميزان في النهاية وقدميه ساخنًا.",
    ],
    tools: [TOOLS.pot, TOOLS.measuring, TOOLS.whisk],
  },
  "r-beef": {
    nutrition: { protein: 48, carbs: 32, fat: 38, fiber: 4 },
    prepTime: 15, difficulty: "متقدم",
    videoUrl: "https://www.youtube.com/embed/AmC9SmCBUj4",
    steps: [
      "أخرجي الستيك من الثلاجة قبل ٣٠ دقيقة من الطهي.",
      "تبّليه بالملح البحري والفلفل وادهنيه بالزيت.",
      "اشوي الستيك على نار عالية ٣–٤ دقائق لكل جانب.",
      "اتركيه يرتاح ٥ دقائق ثم قدميه مع الخضار وصلصة الفلفل.",
    ],
    tools: [TOOLS.grill, TOOLS.knife, TOOLS.board, TOOLS.ovenTray],
  },
};

// IDs of ingredients considered essential (cannot be removed) per recipe.
// Heuristic: the first 2 ingredients (main protein/carb base) are essential.
const ESSENTIAL_INGREDIENT_IDS: Record<string, string[]> = {
  "r-eggs":    ["i1", "i4"],          // بيض + زيت
  "r-cereal":  ["i1", "i2"],          // جرانولا + زبادي
  "r-bread":   ["i1", "i3"],          // خبز + أفوكادو
  "r-chicken": ["i1", "i2"],          // دجاج + أرز
  "r-pasta":   ["i1", "i3"],          // باستا + كريمة
  "r-bowl":    ["i1", "i2"],          // كينوا + حمص
  "r-salmon":  ["i1"],                // السلمون
  "r-risotto": ["i1", "i2"],          // أرز أربوريو + فطر
  "r-beef":    ["i1"],                // الستيك
};

import pChicken from "@/assets/p-grilled-chicken.jpg";
import pSalmon from "@/assets/p-salmon.jpg";
import pRisotto from "@/assets/p-risotto.jpg";
import pBowl from "@/assets/p-bowl.jpg";
import pEggs from "@/assets/p-eggs.jpg";
import pCereal from "@/assets/p-cereal.jpg";
import pBread from "@/assets/p-bread.jpg";
import pPasta from "@/assets/p-pasta.jpg";
import pBeef from "@/assets/p-beef.jpg";

// Marketing metadata per recipe (badges, social proof, scarcity, discounts).
// Static + deterministic so SSR matches CSR (no Math.random at render time).
type Marketing = {
  oldPrice?: number;       // strike-through to show discount
  soldToday?: number;      // social proof
  remaining?: number;      // scarcity
  badge?: "الأكثر طلبًا" | "جديد" | "توصية الشيف" | "صحي" | "وفّر";
};
const MARKETING: Record<string, Marketing> = {
  "r-eggs":    { soldToday: 47, remaining: 12, badge: "الأكثر طلبًا" },
  "r-cereal":  { soldToday: 22, remaining: 18, badge: "صحي" },
  "r-bread":   { oldPrice: 70, soldToday: 31, remaining: 9, badge: "وفّر" },
  "r-chicken": { soldToday: 88, remaining: 14, badge: "الأكثر طلبًا" },
  "r-pasta":   { oldPrice: 110, soldToday: 54, remaining: 7, badge: "وفّر" },
  "r-bowl":    { soldToday: 36, remaining: 21, badge: "توصية الشيف" },
  "r-salmon":  { soldToday: 19, remaining: 6, badge: "توصية الشيف" },
  "r-risotto": { oldPrice: 210, soldToday: 25, remaining: 8, badge: "وفّر" },
  "r-beef":    { soldToday: 14, remaining: 4, badge: "جديد" },
};

const RECIPES: Recipe[] = [
  {
    id: "r-eggs", name: "أومليت بالخضار والجبنة", section: "إفطار", category: "سريع",
    image: pEggs, basePrice: 65, baseServings: 1, cookTime: 10, calories: 320,
    ingredients: [
      { id: "i1", name: "بيض بلدي (3 حبات)", cost: 18 },
      { id: "i2", name: "جبنة بيضاء", cost: 15 },
      { id: "i3", name: "خضار طازج", cost: 12 },
      { id: "i4", name: "زيت زيتون", cost: 8 },
      { id: "i5", name: "ملح وفلفل", cost: 4 },
      { id: "i6", name: "أعشاب طازجة", cost: 8 },
    ],
  },
  {
    id: "r-cereal", name: "بول الجرانولا بالفواكه والعسل", section: "إفطار", category: "صحي",
    image: pCereal, basePrice: 75, baseServings: 1, cookTime: 5, calories: 380,
    ingredients: [
      { id: "i1", name: "جرانولا بالتوت", cost: 22 },
      { id: "i2", name: "زبادي يوناني", cost: 18 },
      { id: "i3", name: "فواكه موسمية", cost: 16 },
      { id: "i4", name: "عسل أبيض", cost: 12 },
      { id: "i5", name: "مكسرات", cost: 7 },
    ],
  },
  {
    id: "r-bread", name: "ساندوتش حلوم بالأفوكادو", section: "إفطار", category: "نباتي",
    image: pBread, basePrice: 55, baseServings: 1, cookTime: 8, calories: 410,
    ingredients: [
      { id: "i1", name: "خبز ساوردو", cost: 15 },
      { id: "i2", name: "جبنة حلوم", cost: 18 },
      { id: "i3", name: "أفوكادو ناضج", cost: 14 },
      { id: "i4", name: "طماطم", cost: 4 },
      { id: "i5", name: "زيت زيتون وليمون", cost: 4 },
    ],
  },
  {
    id: "r-chicken", name: "دجاج مشوي بالأعشاب", section: "غداء", category: "عائلي",
    image: pChicken, basePrice: 145, baseServings: 2, cookTime: 35, calories: 520,
    ingredients: [
      { id: "i1", name: "صدور دجاج بلدي (500غ)", cost: 65 },
      { id: "i2", name: "أرز بسمتي", cost: 22 },
      { id: "i3", name: "خضار مشكل", cost: 18 },
      { id: "i4", name: "زيت زيتون وأعشاب", cost: 14 },
      { id: "i5", name: "ثوم وليمون", cost: 8 },
      { id: "i6", name: "بهارات الشيف", cost: 10 },
      { id: "i7", name: "صلصة جانبية", cost: 8 },
    ],
  },
  {
    id: "r-pasta", name: "باستا كريمي بالفطر", section: "غداء", category: "سريع",
    image: pPasta, basePrice: 95, baseServings: 2, cookTime: 20, calories: 580,
    ingredients: [
      { id: "i1", name: "باستا إيطالية", cost: 18 },
      { id: "i2", name: "فطر بورتوبيلو", cost: 22 },
      { id: "i3", name: "كريمة طبخ", cost: 14 },
      { id: "i4", name: "جبنة بارميزان", cost: 22 },
      { id: "i5", name: "ثوم وأعشاب", cost: 9 },
      { id: "i6", name: "زيت زيتون", cost: 10 },
    ],
  },
  {
    id: "r-bowl", name: "بول البحر المتوسط", section: "غداء", category: "صحي",
    image: pBowl, basePrice: 95, baseServings: 1, cookTime: 15, calories: 420,
    ingredients: [
      { id: "i1", name: "كينوا مطبوخة", cost: 18 },
      { id: "i2", name: "حمص محمص", cost: 14 },
      { id: "i3", name: "خضار مشوي", cost: 18 },
      { id: "i4", name: "تتبيلة طحينة", cost: 16 },
      { id: "i5", name: "أوراق خضراء", cost: 12 },
      { id: "i6", name: "حبة بركة وسمسم", cost: 6 },
      { id: "i7", name: "جبنة فيتا", cost: 11 },
    ],
  },
  {
    id: "r-salmon", name: "سلمون مشوي بالليمون", section: "عشاء", category: "صحي",
    image: pSalmon, basePrice: 220, baseServings: 1, cookTime: 25, calories: 480,
    ingredients: [
      { id: "i1", name: "فيليه سلمون نرويجي (250غ)", cost: 120 },
      { id: "i2", name: "أسباراجوس طازج", cost: 28 },
      { id: "i3", name: "زيت زيتون وليمون", cost: 18 },
      { id: "i4", name: "بطاطس صغيرة", cost: 22 },
      { id: "i5", name: "أعشاب وثوم", cost: 12 },
      { id: "i6", name: "ملح بحري", cost: 8 },
      { id: "i7", name: "صلصة الزبدة بالأعشاب", cost: 12 },
    ],
  },
  {
    id: "r-risotto", name: "ريزوتو الفطر بالبارميزان", section: "عشاء", category: "نباتي",
    image: pRisotto, basePrice: 180, baseServings: 2, cookTime: 30, calories: 620,
    ingredients: [
      { id: "i1", name: "أرز أربوريو", cost: 28 },
      { id: "i2", name: "فطر مشكل", cost: 38 },
      { id: "i3", name: "بارميزان مبشور", cost: 32 },
      { id: "i4", name: "زبدة طازجة", cost: 18 },
      { id: "i5", name: "مرق خضار", cost: 14 },
      { id: "i6", name: "كراث وثوم", cost: 14 },
      { id: "i7", name: "نبيذ أبيض للطبخ", cost: 36 },
    ],
  },
  {
    id: "r-beef", name: "ستيك بقري مع خضار مشوي", section: "عشاء", category: "عائلي",
    image: pBeef, basePrice: 280, baseServings: 2, cookTime: 25, calories: 720,
    ingredients: [
      { id: "i1", name: "ستيك بقري ممتاز (400غ)", cost: 165 },
      { id: "i2", name: "بطاطس باربية", cost: 22 },
      { id: "i3", name: "خضار مشوي", cost: 28 },
      { id: "i4", name: "زبدة الأعشاب", cost: 22 },
      { id: "i5", name: "صلصة فلفل أسود", cost: 24 },
      { id: "i6", name: "ثوم محمر", cost: 10 },
      { id: "i7", name: "ملح بحري", cost: 9 },
    ],
  },
];

const sections: Recipe["section"][] = ["إفطار", "غداء", "عشاء"];

// Apply essential flags to ingredients based on ESSENTIAL_INGREDIENT_IDS.
RECIPES.forEach((r) => {
  const ess = ESSENTIAL_INGREDIENT_IDS[r.id] ?? [];
  r.ingredients = r.ingredients.map((i) => ({ ...i, essential: ess.includes(i.id) }));
});
const filters = ["كل الوصفات", "سريعة", "عائلية", "للأطفال", "صحية", "نباتية"];
const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

// Time-based availability windows for each meal section.
// Used for: default tab, "متاح الآن" badge, urgency countdown, and disabled state.
const MEAL_WINDOWS: Record<Recipe["section"], { startH: number; endH: number; icon: typeof Sun; label: string }> = {
  "إفطار": { startH: 6,  endH: 11, icon: Sun,    label: "٦ ص – ١١ ص" },
  "غداء":  { startH: 12, endH: 17, icon: Sunset, label: "١٢ ظ – ٥ م" },
  "عشاء":  { startH: 18, endH: 23, icon: Moon,   label: "٦ م – ١١ م" },
};

function getMealForHour(h: number): Recipe["section"] {
  if (h >= 6 && h < 12) return "إفطار";
  if (h >= 12 && h < 18) return "غداء";
  return "عشاء";
}

function isMealOpenNow(s: Recipe["section"], d: Date) {
  const w = MEAL_WINDOWS[s];
  const h = d.getHours();
  return h >= w.startH && h < w.endH;
}

function minutesUntilClose(s: Recipe["section"], d: Date) {
  const w = MEAL_WINDOWS[s];
  if (!isMealOpenNow(s, d)) return 0;
  return (w.endH - d.getHours()) * 60 - d.getMinutes();
}

const Recipes = () => {
  const { add } = useCart();
  const search = useSearch({ from: "/store/recipes" }) as { tag?: string };
  const navigate = useNavigate({ from: "/store/recipes" });
  const tag = (search.tag ?? "").trim();
  const [filter, setFilter] = useState(filters[0]);
  const [open, setOpen] = useState<Recipe | null>(null);

  // Subscription mode toggle (browse-daily vs subscribe-weekly)
  const [mode, setMode] = useState<"daily" | "weekly">("daily");

  // Active meal-time tab in daily mode (defaults by current hour)
  const [activeMeal, setActiveMeal] = useState<Recipe["section"]>(() => getMealForHour(new Date().getHours()));

  // Live "ends in" countdown for the active meal window — drives urgency
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Weekly meal plan: { [day]: { breakfast?, lunch?, dinner? } }
  type DayPlan = Partial<Record<Recipe["section"], string>>;
  const [plan, setPlan] = useState<Record<string, DayPlan>>(() =>
    Object.fromEntries(days.map((d) => [d, {}]))
  );
  const [activeDay, setActiveDay] = useState(days[0]);
  const [planServings, setPlanServings] = useState(2);

  const filtered = useMemo(() => {
    let list = RECIPES;
    if (tag) {
      const t = tag;
      list = list.filter(
        (r) =>
          r.name.includes(t) ||
          r.ingredients.some((i) => i.name.includes(t)),
      );
      if (list.length === 0) list = RECIPES;
    }
    if (filter === "كل الوصفات") return list;
    return list.filter(
      (r) =>
        r.category.includes(filter.replace("ة", "").replace("ال", "")) ||
        filter.includes(r.category),
    );
  }, [filter, tag]);

  const planSet = (day: string, section: Recipe["section"], recipeId: string) =>
    setPlan((p) => ({ ...p, [day]: { ...p[day], [section]: p[day]?.[section] === recipeId ? undefined : recipeId } }));

  const planTotal = useMemo(() => {
    let sum = 0;
    Object.values(plan).forEach((day) => {
      sections.forEach((s) => {
        const id = day[s];
        if (id) {
          const r = RECIPES.find((x) => x.id === id);
          if (r) sum += r.basePrice * (planServings / r.baseServings);
        }
      });
    });
    return Math.round(sum);
  }, [plan, planServings]);

  const planMealsCount = useMemo(
    () => Object.values(plan).reduce((c, d) => c + Object.values(d).filter(Boolean).length, 0),
    [plan]
  );

  const subscribePlan = () => {
    Object.values(plan).forEach((day) => {
      sections.forEach((s) => {
        const id = day[s];
        if (!id) return;
        const r = RECIPES.find((x) => x.id === id);
        if (!r) return;
        const asProduct: Product = {
          id: `plan-${r.id}-${Date.now()}`,
          name: `${r.name} (${s})`,
          unit: `${toLatin(planServings)} أفراد`,
          price: Math.round(r.basePrice * (planServings / r.baseServings)),
          image: r.image,
          category: "وصفات",
          source: "recipes",
        };
        add(asProduct);
      });
    });
  };

  // Suggest 3 meals for active day
  const suggestForDay = () => {
    setPlan((p) => ({
      ...p,
      [activeDay]: {
        إفطار: RECIPES.find((r) => r.section === "إفطار")!.id,
        غداء: RECIPES.find((r) => r.section === "غداء")!.id,
        عشاء: RECIPES.find((r) => r.section === "عشاء")!.id,
      },
    }));
  };

  return (
    <>
      <div className="space-y-5">
        <BackHeader title="وصفات الشيف" subtitle="منيو أسبوعي وذكي · 3 وجبات/يوم" accent="متجر" themeKey="recipes" />

        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-tile"
          style={{ background: "linear-gradient(135deg, hsl(150 40% 25%), hsl(160 30% 35%))" }}
        >
          <div className="absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
          <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
            وصفات الشيف
          </span>
          <h2 className="mt-3 font-display text-2xl font-extrabold text-white text-balance">
            تصفّح يوميًا<br />واطلب ما يحلو لك
          </h2>
          <p className="mt-1 text-xs text-white/80">3 وجبات/يوم · أو اشترك بخطة الأسبوع</p>
        </section>

        {/* Mode switcher: daily browsing (default) vs weekly subscription */}
        <div className="glass-strong flex rounded-full p-1 shadow-soft">
          <button
            onClick={() => setMode("daily")}
            className={`flex-1 rounded-full py-2 text-xs font-extrabold transition ${
              mode === "daily" ? "bg-foreground text-background shadow-pill" : "text-muted-foreground"
            }`}
          >
            اطلب اليوم
          </button>
          <button
            onClick={() => setMode("weekly")}
            className={`flex-1 rounded-full py-2 text-xs font-extrabold transition ${
              mode === "weekly" ? "bg-foreground text-background shadow-pill" : "text-muted-foreground"
            }`}
          >
            اشترك أسبوعيًا
          </button>
        </div>

        {/* Marketing strip — value props (free delivery, fresh today, secure pay) */}
        {mode === "daily" && (
          <>
            {tag && (
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-amber-500/15 p-3 ring-1 ring-amber-500/30 animate-fade-in">
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-extrabold text-amber-800 dark:text-amber-300">
                    ✨ وصفات مقترحة لـ
                  </p>
                  <p className="truncate text-[12.5px] font-extrabold text-foreground">{tag}</p>
                </div>
                <button
                  onClick={() =>
                    navigate({ search: { tag: "" } as never, replace: true })
                  }
                  className="shrink-0 rounded-full bg-amber-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-pill"
                >
                  عرض الكل
                </button>
              </div>
            )}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {[
              { icon: Truck, label: "توصيل مجاني فوق ٢٠٠ ج.م", c: "from-emerald-500/15 to-emerald-500/5", t: "text-emerald-700 dark:text-emerald-300" },
              { icon: Zap, label: "طازج يوميًا · يصل خلال ٤٥د", c: "from-amber-500/15 to-amber-500/5", t: "text-amber-700 dark:text-amber-300" },
              { icon: BadgePercent, label: "خصم ١٥٪ على أول طلب", c: "from-rose-500/15 to-rose-500/5", t: "text-rose-700 dark:text-rose-300" },
            ].map((p, i) => (
              <div key={i} className={`shrink-0 flex items-center gap-1.5 rounded-full bg-gradient-to-l ${p.c} px-3 py-1.5`}>
                <p.icon className={`h-3.5 w-3.5 ${p.t}`} />
                <span className={`text-[11px] font-extrabold ${p.t}`}>{p.label}</span>
              </div>
            ))}
          </div>
          </>
        )}

        {/* Weekly meal-plan builder (only in weekly mode) */}
        {mode === "weekly" && (
        <section className="space-y-3">
          <div className="rounded-2xl bg-primary-soft/60 p-3 text-[11px] leading-relaxed text-foreground/80">
            اختر وجبات الأسبوع كاملة وسنرسلها إليك <b>فور تأكيد الاشتراك</b> في بداية الأسبوع. يمكنك تعديل أي وجبة قبل ٨ ساعات من موعد الاستلام.
          </div>
          <div className="flex items-baseline justify-between px-1">
            <h3 className="font-display text-xl font-extrabold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> منيو الأسبوع
            </h3>
            <button onClick={suggestForDay} className="flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-bold text-primary">
              <Sparkles className="h-3 w-3" /> اقترح يومي
            </button>
          </div>

          {/* Days strip */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {days.map((d) => {
              const filledCount = Object.values(plan[d] ?? {}).filter(Boolean).length;
              const isActive = d === activeDay;
              return (
                <button
                  key={d}
                  onClick={() => setActiveDay(d)}
                  className={`shrink-0 rounded-2xl px-4 py-2 text-center transition ease-apple ${
                    isActive ? "bg-foreground text-background shadow-pill" : "glass-strong"
                  }`}
                >
                  <p className="text-[10px] font-medium opacity-80">{d}</p>
                  <p className="text-[10px] font-extrabold tabular-nums">{toLatin(filledCount)}/3</p>
                </button>
              );
            })}
          </div>

          {/* Sections for active day */}
          <div className="space-y-3">
            {sections.map((s) => {
              const choices = RECIPES.filter((r) => r.section === s);
              const selected = plan[activeDay]?.[s];
              return (
                <div key={s} className="glass-strong rounded-2xl p-3 shadow-soft">
                  <p className="mb-2 px-1 font-display text-sm font-extrabold">{s}</p>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar">
                    {choices.map((r) => {
                      const isSel = selected === r.id;
                      const price = Math.round(r.basePrice * (planServings / r.baseServings));
                      return (
                        <button
                          key={r.id}
                          onClick={() => planSet(activeDay, s, r.id)}
                          className={`relative w-32 shrink-0 overflow-hidden rounded-2xl text-right transition ${
                            isSel ? "ring-2 ring-primary" : "bg-background/60"
                          }`}
                        >
                          <img src={r.image} alt={r.name} className="h-20 w-full object-cover" />
                          <div className="p-2">
                            <p className="line-clamp-2 text-[11px] font-bold leading-tight">{r.name}</p>
                            <p className="mt-1 text-[10px] font-extrabold text-primary tabular-nums">{toLatin(price)} ج.م</p>
                          </div>
                          {isSel && (
                            <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Servings + addons toggle */}
          <div className="glass-strong flex items-center justify-between rounded-2xl p-4 shadow-soft">
            <div>
              <p className="font-display text-sm font-extrabold">عدد الأفراد للخطة</p>
              <p className="text-[11px] text-muted-foreground">يضرب سعر كل وجبة بالكمية</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPlanServings((s) => Math.max(1, s - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center font-display text-lg font-extrabold tabular-nums">{toLatin(planServings)}</span>
              <button onClick={() => setPlanServings((s) => Math.min(8, s + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
        )}

        {mode === "daily" && (
          <DailyBrowser
            activeMeal={activeMeal}
            setActiveMeal={setActiveMeal}
            now={now}
            filter={filter}
            setFilter={setFilter}
            filtered={filtered}
            onOpen={setOpen}
          />
        )}

        <div className="h-32" />
        {open && <RecipeModal recipe={open} onClose={() => setOpen(null)} />}
      </div>

      {/* Sticky CTA — only meaningful in weekly mode */}
      {mode === "weekly" && (
        <BottomCTA>
          <button
            onClick={subscribePlan}
            disabled={planMealsCount === 0}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 font-bold text-primary-foreground shadow-pill transition active:scale-[0.98] disabled:opacity-50"
          >
            <span className="text-sm">
              {planMealsCount > 0
                ? `أرسل وجبات الأسبوع الآن · ${toLatin(planMealsCount)} وجبة`
                : "اختر وجبات للأسبوع"}
            </span>
            <span className="font-display text-base font-extrabold tabular-nums">{toLatin(planTotal)} ج.م</span>
          </button>
        </BottomCTA>
      )}
    </>
  );
};

// ===== Modal =====
function RecipeModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  const { add } = useCart();
  const content = RECIPE_CONTENT[recipe.id];
  const [servings, setServings] = useState(recipe.baseServings);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [orderQty, setOrderQty] = useState(1);
  const [tab, setTab] = useState<"overview" | "steps" | "tools">("overview");
  const [showVideo, setShowVideo] = useState(false);

  const ingredientsCost = useMemo(
    () => recipe.ingredients.filter((i) => !excluded.has(i.id)).reduce((s, i) => s + i.cost, 0),
    [recipe, excluded]
  );
  const totalPrice = Math.round(ingredientsCost * (servings / recipe.baseServings) * orderQty);

  const toggle = (ing: { id: string; essential?: boolean }) => {
    if (ing.essential) return; // cannot remove essential
    setExcluded((p) => { const x = new Set(p); x.has(ing.id) ? x.delete(ing.id) : x.add(ing.id); return x; });
  };

  const handleAdd = () => {
    const asProduct: Product = {
      id: `recipe-${recipe.id}-${Date.now()}`,
      name: `${recipe.name} (${toLatin(servings)} أفراد)`,
      unit: orderQty > 1 ? `${toLatin(orderQty)} طلبات` : `وصفة شيف`,
      price: totalPrice / orderQty,
      image: recipe.image,
      category: "وصفات",
      source: "recipes",
    };
    add(asProduct, orderQty);
    onClose();
  };

  const addTool = (t: ToolItem) => {
    // 1) primary product
    if (t.productId) {
      const primary = getById(t.productId);
      if (primary) {
        add(primary, 1);
        toast.success(`تمت إضافة ${primary.name} إلى السلة`);
        return;
      }
    }
    // 2) auto fallback
    if (t.fallbackId) {
      const fb = getById(t.fallbackId);
      if (fb) {
        add(fb, 1);
        toast.success(`تمت إضافة البديل: ${fb.name}`, {
          description: `${t.name} غير متوفر حاليًا — أضفنا البديل المناسب.`,
        });
        return;
      }
    }
    toast.error(`${t.name} غير متوفر حاليًا في المتجر`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-float-up" />
      <div
        className="relative mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-background shadow-float animate-float-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-background/90 p-3 backdrop-blur">
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5">
            <X className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-muted-foreground">تفاصيل الوصفة</span>
          <span className="w-9" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero with video play button */}
          <div className="relative">
            {showVideo && content?.videoUrl ? (
              <div className="aspect-[4/3] w-full bg-black">
                <iframe
                  src={`${content.videoUrl}?autoplay=1&rel=0`}
                  title={recipe.name}
                  className="h-full w-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <>
                <img src={recipe.image} alt={recipe.name} className="aspect-[4/3] w-full object-cover" />
                {content?.videoUrl && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
                  >
                    <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 shadow-pill">
                      <PlayCircle className="h-5 w-5 text-foreground" />
                      <span className="text-xs font-extrabold text-foreground">شاهد طريقة التحضير</span>
                    </div>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="space-y-5 p-5">
            {/* Title + meta */}
            <div>
              <h2 className="font-display text-2xl font-extrabold">{recipe.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground tabular-nums">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {toLatin(recipe.cookTime)}د طهي</span>
                {content && <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> {toLatin(content.prepTime)}د تحضير</span>}
                <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> {toLatin(recipe.calories)} سعرة</span>
                {content && (
                  <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] font-bold">{content.difficulty}</span>
                )}
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">{recipe.category}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="glass-strong flex rounded-full p-1 shadow-soft">
              {([
                { k: "overview", l: "الوصفة" },
                { k: "steps", l: "خطوات التحضير" },
                { k: "tools", l: "الأواني" },
              ] as const).map((t) => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex-1 rounded-full py-1.5 text-[11px] font-extrabold transition ${
                    tab === t.k ? "bg-foreground text-background shadow-pill" : "text-muted-foreground"
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>

            {tab === "overview" && (
              <>
                {/* Nutrition */}
                {content && (
                  <div>
                    <h3 className="mb-2 font-display text-base font-extrabold">القيم الغذائية / حصة</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { l: "بروتين", v: content.nutrition.protein, c: "text-rose-600 dark:text-rose-400" },
                        { l: "كارب", v: content.nutrition.carbs, c: "text-amber-600 dark:text-amber-400" },
                        { l: "دهون", v: content.nutrition.fat, c: "text-violet-600 dark:text-violet-400" },
                        { l: "ألياف", v: content.nutrition.fiber, c: "text-emerald-600 dark:text-emerald-400" },
                      ].map((n) => (
                        <div key={n.l} className="glass rounded-xl p-2.5 text-center shadow-soft">
                          <p className={`font-display text-lg font-extrabold tabular-nums ${n.c}`}>{toLatin(n.v)}<span className="text-[9px] font-bold opacity-70">غ</span></p>
                          <p className="text-[10px] font-bold text-muted-foreground">{n.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Servings */}
                <div className="glass-strong flex items-center justify-between rounded-2xl p-3 shadow-soft">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">عدد الأفراد</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setServings((s) => Math.max(1, s - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center font-display text-lg font-extrabold tabular-nums">{toLatin(servings)}</span>
                    <button onClick={() => setServings((s) => Math.min(12, s + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Ingredients (essential locked) */}
                <div>
                  <h3 className="mb-2 font-display text-base font-extrabold">المكونات</h3>
                  <p className="mb-3 text-[11px] text-muted-foreground">
                    احذف ما هو متوفر لديك لينخفض السعر · المكونات الأساسية مقفلة
                  </p>
                  <div className="space-y-2">
                    {recipe.ingredients.map((ing) => {
                      const off = excluded.has(ing.id);
                      const locked = !!ing.essential;
                      return (
                        <button
                          key={ing.id}
                          onClick={() => toggle(ing)}
                          disabled={locked}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right transition ${
                            locked
                              ? "bg-primary-soft/40 cursor-not-allowed"
                              : off
                              ? "bg-foreground/5 opacity-50"
                              : "glass"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {locked ? (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Lock className="h-3 w-3" strokeWidth={3} />
                              </span>
                            ) : (
                              <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                off ? "border-muted-foreground" : "border-primary bg-primary text-primary-foreground"
                              }`}>
                                {!off && <Check className="h-3 w-3" strokeWidth={3} />}
                              </span>
                            )}
                            <span className={`text-sm ${off ? "line-through" : ""}`}>{ing.name}</span>
                            {locked && (
                              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-extrabold text-primary-foreground">أساسي</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-primary tabular-nums">
                            {off ? "—" : `${toLatin(ing.cost)} ج`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Order quantity */}
                <div className="glass-strong flex items-center justify-between rounded-2xl p-3 shadow-soft">
                  <div>
                    <p className="text-sm font-bold">عدد الطلبات</p>
                    <p className="text-[10px] text-muted-foreground">اطلب الوصفة أكثر من مرة لمزيد من الأفراد</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setOrderQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center font-display text-lg font-extrabold tabular-nums">{toLatin(orderQty)}</span>
                    <button onClick={() => setOrderQty((q) => q + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {tab === "steps" && content && (
              <div>
                <h3 className="mb-3 flex items-center gap-2 font-display text-base font-extrabold">
                  <ChefHat className="h-4 w-4 text-primary" /> خطوات التحضير
                </h3>
                <ol className="space-y-2.5">
                  {content.steps.map((s, i) => (
                    <li key={i} className="glass flex gap-3 rounded-xl p-3 shadow-soft">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground tabular-nums">
                        {toLatin(i + 1)}
                      </span>
                      <p className="text-sm leading-relaxed">{s}</p>
                    </li>
                  ))}
                </ol>
                {content.videoUrl && !showVideo && (
                  <button
                    onClick={() => setShowVideo(true)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-sm font-extrabold text-background shadow-pill"
                  >
                    <PlayCircle className="h-4 w-4" /> شاهد الفيديو الكامل
                  </button>
                )}
              </div>
            )}

            {tab === "tools" && content && (
              <div>
                <h3 className="mb-1 flex items-center gap-2 font-display text-base font-extrabold">
                  <Utensils className="h-4 w-4 text-primary" /> الأواني المطلوبة
                </h3>
                <p className="mb-3 text-[11px] text-muted-foreground">
                  أضف ما ينقصك للسلة من قسم أدوات المطبخ، أو استخدم البديل المتوفر لديك.
                </p>
                <div className="space-y-2.5">
                  {content.tools.map((t) => {
                    const stockProduct = t.productId ? getById(t.productId) : undefined;
                    const inStock = !!stockProduct;
                    const fallbackProduct = !inStock && t.fallbackId ? getById(t.fallbackId) : undefined;
                    const effective = stockProduct ?? fallbackProduct;
                    const displayPrice = effective?.price ?? t.price;
                    return (
                    <div key={t.id} className="glass-strong rounded-2xl p-3 shadow-soft">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-display text-sm font-extrabold">{t.name}</p>
                            {!inStock && fallbackProduct && (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                بديل تلقائي
                              </span>
                            )}
                          </div>
                          {!inStock && fallbackProduct && (
                            <p className="mt-1 flex items-start gap-1 text-[11px] text-foreground/80">
                              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                              <span>سنضيف <b>{fallbackProduct.name}</b> بدلاً منه</span>
                            </p>
                          )}
                          {t.alternatives && t.alternatives.length > 0 && (
                            <p className="mt-1 flex items-start gap-1 text-[11px] text-muted-foreground">
                              <Repeat className="mt-0.5 h-3 w-3 shrink-0" />
                              <span>بديل: {t.alternatives.join(" · ")}</span>
                            </p>
                          )}
                        </div>
                        {effective && displayPrice ? (
                          <button
                            onClick={() => addTool(t)}
                            className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-extrabold shadow-pill active:scale-95 ${
                              inStock
                                ? "bg-primary text-primary-foreground"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            <ShoppingBasket className="h-3 w-3" />
                            <span className="tabular-nums">
                              {inStock ? "" : "البديل "}{toLatin(displayPrice)} ج
                            </span>
                          </button>
                        ) : (
                          <span className="shrink-0 rounded-full bg-foreground/5 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                            غير متوفر
                          </span>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="h-20" />
          </div>
        </div>

        {/* Sticky CTA */}
        <div
          className="border-t border-border bg-background p-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={handleAdd}
            className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 font-bold text-primary-foreground shadow-pill transition active:scale-[0.98]"
          >
            <span className="text-sm">أضف الوصفة للسلة</span>
            <span className="font-display text-base font-extrabold tabular-nums">{fmtMoney(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Daily browser (horizontal meal tabs + marketing-rich cards) =====
function DailyBrowser({
  activeMeal, setActiveMeal, now, filter, setFilter, filtered, onOpen,
}: {
  activeMeal: Recipe["section"];
  setActiveMeal: (s: Recipe["section"]) => void;
  now: Date;
  filter: string;
  setFilter: (s: string) => void;
  filtered: Recipe[];
  onOpen: (r: Recipe) => void;
}) {
  const { add } = useCart();
  const list = filtered.filter((r) => r.section === activeMeal);
  const openNow = isMealOpenNow(activeMeal, now);
  const minsLeft = minutesUntilClose(activeMeal, now);
  const window = MEAL_WINDOWS[activeMeal];

  return (
    <div className="space-y-4">
      {/* Horizontal meal tabs (إفطار · غداء · عشاء) */}
      <div className="grid grid-cols-3 gap-2">
        {sections.map((s) => {
          const w = MEAL_WINDOWS[s];
          const Icon = w.icon;
          const isActive = s === activeMeal;
          const open = isMealOpenNow(s, now);
          return (
            <button
              key={s}
              onClick={() => setActiveMeal(s)}
              className={`relative overflow-hidden rounded-2xl px-3 py-3 text-center transition ease-apple ${
                isActive
                  ? "bg-foreground text-background shadow-pill"
                  : "glass-strong text-foreground"
              }`}
            >
              <Icon className={`mx-auto h-5 w-5 ${isActive ? "" : "text-primary"}`} />
              <p className="mt-1 font-display text-sm font-extrabold">{s}</p>
              <p className={`text-[9px] tabular-nums ${isActive ? "opacity-75" : "text-muted-foreground"}`}>
                {w.label}
              </p>
              {open && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Availability banner — urgency / countdown */}
      <div
        className={`flex items-center justify-between rounded-2xl px-4 py-2.5 ${
          openNow
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
        }`}
      >
        <div className="flex items-center gap-2">
          {openNow ? <Zap className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
          <span className="text-[12px] font-extrabold">
            {openNow ? "متاح الآن" : "خارج وقت التقديم"}
          </span>
        </div>
        <span className="text-[11px] font-bold tabular-nums">
          {openNow
            ? `ينتهي خلال ${toLatin(Math.floor(minsLeft / 60))}س ${toLatin(minsLeft % 60)}د`
            : `يبدأ ${window.label}`}
        </span>
      </div>

      {/* Filters */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              filter === f ? "bg-foreground text-background" : "glass text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Recipe cards with marketing layers */}
      <div className="space-y-3">
        {list.map((r) => {
          const m = MARKETING[r.id] ?? {};
          const discountPct = m.oldPrice ? Math.round((1 - r.basePrice / m.oldPrice) * 100) : 0;
          const lowStock = (m.remaining ?? 99) <= 10;
          return (
            <div
              key={r.id}
              className="glass-strong relative overflow-hidden rounded-2xl shadow-soft"
            >
              {/* Top badges row */}
              <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
                {m.badge && (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-extrabold text-background shadow-pill">
                    {m.badge}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-pill">
                    -{toLatin(discountPct)}٪
                  </span>
                )}
              </div>

              <button onClick={() => onOpen(r)} className="flex w-full text-right">
                <div className="relative h-32 w-32 shrink-0">
                  <img src={r.image} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
                  {/* Sold-today chip on image */}
                  {m.soldToday && (
                    <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                      <TrendingUp className="h-3 w-3" /> {toLatin(m.soldToday)} اليوم
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between p-3 text-right">
                  <div>
                    <h4 className="font-display text-base font-extrabold leading-tight text-foreground">
                      {r.name}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{r.category}</p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-2.5 text-[10px] text-muted-foreground tabular-nums">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {toLatin(r.cookTime)}د</span>
                      <span className="flex items-center gap-1"><FlameIcon className="h-3 w-3" /> {toLatin(r.calories)}</span>
                    </div>
                    <div className="flex flex-col items-end leading-none">
                      {m.oldPrice && (
                        <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                          {toLatin(m.oldPrice)}
                        </span>
                      )}
                      <span className="font-display text-base font-extrabold text-primary tabular-nums">
                        {toLatin(r.basePrice)} <span className="text-[10px] text-muted-foreground">ج.م</span>
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Bottom marketing bar */}
              <div className="flex items-center justify-between border-t border-border/40 bg-background/30 px-3 py-2">
                {lowStock ? (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                    <Timer className="h-3 w-3" /> متبقي {toLatin(m.remaining!)} فقط
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    تخصيص المكونات لتقليل السعر
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    add({
                      id: `recipe-quick-${r.id}-${Date.now()}`,
                      name: r.name,
                      unit: "وصفة شيف",
                      price: r.basePrice,
                      image: r.image,
                      category: "وصفات",
                      source: "recipes",
                    });
                  }}
                  className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-pill active:scale-95"
                >
                  <Plus className="h-3 w-3" strokeWidth={3} />
                  أضف سريع
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Recipes;
