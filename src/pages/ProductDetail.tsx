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
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id);
      if (!cancelled) setReviewCount(count ?? 0);
    })();
    return () => { cancelled = true; };
  }, [product?.id]);

  const variant = product?.variants?.find((v) => v.id === variantId);
  const addonsTotal = useMemo(
    () => (product?.addons ?? []).filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0),
    [product?.addons, addonIds],
  );
  const unitPrice = (product?.price ?? 0) + (variant?.priceDelta ?? 0) + addonsTotal;
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
  /* Gallery: replicate single image into a 3-frame slider for the "carousel" feel */
  const gallery = [product.image, product.image, product.image];

  const toggleAddon = (id: string) =>
    setAddonIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleAdd = () => {
    const variantSuffix = variant ? ` (${variant.label})` : "";
    const addonLabels = (product.addons ?? []).filter((a) => addonIds.includes(a.id)).map((a) => a.label);
    const suffix = variantSuffix + (addonLabels.length ? ` + ${addonLabels.join(" + ")}` : "");
    const customId = `${product.id}${variant ? `__${variant.id}` : ""}${addonIds.length ? `__${addonIds.sort().join("-")}` : ""}`;
    add({ ...product, id: customId, name: `${product.name}${suffix}`, price: unitPrice }, qty);
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

  return (
    <>
      <motion.div
        className="space-y-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <BackHeader title={product.category} />

        {/* ===== Hero gallery with zoom ===== */}
        <section className="space-y-2">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-secondary/30 shadow-tile">
            <div
              ref={galleryRef}
              className="flex aspect-square w-full snap-x snap-mandatory overflow-x-auto no-scrollbar"
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

            {/* Arrows (visible only when more than one slide) */}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-soft backdrop-blur-md ring-1 ring-border/40 transition active:scale-90"
                  aria-label="السابق"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <button
                  onClick={goNext}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-soft backdrop-blur-md ring-1 ring-border/40 transition active:scale-90"
                  aria-label="التالي"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </>
            )}

            {/* Zoom hint */}
            <button
              onClick={() => setZoomOpen(true)}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-[10px] font-extrabold text-foreground shadow-soft backdrop-blur-md ring-1 ring-border/40"
            >
              <ZoomIn className="h-3 w-3" strokeWidth={2.6} />
              تكبير
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {gallery.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === galleryIndex ? "w-5 bg-primary" : "w-1.5 bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ===== Title + Trust Badges ===== */}
        <section className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {product.brand && <p className="text-[11px] font-bold text-primary">{product.brand}</p>}
              <h1 className="font-display text-2xl font-extrabold leading-tight">{product.name}</h1>
              <p className="text-xs text-muted-foreground">{product.unit}</p>
            </div>
            <button
              onClick={() => toggle(product.id)}
              className="glass-strong flex h-10 w-10 items-center justify-center rounded-full shadow-soft transition active:scale-90"
              aria-label="مفضلة"
            >
              <Heart className={`h-4 w-4 transition ${fav ? "fill-destructive text-destructive" : ""}`} strokeWidth={2} />
            </button>
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
          <button
            onClick={handleAdd}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-primary py-2.5 text-primary-foreground shadow-pill transition active:scale-[0.98]"
          >
            <span className="text-[11px] font-medium opacity-85">أضف للسلة</span>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={priceFlash}
                initial={{ opacity: 0, y: -6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.92 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-base font-extrabold tabular-nums"
              >
                {fmtMoney(total)}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </BottomCTA>

      {/* ===== Zoom Lightbox ===== */}
      <AnimatePresence>
        {zoomOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
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
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md ring-1 ring-white/30 transition active:scale-90"
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

export default ProductDetail;
