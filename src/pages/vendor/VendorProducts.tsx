import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney } from "@/lib/format";
import { Loader2, Search } from "lucide-react";

type P = { id: string; name: string; price: number; stock: number; is_active: boolean; image_url: string | null; image: string | null; category: string };

export default function VendorProducts() {
  const [rows, setRows] = useState<P[] | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setRows(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("products")
      .select("id,name,price,stock,is_active,image_url,image,category,vendor_id")
      .not("vendor_id", "is", null)
      .order("name");
    if (error) { console.error(error); return; }
    setRows((data ?? []) as P[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = (rows ?? []).filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-4 pt-3 pb-6 space-y-3">
      <h1 className="font-display text-[22px]">منتجاتي</h1>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في منتجاتك..."
          className="w-full bg-surface-muted rounded-2xl h-11 pr-10 pl-4 text-[14px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>
      {rows === null ? (
        <div className="p-10 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <IOSCard className="text-center text-foreground-tertiary text-[13px] py-10">لا توجد منتجات.</IOSCard>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <IOSCard key={p.id} className="!p-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-surface-muted overflow-hidden shrink-0">
                  {(p.image_url || p.image) && <img src={p.image_url || p.image || ""} alt={p.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px] truncate">{p.name}</p>
                  <p className="text-[11px] text-foreground-tertiary truncate">{p.category}</p>
                  <div className="flex gap-3 mt-1 text-[12px]">
                    <span className="font-semibold text-primary">{fmtMoney(p.price)}</span>
                    <span className={p.stock < 5 ? "text-destructive" : "text-foreground-secondary"}>المخزون: {p.stock}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.is_active ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                  {p.is_active ? "نشط" : "موقوف"}
                </span>
              </div>
            </IOSCard>
          ))}
        </div>
      )}
    </div>
  );
}
