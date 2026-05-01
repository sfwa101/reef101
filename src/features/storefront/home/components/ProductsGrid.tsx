/**
 * ProductsGrid — main 2-column product grid + empty-state with reset CTA.
 */
import { Layers3 } from "lucide-react";

import { toLatin } from "@/lib/format";

import { CATS } from "../data";
import type { CatId, HGProduct } from "../types";
import { ProductCard } from "./ProductCard";
import { RailHeader } from "./RailHeader";

export const ProductsGrid = ({
  cat,
  filtered,
  hue,
  onOpen,
  onResetAll,
}: {
  cat: CatId;
  filtered: HGProduct[];
  hue: string;
  onOpen: (id: string) => void;
  onResetAll: () => void;
}) => (
  <section className="mt-6 px-4">
    <RailHeader
      icon={Layers3}
      title={
        cat === "all"
          ? "كل المنتجات"
          : CATS.find((c) => c.id === cat)?.name ?? ""
      }
      sub={`${toLatin(filtered.length)} منتج`}
      hue={hue}
    />
    <div className="mt-3 grid grid-cols-2 gap-3">
      {filtered.map((p) => (
        <ProductCard key={p.id} p={p} onOpen={() => onOpen(p.id)} />
      ))}
    </div>
    {filtered.length === 0 && (
      <div className="mt-10 flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-bold text-muted-foreground">
          لا توجد نتائج تطابق بحثك
        </p>
        <button
          onClick={onResetAll}
          className="rounded-full bg-primary px-4 py-2 text-[11px] font-extrabold text-primary-foreground shadow-pill"
        >
          إعادة ضبط الفلاتر
        </button>
      </div>
    )}
  </section>
);
