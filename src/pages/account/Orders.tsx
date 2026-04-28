import { useEffect, useState } from "react";
import BackHeader from "@/components/BackHeader";
import { Package, Truck, Check, RotateCcw, Clock, Loader2, ShoppingBag, MessageCircle, X } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, toLatin } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";
import { useCart } from "@/context/CartContext";
import { getById } from "@/lib/products";
import { toast } from "sonner";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type ItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type OrderWithItems = OrderRow & { order_items: ItemRow[] };

const statusInfo: Record<string, { label: string; color: string; icon: any }> = {
  delivered:        { label: "تم التسليم",  color: "bg-primary text-primary-foreground", icon: Check },
  out_for_delivery: { label: "في الطريق",   color: "bg-accent text-accent-foreground",   icon: Truck },
  preparing:        { label: "قيد التحضير", color: "bg-amber-500 text-white",            icon: Clock },
  confirmed:        { label: "مؤكد",         color: "bg-blue-500 text-white",             icon: Check },
  pending:          { label: "بانتظار",      color: "bg-foreground/15 text-foreground",   icon: Clock },
  cancelled:        { label: "ملغي",         color: "bg-destructive text-destructive-foreground", icon: X },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const sameDay = d.toDateString() === today.toDateString();
  const wasYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `اليوم ${time}`;
  if (wasYesterday) return `أمس ${time}`;
  return d.toLocaleDateString("en-GB") + " " + time;
};

const Orders = () => {
  const { user } = useAuth();
  const { add } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as OrderWithItems[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const reorder = (o: OrderWithItems) => {
    if (!o.order_items?.length) return;
    let added = 0;
    for (const it of o.order_items) {
      const p = getById(it.product_id);
      if (p) {
        add(p, it.quantity);
        added++;
      } else {
        // Fallback: synthesize a minimal product so the user can still re-order custom items
        add({
          id: it.product_id,
          name: it.product_name,
          unit: "",
          price: Number(it.price),
          image: it.product_image ?? "",
          category: "إعادة طلب",
          source: "supermarket",
        }, it.quantity);
        added++;
      }
    }
    if (added === 0) {
      toast.error("تعذّر إضافة المنتجات");
      return;
    }
    toast.success("تمت الإضافة إلى السلة");
    navigate({ to: "/cart" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <BackHeader title="طلباتي" accent="حسابي" />
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <BackHeader title="طلباتي" accent="حسابي" />
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
            <ShoppingBag className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-xl font-extrabold">لا طلبات بعد</h2>
          <p className="text-sm text-muted-foreground">طلباتك ستظهر هنا فور إتمامها</p>
          <Link to="/sections" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pill">
            ابدأ التسوّق
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BackHeader title="طلباتي" subtitle={`${toLatin(orders.length)} طلبات`} accent="حسابي" />

      <div className="space-y-3">
        {orders.map((o) => {
          const info = statusInfo[o.status] ?? statusInfo.pending;
          const Icon = info.icon;
          const itemCount = o.order_items?.reduce((s, it) => s + it.quantity, 0) ?? 0;
          const shortId = o.id.slice(0, 8).toUpperCase();
          return (
            <div key={o.id} className="glass-strong rounded-2xl p-4 shadow-soft">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <p className="font-display text-sm font-extrabold tabular-nums">RF-{shortId}</p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                    {formatDate(o.created_at)} · {toLatin(itemCount)} منتجات
                  </p>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${info.color}`}>
                  <Icon className="h-3 w-3" /> {info.label}
                </span>
              </div>

              {o.order_items && o.order_items.length > 0 && (
                <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {o.order_items.slice(0, 5).map((it) => (
                    it.product_image ? (
                      <img key={it.id} src={it.product_image} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <div key={it.id} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-[10px] font-bold">
                        {it.product_name.slice(0, 2)}
                      </div>
                    )
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="font-display text-base font-extrabold text-primary tabular-nums">{fmtMoney(Number(o.total))}</span>
                <div className="flex gap-2">
                  {o.whatsapp_sent && (
                    <span className="flex items-center gap-1 rounded-full bg-[hsl(142_70%_42%)]/15 px-2 py-1 text-[10px] font-bold text-[hsl(142_70%_42%)]">
                      <MessageCircle className="h-3 w-3" /> واتساب
                    </span>
                  )}
                  <button onClick={() => reorder(o)} className="flex items-center gap-1 rounded-full bg-foreground/5 px-3 py-1.5 text-[11px] font-bold">
                    <RotateCcw className="h-3 w-3" /> أعد الطلب
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
