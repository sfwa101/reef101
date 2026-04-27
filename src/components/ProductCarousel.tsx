import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import ProductCard from "./ProductCard";

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  seeAllTo?: string;
  accent?: string;
}

const ProductCarousel = ({ title, subtitle, products, seeAllTo, accent }: ProductCarouselProps) => {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between px-1">
        <div>
          {accent && (
            <span className="mb-1 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
              {accent}
            </span>
          )}
          <h2 className="font-display text-xl font-extrabold leading-tight text-foreground">
            {title}
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {seeAllTo && (
          <Link to={seeAllTo} className="flex items-center gap-0.5 text-xs font-bold text-primary">
            عرض الكل
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        )}
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} variant="carousel" />
        ))}
      </div>
    </section>
  );
};

export default ProductCarousel;