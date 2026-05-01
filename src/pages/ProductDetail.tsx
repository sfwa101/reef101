import { useParams, Link, useRouter } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import BottomCTA from "@/components/BottomCTA";
import ProductCard from "@/components/ProductCard";
import { getById } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/lib/favorites";
import {
  Star, Truck, ShieldCheck, Heart, Minus, Plus, ZoomIn, X, ChevronLeft, ChevronRight, Sparkles,
  ArrowRight, Share2, Repeat, Check,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtMoney, toLatin } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { logBehavior } from "@/lib/behavior";
import { motion, AnimatePresence } from "framer-motion";
import {
  trustBadgesFor,
  chefBlockFor,
  relatedProductsFor,
} from "@/lib/productEnrichment";
import { villageMetaFor } from "@/lib/villageMeta";

const ProductDetail = () => {
  const { productId } = useParams({ from: "/_app/product/$productId" });
  const product = getById(productId);
  const router = useRouter();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const { has, toggle } = useFavorites();
  const fav = product ? has(product.id) : false;
  const [variantId, setVariantId] = useState<string | null>(null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  type PUnit = { id: string; unit_code: string; conversion_factor: number; selling_price: number | null; is_default_sell: boolean };
  const [productUnits, setProductUnits] = useState<PUnit[]>([]);
  const [unitId, setUnitId] = useState<string | null>(null);

  /* Gallery state */
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  /* Animated price */
  const [priceFlash, setPriceFlash] = useState(0);

  useEffect(() => {
    if (product?.variants?.length) {
      const def = product.variants.find((v) => v.priceDelta === 0) ?? product.variants[0];
      setVariantId(def.id);
    } else {
      setVariantId(null);
    }
    setAddonIds([]);
    setQty(1);
    setGalleryIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    void logBehavior({ event: "view_product", productId: product.id, category: product.category });
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    (async () => {
      const [{ count }, { data: units }] = await Promise.all([
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("product_id", product.id),
        (supabase as any).from("product_units").select("id,unit_code,conversion_factor,selling_price,is_default_sell").eq("product_id", product.id).eq("is_active", true).order("conversion_factor", { ascending: true }),
      ]);
      if (cancelled) return;
      setReviewCount(count ?? 0);
      const list = (units || []) as PUnit[];
      setProductUnits(list);
      if (list.length > 0) {
        const def = list.find((u) => u.is_default_sell) || list[0];
        setUnitId(def.id);
      } else {
        setUnitId(null);
      }
    })();
    return () => { cancelled = true; };
  }, [product?.id]);

  const selectedUnit = productUnits.find((u) => u.id === unitId);

  const variant = product?.variants?.find((v) => v.id === variantId);
  const addonsTotal = useMemo(
    () => (product?.addons ?? []).filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0),
    [product?.addons, addonIds],
  );
  const baseUnitPrice = (product?.price ?? 0) + (variant?.priceDelta ?? 0) + addonsTotal;
  const unitPrice = selectedUnit?.selling_price != null
    ? Number(selectedUnit.selling_price) + (variant?.priceDelta ?? 0) + addonsTotal
    : selectedUnit
      ? baseUnitPrice * selectedUnit.conversion_factor
      : baseUnitPrice;
  const total = unitPrice * qty;

  /* Trigger flash whenever any pricing input changes */
  useEffect(() => {
    setPriceFlash((x) => x + 1);
  }, [variantId, addonIds.join(","), qty]);

  /* Subscription mode toggle (for Village products with routine) */
  const [subMode, setSubMode] = useState(false);
  /* Add-to-cart success micro-interaction */
  const [addBurst, setAddBurst] = useState(false);

  if (!product) {
    return (
      <div>
        <BackHeader title="المنتج غير موجود" />
        <p className="text-sm text-muted-foreground">لم يتم العثور على المنتج المطلوب.</p>
        <Link to="/" className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">العودة للرئيسية</Link>
      </div>
    );
  }

  const badges = trustBadgesFor(product);
  const chef = chefBlockFor(product);
  const related = relatedProductsFor(product, 4);
  const village = villageMetaFor(product.id);
  const isVillage = !!village;
  const isPharmacy = product.source === "pharmacy";
  const meta = (product.metadata ?? {}) as Record<string, any>;
  /* Gallery: replicate single image into a 3-frame slider for the "carousel" feel */
  const gallery = [product.image, product.image, product.image];

  const toggleAddon = (id: string) =>
    setAddonIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleAdd = () => {
    const variantSuffix = variant ? ` (${variant.label})` : "";
    const addonLabels = (product.addons ?? []).filter((a) => addonIds.includes(a.id)).map((a) => a.label);
    const subSuffix = subMode ? " (اشتراك أسبوعي)" : "";
    const suffix = variantSuffix + (addonLabels.length ? ` + ${addonLabels.join(" + ")}` : "") + subSuffix;
    const customId = `${product.id}${variant ? `__${variant.id}` : ""}${addonIds.length ? `__${addonIds.sort().join("-")}` : ""}${subMode ? "__sub" : ""}`;
    const finalPrice = subMode && village?.routine
      ? Math.round(unitPrice * (1 - village.routine.discountPct / 100))
      : unitPrice;
    add({ ...product, id: customId, name: `${product.name}${suffix}`, price: finalPrice }, qty);
    setAddBurst(true);
    window.setTimeout(() => setAddBurst(false), 900);
  };

  const goPrev = () => {
    const next = (galleryIndex - 1 + gallery.length) % gallery.length;
    setGalleryIndex(next);
    galleryRef.current?.scrollTo({ left: next * (galleryRef.current.clientWidth || 0), behavior: "smooth" });
  };
  const goNext = () => {
    const next = (galleryIndex + 1) % gallery.length;
    setGalleryIndex(next);
    galleryRef.current?.scrollTo({ left: next * (galleryRef.current.clientWidth || 0), behavior: "smooth" });
  };

  // Track scroll to keep dots in sync when user swipes
  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / (el.clientWidth || 1));
      setGalleryIndex((prev) => (prev === idx ? prev : idx));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch { /* ignore */ }
  };

  return (
    <>
      <motion.div
        className={isVillage ? "" : "space-y-5"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {!isVillage && <BackHeader title={product.category} />}

        {/* ===== Hero gallery with zoom ===== */}
        <section className={isVillage ? "" : "space-y-2"}>
          <div
            className={
              isVillage
                ? "relative -mx-4 -mt-4 overflow-hidden bg-secondary/30"
                : "relative overflow-hidden rounded-[1.75rem] bg-secondary/30 shadow-tile"
            }
          >
            <div
              ref={galleryRef}
              className={
                isVillage
                  ? "flex w-full snap-x snap-mandatory overflow-x-auto no-scrollbar"
                  : "flex aspect-square w-full snap-x snap-mandatory overflow-x-auto no-scrollbar"
              }
              style={isVillage ? { height: "55vh" } : undefined}
            >
              {gallery.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  className="relative block h-full w-full shrink-0 snap-center"
                  style={{ width: "100%" }}
                >
                  <img
                    src={src}
                    alt={`${product.name} - ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 ease-apple group-hover:scale-105"
                  />
                </button>
              ))}
            </div>

            {/* Bottom fade for legibility on village hero */}
            {isVillage && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
                style={{ background: "linear-gradient(180deg, transparent, rgba(40,35,18,0.45))" }}
              />
            )}

            {/* Floating glassmorphism back/share buttons (village only) */}
            {isVillage && (
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-3"
                style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
              >
                <button
                  onClick={() => router.history.back()}
                  aria-label="رجوع"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white shadow-soft ring-1 ring-white/30 transition active:scale-90"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.6} />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    aria-label="مشاركة"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white shadow-soft ring-1 ring-white/30 transition active:scale-90"
                  >
                    <Share2 className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                  <button
                    onClick={() => toggle(product.id)}
                    aria-label="مفضلة"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white shadow-soft ring-1 ring-white/30 transition active:scale-90"
                  >
                    <Heart className={`h-4 w-4 transition ${fav ? "fill-white" : ""}`} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            )}

            {/* Arrows (visible only when more than one slide) */}
            {gallery.length > 1 && !isVillage && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-soft ring-1 ring-border/40 transition active:scale-90"
                  aria-label="السابق"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <button
                  onClick={goNext}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-soft ring-1 ring-border/40 transition active:scale-90"
                  aria-label="التالي"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </>
            )}

            {/* Zoom hint — hidden on village */}
            {!isVillage && (
              <button
                onClick={() => setZoomOpen(true)}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-[10px] font-extrabold text-foreground shadow-soft ring-1 ring-border/40"
              >
                <ZoomIn className="h-3 w-3" strokeWidth={2.6} />
                تكبير
              </button>
            )}

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {gallery.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === galleryIndex
                      ? isVillage ? "w-5 bg-white" : "w-5 bg-primary"
                      : isVillage ? "w-1.5 bg-white/50" : "w-1.5 bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Wrapper for the rest of village content (re-establish vertical rhythm) */}
        <div className={isVillage ? "mt-5 space-y-5" : ""}>

        {/* ===== Title + Trust Badges ===== */}
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {product.brand && <p className="text-[11px] font-bold text-primary">{product.brand}</p>}
              <h1 className="font-display text-2xl font-extrabold leading-tight">{product.name}</h1>
              <p className="text-xs text-muted-foreground">{product.unit}</p>
            </div>
            {!isVillage && (
              <button
                onClick={() => toggle(product.id)}
                className="glass-strong flex h-10 w-10 items-center justify-center rounded-full shadow-soft transition active:scale-90"
                aria-label="مفضلة"
              >
                <Heart className={`h-4 w-4 transition ${fav ? "fill-destructive text-destructive" : ""}`} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Trust badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft/70 px-2.5 py-1 text-[10.5px] font-extrabold text-primary ring-1 ring-primary/15"
                >
                  <span aria-hidden className="text-[12px] leading-none">{b.emoji}</span>
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {product.rating && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-1 font-bold text-accent-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" strokeWidth={0} />
                {product.rating}
              </span>
              <span className="text-muted-foreground tabular-nums">{toLatin(reviewCount ?? 0)} تقييم</span>
            </div>
          )}
        </section>

        {/* ===== Pharmacy: Medical info + Smart Dosage Calculator ===== */}
        {isPharmacy && <PharmacyMedicalBlock meta={meta} productName={product.name} />}

        {/* ===== Unit picker (multi-unit products) ===== */}
        {productUnits.length > 0 && (
          <section className="space-y-2">
            <p className="px-1 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              اختر الوحدة
            </p>
            <div className="grid grid-cols-2 gap-2">
              {productUnits.map((u) => {
                const active = u.id === unitId;
                const price = u.selling_price != null
                  ? Number(u.selling_price)
                  : (product?.price ?? 0) * u.conversion_factor;
                return (
                  <button
                    key={u.id}
                    onClick={() => setUnitId(u.id)}
                    className={`rounded-2xl p-3 text-right transition active:scale-[0.98] ${
                      active
                        ? "bg-primary text-primary-foreground ring-2 ring-primary"
                        : "bg-surface ring-1 ring-border/40"
                    }`}
                  >
                    <p className="text-[13px] font-extrabold">{u.unit_code}</p>
                    <p className={`text-[10px] ${active ? "opacity-90" : "text-muted-foreground"}`}>
                      = {toLatin(u.conversion_factor)} قطعة
                    </p>
                    <p className="mt-1 font-display text-sm font-extrabold tabular-nums">
                      {toLatin(Math.round(price))} ج.م
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Village: Origin Story ===== */}
        {isVillage && village?.story && (
          <section
            className="relative overflow-hidden rounded-[1.5rem] p-5 shadow-soft"
            style={{
              background: "linear-gradient(135deg, #FBF7EE 0%, #F5EFE0 100%)",
              border: "1px solid #E8DFC9",
            }}
          >
            <div
              className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #B8860B, transparent 70%)" }}
            />
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl" aria-hidden>👩‍🌾</span>
              <h3 className="font-display text-base font-extrabold" style={{ color: "#3A341E" }}>
                من أين يأتي طعامك؟
              </h3>
            </div>
            {village.source && (
              <p className="mb-2 text-[11px] font-bold" style={{ color: "#B8860B" }}>
                <ShieldCheck className="me-1 inline h-3 w-3" />
                {village.source}
              </p>
            )}
            <p
              className="text-[13.5px] leading-relaxed"
              style={{ color: "#3A341E", fontStyle: "italic" }}
            >
              "{village.story}"
            </p>
          </section>
        )}

        {/* ===== Village: Storage badges ===== */}
        {isVillage && village?.storage && village.storage.length > 0 && (
          <section className="grid grid-cols-3 gap-2">
            {village.storage.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-2xl p-3 text-center"
                style={{ background: "#FFFDF8", border: "1px solid #E8DFC9", color: "#3A341E" }}
              >
                <span className="text-xl leading-none" aria-hidden>{s.icon}</span>
                <p className="text-[10px] font-bold leading-tight">{s.label}</p>
              </div>
            ))}
          </section>
        )}

        {/* ===== Village: Subscription Widget ===== */}
        {isVillage && village?.routine && (
          <section className="space-y-2">
            <p className="px-1 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: "#7B6A3F" }}>
              اختر طريقة الشراء
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {/* One-time */}
              <button
                onClick={() => setSubMode(false)}
                className="relative flex items-center justify-between rounded-2xl p-4 text-right transition active:scale-[0.99]"
                style={{
                  background: !subMode ? "#FFFDF8" : "#FBF7EE",
                  border: !subMode ? "2px solid #3A341E" : "1px solid #E8DFC9",
                  color: "#3A341E",
                }}
              >
                <div>
                  <p className="text-[13px] font-extrabold">شراء مرة واحدة</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "#7B6A3F" }}>توصيل لمرة واحدة فقط</p>
                </div>
                <div className="text-left">
                  <span className="font-display text-lg font-extrabold tabular-nums">
                    {toLatin(unitPrice)}
                  </span>
                  <span className="ms-0.5 text-[10px]">ج.م</span>
                </div>
              </button>

              {/* Subscription */}
              <button
                onClick={() => setSubMode(true)}
                className="relative flex items-center justify-between overflow-hidden rounded-2xl p-4 text-right transition active:scale-[0.99]"
                style={{
                  background: subMode
                    ? "linear-gradient(135deg, #5A6E3A 0%, #3F5226 100%)"
                    : "linear-gradient(135deg, #FBF7EE 0%, #F0E5C2 100%)",
                  border: subMode ? "2px solid #3A341E" : "1px solid #B8860B",
                  color: subMode ? "#FBF7EE" : "#3A341E",
                }}
              >
                <span
                  className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-extrabold"
                  style={{
                    background: subMode ? "rgba(255,255,255,0.18)" : "#B8860B",
                    color: subMode ? "#FBF7EE" : "#FBF7EE",
                  }}
                >
                  وفّر {toLatin(village.routine.discountPct)}٪
                </span>
                <div>
                  <p className="text-[13px] font-extrabold">
                    <Repeat className="me-1 inline h-3 w-3" />
                    اشتراك {village.routine.defaultFrequency === "weekly" ? "أسبوعي" : "كل أسبوعين"}
                  </p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    اضمن حصتك · ألغِ في أي وقت
                  </p>
                </div>
                <div className="text-left">
                  <span className="font-display text-lg font-extrabold tabular-nums">
                    {toLatin(Math.round(unitPrice * (1 - village.routine.discountPct / 100)))}
                  </span>
                  <span className="ms-0.5 text-[10px]">ج.م</span>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* ===== Village: Nutrition Facts Label ===== */}
        {isVillage && village?.nutrition && (
          <section
            className="rounded-2xl p-4"
            style={{
              background: "#FFFDF8",
              border: "2px solid #3A341E",
              boxShadow: "0 1px 0 #3A341E inset",
              color: "#3A341E",
            }}
          >
            <h3 className="font-display text-lg font-extrabold uppercase tracking-wide" style={{ borderBottom: "6px solid #3A341E", paddingBottom: 4 }}>
              Nutrition Facts · القيم الغذائية
            </h3>
            <p className="mt-1 text-[10.5px]" style={{ color: "#7B6A3F" }}>الحصة الواحدة</p>
            <div className="mt-2 divide-y" style={{ borderColor: "#E8DFC9" }}>
              {village.nutrition.calories && (
                <div className="flex items-baseline justify-between py-2">
                  <span className="text-sm font-extrabold">السعرات الحرارية</span>
                  <span className="font-display text-base font-extrabold tabular-nums">{village.nutrition.calories}</span>
                </div>
              )}
              {village.nutrition.protein && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-[12px] font-bold">البروتين</span>
                  <span className="text-[13px] font-extrabold tabular-nums">{village.nutrition.protein}</span>
                </div>
              )}
              {village.nutrition.fat && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-[12px] font-bold">الدهون</span>
                  <span className="text-[13px] font-extrabold tabular-nums">{village.nutrition.fat}</span>
                </div>
              )}
              {village.nutrition.carbs && (
                <div className="flex items-baseline justify-between py-1.5">
                  <span className="text-[12px] font-bold">الكربوهيدرات</span>
                  <span className="text-[13px] font-extrabold tabular-nums">{village.nutrition.carbs}</span>
                </div>
              )}
            </div>
            {village.nutrition.notes && (
              <p className="mt-2 text-[11px] italic" style={{ color: "#7B6A3F" }}>
                {village.nutrition.notes}
              </p>
            )}
          </section>
        )}

        {/* ===== Variants (dynamic) ===== */}
        {product.variants && product.variants.length > 0 && (
          <section className="glass-strong rounded-2xl p-4 shadow-soft">
            <p className="mb-2 text-xs font-bold text-muted-foreground">الحجم / الوزن</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const active = v.id === variantId;
                return (
                  <button
                    key={v.id}
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                      active
                        ? "bg-primary text-primary-foreground shadow-pill"
                        : "bg-foreground/5"
                    }`}
                  >
                    {v.label}
                    {v.priceDelta !== 0 && (
                      <span className="ms-1 opacity-70 tabular-nums">
                        {v.priceDelta > 0 ? `+${v.priceDelta}` : v.priceDelta}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Addons ===== */}
        {product.addons && product.addons.length > 0 && (
          <section className="glass-strong rounded-2xl p-4 shadow-soft">
            <p className="mb-2 text-xs font-bold text-muted-foreground">إضافات اختيارية</p>
            <div className="space-y-2">
              {product.addons.map((a) => {
                const active = addonIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleAddon(a.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition ${
                      active ? "border-primary bg-primary-soft" : "border-border"
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-md border-2 ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    }`}>
                      {active && <span className="text-[10px]">✓</span>}
                    </div>
                    <p className="flex-1 text-sm font-bold">{a.label}</p>
                    <span className="font-display text-sm font-extrabold text-primary tabular-nums">
                      +{fmtMoney(a.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Trust strip ===== */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass flex items-center gap-2 rounded-2xl p-3 shadow-soft">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] font-bold">توصيل سريع</p>
              <p className="text-[10px] text-muted-foreground">خلال ساعتين</p>
            </div>
          </div>
          <div className="glass flex items-center gap-2 rounded-2xl p-3 shadow-soft">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] font-bold">جودة مضمونة</p>
              <p className="text-[10px] text-muted-foreground">استبدال فوري</p>
            </div>
          </div>
        </div>

        {/* ===== Chef / Nutrition block ===== */}
        {chef && (
          <section
            className="rounded-2xl p-4 shadow-soft ring-1 ring-primary/10"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary-soft) / 0.6), hsl(var(--secondary) / 0.4))",
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl" aria-hidden>{chef.emoji}</span>
              <h3 className="font-display text-base font-extrabold text-foreground">
                {chef.title}
              </h3>
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/80">{chef.body}</p>
          </section>
        )}

        {/* ===== Generic about ===== */}
        <section className="glass-strong rounded-2xl p-4 shadow-soft">
          <h3 className="mb-2 font-display text-base font-extrabold">عن المنتج</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            منتج مختار بعناية من أجود المصادر، يصلك بنفس اليوم مع ضمان الاستبدال الفوري.
          </p>
        </section>

        {/* ===== "يكمل تجربتك" — Smart upsell ===== */}
        {related.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-end justify-between px-1">
              <div>
                <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                  <Sparkles className="h-3 w-3" strokeWidth={2.6} />
                  مقترح ذكي
                </span>
                <h2 className="font-display text-xl font-extrabold leading-tight text-foreground">
                  يكمل تجربتك
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  منتجات اختارها لك الذكاء الاصطناعي لتكمّل سلتك
                </p>
              </div>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x">
              {related.map((p) => (
                <div key={p.id} className="snap-start">
                  <ProductCard product={p} variant="carousel" />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="h-28" />
        </div>
      </motion.div>

      {/* ===== Sticky bottom CTA ===== */}
      <BottomCTA>
        <div className="glass-strong flex items-center gap-3 rounded-[1.5rem] p-3 shadow-float">
          <div className="flex items-center gap-1 rounded-full bg-foreground/5 p-1">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-soft active:scale-90"
              aria-label="إنقاص"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center font-display text-base font-extrabold tabular-nums">
              {toLatin(qty)}
            </span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90"
              aria-label="زيادة"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <motion.button
            onClick={handleAdd}
            animate={addBurst ? { scale: [1, 1.04, 1] } : { scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl bg-primary py-2.5 text-primary-foreground shadow-pill transition active:scale-[0.98]"
          >
            <AnimatePresence mode="wait">
              {addBurst ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 text-sm font-extrabold"
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                  تمت الإضافة للسلة
                </motion.span>
              ) : (
                <motion.div
                  key="cta"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-[11px] font-medium opacity-85">
                    {isVillage && subMode ? "اشترك واحجز حصتك" : "أضف للسلة"}
                  </span>
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={priceFlash}
                      initial={{ opacity: 0, y: -6, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.92 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="font-display text-base font-extrabold tabular-nums"
                    >
                      {fmtMoney(
                        isVillage && subMode && village?.routine
                          ? Math.round(total * (1 - village.routine.discountPct / 100))
                          : total,
                      )}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </BottomCTA>

      {/* ===== Zoom Lightbox ===== */}
      <AnimatePresence>
        {zoomOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setZoomOpen(false)}
          >
            <motion.img
              src={gallery[galleryIndex]}
              alt={product.name}
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="max-h-[88vh] max-w-[92vw] cursor-zoom-out object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setZoomOpen(false)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 transition active:scale-90"
              aria-label="إغلاق"
            >
              <X className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ──────────────────────────────────────────────────────────────────── */
/* Pharmacy: Professional medical info + Smart Dosage Calculator UI    */
/* ──────────────────────────────────────────────────────────────────── */

const PharmacyMedicalBlock = ({
  meta,
  productName,
}: {
  meta: Record<string, any>;
  productName: string;
}) => {
  const activeIngredient = meta.active_ingredient || meta.activeIngredient;
  const dosageDefault = meta.dosage || meta.recommended_dosage;
  const requiresRx = meta.requires_prescription || meta.requiresPrescription;
  const sideEffects = meta.side_effects || meta.sideEffects;
  const storage = meta.storage_instructions || meta.storage;

  const [weight, setWeight] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [computed, setComputed] = useState<string | null>(null);

  const compute = () => {
    const w = Number(weight);
    const a = Number(age);
    if (!w || !a) {
      setComputed("يرجى إدخال الوزن والعمر بشكل صحيح.");
      return;
    }
    // UI-only AI demo: indicative range; not medical advice.
    if (a < 12) {
      const perKg = Math.max(5, Math.min(15, Math.round((w * 10) / 1)) / 10);
      setComputed(`الجرعة المقترحة: حوالي ${perKg} مج/كجم كل 6–8 ساعات. استشر الصيدلي قبل البدء.`);
    } else {
      setComputed("الجرعة المقترحة للبالغين: 1 قرص كل 6–8 ساعات حسب الحاجة، بحد أقصى 4 جرعات يومياً.");
    }
  };

  const hasMedical =
    activeIngredient || dosageDefault || requiresRx || sideEffects || storage;

  return (
    <section className="space-y-3">
      {/* Medical fact sheet */}
      {hasMedical && (
        <div
          className="rounded-2xl p-4 ring-1 ring-primary/15 shadow-soft"
          style={{
            background:
              "linear-gradient(135deg, hsl(168 55% 96%) 0%, hsl(195 55% 97%) 100%)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-extrabold text-foreground inline-flex items-center gap-1.5">
              <span className="text-lg" aria-hidden>💊</span>
              المعلومات الطبية
            </h3>
            {requiresRx && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-[10px] font-extrabold text-rose-700 ring-1 ring-rose-500/30">
                <span aria-hidden>📝</span>
                يتطلب روشتة طبية
              </span>
            )}
          </div>
          <dl className="grid grid-cols-1 gap-2 text-[12.5px]">
            {activeIngredient && (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-background/70 px-3 py-2">
                <dt className="font-bold text-muted-foreground">المادة الفعالة</dt>
                <dd className="text-right font-extrabold text-foreground">{activeIngredient}</dd>
              </div>
            )}
            {dosageDefault && (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-background/70 px-3 py-2">
                <dt className="font-bold text-muted-foreground">الجرعة الموصى بها</dt>
                <dd className="text-right font-extrabold text-foreground">{dosageDefault}</dd>
              </div>
            )}
            {storage && (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-background/70 px-3 py-2">
                <dt className="font-bold text-muted-foreground">التخزين</dt>
                <dd className="text-right font-extrabold text-foreground">{storage}</dd>
              </div>
            )}
            {sideEffects && (
              <div className="rounded-xl bg-background/70 px-3 py-2">
                <dt className="mb-1 font-bold text-muted-foreground">الأعراض الجانبية المحتملة</dt>
                <dd className="text-[12px] leading-relaxed text-foreground/80">{sideEffects}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Smart Dosage Calculator (UI demo) */}
      <div
        className="relative overflow-hidden rounded-2xl p-4 text-white shadow-tile"
        style={{
          background:
            "linear-gradient(135deg, hsl(168 55% 28%) 0%, hsl(210 55% 32%) 100%)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl"
        />
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <span className="text-base" aria-hidden>🧮</span>
          </span>
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[9.5px] font-extrabold">
              AI · تجريبي
            </div>
            <h3 className="font-display text-base font-extrabold leading-tight">
              آلة حاسبة للجرعة الذكية
            </h3>
          </div>
        </div>
        <p className="mb-3 text-[11.5px] leading-snug text-white/85">
          أدخل وزنك وعمرك لاقتراح جرعة مبدئية لـ{" "}
          <span className="font-extrabold">{productName}</span> — لا يُعد بديلاً عن استشارة الطبيب.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-bold text-white/80">الوزن (كجم)</span>
            <input
              inputMode="numeric"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
              className="w-full rounded-xl bg-white/15 px-3 py-2 text-sm font-extrabold text-white placeholder:text-white/40 outline-none ring-1 ring-white/20 focus:ring-white/50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-bold text-white/80">العمر (سنة)</span>
            <input
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="30"
              className="w-full rounded-xl bg-white/15 px-3 py-2 text-sm font-extrabold text-white placeholder:text-white/40 outline-none ring-1 ring-white/20 focus:ring-white/50"
            />
          </label>
        </div>
        <button
          onClick={compute}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-[13px] font-extrabold text-emerald-800 shadow-pill transition active:scale-[0.98]"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.6} />
          احسب الجرعة المقترحة
        </button>
        {computed && (
          <div className="mt-3 rounded-xl bg-white/12 p-3 text-[12px] font-bold leading-relaxed ring-1 ring-white/20">
            {computed}
          </div>
        )}
        <p className="mt-2 text-[10px] text-white/70">
          ⚠️ هذه التوصية إرشادية فقط ولا تُغني عن استشارة طبيب أو صيدلي مرخّص.
        </p>
      </div>
    </section>
  );
};

export default ProductDetail;
