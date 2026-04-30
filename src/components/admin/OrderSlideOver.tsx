import { useEffect, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { Loader2, ExternalLink, Truck, Phone, Receipt } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Props = { orderId: string | null; onClose: () => void };

export function OrderSlideOver({ orderId, onClose }: Props) {
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) { setOrder(null); setItems([]); return; }
    setLoading(true);
    Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("orders").select("*, profile:user_id(full_name,phone)").eq("id", orderId).maybeSingle(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("order_items").select("*").eq("order_id", orderId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("user_roles").select("user_id, profiles:user_id(full_name,phone)").eq("role", "delivery").limit(20),
    ]).then(([oRes, iRes, dRes]: any[]) => {
      setOrder(oRes.data);
      setItems(iRes.data ?? []);
      setDrivers(dRes.data ?? []);
      setLoading(false);
    });
  }, [orderId]);

  const assign = async (driverId: string) => {
    if (!orderId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("orders").update({ assigned_driver_id: driverId, status: "out_for_delivery" }).eq("id", orderId);
    onClose();
  };

  return (
    <Sheet open={!!orderId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-full sm:max-w-lg p-0 overflow-y-auto" dir="rtl">
        {loading || !order ? (
          <div className="h-full flex items-center justify-center p-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground p-5">
              <p className="text-[11px] opacity-80">طلب رقم</p>
              <p className="font-mono text-[14px] truncate">#{String(order.id).slice(0, 8).toUpperCase()}</p>
              <p className="font-display text-[28px] num mt-2">{fmtMoney(order.total)}</p>
              <Link to="/admin/orders/$orderId" params={{ orderId: order.id }} onClick={onClose}
                className="inline-flex items-center gap-1 mt-2 text-[11px] bg-white/20 backdrop-blur rounded-full px-2.5 py-1">
                <ExternalLink className="h-3 w-3" /> فتح الصفحة الكاملة
              </Link>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-surface rounded-2xl border border-border/40 p-3.5 space-y-2">
                <h3 className="font-display text-[14px] flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> العميل</h3>
                <p className="text-[13px]">{order.profile?.full_name ?? "—"}</p>
                <p className="text-[12px] text-foreground-tertiary num" dir="ltr">{order.profile?.phone ?? "—"}</p>
              </div>

              <div className="bg-surface rounded-2xl border border-border/40 p-3.5 space-y-2">
                <h3 className="font-display text-[14px] flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" /> الفاتورة ({items.length})</h3>
                <ul className="divide-y divide-border/40 text-[12.5px]">
                  {items.map((it) => (
                    <li key={it.id} className="py-1.5 flex items-center justify-between gap-2">
                      <span className="truncate">{it.name ?? it.product_name ?? "منتج"}</span>
                      <span className="text-foreground-tertiary shrink-0">×{it.quantity}</span>
                      <span className="num shrink-0 font-semibold">{fmtMoney((it.price ?? 0) * (it.quantity ?? 1))}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface rounded-2xl border border-border/40 p-3.5">
                <h3 className="font-display text-[14px] mb-2 flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> تعيين مندوب</h3>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {drivers.length === 0 && <p className="text-[12px] text-foreground-tertiary">لا يوجد مناديب متاحون</p>}
                  {drivers.map((d) => (
                    <button key={d.user_id} onClick={() => assign(d.user_id)}
                      className="w-full text-right p-2 rounded-xl bg-surface-muted hover:bg-primary/10 hover:text-primary transition text-[12.5px] flex items-center justify-between">
                      <span>{d.profiles?.full_name ?? "مندوب"}</span>
                      <span className="text-[10px] text-foreground-tertiary num" dir="ltr">{d.profiles?.phone ?? ""}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
