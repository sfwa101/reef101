import BackHeader from "@/components/BackHeader";
import BottomCTA from "@/components/BottomCTA";
import { useCart } from "@/context/CartContext";
import { useMemo, useState, useEffect } from "react";
import {
  Clock, Users, Flame, X, Minus, Plus, Check, Calendar, Sparkles,
  Sun, Sunset, Moon, Flame as FlameIcon, TrendingUp, Timer, Zap, BadgePercent, Truck,
} from "lucide-react";
import { fmtMoney, toLatin } from "@/lib/format";
import type { Product } from "@/lib/products";

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
  ingredients: { id: string; name: string; cost: number }[];
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
const filters = ["كل الوصفات", "سريعة", "عائلية", "للأطفال", "صحية", "نباتية"];
const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const Recipes = () => {
  const { add, items } = useCart();
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
    if (filter === "كل الوصفات") return RECIPES;
    return RECIPES.filter((r) => r.category.includes(filter.replace("ة", "").replace("ال", "")) || filter.includes(r.category));
  }, [filter]);

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
const RecipeModal = ({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) => {
  const { add } = useCart();
  const [servings, setServings] = useState(recipe.baseServings);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [orderQty, setOrderQty] = useState(1);

  const ingredientsCost = useMemo(
    () => recipe.ingredients.filter((i) => !excluded.has(i.id)).reduce((s, i) => s + i.cost, 0),
    [recipe, excluded]
  );
  // Apply servings ratio (linear) to the active ingredient cost
  const totalPrice = Math.round(ingredientsCost * (servings / recipe.baseServings) * orderQty);

  const toggle = (id: string) =>
    setExcluded((p) => { const x = new Set(p); x.has(id) ? x.delete(id) : x.add(id); return x; });

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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-float-up" />
      <div
        className="relative mx-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] bg-background shadow-float animate-float-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header (sticky inside modal) */}
        <div className="flex items-center justify-between bg-background/90 p-3 backdrop-blur">
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5">
            <X className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-muted-foreground">تفاصيل الوصفة</span>
          <span className="w-9" />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <img src={recipe.image} alt={recipe.name} className="aspect-[4/3] w-full object-cover" />
          <div className="space-y-5 p-5">
            <div>
              <h2 className="font-display text-2xl font-extrabold">{recipe.name}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground tabular-nums">
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {toLatin(recipe.cookTime)} دقيقة</span>
                <span className="flex items-center gap-1"><Flame className="h-3.5 w-3.5" /> {toLatin(recipe.calories)} سعرة</span>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">{recipe.category}</span>
              </div>
            </div>

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

            {/* Ingredients with deletion lowering price */}
            <div>
              <h3 className="mb-2 font-display text-base font-extrabold">المكونات</h3>
              <p className="mb-3 text-[11px] text-muted-foreground">احذف ما هو متوفر لديك لينخفض السعر</p>
              <div className="space-y-2">
                {recipe.ingredients.map((ing) => {
                  const off = excluded.has(ing.id);
                  return (
                    <button
                      key={ing.id}
                      onClick={() => toggle(ing.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right transition ${
                        off ? "bg-foreground/5 opacity-50" : "glass"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                          off ? "border-muted-foreground" : "border-primary bg-primary text-primary-foreground"
                        }`}>
                          {!off && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className={`text-sm ${off ? "line-through" : ""}`}>{ing.name}</span>
                      </div>
                      <span className="text-xs font-bold text-primary tabular-nums">{off ? "—" : `${toLatin(ing.cost)} ج`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity (-1+) — order same recipe more than once */}
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

            {/* Spacer for sticky CTA inside modal */}
            <div className="h-20" />
          </div>
        </div>

        {/* Sticky CTA at bottom of modal */}
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
};

export default Recipes;
