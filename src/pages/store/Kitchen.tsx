import { useEffect, useMemo, useState } from "react";
import BackHeader from "@/components/BackHeader";
import MealSheet from "@/components/kitchen/MealSheet";
import {
  dailyMeals,
  weeklyMeals,
  dayShortAr,
  dayNamesAr,
  categoryLabels,
  badgeLabel,
  getBookingDeadline,
  type KitchenMeal,
} from "@/lib/kitchenMenu";
import { fmtMoney, toLatin } from "@/lib/format";
import { Clock, Flame, Search, Star, AlarmClock } from "lucide-react";

type Tab = "weekly" | "daily";
type CatFilter = "all" | KitchenMeal["category"];

const Kitchen = () => {
  const [tab, setTab] = useState<Tab>("daily");
  const [activeDay, setActiveDay] = useState<number>(() => new Date().getDay());
  const [catFilter, setCatFilter] = useState<CatFilter>("all");
  const [query, setQuery] = useState("");
  const [openMeal, setOpenMeal] = useState<KitchenMeal | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());

  // Tick every minute so deadline countdown stays fresh
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dayMeals = useMemo(
    () => weeklyMeals.filter((m) => m.day === activeDay),
    [activeDay]
  );
  const deadline = useMemo(() => getBookingDeadline(activeDay, now), [activeDay, now]);
  const isClosed = deadline.getTime() <= now.getTime();

  const filteredDaily = useMemo(() => {
    return dailyMeals.filter((m) => {
      if (catFilter !== "all" && m.category !== catFilter) return false;
      if (query && !m.name.includes(query) && !m.short.includes(query)) return false;
      return true;
    });
  }, [catFilter, query]);

  return (
    <div className="px-4 pb-24 pt-1">
      <BackHeader title="مطبخ ريف المدينة" subtitle="وجبات طازجة كل يوم" />

      {/* Hero */}
      <section
        className="relative mb-4 overflow-hidden rounded-[1.75rem] p-5 shadow-tile"
        style={{
          background:
            "linear-gradient(135deg, hsl(20 60% 28%), hsl(15 50% 40%) 60%, hsl(35 70% 60%))",
        }}
      >
        <div className="absolute -bottom-12 -right-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
          مطبخ السحاب الذكي
        </span>
        <h2 className="mt-3 font-display text-2xl font-extrabold text-white text-balance">
          احجز وجبتك مسبقاً واستلمها طازجة
        </h2>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-white/85 tabular-nums">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> توصيل ٣٠ د
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3.5 w-3.5" /> طبخ يومي
          </span>
        </div>
      </section>

      {/* Sticky tabs */}
      <div className="sticky top-[56px] z-30 -mx-4 mb-3 bg-background/85 px-4 py-2 backdrop-blur">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          <TabBtn active={tab === "daily"} onClick={() => setTab("daily")}>
            وجبات فورية
          </TabBtn>
          <TabBtn active={tab === "weekly"} onClick={() => setTab("weekly")}>
            المنيو الأسبوعي
          </TabBtn>
        </div>
      </div>

      {tab === "weekly" ? (
        <WeeklyView
          activeDay={activeDay}
          setActiveDay={setActiveDay}
          meals={dayMeals}
          deadline={deadline}
          isClosed={isClosed}
          onOpen={setOpenMeal}
        />
      ) : (
        <DailyView
          query={query}
          setQuery={setQuery}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          meals={filteredDaily}
          onOpen={setOpenMeal}
        />
      )}

      <MealSheet
        meal={openMeal}
        open={!!openMeal}
        onClose={() => setOpenMeal(null)}
        weeklyDay={tab === "weekly" ? activeDay : undefined}
        weeklyDayLabel={tab === "weekly" ? dayNamesAr[activeDay] : undefined}
      />
    </div>
  );
};

const TabBtn = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`rounded-full py-2 text-xs font-bold transition ${
      active
        ? "bg-card text-foreground shadow-sm"
        : "bg-transparent text-muted-foreground"
    }`}
  >
    {children}
  </button>
);

/* ---------- Weekly view ---------- */

const formatDeadline = (d: Date, dayName: string) => {
  const dn = dayShortAr[(d.getDay()) % 7];
  const hh = d.getHours();
  const period = hh >= 12 ? "م" : "ص";
  const h12 = ((hh + 11) % 12) + 1;
  return `يُغلق حجز ${dayName} يوم ${dn} الساعة ${toLatin(h12)} ${period}`;
};

const WeeklyView = ({
  activeDay,
  setActiveDay,
  meals,
  deadline,
  isClosed,
  onOpen,
}: {
  activeDay: number;
  setActiveDay: (d: number) => void;
  meals: KitchenMeal[];
  deadline: Date;
  isClosed: boolean;
  onOpen: (m: KitchenMeal) => void;
}) => {
  return (
    <>
      {/* Day picker */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex snap-x snap-mandatory gap-2">
          {dayShortAr.map((name, i) => {
            const active = i === activeDay;
            return (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                className={`flex shrink-0 snap-start flex-col items-center justify-center rounded-2xl px-4 py-2 transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-pill"
                    : "bg-card text-foreground ring-1 ring-border/50"
                }`}
              >
                <span className="text-[10px] opacity-80">يوم</span>
                <span className="font-display text-sm font-extrabold">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deadline banner */}
      <div
        className={`mt-3 flex items-center gap-2 rounded-2xl border p-3 text-xs font-bold ${
          isClosed
            ? "border-destructive/40 bg-destructive/10 text-destructive"
            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        }`}
      >
        <AlarmClock className="h-4 w-4 shrink-0" />
        <span>
          {isClosed
            ? `انتهى وقت حجز ${dayNamesAr[activeDay]} — جرّب اليوم التالي`
            : formatDeadline(deadline, dayNamesAr[activeDay])}
        </span>
      </div>

      {/* Weekly meals list */}
      <div className="mt-4 space-y-3">
        {meals.length === 0 && (
          <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">
            لا توجد وجبات مجدولة لهذا اليوم بعد.
          </p>
        )}
        {meals.map((m) => (
          <MealRow key={m.id} meal={m} disabled={isClosed} onOpen={() => !isClosed && onOpen(m)} />
        ))}
      </div>
    </>
  );
};

/* ---------- Daily view ---------- */

const DailyView = ({
  query,
  setQuery,
  catFilter,
  setCatFilter,
  meals,
  onOpen,
}: {
  query: string;
  setQuery: (s: string) => void;
  catFilter: CatFilter;
  setCatFilter: (c: CatFilter) => void;
  meals: KitchenMeal[];
  onOpen: (m: KitchenMeal) => void;
}) => {
  const cats: { id: CatFilter; label: string }[] = [
    { id: "all", label: "الكل" },
    { id: "grills", label: categoryLabels.grills },
    { id: "sandwiches", label: categoryLabels.sandwiches },
    { id: "crepes", label: categoryLabels.crepes },
    { id: "family", label: categoryLabels.family },
  ];

  return (
    <>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن وجبة…"
          className="w-full rounded-full border border-border/60 bg-card py-3 pr-10 pl-4 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
      </div>

      {/* Category chips */}
      <div className="-mx-4 mb-3 overflow-x-auto px-4">
        <div className="flex gap-2">
          {cats.map((c) => {
            const active = catFilter === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCatFilter(c.id)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-pill"
                    : "bg-card text-foreground ring-1 ring-border/50"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {meals.length === 0 && (
          <p className="rounded-2xl bg-muted p-6 text-center text-sm text-muted-foreground">
            لا توجد وجبات مطابقة.
          </p>
        )}
        {meals.map((m) => (
          <MealRow key={m.id} meal={m} onOpen={() => onOpen(m)} />
        ))}
      </div>
    </>
  );
};

/* ---------- Meal Row card ---------- */

const MealRow = ({
  meal,
  onOpen,
  disabled,
}: {
  meal: KitchenMeal;
  onOpen: () => void;
  disabled?: boolean;
}) => {
  const startPrice = Math.min(...meal.sizes.map((s) => s.price));
  return (
    <button
      onClick={onOpen}
      disabled={disabled}
      className={`group flex gap-3 overflow-hidden rounded-3xl bg-card p-3 text-right shadow-tile ring-1 ring-border/40 transition active:scale-[0.99] ${
        disabled ? "opacity-60 grayscale" : "hover:ring-primary/30"
      }`}
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
        <img
          src={meal.image}
          alt={meal.name}
          className="h-full w-full object-cover transition group-hover:scale-105"
        />
        {meal.badge && !disabled && (
          <span className="absolute right-1 top-1 rounded-full bg-primary px-2 py-0.5 text-[9px] font-extrabold text-primary-foreground">
            {badgeLabel[meal.badge]}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-display text-sm font-extrabold leading-tight">
            {meal.name}
          </h3>
          <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 tabular-nums">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            {toLatin(meal.rating)}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{meal.short}</p>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground tabular-nums">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3" /> {toLatin(meal.nutrition.kcal)} سعرة
            </span>
          </div>
          {disabled ? (
            <span className="rounded-full bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
              انتهى وقت الحجز
            </span>
          ) : (
            <span className="rounded-full bg-primary-soft px-3 py-1.5 font-display text-xs font-extrabold text-primary tabular-nums">
              يبدأ من {fmtMoney(startPrice)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default Kitchen;
