import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCartActions, useCartLineQty } from "@/context/CartContext";
import type { Product } from "@/lib/products";
import BackHeader from "@/components/BackHeader";
import { storeThemes } from "@/lib/storeThemes";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";
import {
  Search,
  X,
  Plus,
  Minus,
  Star,
  Truck,
  CalendarClock,
  ShieldCheck,
  Wrench,
  Lock,
  Sparkles,
  Layers3,
  ChefHat,
  Microwave,
  Sparkle,
  WashingMachine,
  Lamp,
  Package,
  Crown,
  CheckCircle2,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";

import imgCookware from "@/assets/hg-cookware.jpg";
import imgBlender from "@/assets/hg-blender.jpg";
import imgFridge from "@/assets/hg-fridge.jpg";
import imgWasher from "@/assets/hg-washer.jpg";
import imgVacuum from "@/assets/hg-vacuum.jpg";
import imgAirfryer from "@/assets/hg-airfryer.jpg";
import imgCleankit from "@/assets/hg-cleankit.jpg";
import imgLamp from "@/assets/hg-smartlamp.jpg";

/* ───────────── Domain ───────────── */

type CatId =
  | "all"
  | "majors"
  | "small"
  | "kitchen"
  | "clean"
  | "decor";

type Fulfillment = "instant" | "preorder";

type HGProduct = {
  id: string;
  name: string;
  brand: string;
  unit: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: CatId;
  fulfillment: Fulfillment;
  depositPct?: number; // for preorder
  etaDays?: number;
  tagline: string;
  badges: string[];
  warranty?: string;
};

const CATS: { id: CatId; name: string; icon: LucideIcon }[] = [
  { id: "all", name: "الكل", icon: Sparkle },
  { id: "majors", name: "أجهزة كهربائية كبرى", icon: WashingMachine },
  { id: "small", name: "أجهزة مطبخ صغيرة", icon: Microwave },
  { id: "kitchen", name: "أدوات مطبخ", icon: ChefHat },
  { id: "clean", name: "أدوات تنظيف", icon: Sparkles },
  { id: "decor", name: "ديكور ذكي", icon: Lamp },
];

const CATALOG: HGProduct[] = [
  {
    id: "hg-cookware",
    name: "طقم أواني ستانلس استيل ٥ قطع",
    brand: "ReefHome",
    unit: "٥ قطع — قاعدة ثلاثية",
    price: 850,
    oldPrice: 1100,
    image: imgCookware,
    rating: 4.9,
    reviews: 2480,
    category: "kitchen",
    fulfillment: "instant",
    tagline: "ثقيلة ومتينة — توزيع حراري احترافي",
    badges: ["خالي من PFOA", "مناسب للحث الكهرومغناطيسي"],
  },
  {
    id: "hg-cleankit",
    name: "بخاخ تنظيف طبيعي + مناشف ميكروفايبر",
    brand: "EcoLeaf",
    unit: "زجاجة 500 مل + قطعتين",
    price: 95,
    oldPrice: 130,
    image: imgCleankit,
    rating: 4.7,
    reviews: 1320,
    category: "clean",
    fulfillment: "instant",
    tagline: "آمن للأطفال — رائحة ليمون منعشة",
    badges: ["مكونات طبيعية", "خالي من الأمونيا"],
  },
  {
    id: "hg-airfryer",
    name: "قلاية هوائية رقمية ٥٫٥ لتر",
    brand: "Phillon",
    unit: "1700 واط — شاشة لمس",
    price: 2490,
    oldPrice: 3200,
    image: imgAirfryer,
    rating: 4.8,
    reviews: 3120,
    category: "small",
    fulfillment: "instant",
    tagline: "قلي بدون زيت — ٨ برامج جاهزة",
    badges: ["موفر للكهرباء", "سهل التنظيف"],
    warranty: "ضمان وكيل سنتين",
  },
  {
    id: "hg-blender",
    name: "خلاط كهربائي عالي القوة 1500W",
    brand: "Phillon",
    unit: "إبريق زجاج 2 لتر",
    price: 1290,
    oldPrice: 1600,
    image: imgBlender,
    rating: 4.7,
    reviews: 980,
    category: "small",
    fulfillment: "instant",
    tagline: "شفرات تيتانيوم — ٦ سرعات",
    badges: ["محرك نحاسي", "إبريق زجاج مقاوم"],
    warranty: "ضمان وكيل سنة",
  },
  {
    id: "hg-lamp",
    name: "مصباح ذكي LED بإضاءة دافئة",
    brand: "LumiSmart",
    unit: "تحكم بالتطبيق — RGB",
    price: 420,
    image: imgLamp,
    rating: 4.6,
    reviews: 540,
    category: "decor",
    fulfillment: "instant",
    tagline: "متوافق مع المساعدات الصوتية",
    badges: ["WiFi", "موفر للطاقة"],
  },
  {
    id: "hg-fridge",
    name: "ثلاجة فرنش دور — 580 لتر — انفرتر",
    brand: "Samsung",
    unit: "نوفروست — موفر طاقة A++",
    price: 38900,
    oldPrice: 44900,
    image: imgFridge,
    rating: 4.9,
    reviews: 412,
    category: "majors",
    fulfillment: "preorder",
    depositPct: 25,
    etaDays: 7,
    tagline: "تبريد ذكي مزدوج — موزع ماء وثلج",
    badges: ["انفرتر هادئ", "تحكم بالتطبيق"],
    warranty: "ضمان وكيل ٥ سنوات على المحرك",
  },
  {
    id: "hg-washer",
    name: "غسالة أوتوماتيك أمامية 9 كجم",
    brand: "LG",
    unit: "1400 لفة — بخار",
    price: 19500,
    oldPrice: 22900,
    image: imgWasher,
    rating: 4.8,
    reviews: 678,
    category: "majors",
    fulfillment: "preorder",
    depositPct: 25,
    etaDays: 7,
    tagline: "تقنية AI Direct Drive — تنظيف بالبخار",
    badges: ["موفر للماء", "هادئة جدًا"],
    warranty: "ضمان وكيل ١٠ سنوات على المحرك",
  },
  {
    id: "hg-vacuum",
    name: "روبوت مكنسة ذكي + ممسحة",
    brand: "Roborock",
    unit: "خرائط ليزر — تطبيق",
    price: 7900,
    oldPrice: 9500,
    image: imgVacuum,
    rating: 4.7,
    reviews: 1102,
    category: "small",
    fulfillment: "preorder",
    depositPct: 25,
    etaDays: 5,
    tagline: "ينظف ويمسح — يعود للشحن وحده",
    badges: ["خرائط ذكية", "بطارية طويلة"],
    warranty: "ضمان وكيل سنتين",
  },
];

type Bundle = {
  id: string;
  title: string;
  desc: string;
  itemIds: string[];
  bundlePrice: number;
  badge: string;
};

const BUNDLES: Bundle[] = [
  {
    id: "b1",
    title: "حزمة المطبخ الذكي",
    desc: "طقم أواني + خلاط 1500W",
    itemIds: ["hg-cookware", "hg-blender"],
    bundlePrice: 1890,
    badge: "وفّر 250 ج.م",
  },
  {
    id: "b2",
    title: "حزمة الطبخ الصحي",
    desc: "قلاية هوائية + بخاخ تنظيف طبيعي",
    itemIds: ["hg-airfryer", "hg-cleankit"],
    bundlePrice: 2499,
    badge: "وفّر 86 ج.م",
  },
  {
    id: "b3",
    title: "حزمة البيت الذكي",
    desc: "روبوت مكنسة + مصباح LED ذكي",
    itemIds: ["hg-vacuum", "hg-lamp"],
    bundlePrice: 8190,
    badge: "وفّر 130 ج.م",
  },
];

const BESTSELLER_IDS = ["hg-airfryer", "hg-washer", "hg-fridge", "hg-vacuum"];

/* ───────────── Helpers ───────────── */
const fmt = (n: number) => `${toLatin(n.toLocaleString("en-US"))} ج.م`;

/* ───────────── Page ───────────── */

const HomeStore = () => {
  const theme = storeThemes.homeTools;
  const [cat, setCat] = useState<CatId>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim();
    return CATALOG.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (!term) return true;
      return (
        p.name.includes(term) ||
        p.brand.includes(term) ||
        p.tagline.includes(term)
      );
    });
  }, [cat, q]);

  const bestSellers = useMemo(
    () => CATALOG.filter((p) => BESTSELLER_IDS.includes(p.id)),
    [],
  );

  const opened = openId ? CATALOG.find((p) => p.id === openId) ?? null : null;

  return (
    <div
      className="min-h-screen pb-32"
      style={{
        background: `linear-gradient(180deg, hsl(${theme.soft}) 0%, hsl(var(--background)) 320px)`,
      }}
    >
      <BackHeader title="الأدوات المنزلية" />

      {/* Hero */}
      <section className="px-4 pt-2">
        <div
          className="relative overflow-hidden rounded-3xl p-5 shadow-tile"
          style={{ background: theme.gradient }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <span
                className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-extrabold backdrop-blur"
                style={{ color: `hsl(${theme.hue})` }}
              >
                <Crown className="h-3 w-3" /> متجر بيتك الذكي
              </span>
              <h1
                className="mt-2 font-display text-2xl font-extrabold leading-tight text-balance"
                style={{ color: `hsl(${theme.ink})` }}
              >
                من أصغر أداة<br />إلى أكبر جهاز
              </h1>
              <p
                className="mt-1 text-[12.5px] font-medium opacity-80"
                style={{ color: `hsl(${theme.ink})` }}
              >
                تسليم فوري · ضمان وكيل · حجز مسبق بدفعة 25%
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  <Truck className="h-3 w-3" /> توصيل اليوم
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-amber-700">
                  <ShieldCheck className="h-3 w-3" /> ضمان وكيل
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-sky-700">
                  <Wrench className="h-3 w-3" /> صيانة معتمدة
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="px-4 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن جهاز، أداة، علامة تجارية…"
            className="h-11 w-full rounded-2xl bg-card pe-10 ps-4 text-[13px] font-medium shadow-soft ring-1 ring-border/60 placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as string]: `hsl(${theme.hue} / 0.4)` }}
          />
        </div>
      </section>

      {/* Sticky scrollable categories */}
      <section
        className="sticky top-[64px] lg:top-[80px] z-30 mt-3 border-y border-border/40 bg-background/85 backdrop-blur"
        style={{ contain: "layout paint" }}
      >
        <div className="-mx-1 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATS.map((c) => {
            const Icon = c.icon;
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-extrabold transition active:scale-95 ${
                  active
                    ? "text-white shadow-pill"
                    : "bg-card text-foreground ring-1 ring-border/60"
                }`}
                style={
                  active
                    ? { background: `hsl(${theme.hue})` }
                    : undefined
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* Bundles rail */}
      {cat === "all" && !q && (
        <section className="mt-5 px-4">
          <RailHeader
            icon={Package}
            title="جهّز بيتك بذكاء"
            sub="حزم مختارة بسعر أوفر عند الشراء معًا"
            hue={theme.hue}
          />
          <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BUNDLES.map((b) => (
              <BundleCard
                key={b.id}
                bundle={b}
                items={CATALOG.filter((p) => b.itemIds.includes(p.id))}
                hue={theme.hue}
              />
            ))}
          </div>
        </section>
      )}

      {/* Best sellers */}
      {cat === "all" && !q && (
        <section className="mt-6 px-4">
          <RailHeader
            icon={Crown}
            title="الأكثر مبيعًا في الأجهزة"
            sub="اختيارات موثوقة من آلاف العملاء"
            hue={theme.hue}
          />
          <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {bestSellers.map((p) => (
              <div key={p.id} className="w-[210px] shrink-0">
                <ProductCard p={p} onOpen={() => setOpenId(p.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <section className="mt-6 px-4">
        <RailHeader
          icon={Layers3}
          title={cat === "all" ? "كل المنتجات" : CATS.find((c) => c.id === cat)?.name ?? ""}
          sub={`${toLatin(filtered.length)} منتج`}
          hue={theme.hue}
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} onOpen={() => setOpenId(p.id)} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-muted-foreground">
            لا توجد نتائج — جرّب كلمة أخرى.
          </p>
        )}
      </section>

      {/* Detail overlay */}
      {opened && <DetailSheet product={opened} onClose={() => setOpenId(null)} />}
    </div>
  );
};

/* ───────────── Pieces ───────────── */

const RailHeader = ({
  icon: Icon,
  title,
  sub,
  hue,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  hue: string;
}) => (
  <div className="flex items-end justify-between">
    <div>
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-white"
          style={{ background: `hsl(${hue})` }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h2 className="font-display text-lg font-extrabold text-foreground">
          {title}
        </h2>
      </div>
      {sub && <p className="mt-0.5 ps-9 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

const ProductCard = ({
  p,
  onOpen,
}: {
  p: HGProduct;
  onOpen: () => void;
}) => {
  const { add } = useCartActions();
  const qty = useCartLineQty(p.id);
  const isPre = p.fulfillment === "preorder";
  const deposit = isPre ? Math.round((p.price * (p.depositPct ?? 25)) / 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPre) {
      // Open detail to confirm preorder terms
      onOpen();
      return;
    }
    add({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      unit: p.unit,
      category: "أدوات منزلية",
      source: "home",
    } as unknown as import("@/lib/products").Product);
    toast.success("أُضيف إلى السلة", { description: p.name });
  };

  return (
    <article
      onClick={onOpen}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-card text-right shadow-soft ring-1 ring-border/50 transition active:scale-[0.99] ${
        isPre ? "ring-2 ring-amber-300/60" : ""
      }`}
      style={{ contentVisibility: "auto", containIntrinsicSize: "320px 340px" }}
    >
      {/* Premium frame for preorder */}
      {isPre && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(135deg, hsl(40 90% 60% / 0.07), transparent 40%)",
          }}
        />
      )}

      <div className="relative aspect-square overflow-hidden bg-secondary/40">
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          decoding="async"
          width={768}
          height={768}
          className="h-full w-full object-cover"
        />

        {/* Top-right fulfillment badge */}
        {isPre ? (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-amber-500 to-amber-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-pill">
            <CalendarClock className="h-3 w-3" />
            حجز · {toLatin(p.etaDays ?? 7)} أيام
          </span>
        ) : (
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-pill">
            <Truck className="h-3 w-3" />
            يصلك اليوم
          </span>
        )}

        {/* Discount */}
        {p.oldPrice && (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground tabular-nums">
            خصم {toLatin(Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100))}٪
          </span>
        )}

        {isPre && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-foreground/85 px-2 py-1 text-[10px] font-bold text-background backdrop-blur">
            <Crown className="h-3 w-3 text-amber-300" />
            Premium
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-[10px] font-medium text-muted-foreground">{p.brand}</p>
        <h3 className="line-clamp-2 text-[13px] font-extrabold leading-tight text-foreground">
          {p.name}
        </h3>
        <p className="line-clamp-1 text-[10.5px] text-muted-foreground">{p.tagline}</p>

        <div className="mt-1 flex items-center gap-1 text-[10.5px]">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="font-bold tabular-nums">{toLatin(p.rating)}</span>
          <span className="text-muted-foreground">
            ({toLatin(p.reviews.toLocaleString("en-US"))})
          </span>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div className="leading-none">
            <span className="font-display text-lg font-extrabold tabular-nums">
              {toLatin(p.price.toLocaleString("en-US"))}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground"> ج.م</span>
            {p.oldPrice && (
              <div className="text-[10px] text-muted-foreground line-through tabular-nums">
                {toLatin(p.oldPrice.toLocaleString("en-US"))} ج.م
              </div>
            )}
          </div>

          <button
            onClick={handleAdd}
            aria-label={isPre ? "احجز الآن" : "أضف إلى السلة"}
            className={`flex h-9 items-center gap-1 rounded-full px-3 text-[11px] font-extrabold shadow-pill transition active:scale-95 ${
              isPre
                ? "bg-gradient-to-l from-amber-500 to-amber-600 text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isPre ? (
              <>
                <CalendarClock className="h-3.5 w-3.5" />
                احجز الآن
              </>
            ) : qty === 0 ? (
              <>
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                للسلة
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                {toLatin(qty)}
              </>
            )}
          </button>
        </div>

        {isPre && (
          <p className="mt-1.5 text-[9.5px] font-bold text-amber-700">
            ادفع {toLatin(p.depositPct ?? 25)}٪ مقدّم ({fmt(deposit)}) لإتمام الحجز
          </p>
        )}
      </div>
    </article>
  );
};

const BundleCard = ({
  bundle,
  items,
  hue,
}: {
  bundle: Bundle;
  items: HGProduct[];
  hue: string;
}) => {
  const { add } = useCartActions();
  const original = items.reduce((s, i) => s + i.price, 0);
  const save = original - bundle.bundlePrice;

  const onBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    items.forEach((p) =>
      add({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        unit: p.unit,
        category: "أدوات منزلية",
        source: "home",
      } as unknown as import("@/lib/products").Product),
    );
    toast.success("أُضيفت الحزمة إلى السلة", { description: bundle.title });
  };

  return (
    <article
      className="relative w-[280px] shrink-0 overflow-hidden rounded-2xl bg-card text-right shadow-tile ring-1 ring-border/50"
      style={{ contentVisibility: "auto", containIntrinsicSize: "280px 280px" }}
    >
      <div className="relative h-[140px] bg-secondary/40">
        <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
          {items.slice(0, 2).map((it) => (
            <img
              key={it.id}
              src={it.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full rounded-xl object-cover"
            />
          ))}
        </div>
        <span
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold text-white shadow-pill"
          style={{ background: `hsl(${hue})` }}
        >
          <Package className="h-3 w-3" /> حزمة ذكية
        </span>
        <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-extrabold text-white shadow-pill">
          {bundle.badge}
        </span>
      </div>

      <div className="p-3">
        <h3 className="line-clamp-1 text-[13px] font-extrabold text-foreground">
          {bundle.title}
        </h3>
        <p className="line-clamp-1 text-[11px] text-muted-foreground">{bundle.desc}</p>

        <div className="mt-2 flex items-end justify-between">
          <div className="leading-none">
            <span className="font-display text-lg font-extrabold tabular-nums">
              {toLatin(bundle.bundlePrice.toLocaleString("en-US"))}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground"> ج.م</span>
            <div className="text-[10px] text-muted-foreground line-through tabular-nums">
              {toLatin(original.toLocaleString("en-US"))} ج.م
            </div>
          </div>
          <button
            onClick={onBuy}
            className="rounded-full bg-foreground px-3 py-2 text-[11px] font-extrabold text-background shadow-pill active:scale-95"
          >
            اشترِ الحزمة
          </button>
        </div>
      </div>
    </article>
  );
};

/* ───────────── Detail overlay (partial pop-up) ───────────── */

const DetailSheet = ({
  product,
  onClose,
}: {
  product: HGProduct;
  onClose: () => void;
}) => {
  const { add } = useCartActions();
  const isPre = product.fulfillment === "preorder";
  const deposit = isPre
    ? Math.round((product.price * (product.depositPct ?? 25)) / 100)
    : 0;
  const remaining = product.price - deposit;

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleConfirm = () => {
    add({
      id: product.id,
      name: product.name,
      price: isPre ? deposit : product.price,
      image: product.image,
      unit: isPre ? `دفعة مقدمة — ${product.unit}` : product.unit,
      category: "أدوات منزلية",
      source: "home",
    } as unknown as import("@/lib/products").Product);
    toast.success(isPre ? "تم تأكيد الحجز" : "أُضيف إلى السلة", {
      description: product.name,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-t-[28px] bg-background shadow-2xl ring-1 ring-border/60 animate-in slide-in-from-bottom-8"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-bold text-muted-foreground">
            {isPre ? "منتج بالحجز المسبق" : "متوفر للتسليم الفوري"}
          </span>
          <span className="w-8" />
        </div>

        <div className="max-h-[calc(90vh-60px)] overflow-y-auto pb-32">
          <div className="relative aspect-[4/3] bg-secondary/40">
            <img
              src={product.image}
              alt={product.name}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover"
            />
            {isPre ? (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-amber-500 to-amber-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-pill">
                <CalendarClock className="h-3.5 w-3.5" />
                حجز مسبق · استلام خلال {toLatin(product.etaDays ?? 7)} أيام
              </span>
            ) : (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-pill">
                <Truck className="h-3.5 w-3.5" />
                تسليم اليوم
              </span>
            )}
          </div>

          <div className="px-4 pt-4">
            <p className="text-[11px] font-bold text-muted-foreground">
              {product.brand}
            </p>
            <h2 className="mt-0.5 font-display text-xl font-extrabold leading-tight text-foreground">
              {product.name}
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {product.tagline}
            </p>

            <div className="mt-2 flex items-center gap-2 text-[12px]">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold tabular-nums">
                  {toLatin(product.rating)}
                </span>
              </span>
              <span className="text-muted-foreground">
                ({toLatin(product.reviews.toLocaleString("en-US"))} تقييم)
              </span>
            </div>

            {/* Price block */}
            <div className="mt-4 rounded-2xl bg-card p-4 ring-1 ring-border/60">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-extrabold tabular-nums">
                  {toLatin(product.price.toLocaleString("en-US"))}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  ج.م
                </span>
                {product.oldPrice && (
                  <span className="text-[12px] text-muted-foreground line-through tabular-nums">
                    {toLatin(product.oldPrice.toLocaleString("en-US"))} ج.م
                  </span>
                )}
              </div>

              {/* Trust badges */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <TrustBadge icon={ShieldCheck} label={product.warranty ? "ضمان وكيل" : "بضاعة أصلية"} />
                <TrustBadge icon={Wrench} label="صيانة معتمدة" />
                <TrustBadge icon={Lock} label="دفع آمن" />
              </div>

              {product.warranty && (
                <p className="mt-3 text-[11px] font-bold text-emerald-700">
                  ✓ {product.warranty}
                </p>
              )}
            </div>

            {/* Preorder payment breakdown */}
            {isPre && (
              <div className="mt-3 overflow-hidden rounded-2xl ring-2 ring-amber-300/70">
                <div className="bg-gradient-to-l from-amber-500 to-amber-600 px-4 py-2 text-[11px] font-extrabold text-white">
                  تفاصيل دفعة الحجز المسبق
                </div>
                <div className="space-y-2 bg-amber-50/60 px-4 py-3">
                  <Row label="السعر الإجمالي" value={fmt(product.price)} bold />
                  <Row
                    label={`الدفعة المقدمة (${toLatin(product.depositPct ?? 25)}٪)`}
                    value={fmt(deposit)}
                    accent
                  />
                  <Row label="المتبقي عند الاستلام" value={fmt(remaining)} />
                  <p className="pt-1 text-[10.5px] text-amber-800">
                    سيتم التواصل لتأكيد موعد التسليم خلال {toLatin(product.etaDays ?? 7)} أيام عمل.
                  </p>
                </div>
              </div>
            )}

            {/* Specs */}
            <div className="mt-4">
              <h3 className="text-[12px] font-extrabold text-foreground">
                المواصفات الرئيسية
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip>{product.unit}</Chip>
                {product.badges.map((b) => (
                  <Chip key={b}>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    {b}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="absolute inset-x-0 bottom-0 border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur">
          <button
            onClick={handleConfirm}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-extrabold shadow-pill transition active:scale-[0.98] ${
              isPre
                ? "bg-gradient-to-l from-amber-500 to-amber-600 text-white"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {isPre ? (
              <>
                <CalendarClock className="h-4 w-4" />
                احجز بدفعة {fmt(deposit)}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" strokeWidth={3} />
                أضف إلى السلة — {fmt(product.price)}
              </>
            )}
          </button>
          {isPre && (
            <p className="mt-1.5 text-center text-[10px] font-bold text-muted-foreground">
              ادفع {fmt(deposit)} الآن — والمتبقي {fmt(remaining)} عند الاستلام
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const TrustBadge = ({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/60 p-2 text-center">
    <Icon className="h-4 w-4 text-foreground" />
    <span className="text-[10px] font-extrabold text-foreground">{label}</span>
  </div>
);

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-foreground">
    {children}
  </span>
);

const Row = ({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) => (
  <div className="flex items-center justify-between text-[12px]">
    <span className="text-muted-foreground">{label}</span>
    <span
      className={`tabular-nums ${
        accent ? "font-extrabold text-amber-700" : bold ? "font-extrabold" : "font-bold"
      }`}
    >
      {value}
    </span>
  </div>
);

export default HomeStore;
