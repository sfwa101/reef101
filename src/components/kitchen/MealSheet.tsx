import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Flame, Beef, Wheat, Droplet, Minus, Plus, Star, X } from "lucide-react";
import type { KitchenMeal } from "@/lib/kitchenMenu";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/products";
import { fmtMoney, toLatin } from "@/lib/format";
import { toast } from "sonner";

interface Props {
  meal: KitchenMeal | null;
  open: boolean;
  onClose: () => void;
  /** When set, marks the line for a specific weekly day */
  weeklyDay?: number;
  weeklyDayLabel?: string;
}

const MealSheet = ({ meal, open, onClose, weeklyDay, weeklyDayLabel }: Props) => {
  const { add } = useCart();
  const [sizeId, setSizeId] = useState<string>("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    if (meal) {
      setSizeId(meal.sizes[0]?.id ?? "");
      setAddonIds([]);
      setNotes("");
      setQty(1);
    }
  }, [meal?.id]);

  const size = meal?.sizes.find((s) => s.id === sizeId) ?? meal?.sizes[0];
  const selectedAddons = useMemo(
    () => (meal ? meal.addons.filter((a) => addonIds.includes(a.id)) : []),
    [meal, addonIds]
  );
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const unitPrice = (size?.price ?? 0) + addonsTotal;
  const total = unitPrice * qty;

  const toggleAddon = (id: string) =>
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleAdd = () => {
    if (!meal || !size) return;
    setFlying(true);
    const addonSuffix = selectedAddons.length
      ? ` + ${selectedAddons.map((a) => a.label).join("، ")}`
      : "";
    const dayPrefix = weeklyDayLabel ? `[${weeklyDayLabel}] ` : "";
    const composedName = `${dayPrefix}${meal.name} (${size.label})${addonSuffix}`;
    const composedId = `kc-${meal.id}-${size.id}-${addonIds.sort().join("_") || "x"}-${
      weeklyDay ?? "now"
    }-${notes ? btoa(unescape(encodeURIComponent(notes))).slice(0, 6) : ""}`;
    const composedProduct: Product = {
      id: composedId,
      name: composedName,
      unit: notes ? `ملاحظات: ${notes}` : "وجبة مطبخ ريف",
      price: unitPrice,
      image: meal.image,
      rating: meal.rating,
      category: "وجبات",
      source: "kitchen",
    };
    add(composedProduct, qty);
    toast.success("أُضيفت الوجبة للسلة", { description: composedName });
    setTimeout(() => {
      setFlying(false);
      onClose();
    }, 550);
  };

  if (!meal) return null;
  const n = meal.nutrition;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-[2rem] border-0 bg-background p-0 shadow-2xl"
      >
        {/* Flying-to-cart animation */}
        {flying && (
          <div
            className="pointer-events-none fixed left-1/2 top-1/2 z-[100] h-16 w-16 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl shadow-xl"
            style={{ animation: "fly-to-cart 550ms cubic-bezier(.6,-.2,.5,1.4) forwards" }}
          >
            <img src={meal.image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <style>{`
          @keyframes fly-to-cart {
            0%   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
            70%  { transform: translate(35vw, -38vh) scale(.45); opacity: .9; }
            100% { transform: translate(40vw, -42vh) scale(.15); opacity: 0; }
          }
        `}</style>

        <div className="flex h-full flex-col">
          {/* Hero image */}
          <div className="relative h-56 shrink-0 overflow-hidden rounded-t-[2rem]">
            <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              {weeklyDayLabel && (
                <span className="mb-1 inline-block rounded-full bg-primary/90 px-2.5 py-0.5 text-[10px] font-bold">
                  {weeklyDayLabel}
                </span>
              )}
              <h2 className="font-display text-2xl font-extrabold leading-tight text-balance">
                {meal.name}
              </h2>
              <div className="mt-1 flex items-center gap-3 text-[11px] font-medium text-white/90 tabular-nums">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {toLatin(meal.rating)}
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> {toLatin(n.kcal)} سعرة
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 pb-32 pt-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{meal.description}</p>

            {/* Nutrition badges */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <NutritionBadge icon={<Flame className="h-4 w-4" />} label="سعرات" value={`${toLatin(n.kcal)}`} />
              <NutritionBadge icon={<Beef className="h-4 w-4" />} label="بروتين" value={`${toLatin(n.protein)}غ`} />
              <NutritionBadge icon={<Wheat className="h-4 w-4" />} label="كارب" value={`${toLatin(n.carbs)}غ`} />
              {typeof n.fat === "number" && (
                <NutritionBadge icon={<Droplet className="h-4 w-4" />} label="دهون" value={`${toLatin(n.fat)}غ`} />
              )}
            </div>

            {/* Sizes (radio - mandatory) */}
            <section className="mt-6">
              <h3 className="mb-2 font-display text-base font-extrabold">اختر الحجم</h3>
              <div className="space-y-2">
                {meal.sizes.map((s) => {
                  const active = sizeId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSizeId(s.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 p-3.5 text-right transition ${
                        active
                          ? "border-primary bg-primary-soft shadow-sm"
                          : "border-border/60 bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                            active ? "border-primary" : "border-border"
                          }`}
                        >
                          {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </span>
                        <span className="text-sm font-bold">{s.label}</span>
                      </div>
                      <span className="font-display text-sm font-extrabold text-primary tabular-nums">
                        {fmtMoney(s.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Addons (checkbox - optional) */}
            <section className="mt-6">
              <h3 className="mb-2 font-display text-base font-extrabold">إضافات اختيارية</h3>
              <div className="space-y-2">
                {meal.addons.map((a) => {
                  const active = addonIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAddon(a.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-right transition ${
                        active ? "border-primary bg-primary-soft" : "border-border/60 bg-card"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {active && <span className="text-[10px] font-extrabold">✓</span>}
                        </span>
                        <span className="text-sm font-medium">{a.label}</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground tabular-nums">
                        +{fmtMoney(a.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Chef notes */}
            <section className="mt-6">
              <h3 className="mb-2 font-display text-base font-extrabold">ملاحظات للشيف</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="مثال: بدون بصل، تسوية زيادة…"
                className="w-full resize-none rounded-2xl border border-border/60 bg-card p-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </section>
          </div>

          {/* Sticky footer: qty + total + add */}
          <div className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-background/95 p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-full bg-foreground/5 p-1">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm"
                  aria-label="إنقاص"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-7 text-center font-display text-base font-extrabold tabular-nums">
                  {toLatin(qty)}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                  aria-label="زيادة"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className="flex flex-1 items-center justify-between rounded-2xl bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-pill transition active:scale-[0.98]"
              >
                <span className="text-sm">أضف للسلة</span>
                <span className="font-display text-base font-extrabold tabular-nums">
                  {fmtMoney(total)}
                </span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const NutritionBadge = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex flex-col items-center gap-1 rounded-2xl bg-card p-2.5 ring-1 ring-border/40">
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
      {icon}
    </span>
    <span className="font-display text-xs font-extrabold tabular-nums">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
);

export default MealSheet;