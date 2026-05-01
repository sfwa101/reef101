import { useState } from "react";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney } from "@/lib/format";
import { Loader2, Minus, Plus, Search, AlertTriangle } from "lucide-react";
import type { VendorProduct } from "../types/vendor-ops.types";

type Props = {
  products: VendorProduct[];
  loading: boolean;
  onUpdate: (productId: string, newQty: number, isActive: boolean) => Promise<boolean>;
};

export function VendorInventoryGrid({ products, loading, onUpdate }: Props) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) {
    return <div className="p-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const filtered = products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  const adjust = async (p: VendorProduct, delta: number) => {
    const next = Math.max(0, p.stock + delta);
    setBusy(p.id);
    await onUpdate(p.id, next, p.is_active);
    setBusy(null);
  };

  const toggleActive = async (p: VendorProduct) => {
    setBusy(p.id);
    await onUpdate(p.id, p.stock, !p.is_active);
    setBusy(null);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث في منتجاتك..."
          className="w-full bg-surface-muted rounded-2xl h-11 pr-10 pl-4 text-[14px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {filtered.length === 0 ? (
        <IOSCard className="text-center text-foreground-tertiary text-[13px] py-10">لا توجد منتجات.</IOSCard>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const low = p.stock < 5;
            const out = p.stock === 0;
            return (
              <IOSCard key={p.id} className="!p-3">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-surface-muted overflow-hidden shrink-0">
                    {(p.image_url || p.image) && <img src={p.image_url || p.image || ""} alt={p.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-[14px] truncate">{p.name}</p>
                      {low && p.is_active && <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />}
                    </div>
                    <p className="text-[11px] text-foreground-tertiary truncate">{p.category}</p>
                    <p className="font-semibold text-primary text-[13px] num mt-0.5">{fmtMoney(p.price)}</p>
                  </div>
                  <button
                    onClick={() => toggleActive(p)}
                    disabled={busy === p.id}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold press ${p.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}
                  >
                    {p.is_active ? "نشط" : "موقوف"}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                  <span className="text-[12px] text-foreground-secondary">المخزون</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjust(p, -1)}
                      disabled={busy === p.id || p.stock === 0}
                      className="h-9 w-9 rounded-xl bg-surface-muted flex items-center justify-center press disabled:opacity-40"
                      aria-label="إنقاص"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className={`min-w-[3ch] text-center font-display text-[18px] num ${out ? "text-destructive" : low ? "text-warning" : ""}`}>
                      {p.stock}
                    </span>
                    <button
                      onClick={() => adjust(p, 1)}
                      disabled={busy === p.id}
                      className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center press"
                      aria-label="زيادة"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </IOSCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
