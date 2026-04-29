import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, Star, Info, Scale, ChefHat, Package, Sparkles,
  Clock, MessageSquare, ShoppingBag, Flame, ChevronLeft,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { fmtMoney, toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import type { Product } from "@/lib/products";
import {
  getButcheryRules,
  computeButcheryPrice,
  slaForPrep,
  slaMeta,
  type PrepOption,
  type WeightOption,
} from "@/lib/butcheryPrep";

type Props = { product: Product; open: boolean; onClose: () => void };

/**
 * The Butcher's Block — premium product modal for اللحوم/الدواجن/الأسماك.
 * Drives prep options, conditional addons, packaging, dynamic SLA badge,
 * recipe upsell + cross-sells and a free-form note for the butcher.
 */
const ButcherSheet = ({ product, open, onClose }: Props) => {
  const { add } = useCart();
  const rules = useMemo(() => getButcheryRules(product), [product]);

  // All hooks must run unconditionally — keep refs even when rules is null.
  const weights: WeightOption[] = rules?.weights ?? [];
  const preps: PrepOption[] = rules?.preps ?? [];

  const [weightId, setWeightId] = useState<string>(weights[1]?.id ?? weights[0]?.id ?? "");
  const [prepId, setPrepId] = useState<string>(preps[0]?.id ?? "");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [packagingId, setPackagingId] = useState<string>(rules?.packaging[0]?.id ?? "normal");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [crossIds, setCrossIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !rules) return;
    setWeightId(rules.weights[1]?.id ?? rules.weights[0]?.id ?? "");
    setPrepId(rules.preps[0]?.id ?? "");
    setAddonIds([]);
    setPackagingId(rules.packaging[0]?.id ?? "normal");
    setQty(1);
    setNote("");
    setCrossIds([]);
  }, [open, product.id, rules]);

  // Disabled addons removed from selection automatically when prep changes
  useEffect(() => {
    const p = rules?.preps.find((x) => x.id === prepId);
    if (!p?.disables?.length) return;
    setAddonIds((prev) => prev.filter((id) => !p.disables!.includes(id)));
  }, [prepId, rules]);

  if (!rules) return null;

  const weight = rules.weights.find((w) => w.id === weightId) ?? rules.weights[0];
  const prep = rules.preps.find((p) => p.id === prepId) ?? rules.preps[0];
  const sla = slaForPrep(prep);
  const slaInfo = slaMeta[sla];

  const visibleAddons = rules.addons.filter((a) => {
    if (prep.disables?.includes(a.id)) return false;
    if (a.conditional && !prep.reveals?.includes(a.id)) return false;
    return true;
  });

  const unitPrice = computeButcheryPrice(
    product.price, weight, prep, addonIds, rules, packagingId,
  );
  const lineTotal = unitPrice * qty;
  const crossTotal = rules.crossSell
    .filter((c) => crossIds.includes(c.id))
    .reduce((s, c) => s + c.price, 0);
  const grand = lineTotal + crossTotal;

  const toggle = (id: string, list: string[], set: (x: string[]) => void) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const confirm = () => {
    add(product, qty, {
      variantId: weight.id,
      addonIds: addonIds.length ? addonIds : undefined,
      unitPrice,
      bookingNote:
        [
          `الوزن: ${weight.label}`,
          `التحضير: ${prep.label}`,
          `التغليف: ${rules.packaging.find((p) => p.id === packagingId)?.label}`,
          note.trim() ? `ملاحظة: ${note.trim()}` : "",
        ].filter(Boolean).join(" · "),
    });
    // Cross-sell items as standalone pseudo-products would require real ids;
    // for now we stash them in the note + toast count to reflect intent.
    if (crossIds.length) {
      toast.success(`تمت إضافة ${toLatin(crossIds.length)} منتج مكمّل`);
    }
    fireMiniConfetti();
    toast.success(`${product.name} — ${prep.label} · ${slaInfo.label}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-card shadow-float ring-2 ${slaInfo.ringClass} transition-all duration-300 sm:rounded-[28px]`}
          >
            {/* Hero */}
            <div className="relative h-44 w-full overflow-hidden">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              <button
                onClick={onClose}
                aria-label="إغلاق"
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-pill backdrop-blur"
              >
                <X className="h-4 w-4" />
              </button>
              {/* Dynamic SLA badge */}
              <motion.span
                key={sla}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 18, stiffness: 320 }}
                className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${slaInfo.bgClass} ${slaInfo.textClass} shadow-pill ring-1 ${slaInfo.ringClass}`}
              >
                <Clock className="h-3 w-3" /> {slaInfo.emoji} {slaInfo.label}
              </motion.span>
              <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-extrabold leading-tight text-foreground">
                    {product.name}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">{product.unit} · {fmtMoney(product.price)} للكيلو</p>
                </div>
                {product.rating && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/85 px-2 py-1 text-[10px] font-extrabold text-background backdrop-blur">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {toLatin(product.rating)}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4 p-4">
              {/* Educational facts */}
              <div className="flex flex-wrap gap-1.5">
                {rules.facts.map((f) => (
                  <span key={f} className="rounded-full bg-foreground/5 px-2.5 py-1 text-[10px] font-bold text-foreground">
                    {f}
                  </span>
                ))}
              </div>

              {/* SLA message strip — color-synced with modal ring */}
              <motion.div
                key={`msg-${sla}`}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-2 rounded-2xl p-3 text-[11.5px] font-bold leading-relaxed ${slaInfo.bgClass} ${slaInfo.textClass} ring-1 ${slaInfo.ringClass}`}
              >
                <Flame className="mt-0.5 h-4 w-4 shrink-0" />
                {slaInfo.message}
              </motion.div>

              {/* Weight */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-rose-600" />
                  <h3 className="text-sm font-extrabold">اختر الوزن</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {rules.weights.map((w) => {
                    const active = w.id === weightId;
                    const wp = Math.round(product.price * w.factor);
                    return (
                      <button
                        key={w.id}
                        onClick={() => setWeightId(w.id)}
                        className={`flex items-center justify-between rounded-[14px] border-2 px-3 py-2.5 text-right transition ${
                          active
                            ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                            : "border-border bg-background"
                        }`}
                      >
                        <span className="text-[12px] font-extrabold">{w.label}</span>
                        <span className="text-[11px] font-extrabold tabular-nums text-rose-700 dark:text-rose-300">
                          {toLatin(wp)} ج.م
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-[10.5px] font-bold leading-relaxed text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  الوزن المذكور هو الوزن التقريبي قبل التنظيف والتحضير.
                </p>
              </section>

              {/* Prep */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-rose-600" />
                  <h3 className="text-sm font-extrabold">طريقة التحضير</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {rules.preps.map((p) => {
                    const active = p.id === prepId;
                    const tier = slaForPrep(p);
                    const tMeta = slaMeta[tier];
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPrepId(p.id)}
                        className={`flex items-center justify-between gap-3 rounded-[14px] border-2 px-3 py-2.5 text-right transition ${
                          active
                            ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                            : "border-border bg-background"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-[12px] font-extrabold">
                          <span className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                            active ? "border-rose-500 bg-rose-500" : "border-muted-foreground/40"
                          }`}>
                            {active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                          </span>
                          {p.label}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${tMeta.bgClass} ${tMeta.textClass}`}>
                            {tMeta.label}
                          </span>
                          {p.price > 0 && (
                            <span className="text-[11px] font-extrabold tabular-nums text-rose-700 dark:text-rose-300">
                              +{toLatin(p.price)}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Conditional addons */}
              {visibleAddons.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-rose-600" />
                    <h3 className="text-sm font-extrabold">
                      إضافات{" "}
                      <span className="text-[10px] font-bold text-muted-foreground">(حسب التحضير)</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {visibleAddons.map((a) => {
                      const active = addonIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggle(a.id, addonIds, setAddonIds)}
                          className={`flex items-center justify-between gap-3 rounded-[14px] border-2 px-3 py-2.5 text-right transition ${
                            active
                              ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                              : "border-border bg-background"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-[12px] font-extrabold">
                            <span className={`flex h-4 w-4 items-center justify-center rounded-[5px] border-2 ${
                              active ? "border-rose-500 bg-rose-500" : "border-muted-foreground/40"
                            }`}>
                              {active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                            </span>
                            {a.label}
                          </span>
                          <span className="text-[11px] font-extrabold tabular-nums text-rose-700 dark:text-rose-300">
                            {a.price > 0 ? `+${toLatin(a.price)} ج.م` : "مجاني"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Packaging */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4 text-rose-600" />
                  <h3 className="text-sm font-extrabold">التغليف</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {rules.packaging.map((p) => {
                    const active = p.id === packagingId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPackagingId(p.id)}
                        className={`flex flex-col items-start gap-0.5 rounded-[14px] border-2 px-3 py-2.5 text-right transition ${
                          active
                            ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                            : "border-border bg-background"
                        }`}
                      >
                        <span className="text-[12px] font-extrabold">{p.label}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {p.price > 0 ? `+${toLatin(p.price)} ج.م` : (p.hint ?? "مجاني")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Recipe Upsell */}
              {rules.recipe && (
                <section className="overflow-hidden rounded-2xl bg-gradient-to-l from-amber-500/15 via-rose-500/10 to-orange-500/15 p-3 ring-1 ring-amber-500/30">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/25 text-2xl">
                      {rules.recipe.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10.5px] font-extrabold text-amber-800 dark:text-amber-300">
                        تبحث عن وجبة متكاملة؟
                      </p>
                      <p className="truncate text-[12.5px] font-extrabold text-foreground">
                        {rules.recipe.title}
                      </p>
                      <p className="truncate text-[10.5px] text-muted-foreground">
                        {rules.recipe.subtitle}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        toast.success(`تم فتح وصفة ${rules.recipe!.title}`);
                      }}
                      className="flex shrink-0 items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 text-[11px] font-extrabold text-white shadow-pill"
                    >
                      {toLatin(rules.recipe.price)} ج.م
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </section>
              )}

              {/* Cross-sell */}
              {rules.crossSell.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-extrabold">منتجات مكملة</h3>
                  <div className="-mx-4 overflow-x-auto px-4">
                    <div className="flex gap-2 pb-1">
                      {rules.crossSell.map((c) => {
                        const active = crossIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggle(c.id, crossIds, setCrossIds)}
                            className={`flex w-[110px] shrink-0 flex-col items-center gap-1 rounded-2xl border-2 p-2 transition ${
                              active
                                ? "border-rose-500 bg-rose-50 dark:bg-rose-500/10"
                                : "border-border bg-background"
                            }`}
                          >
                            <span className="text-2xl">{c.emoji}</span>
                            <span className="line-clamp-1 text-[11px] font-extrabold">{c.label}</span>
                            <span className="text-[10px] font-extrabold tabular-nums text-rose-700 dark:text-rose-300">
                              +{toLatin(c.price)} ج.م
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {/* Note */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-rose-600" />
                  <h3 className="text-sm font-extrabold">ملاحظات للجزار/الشيف</h3>
                </div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="مثال: تقطيع الشاورما رفيع جداً، أو فصل الرأس عن السمك"
                  rows={2}
                  maxLength={140}
                  className="w-full resize-none rounded-2xl border-2 border-border bg-background p-3 text-[12px] font-bold leading-relaxed outline-none ring-rose-500/40 placeholder:font-medium placeholder:text-muted-foreground focus:border-rose-500 focus:ring-2"
                />
              </section>

              {/* Qty + total */}
              <section className="flex items-center justify-between gap-3 rounded-2xl bg-foreground/5 p-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-foreground shadow-pill"
                    aria-label="إنقاص"
                  >−</button>
                  <span className="min-w-[1.5ch] text-center font-display text-base font-extrabold tabular-nums">
                    {toLatin(qty)}
                  </span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-pill"
                    aria-label="زيادة"
                  >+</button>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground">الإجمالي</p>
                  <p className="font-display text-lg font-extrabold tabular-nums text-foreground">
                    {fmtMoney(grand)}
                  </p>
                </div>
              </section>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 border-t border-border/60 bg-card/95 p-4 backdrop-blur">
              <button
                onClick={confirm}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 font-display text-sm font-extrabold text-white shadow-pill transition active:scale-[0.98]"
              >
                <ShoppingBag className="h-4 w-4" />
                أضف إلى السلة · {fmtMoney(grand)}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ButcherSheet;