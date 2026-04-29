import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Package, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  image_url: string | null;
  status: "active" | "draft" | "archived" | "out_of_stock";
  unit: string | null;
  category_id: string | null;
};

type Category = { id: string; name: string; icon: string | null };

const statusBadge: Record<string, string> = {
  active: "bg-success/12 text-success",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-foreground-tertiary/15 text-foreground-secondary",
  out_of_stock: "bg-destructive/12 text-destructive",
};
const statusLabel: Record<string, string> = {
  active: "نشط", draft: "مسودة", archived: "مؤرشف", out_of_stock: "نفد",
};

export default function Products() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("products").select("id,name,description,price,compare_at_price,stock,image_url,status,unit,category_id").order("created_at", { ascending: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("categories").select("id,name,icon").order("sort_order"),
    ]).then(([p, c]: any[]) => {
      setProducts(p.data ?? []);
      setCategories(c.data ?? []);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!products) return null;
    let r = products;
    if (cat !== "all") r = r.filter(p => p.category_id === cat);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      r = r.filter(p => p.name.toLowerCase().includes(t));
    }
    return r;
  }, [products, cat, q]);

  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, low: 0 };
    return {
      total: products.length,
      active: products.filter(p => p.status === "active").length,
      low: products.filter(p => p.stock > 0 && p.stock < 20).length,
    };
  }, [products]);

  return (
    <>
      <MobileTopbar title="المنتجات" />
      <div className="px-4 lg:px-6 pt-2 pb-6 max-w-6xl mx-auto">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث عن منتج"
              className="w-full bg-surface-muted rounded-2xl h-11 pr-10 pl-4 text-[14px] placeholder:text-foreground-tertiary border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center press shadow-sm">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l: "الإجمالي", v: stats.total, t: "text-foreground" },
            { l: "نشطة", v: stats.active, t: "text-success" },
            { l: "مخزون منخفض", v: stats.low, t: "text-warning" },
          ].map(s => (
            <div key={s.l} className="bg-surface rounded-2xl border border-border/40 p-3 text-center">
              <p className={cn("font-display text-[22px] leading-none num", s.t)}>{fmtNum(s.v)}</p>
              <p className="text-[11px] text-foreground-tertiary mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto -mx-4 px-4 mb-4 no-scrollbar">
          <div className="inline-flex gap-1.5">
            <Pill active={cat === "all"} onClick={() => setCat("all")} icon="📦" label="الكل" />
            {categories.map(c => (
              <Pill key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} icon={c.icon ?? "•"} label={c.name} />
            ))}
          </div>
        </div>

        {filtered === null ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-muted animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-3xl p-10 text-center border border-border/40">
            <Package className="h-10 w-10 mx-auto text-foreground-tertiary mb-3" />
            <p className="font-display text-[16px] mb-1">لا توجد منتجات</p>
            <p className="text-[13px] text-foreground-secondary">أضف منتجاً جديداً أو غيّر التصفية.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map(p => {
              const lowStock = p.stock > 0 && p.stock < 20;
              return (
                <button key={p.id} className="text-right press">
                  <IOSCard padded={false} className="overflow-hidden">
                    <div className="aspect-square bg-gradient-to-br from-surface-muted to-secondary flex items-center justify-center relative">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        : <ImageIcon className="h-10 w-10 text-foreground-tertiary opacity-40" />}
                      <span className={cn("absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full", statusBadge[p.status])}>
                        {statusLabel[p.status]}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-[13.5px] font-semibold truncate mb-1">{p.name}</p>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="font-display text-[15px] num tracking-tight">{fmtMoney(p.price)}</span>
                        {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                          <span className="text-[10.5px] text-foreground-tertiary line-through num">{fmtMoney(p.compare_at_price)}</span>
                        )}
                      </div>
                      <p className={cn("text-[11px]", lowStock ? "text-warning" : "text-foreground-tertiary")}>
                        المخزون: <span className="num font-semibold">{fmtNum(p.stock)}</span> {p.unit}
                      </p>
                    </div>
                  </IOSCard>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Pill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-1.5 h-9 px-4 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-base press border",
      active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-surface text-foreground-secondary border-border/40"
    )}>
      <span>{icon}</span>{label}
    </button>
  );
}
