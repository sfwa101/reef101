import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useCartActions, useCartLineQty } from "@/context/CartContext";
import BackHeader from "@/components/BackHeader";
import { storeThemes } from "@/lib/storeThemes";
import {
  Sparkles,
  CalendarClock,
  Stethoscope,
  ScanLine,
  Pill,
  HeartPulse,
  Leaf,
  Activity,
  ShieldPlus,
  Baby,
  Search,
  X,
  Plus,
  Minus,
  Star,
  Calculator,
  CheckCircle2,
  Camera,
  Sparkle,
  Bot,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import rxVitD from "@/assets/rx-vitd.jpg";
import rxOmega from "@/assets/rx-omega.jpg";
import rxGlucose from "@/assets/rx-glucose.jpg";
import rxFirstAid from "@/assets/rx-firstaid.jpg";
import rxSerum from "@/assets/rx-serum.jpg";
import rxBp from "@/assets/rx-bp.jpg";
import pMedicine from "@/assets/p-medicine.jpg";
import pDiapers from "@/assets/p-diapers.jpg";

/* ──────────────────────────────────────────────────────────────────── */
/* Domain                                                              */
/* ──────────────────────────────────────────────────────────────────── */

type RxProduct = {
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
  tagline: string;
  badges: string[]; // e.g. "خالٍ من الجلوتين"
  dosage: string;
  inStock: boolean;
};

type CatId =
  | "all"
  | "vitamins"
  | "rx"
  | "personal"
  | "diabetes"
  | "firstaid"
  | "baby";

const categories: { id: CatId; name: string; icon: LucideIcon }[] = [
  { id: "all", name: "الكل", icon: Sparkle },
  { id: "vitamins", name: "فيتامينات ومكملات", icon: Leaf },
  { id: "rx", name: "أدوية موصوفة", icon: Pill },
  { id: "personal", name: "عناية شخصية متقدمة", icon: HeartPulse },
  { id: "diabetes", name: "عناية مرضى السكري", icon: Activity },
  { id: "firstaid", name: "الإسعافات الأولية", icon: ShieldPlus },
  { id: "baby", name: "عناية الأطفال", icon: Baby },
];

const RX: RxProduct[] = [
  {
    id: "vit-d3",
    name: "فيتامين د3 5000 وحدة",
    brand: "ناتشورال",
    unit: "60 كبسولة",
    price: 185,
    oldPrice: 220,
    image: rxVitD,
    rating: 4.8,
    reviews: 312,
    category: "vitamins",
    tagline: "لمناعة قوية وعظام سليمة",
    badges: ["خالٍ من الجلوتين", "غير معدّل وراثياً", "نباتي"],
    dosage: "كبسولة واحدة يومياً مع الطعام",
    inStock: true,
  },
  {
    id: "omega3",
    name: "أوميجا 3 عالي التركيز",
    brand: "نوردك بيور",
    unit: "90 كبسولة · 1000mg",
    price: 295,
    image: rxOmega,
    rating: 4.9,
    reviews: 421,
    category: "vitamins",
    tagline: "لصحة القلب والدماغ",
    badges: ["نقي طبياً", "بدون رائحة", "مُختبر معملياً"],
    dosage: "كبسولتان يومياً مع الوجبات",
    inStock: true,
  },
  {
    id: "para",
    name: "باراسيتامول 500mg",
    brand: "أبيمول",
    unit: "20 قرص",
    price: 22,
    image: pMedicine,
    rating: 4.6,
    reviews: 98,
    category: "rx",
    tagline: "مسكن وخافض للحرارة",
    badges: ["لا يحتاج وصفة", "آمن للحامل بإشراف"],
    dosage: "قرص كل 6 ساعات عند الحاجة",
    inStock: true,
  },
  {
    id: "amox",
    name: "أموكسيسيلين 500mg",
    brand: "ميديك",
    unit: "21 كبسولة",
    price: 65,
    image: pMedicine,
    rating: 4.5,
    reviews: 54,
    category: "rx",
    tagline: "مضاد حيوي واسع الطيف",
    badges: ["يحتاج وصفة طبية"],
    dosage: "كبسولة كل 8 ساعات",
    inStock: true,
  },
  {
    id: "serum",
    name: "سيروم حمض الهيالورونيك",
    brand: "ديرما لوكس",
    unit: "30ml",
    price: 340,
    oldPrice: 420,
    image: rxSerum,
    rating: 4.9,
    reviews: 256,
    category: "personal",
    tagline: "ترطيب عميق ومكافحة الشيخوخة",
    badges: ["ديرماتولوجياً مختبر", "خالٍ من البارابين"],
    dosage: "قطرتان صباحاً ومساءً",
    inStock: true,
  },
  {
    id: "glucose",
    name: "جهاز قياس السكر الذكي",
    brand: "أكيوريت",
    unit: "جهاز + 50 شريحة",
    price: 890,
    image: rxGlucose,
    rating: 4.7,
    reviews: 128,
    category: "diabetes",
    tagline: "نتائج دقيقة في 5 ثوانٍ",
    badges: ["متصل بالموبايل", "ضمان سنتين"],
    dosage: "كما يحدده طبيبك",
    inStock: true,
  },
  {
    id: "firstaid",
    name: "حقيبة إسعافات أولية شاملة",
    brand: "ميد سيف",
    unit: "32 قطعة",
    price: 245,
    image: rxFirstAid,
    rating: 4.8,
    reviews: 89,
    category: "firstaid",
    tagline: "كل ما تحتاجه للطوارئ المنزلية",
    badges: ["معتمدة طبياً", "محمولة"],
    dosage: "—",
    inStock: true,
  },
  {
    id: "bp",
    name: "جهاز قياس ضغط الدم",
    brand: "أوميرون",
    unit: "ذراع رقمي",
    price: 1250,
    oldPrice: 1450,
    image: rxBp,
    rating: 4.9,
    reviews: 201,
    category: "personal",
    tagline: "قياسات دقيقة في المنزل",
    badges: ["شاشة كبيرة", "ذاكرة 60 قراءة"],
    dosage: "قراءتان يومياً",
    inStock: true,
  },
  {
    id: "diapers",
    name: "حفاضات الأطفال الفاخرة",
    brand: "بامبو",
    unit: "مقاس 4 · 60 حبة",
    price: 215,
    image: pDiapers,
    rating: 4.7,
    reviews: 312,
    category: "baby",
    tagline: "جلد طفلك يستحق الأفضل",
    badges: ["ناعم على البشرة", "امتصاص 12 ساعة"],
    dosage: "—",
    inStock: true,
  },
];

/* ──────────────────────────────────────────────────────────────────── */
/* Lazy image w/ shimmer                                                */
/* ──────────────────────────────────────────────────────────────────── */

const LazyImg = ({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <div
          aria-hidden
          className="absolute inset-0 animate-shimmer"
          style={{
            background:
              "linear-gradient(110deg, hsl(var(--muted)) 8%, hsl(var(--muted-foreground) / 0.08) 18%, hsl(var(--muted)) 33%)",
            backgroundSize: "200% 100%",
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={768}
        height={768}
        onLoad={() => setLoaded(true)}
        className={`${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
      />
    </>
  );
};

/* ──────────────────────────────────────────────────────────────────── */
/* Page                                                                 */
/* ──────────────────────────────────────────────────────────────────── */

const Pharmacy = () => {
  const theme = storeThemes.pharmacy;
  const [active, setActive] = useState<CatId>("all");
  const [query, setQuery] = useState("");
  const [openProduct, setOpenProduct] = useState<RxProduct | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim();
    return RX.filter((p) => active === "all" || p.category === active).filter(
      (p) => !q || p.name.includes(q) || p.brand.includes(q),
    );
  }, [active, query]);

  const recommendations = useMemo(
    () => RX.filter((p) => ["vit-d3", "omega3", "serum", "firstaid"].includes(p.id)),
    [],
  );

  return (
    <div className="pb-8">
      <BackHeader title="صيدلية ريف" subtitle="أعظم صيدلية ذكية · توصيل خلال ساعة" accent="صحة" themeKey="pharmacy" />

      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-tile"
        style={{ background: theme.gradient }}
      >
        <span
          className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-extrabold"
          style={{ color: `hsl(${theme.hue})` }}
        >
          <Sparkles className="h-3 w-3" /> ذكاء صيدلاني
        </span>
        <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground text-balance">
          ارفع وصفتك الطبية،<br />يجهّزها صيدليّنا الذكي فوراً
        </h2>
        <p className="mt-1.5 text-[12px] font-medium text-foreground/70">
          استشارة AI · تنبيه تفاعلات · تذكير دواء آلي
        </p>
      </section>

      {/* ░░░ Bar #1 — AI Smart actions (glassmorphism) ░░░ */}
      <SmartBar
        title="أدوات ذكية"
        items={[
          { id: "ai-symptoms", label: "تحليل أعراض AI", icon: Bot, hue: "168 55% 38%" },
          { id: "ai-schedule", label: "جدول أدوية ذكي", icon: CalendarClock, hue: "210 55% 42%" },
          { id: "ai-consult", label: "استشارة صيدلي", icon: Stethoscope, hue: "340 50% 48%" },
          { id: "ai-scan", label: "مسح بصري للدواء", icon: ScanLine, hue: "32 70% 44%" },
        ]}
        onPick={(id) => {
          if (id === "ai-scan") setScannerOpen(true);
          else toast(`جارٍ فتح ${idToLabel(id)}…`, { description: "تجربة ذكاء اصطناعي" });
        }}
      />

      {/* Search */}
      <div className="mt-3 flex items-center gap-3 rounded-2xl bg-card/95 px-4 py-3 shadow-soft ring-1 ring-border/40">
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.4} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن دواء، فيتامين، علامة تجارية…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* ░░░ Bar #2 — Categories (glass chips) ░░░ */}
      <CategoryRail active={active} onChange={setActive} />

      {/* ░░░ AI Recommendations carousel ░░░ */}
      <section className="mt-5">
        <div className="mb-2 flex items-end justify-between px-1">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-3 w-3 text-primary" strokeWidth={2.6} />
              </span>
              <h3 className="font-display text-[15px] font-extrabold text-foreground">
                توصيات ذكية مقترحة لك
              </h3>
            </div>
            <p className="mt-0.5 pr-6 text-[11px] font-medium text-muted-foreground">
              مبنية على تحليل سجل صحتك بواسطة AI
            </p>
          </div>
        </div>
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex snap-x gap-3">
            {recommendations.map((p) => (
              <RecCard key={p.id} p={p} onOpen={() => setOpenProduct(p)} />
            ))}
          </div>
        </div>
      </section>

      {/* ░░░ AI Scanner CTA ░░░ */}
      <section className="mt-5">
        <button
          onClick={() => setScannerOpen(true)}
          className="group relative w-full overflow-hidden rounded-[24px] p-5 text-right shadow-tile ring-1 ring-border/40 active:scale-[0.99] transition"
          style={{
            background:
              "linear-gradient(135deg, hsl(168 55% 28%) 0%, hsl(195 55% 28%) 100%)",
          }}
        >
          {/* sweep light */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(60% 50% at 90% 0%, rgba(255,255,255,.5) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex items-center gap-4">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <Camera className="h-8 w-8 text-white" strokeWidth={2.2} />
              <span
                aria-hidden
                className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 animate-scan rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, hsl(160 80% 70%), transparent)",
                }}
              />
            </div>
            <div className="flex-1">
              <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white">
                AI · بيتا
              </div>
              <h3 className="font-display text-[16px] font-extrabold leading-tight text-white">
                امسح عبوة الدواء للتعرف عليه فوراً
              </h3>
              <p className="mt-1 text-[11.5px] font-medium leading-snug text-white/80">
                تفاعلات دوائية، جرعات، وبدائل بضغطة واحدة
              </p>
            </div>
            <ChevronLeft className="h-5 w-5 text-white/80" />
          </div>
        </button>
      </section>

      {/* ░░░ Products Grid ░░░ */}
      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between px-1">
          <h3 className="font-display text-[16px] font-extrabold text-foreground">
            {active === "all" ? "كل منتجات الصيدلية" : categories.find((c) => c.id === active)?.name}
            <span className="mr-1.5 text-[11px] font-medium text-muted-foreground">
              · {filtered.length}
            </span>
          </h3>
        </div>

        {filtered.length === 0 ? (
          <EmptyState onScan={() => setScannerOpen(true)} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <DetailedProductCard key={p.id} p={p} onOpen={() => setOpenProduct(p)} />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {openProduct && <ProductOverlay p={openProduct} onClose={() => setOpenProduct(null)} />}
      {scannerOpen && <ScannerOverlay onClose={() => setScannerOpen(false)} />}

      <style>{`
        @keyframes scan-sweep { 0%,100%{transform:translateY(-18px)} 50%{transform:translateY(18px)} }
        .animate-scan { animation: scan-sweep 1.6s ease-in-out infinite; }
        @keyframes overlay-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .animate-overlay { animation: overlay-up .32s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes overlay-fade { from{opacity:0} to{opacity:1} }
        .animate-overlay-fade { animation: overlay-fade .25s ease-out both; }
      `}</style>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────── */
/* Sub-components                                                       */
/* ──────────────────────────────────────────────────────────────────── */

const idToLabel = (id: string) =>
  ({
    "ai-symptoms": "تحليل الأعراض",
    "ai-schedule": "جدول الأدوية",
    "ai-consult": "استشارة الصيدلي",
    "ai-scan": "ماسح الأدوية",
  })[id] ?? id;

type SmartItem = { id: string; label: string; icon: LucideIcon; hue: string };

const SmartBar = ({
  title,
  items,
  onPick,
}: {
  title: string;
  items: SmartItem[];
  onPick: (id: string) => void;
}) => (
  <section className="mt-4">
    <div className="mb-2 flex items-center gap-1.5 px-1">
      <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.6} />
      <span className="text-[11px] font-extrabold text-foreground/80">{title}</span>
    </div>
    <div
      className="rounded-[22px] p-2.5 ring-1 ring-border/40"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--card) / 0.92) 0%, hsl(var(--card) / 0.78) 100%)",
        boxShadow: "0 8px 24px -16px rgba(0,0,0,0.18)",
      }}
    >
      <div className="grid grid-cols-4 gap-2">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onPick(it.id)}
            className="group flex flex-col items-center gap-1.5 rounded-2xl bg-background/60 p-2.5 ring-1 ring-border/40 transition active:scale-95"
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: `hsl(${it.hue} / 0.14)`,
                color: `hsl(${it.hue})`,
              }}
            >
              <it.icon className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="text-center text-[10px] font-extrabold leading-tight text-foreground/85">
              {it.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  </section>
);

const CategoryRail = ({
  active,
  onChange,
}: {
  active: CatId;
  onChange: (c: CatId) => void;
}) => (
  <section className="mt-3">
    <div
      className="-mx-4 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex snap-x gap-2">
        {categories.map((c) => {
          const isActive = c.id === active;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-extrabold ring-1 transition active:scale-95 ${
                isActive
                  ? "bg-primary text-primary-foreground ring-primary shadow-pill"
                  : "bg-card/90 text-foreground/85 ring-border/50"
              }`}
            >
              <c.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  </section>
);

const RecCard = ({ p, onOpen }: { p: RxProduct; onOpen: () => void }) => (
  <button
    onClick={onOpen}
    className="group relative flex w-[180px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] bg-card text-right ring-1 ring-border/50 shadow-soft transition active:scale-[0.98]"
  >
    <div className="relative aspect-square w-full overflow-hidden bg-muted">
      <LazyImg src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
      <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-primary/95 px-2 py-0.5 text-[9px] font-extrabold text-primary-foreground">
        <Sparkle className="h-2.5 w-2.5" /> AI
      </span>
    </div>
    <div className="flex-1 p-2.5">
      <p className="text-[10px] font-bold text-muted-foreground">{p.brand}</p>
      <h4 className="mt-0.5 line-clamp-2 text-[12px] font-extrabold leading-snug text-foreground">
        {p.name}
      </h4>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[12px] font-extrabold text-primary">{p.price} ج.م</span>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-foreground/70">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {p.rating}
        </span>
      </div>
    </div>
  </button>
);

const DetailedProductCard = ({ p, onOpen }: { p: RxProduct; onOpen: () => void }) => {
  const { add, setQty } = useCartActions();
  const qty = useCartLineQty(p.id);
  const discount = p.oldPrice ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[20px] bg-card ring-1 ring-border/50 shadow-soft">
      <button onClick={onOpen} className="relative aspect-square w-full overflow-hidden bg-muted">
        <LazyImg src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {discount > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
            −{discount}%
          </span>
        )}
        <span className="absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/95 ring-1 ring-border/40">
          <Sparkle className="h-3 w-3 text-primary" />
        </span>
      </button>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-bold text-muted-foreground">{p.brand}</p>
        <button onClick={onOpen} className="mt-0.5 text-right">
          <h4 className="line-clamp-2 text-[13px] font-extrabold leading-snug text-foreground">
            {p.name}
          </h4>
        </button>
        <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">{p.unit}</p>

        {/* badges row */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {p.badges.slice(0, 2).map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-0.5 rounded-full bg-primary-soft/70 px-1.5 py-0.5 text-[9px] font-bold text-primary"
            >
              <CheckCircle2 className="h-2.5 w-2.5" /> {b}
            </span>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-foreground/75">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {p.rating} · {p.reviews}
        </div>

        <div className="mt-2 flex items-end justify-between">
          <div>
            {p.oldPrice && (
              <span className="block text-[10px] font-bold text-muted-foreground line-through">
                {p.oldPrice} ج.م
              </span>
            )}
            <span className="text-[14px] font-extrabold text-primary">{p.price} ج.م</span>
          </div>
          {qty === 0 ? (
            <button
              onClick={() =>
                add({ id: p.id, name: p.name, price: p.price, image: p.image, unit: p.unit, category: "صيدلية", source: "pharmacy" })
              }
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pill active:scale-90"
            >
              <Plus className="h-4 w-4" strokeWidth={2.6} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-1.5 py-1">
              <button
                onClick={() => setQty(p.id, qty - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-card text-foreground active:scale-90"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[18px] text-center text-[11px] font-extrabold tabular-nums text-primary">
                {qty}
              </span>
              <button
                onClick={() => setQty(p.id, qty + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

const EmptyState = ({ onScan }: { onScan: () => void }) => (
  <div className="rounded-2xl bg-card/80 p-6 text-center ring-1 ring-border/40">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
      <Sparkles className="h-6 w-6 text-primary" />
    </div>
    <p className="text-[13px] font-extrabold text-foreground">لم نجد منتجات هنا بعد</p>
    <p className="mt-1 text-[11px] text-muted-foreground">
      جرّب الماسح الذكي للعثور على البدائل المناسبة
    </p>
    <button
      onClick={onScan}
      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12px] font-extrabold text-primary-foreground active:scale-95"
    >
      <Camera className="h-3.5 w-3.5" /> امسح عبوة دواء
    </button>
  </div>
);

/* ──────────────────────────────────────────────────────────────────── */
/* Product overlay (partial pop-up)                                     */
/* ──────────────────────────────────────────────────────────────────── */

const ProductOverlay = ({ p, onClose }: { p: RxProduct; onClose: () => void }) => {
  const { add } = useCartActions();
  const qty = useCartLineQty(p.id);
  const [weight, setWeight] = useState(70); // kg for AI dose calc
  const [age, setAge] = useState(30);

  const aiDose = useMemo(() => {
    // toy heuristic for the demo
    const base = p.category === "vitamins" ? 1 : 1;
    const wFactor = weight > 80 ? 1.25 : weight < 50 ? 0.75 : 1;
    const aFactor = age > 65 ? 0.85 : 1;
    const rec = Math.max(1, Math.round(base * wFactor * aFactor));
    return rec;
  }, [p.category, weight, age]);

  // close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        onClick={onClose}
        className="absolute inset-0 animate-overlay-fade bg-black/50"
        aria-hidden
      />
      <div
        className="relative animate-overlay max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-background ring-1 ring-border/60 sm:rounded-[28px]"
        style={{ boxShadow: "0 -20px 60px -10px rgba(0,0,0,0.25)" }}
      >
        {/* drag handle */}
        <div className="sticky top-0 z-10 flex justify-center bg-gradient-to-b from-background to-transparent pt-2 pb-1 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-foreground/20" />
        </div>

        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-pill ring-1 ring-border/50 active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>

        {/* media */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <LazyImg src={p.image} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-extrabold text-foreground ring-1 ring-border/40">
            <Sparkle className="h-3 w-3 text-primary" /> منتج موصى به AI
          </div>
        </div>

        <div className="px-5 pb-5">
          <p className="text-[11px] font-bold text-muted-foreground">{p.brand}</p>
          <h2 className="mt-0.5 font-display text-[20px] font-extrabold leading-tight text-foreground">
            {p.name}
          </h2>
          <p className="mt-1 text-[12px] font-medium text-muted-foreground">{p.tagline}</p>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-[20px] font-extrabold text-primary">{p.price} ج.م</span>
            {p.oldPrice && (
              <span className="text-[12px] font-bold text-muted-foreground line-through">
                {p.oldPrice} ج.م
              </span>
            )}
            <span className="mr-auto inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> {p.rating} · {p.reviews}
            </span>
          </div>

          {/* badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1 rounded-full bg-primary-soft/80 px-2.5 py-1 text-[10.5px] font-extrabold text-primary"
              >
                <CheckCircle2 className="h-3 w-3" /> {b}
              </span>
            ))}
          </div>

          {/* AI dose calculator */}
          <div className="mt-4 rounded-2xl border border-border/60 bg-card/80 p-3.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15">
                <Calculator className="h-4 w-4 text-primary" strokeWidth={2.4} />
              </span>
              <h3 className="text-[13px] font-extrabold text-foreground">
                آلة حاسبة للجرعة الذكية
              </h3>
              <span className="mr-auto inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">
                AI
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-[11px] font-bold text-foreground/85">
                الوزن (كجم)
                <input
                  type="number"
                  min={20}
                  max={200}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-sm font-extrabold text-foreground ring-1 ring-border/50 outline-none focus:ring-primary"
                />
              </label>
              <label className="block text-[11px] font-bold text-foreground/85">
                العمر
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl bg-background px-3 py-2 text-sm font-extrabold text-foreground ring-1 ring-border/50 outline-none focus:ring-primary"
                />
              </label>
            </div>

            <div className="mt-3 rounded-xl bg-primary/10 p-3">
              <p className="text-[11px] font-bold text-primary/80">الجرعة المقترحة</p>
              <p className="mt-0.5 text-[14px] font-extrabold text-foreground">
                {aiDose} {p.category === "vitamins" ? "كبسولة" : "وحدة"} يومياً · {p.dosage}
              </p>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                * استشر طبيبك قبل أي تعديل دائم على الجرعة
              </p>
            </div>
          </div>

          {/* AI reviews summary */}
          <div className="mt-3 rounded-2xl border border-border/60 bg-card/80 p-3.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15">
                <Bot className="h-4 w-4 text-amber-600" strokeWidth={2.4} />
              </span>
              <h3 className="text-[13px] font-extrabold text-foreground">تقييمات AI للمستخدمين</h3>
            </div>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-foreground/85">
              لخّص الذكاء الاصطناعي {p.reviews} تقييماً: المستخدمون يثنون على
              <span className="font-extrabold text-foreground"> الفعالية السريعة</span>
              {" و "}
              <span className="font-extrabold text-foreground">جودة التغليف</span>،
              مع ملاحظات إيجابية على نسبة <span className="font-extrabold text-foreground">{p.rating} من 5</span>.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              add({ id: p.id, name: p.name, price: p.price, image: p.image, unit: p.unit, category: "صيدلية", source: "pharmacy" });
              toast.success("أُضيف للسلة", { description: p.name });
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            {qty > 0 ? `أضِف المزيد (${qty} في السلة)` : `أضِف للسلة · ${p.price} ج.م`}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────────── */
/* AI Scanner overlay                                                   */
/* ──────────────────────────────────────────────────────────────────── */

const ScannerOverlay = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div onClick={onClose} className="absolute inset-0 animate-overlay-fade bg-black/70" aria-hidden />
      <div className="relative animate-overlay m-4 w-full max-w-sm overflow-hidden rounded-[28px] bg-background ring-1 ring-border/60">
        <button
          onClick={onClose}
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-pill ring-1 ring-border/50"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          className="relative flex h-72 items-center justify-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(168 55% 22%) 0%, hsl(195 55% 22%) 100%)",
          }}
        >
          {/* viewfinder */}
          <div className="relative h-44 w-44 rounded-3xl ring-2 ring-white/40">
            <span className="absolute -inset-1 rounded-[28px] ring-1 ring-white/15" />
            <span
              className="absolute inset-x-3 top-1/2 h-[2px] -translate-y-1/2 animate-scan rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(160 90% 70%), transparent)",
              }}
            />
            <Camera className="absolute inset-0 m-auto h-12 w-12 text-white/85" strokeWidth={1.6} />
          </div>
        </div>
        <div className="p-5 text-center">
          <h3 className="font-display text-[18px] font-extrabold text-foreground">
            وجّه الكاميرا نحو عبوة الدواء
          </h3>
          <p className="mt-1.5 text-[12px] font-medium text-muted-foreground">
            سنحلل الباركود والاسم التجاري لإظهار التفاعلات والبدائل خلال ثوانٍ
          </p>
          <button
            onClick={() => {
              onClose();
              toast("الماسح في وضع التجربة", { description: "سيتم تفعيله مع تحديث الكاميرا" });
            }}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[12.5px] font-extrabold text-primary-foreground active:scale-95"
          >
            <ScanLine className="h-4 w-4" /> ابدأ المسح
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pharmacy;
