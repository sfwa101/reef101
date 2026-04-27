import BackHeader from "@/components/BackHeader";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/products";
import { useFavorites } from "@/lib/favorites";
import { Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";

const Favorites = () => {
  const { favs } = useFavorites();
  const items = products.filter((p) => favs.includes(p.id));

  return (
    <div className="space-y-4">
      <BackHeader title="المفضلة" subtitle={`${items.length} منتج`} accent="حسابي" />
      {items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-xl font-extrabold">لا توجد منتجات بعد</h2>
          <p className="text-sm text-muted-foreground">اضغط على ❤ في أي منتج لإضافته للمفضلة</p>
          <Link to="/sections" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pill">تصفّح الأقسام</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default Favorites;
