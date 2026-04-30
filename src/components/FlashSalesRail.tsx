import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

type Sale = { id: string; ends_at: string };
type Item = { product_id: string; product_name: string; original_price: number; discount_pct: number; reason: string | null };

function formatRemaining(ms: number) {
  if (ms <= 0) return "انتهى";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}س ${mm}د` : `${mm}د`;
}

export default function FlashSalesRail() {
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: s } = await (supabase as any)
        .from("flash_sales")
        .select("id,ends_at")
        .eq("is_active", true)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !s) return;
      setSale(s as Sale);
      const { data: ps } = await (supabase as any)
        .from("flash_sale_products")
        .select("product_id,product_name,original_price,discount_pct,reason")
        .eq("flash_sale_id", s.id)
        .order("rank");
      if (!cancelled) setItems((ps ?? []) as Item[]);
    })();
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (!sale || items.length === 0) return null;
  const remaining = new Date(sale.ends_at).getTime() - now;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-destructive" />
          <h2 className="font-display text-base font-extrabold">عروض الفلاش</h2>
        </div>
        <span className="rounded-full bg-destructive/10 px-2 py-1 text-[11px] font-extrabold text-destructive tabular-nums">
          ينتهي خلال {formatRemaining(remaining)}
        </span>
      </div>
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2.5">
          {items.map((it) => {
            const final = Math.round(Number(it.original_price) * (1 - Number(it.discount_pct) / 100));
            return (
              <Link
                key={it.product_id}
                to="/product/$productId"
                params={{ productId: it.product_id }}
                className="w-36 shrink-0 rounded-2xl bg-surface p-3 ring-1 ring-border/40 active:scale-95 transition"
              >
                <div className="mb-1 inline-flex rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-extrabold text-destructive-foreground">
                  -{Math.round(Number(it.discount_pct))}٪
                </div>
                <p className="line-clamp-2 text-[12px] font-bold leading-tight">{it.product_name}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-display text-sm font-extrabold tabular-nums">{final}</span>
                  <span className="text-[9px] text-muted-foreground line-through tabular-nums">{Math.round(Number(it.original_price))}</span>
                </div>
                {it.reason && <p className="mt-0.5 text-[9px] text-muted-foreground">{it.reason}</p>}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
