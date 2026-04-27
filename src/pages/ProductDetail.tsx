import { useParams, Link } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import BottomCTA from "@/components/BottomCTA";
import { getById } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/lib/favorites";
import { Star, Truck, ShieldCheck, Heart, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { fmtMoney } from "@/lib/format";

const ProductDetail = () => {
  const { productId } = useParams({ from: "/_app/product/$productId" });
  const product = getById(productId);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const { has, toggle } = useFavorites();
  const fav = product ? has(product.id) : false;

  if (!product) {
    return (
      <div>
        <BackHeader title="المنتج غير موجود" />
        <p className="text-sm text-muted-foreground">لم يتم العثور على المنتج المطلوب.</p>
        <Link to="/" className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">العودة للرئيسية</Link>
      </div>
    );
  }
  const total = product.price * qty;

  return (
    <>
      <div className="space-y-5">
        <BackHeader title={product.category} accent="منتج" />
        <div className="overflow-hidden rounded-[1.75rem] bg-secondary/30 shadow-tile">
          <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
        </div>
        <section className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              {product.brand && <p className="text-[11px] font-bold text-primary">{product.brand}</p>}
              <h1 className="font-display text-2xl font-extrabold leading-tight">{product.name}</h1>
              <p className="text-xs text-muted-foreground">{product.unit}</p>
            </div>
            <button onClick={() => toggle(product.id)} className="glass-strong flex h-10 w-10 items-center justify-center rounded-full shadow-soft">
              <Heart className={`h-4 w-4 transition ${fav ? "fill-destructive text-destructive" : ""}`} strokeWidth={2} />
            </button>
          </div>
          {product.rating && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-1 font-bold text-accent-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" strokeWidth={0} />{product.rating}
              </span>
              <span className="text-muted-foreground">421 تقييم</span>
            </div>
          )}
        </section>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass flex items-center gap-2 rounded-2xl p-3 shadow-soft">
            <Truck className="h-5 w-5 text-primary" />
            <div><p className="text-[11px] font-bold">توصيل سريع</p><p className="text-[10px] text-muted-foreground">خلال ساعتين</p></div>
          </div>
          <div className="glass flex items-center gap-2 rounded-2xl p-3 shadow-soft">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div><p className="text-[11px] font-bold">جودة مضمونة</p><p className="text-[10px] text-muted-foreground">استبدال فوري</p></div>
          </div>
        </div>
        <section className="glass-strong rounded-2xl p-4 shadow-soft">
          <h3 className="mb-2 font-display text-base font-extrabold">عن المنتج</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">منتج طازج من أجود المصادر، يصلك بنفس اليوم مع ضمان الاستبدال الفوري.</p>
        </section>
        <div className="h-24" />
      </div>
      <BottomCTA>
        <div className="glass-strong flex items-center gap-3 rounded-[1.5rem] p-3 shadow-float">
          <div className="flex items-center gap-1 rounded-full bg-foreground/5 p-1">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-soft" aria-label="إنقاص"><Minus className="h-3.5 w-3.5" /></button>
            <span className="w-6 text-center font-display text-base font-extrabold tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-label="زيادة"><Plus className="h-3.5 w-3.5" /></button>
          </div>
          <button onClick={() => add(product, qty)} className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-primary py-2.5 text-primary-foreground shadow-pill transition active:scale-[0.98]">
            <span className="text-[11px] font-medium opacity-85">أضف للسلة</span>
            <span className="font-display text-base font-extrabold tabular-nums">{fmtMoney(total)}</span>
          </button>
        </div>
      </BottomCTA>
    </>
  );
};
export default ProductDetail;
