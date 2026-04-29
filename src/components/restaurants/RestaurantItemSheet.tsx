import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Minus, Plus, Star, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/products";
import { fmtMoney, toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import { toast } from "sonner";

interface Props {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  /** Restaurant brand HSL ("h s% l%") — used for accent color */
  brandHue?: string;
}

/**
 * Universal product sheet for restaurant items.
 * Supports variants (radio, mandatory) + addons (checkbox, optional)
 * with live total price = (basePrice + variantDelta + addons) × qty.
 */
const RestaurantItemSheet = ({ product, open, onClose, brandHue = "18 78% 48%" }: Props) => {
  const { add } = useCart();
  const [variantId, setVariantId] = useState<string>("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState(1);
  const [flying, setFlying] = useState(false);

  useEffect(() => {
    if (product) {
      setVariantId(product.variants?.[0]?.id ?? "");
      setAddonIds([]);
      setNotes("");
      setQty(1);
    }
  }, [product?.id]);

  const variant = product?.variants?.find((v) => v.id === variantId) ?? product?.variants?.[0];
  const selectedAddons = useMemo(
    () => (product?.addons ?? []).filter((a) => addonIds.includes(a.id)),
    [product, addonIds],
  );
  const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const unitPrice = (product?.price ?? 0) + (variant?.priceDelta ?? 0) + addonsTotal;
  const total = unitPrice * qty;

  const toggleAddon = (id: string) =>
    setAddonIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (!product) return null;

  const handleAdd = () => {
    setFlying(true);
    fireMiniConfetti();
    const variantSuffix = variant ? ` (${variant.label})` : "";
    const addonSuffix = selectedAddons.length
      ? ` + ${selectedAddons.map((a) => a.label).join("، ")}`
      : "";
    const composedName = `${product.name}${variantSuffix}${addonSuffix}`;
    const composedId = `r-${product.id}-${variantId || "x"}-${addonIds.sort().join("_") || "x"}-${
      notes ? btoa(unescape(encodeURIComponent(notes))).slice(0, 6) : ""
    }`;
    const composed: Product = {
      ...product,
      id: composedId,
      name: composedName,
      price: unitPrice,
      unit: notes ? `ملاحظات: ${notes}` : product.unit,
      variants: undefined,
      addons: undefined,
    };
    add(composed, qty);
    toast.success("أُضيف للسلة", { description: composedName, duration: 1500 });
    setTimeout(() => {
      setFlying(false);
      onClose();
    }, 550);
  };

  const accent = `hsl(${brandHue})`;
  const accentSoft = `hsl(${brandHue} / 0.12)`;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[92vh] rounded-t-[2rem] border-0 bg-background p-0 shadow-2xl"
      >
        {flying && (
          <div
            className="pointer-events-none fixed left-1/2 top-1/2 z-[100] h-16 w-16 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl shadow-xl"
            style={{ animation: "fly-to-cart 550ms cubic-bezier(.6,-.2,.5,1.4) forwards" }}
          >
            <img src={product.image} alt="" className="h-full w-full object-cover" />
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
          {/* Hero */}
          <div className="relative h-56 shrink-0 overflow-hidden rounded-t-[2rem]">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              {product.brand && (
                <span
                  className="mb-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                  style={{ background: accent }}
                >
                  {product.brand}
                </span>
              )}
              <h2 className="font-display text-2xl font-extrabold leading-tight text-balance">
                {product.name}
              </h2>
              <div className="mt-1 flex items-center gap-3 text-[11px] font-medium text-white/90 tabular-nums">
                {product.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {toLatin(product.rating)}
                  </span>
                )}
                <span>{product.unit}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 pb-32 pt-4">
            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <section className="mt-2">
                <h3 className="mb-2 font-display text-base font-extrabold">اختر النوع</h3>
                <div className="space-y-2">
                  {product.variants.map((v) => {
                    const active = variantId === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVariantId(v.id)}
                        className="flex w-full items-center justify-between rounded-2xl border-2 p-3.5 text-right transition"
                        style={{
                          borderColor: active ? accent : "hsl(var(--border) / 0.6)",
                          background: active ? accentSoft : "hsl(var(--card))",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-full border-2"
                            style={{ borderColor: active ? accent : "hsl(var(--border))" }}
                          >
                            {active && (
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: accent }}
                              />
                            )}
                          </span>
                          <span className="text-sm font-bold">{v.label}</span>
                        </div>
                        <span
                          className="font-display text-sm font-extrabold tabular-nums"
                          style={{ color: accent }}
                        >
                          {v.priceDelta >= 0 ? "+" : ""}
                          {fmtMoney(v.priceDelta)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Addons */}
            {product.addons && product.addons.length > 0 && (
              <section className="mt-6">
                <h3 className="mb-2 font-display text-base font-extrabold">إضافات اختيارية</h3>
                <div className="space-y-2">
                  {product.addons.map((a) => {
                    const active = addonIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAddon(a.id)}
                        className="flex w-full items-center justify-between rounded-2xl border p-3 text-right transition"
                        style={{
                          borderColor: active ? accent : "hsl(var(--border) / 0.6)",
                          background: active ? accentSoft : "hsl(var(--card))",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-md border-2"
                            style={{
                              borderColor: active ? accent : "hsl(var(--border))",
                              background: active ? accent : "transparent",
                              color: active ? "white" : "transparent",
                            }}
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
            )}

            {/* Notes */}
            <section className="mt-6">
              <h3 className="mb-2 font-display text-base font-extrabold">ملاحظات للمطعم</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="مثال: بدون بصل، حار زيادة…"
                className="w-full resize-none rounded-2xl border border-border/60 bg-card p-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
                style={{ borderColor: "hsl(var(--border) / 0.6)" }}
              />
            </section>
          </div>

          {/* Sticky footer */}
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
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm"
                  style={{ background: accent }}
                  aria-label="زيادة"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className="flex flex-1 items-center justify-between rounded-2xl px-5 py-3.5 font-bold text-white shadow-pill transition active:scale-[0.98]"
                style={{ background: accent }}
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

export default RestaurantItemSheet;