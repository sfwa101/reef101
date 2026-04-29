import { useMemo } from "react";
import type { Product } from "@/lib/products";
import { productsWithVolumeDeals, volumeDealFor } from "@/lib/volumeDeals";
import ProductCard from "@/components/ProductCard";
import { Layers } from "lucide-react";

interface Props {
  pool: Product[];
}

const VolumeDealsRail = ({ pool }: Props) => {
  const items = useMemo(() => productsWithVolumeDeals(pool), [pool]);
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Layers className="h-4 w-4 text-accent-foreground" strokeWidth={2.4} />
        <h2 className="font-display text-base font-extrabold text-foreground">
          خصم الكميات
        </h2>
        <span className="text-[10px] text-muted-foreground">· وفر أكثر بالشراء بالكمية</span>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 no-scrollbar">
        {items.map((p) => (
          <div key={`vol-${p.id}`} className="w-[150px] shrink-0">
            <ProductCard
              product={p}
              variant="carousel"
              volumeBadge={volumeDealFor(p) ?? undefined}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default VolumeDealsRail;
