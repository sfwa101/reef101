import { useCompare } from "@/context/CompareContext";
import { useCartActions } from "@/context/CartContext";
import BackHeader from "@/components/BackHeader";
import { toLatin } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import {
  X,
  Star,
  Truck,
  CalendarClock,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Scale,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => `${toLatin(n.toLocaleString("en-US"))} ج.م`;

const CompareHomeGoods = () => {
  const { items, remove, clear } = useCompare();
  const { add } = useCartActions();

  const minPrice = items.length ? Math.min(...items.map((i) => i.price)) : 0;
  const maxRating = items.length ? Math.max(...items.map((i) => i.rating)) : 0;

  const handleAdd = (it: (typeof items)[number]) => {
    const isPre = it.fulfillment === "preorder";
    const deposit = isPre ? Math.round(it.price * 0.25) : 0;
    add(
      {
        id: it.id,
        name: it.name,
        price: it.price,
        image: it.image,
        unit: it.unit,
        category: "أدوات منزلية",
        source: "home",
      } as never,
      1,
      isPre
        ? {
            payDeposit: true,
            unitPrice: it.price,
            bookingNote: `حجز مسبق · دفعة مقدمة ${fmt(deposit)}`,
          }
        : undefined,
    );
    toast.success(isPre ? "تم تأكيد الحجز" : "أُضيف إلى السلة", {
      description: it.name,
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen pb-32">
        <BackHeader title="مقارنة المنتجات" />
        <div className="mx-4 mt-12 flex flex-col items-center gap-3 rounded-3xl bg-card p-8 text-center shadow-soft ring-1 ring-border/50">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Scale className="h-10 w-10 text-primary" strokeWidth={2} />
          </div>
          <h2 className="font-display text-xl font-extrabold">لا توجد منتجات للمقارنة</h2>
          <p className="text-sm text-muted-foreground">
            أضف منتجات إلى المقارنة من قسم الأدوات المنزلية حتى ٤ منتجات.
          </p>
          <Link
            to="/store/home"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-pill"
          >
            <ArrowLeft className="h-4 w-4" />
            تصفّح الأدوات المنزلية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <BackHeader
        title="مقارنة المنتجات"
        subtitle={`${toLatin(items.length)} / ${toLatin(4)} منتج`}
      />

      {/* Top bar */}
      <div className="sticky top-[64px] z-30 mx-4 mt-2 flex items-center justify-between rounded-2xl bg-card/95 p-2 shadow-soft ring-1 ring-border/50 backdrop-blur">
        <span className="px-2 text-[12px] font-extrabold text-foreground">
          مقارنة دقيقة بين {toLatin(items.length)} منتجات
        </span>
        <button
          onClick={clear}
          className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-[11px] font-extrabold text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          مسح الكل
        </button>
      </div>

      {/* Horizontal scroll comparison */}
      <div className="mt-3 overflow-x-auto px-4 pb-4 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${items.length}, minmax(220px, 1fr))`,
            minWidth: items.length > 1 ? `${items.length * 230}px` : "100%",
          }}
        >
          {items.map((it) => {
            const isPre = it.fulfillment === "preorder";
            const isCheapest = it.price === minPrice && items.length > 1;
            const isTopRated = it.rating === maxRating && items.length > 1;
            return (
              <article
                key={it.id}
                className="relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border/50"
              >
                <button
                  onClick={() => remove(it.id)}
                  className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft backdrop-blur"
                  aria-label="حذف من المقارنة"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="relative aspect-square bg-secondary/40">
                  <img
                    src={it.image}
                    alt={it.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  {isPre ? (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-l from-amber-500 to-amber-600 px-2 py-1 text-[9.5px] font-extrabold text-white shadow-pill">
                      <CalendarClock className="h-3 w-3" />
                      حجز
                    </span>
                  ) : (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[9.5px] font-extrabold text-white shadow-pill">
                      <Truck className="h-3 w-3" />
                      فوري
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {it.brand}
                  </p>
                  <h3 className="line-clamp-2 text-[12.5px] font-extrabold leading-tight">
                    {it.name}
                  </h3>

                  {/* Award badges */}
                  <div className="flex flex-wrap gap-1">
                    {isCheapest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-700">
                        <Crown className="h-2.5 w-2.5" /> الأرخص
                      </span>
                    )}
                    {isTopRated && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold text-amber-700">
                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                        الأعلى تقييمًا
                      </span>
                    )}
                  </div>

                  <Divider />

                  <Row label="السعر">
                    <span className="font-display text-base font-extrabold tabular-nums">
                      {fmt(it.price)}
                    </span>
                  </Row>
                  <Row label="التقييم">
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold tabular-nums">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {toLatin(it.rating)} ({toLatin(it.reviews)})
                    </span>
                  </Row>
                  <Row label="الوحدة">
                    <span className="text-[10.5px] text-foreground/80">{it.unit}</span>
                  </Row>
                  <Row label="التسليم">
                    <span className="text-[10.5px] font-bold text-foreground">
                      {isPre
                        ? `حجز · ${toLatin(it.etaDays ?? 7)} أيام`
                        : "اليوم"}
                    </span>
                  </Row>
                  <Row label="الضمان">
                    <span className="text-[10px] font-bold text-foreground/90">
                      {it.warranty ?? "—"}
                    </span>
                  </Row>

                  <Divider />

                  <p className="text-[10px] font-bold text-muted-foreground">
                    المميزات
                  </p>
                  <ul className="space-y-1">
                    {it.badges.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-1 text-[10.5px] font-medium text-foreground/85"
                      >
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {isPre && (
                    <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1.5 text-[9.5px] font-bold leading-relaxed text-amber-800 ring-1 ring-amber-200">
                      دفعة مقدمة {fmt(Math.round(it.price * 0.25))} والمتبقي
                      {" "}
                      {fmt(it.price - Math.round(it.price * 0.25))} عند الاستلام
                    </p>
                  )}

                  <button
                    onClick={() => handleAdd(it)}
                    className={`mt-2 flex h-10 items-center justify-center gap-1 rounded-full text-[11.5px] font-extrabold shadow-pill transition active:scale-95 ${
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
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                        أضف للسلة
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Trust footer */}
      <div className="mx-4 mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-card p-3 shadow-soft ring-1 ring-border/50">
        <Trust icon={ShieldCheck} label="ضمان وكيل" />
        <Trust icon={Truck} label="تسليم آمن" />
        <Trust icon={CheckCircle2} label="بضاعة أصلية" />
      </div>
    </div>
  );
};

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[10px] font-bold text-muted-foreground">{label}</span>
    <div className="text-left">{children}</div>
  </div>
);

const Divider = () => <div className="my-1 h-px bg-border/60" />;

const Trust = ({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) => (
  <div className="flex flex-col items-center gap-1 rounded-xl bg-secondary/60 p-2 text-center">
    <Icon className="h-4 w-4 text-foreground" />
    <span className="text-[10px] font-extrabold text-foreground">{label}</span>
  </div>
);

export default CompareHomeGoods;
