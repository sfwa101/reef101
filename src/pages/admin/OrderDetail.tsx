import { useEffect, useState } from "react";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { ChevronRight, MapPin, FileText, CreditCard, Package, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { IOSCard, IOSList, IOSRow, IOSSection } from "@/components/ios/IOSCard";
import { fmtMoney, fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FLOW = [
  { value: "pending", label: "بانتظار" },
  { value: "confirmed", label: "مؤكد" },
  { value: "preparing", label: "قيد التحضير" },
  { value: "ready", label: "جاهز" },
  { value: "out_for_delivery", label: "قيد التوصيل" },
  { value: "delivered", label: "تم التسليم" },
];

const statusBadge: Record<string, string> = {
  pending: "bg-warning/12 text-warning",
  confirmed: "bg-info/12 text-info",
  preparing: "bg-[hsl(var(--purple))]/12 text-[hsl(var(--purple))]",
  ready: "bg-[hsl(var(--teal))]/12 text-[hsl(var(--teal))]",
  out_for_delivery: "bg-[hsl(var(--indigo))]/12 text-[hsl(var(--indigo))]",
  delivered: "bg-success/12 text-success",
  cancelled: "bg-destructive/12 text-destructive",
  paid: "bg-success/12 text-success",
};

export default function OrderDetail() {
  const { orderId } = useParams({ strict: false }) as { orderId: string };
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [address, setAddress] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: o } = await (supabase as any).from("orders").select("*").eq("id", orderId).maybeSingle();
      setOrder(o);
      if (!o) return;
      const [it, cust, addr] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("order_items").select("*").eq("order_id", orderId),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).from("profiles").select("*").eq("id", o.user_id).maybeSingle(),
        o.address_id ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("addresses").select("*").eq("id", o.address_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setItems(it.data ?? []);
      setCustomer(cust.data);
      setAddress(addr.data);
    })();
  }, [orderId]);

  async function setStatus(next: string) {
    if (!order) return;
    setUpdating(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("orders").update({ status: next }).eq("id", order.id);
    setUpdating(false);
    if (error) return toast.error("تعذّر تحديث الحالة");
    setOrder({ ...order, status: next });
    toast.success("تم تحديث حالة الطلب");
  }

  if (!order) {
    return (
      <>
        <Topbar title="جاري التحميل…" onBack={() => router.history.back()} />
        <div className="p-4 max-w-2xl mx-auto space-y-3">
          <div className="h-32 rounded-3xl bg-surface-muted animate-pulse" />
          <div className="h-48 rounded-3xl bg-surface-muted animate-pulse" />
        </div>
      </>
    );
  }

  const idx = FLOW.findIndex(s => s.value === order.status);
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;

  return (
    <>
      <Topbar title={`#${String(order.id).slice(0, 8).toUpperCase()}`} onBack={() => router.history.back()} />
      <div className="px-4 lg:px-6 pt-3 pb-8 max-w-2xl mx-auto space-y-4">
        <IOSCard className="bg-gradient-primary text-primary-foreground border-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[12px] opacity-80">الإجمالي</p>
              <p className="font-display text-[34px] leading-none num tracking-tight mt-1">{fmtMoney(order.total)}</p>
            </div>
            <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20")}>{order.payment_method ?? "—"}</span>
          </div>
          <div className="text-[12.5px] opacity-90">{fmtDate(order.created_at)}</div>
        </IOSCard>

        <IOSCard>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-foreground-secondary">الحالة الحالية</span>
            <span className={cn("text-[12px] font-semibold px-2.5 py-1 rounded-full", statusBadge[order.status] ?? "bg-muted")}>
              {FLOW.find(s => s.value === order.status)?.label ?? order.status}
            </span>
          </div>
          {next && (
            <button disabled={updating} onClick={() => setStatus(next.value)}
              className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-[14px] press disabled:opacity-50">
              تحويل إلى: {next.label}
            </button>
          )}
          {!["cancelled", "delivered"].includes(order.status) && (
            <button disabled={updating} onClick={() => setStatus("cancelled")}
              className="w-full h-11 rounded-full bg-destructive/10 text-destructive font-semibold text-[14px] mt-2 press">
              إلغاء الطلب
            </button>
          )}
        </IOSCard>

        {customer && (
          <IOSSection title="العميل">
            <IOSList>
              <IOSRow>
                <User className="h-4 w-4 text-foreground-tertiary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium">{customer.full_name ?? "بدون اسم"}</p>
                  {customer.phone && <p className="text-[12px] text-foreground-tertiary num" dir="ltr">{customer.phone}</p>}
                </div>
              </IOSRow>
            </IOSList>
          </IOSSection>
        )}

        <IOSSection title={`العناصر (${items.length})`}>
          {items.length === 0 ? (
            <IOSCard className="text-center text-[13px] text-foreground-secondary">لا توجد عناصر مفصّلة</IOSCard>
          ) : (
            <IOSList>
              {items.map(it => (
                <IOSRow key={it.id}>
                  <div className="h-10 w-10 rounded-xl bg-surface-muted flex items-center justify-center overflow-hidden">
                    {it.product_image ? <img src={it.product_image} alt="" className="w-full h-full object-cover" />
                      : <Package className="h-4 w-4 text-foreground-tertiary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">{it.product_name}</p>
                    <p className="text-[11.5px] text-foreground-tertiary num">{it.quantity} × {fmtMoney(it.price)}</p>
                  </div>
                  <span className="font-display text-[14px] num">{fmtMoney(Number(it.price) * Number(it.quantity))}</span>
                </IOSRow>
              ))}
            </IOSList>
          )}
        </IOSSection>

        {address && (
          <IOSSection title="عنوان التوصيل">
            <IOSList>
              <IOSRow>
                <MapPin className="h-4 w-4 text-foreground-tertiary" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px]">{address.label}</p>
                  <p className="text-[12px] text-foreground-tertiary">{[address.city, address.district, address.street, address.building].filter(Boolean).join(" - ")}</p>
                </div>
              </IOSRow>
            </IOSList>
          </IOSSection>
        )}

        {order.notes && (
          <IOSSection title="ملاحظات">
            <IOSCard><p className="text-[13.5px]">{order.notes}</p></IOSCard>
          </IOSSection>
        )}
      </div>
    </>
  );
}

function Topbar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="glass-strong sticky top-0 z-30 border-b border-border/40" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="px-2 h-12 flex items-center gap-1">
        <button onClick={onBack} className="h-9 w-9 rounded-full hover:bg-surface-muted press flex items-center justify-center">
          <ChevronRight className="h-5 w-5" />
        </button>
        <h1 className="font-display text-[17px] flex-1 text-center pr-9 truncate">{title}</h1>
      </div>
    </header>
  );
}
