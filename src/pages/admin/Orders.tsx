import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Package, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney, fmtRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  status: string;
  total: number;
  payment_method: string | null;
  notes: string | null;
  whatsapp_sent: boolean;
  user_id: string;
  created_at: string;
};

const TABS = [
  { key: "all",      label: "الكل" },
  { key: "pending",  label: "جديدة" },
  { key: "active",   label: "قيد التنفيذ" },
  { key: "delivered",label: "مكتملة" },
  { key: "cancelled",label: "ملغية" },
] as const;

const ACTIVE = ["confirmed", "preparing", "ready", "out_for_delivery", "paid"];

const statusMap: Record<string, { label: string; tone: string; dot: string }> = {
  pending:          { label: "بانتظار",     tone: "bg-warning/12 text-warning",        dot: "bg-warning" },
  confirmed:        { label: "مؤكد",        tone: "bg-info/12 text-info",              dot: "bg-info" },
  paid:             { label: "مدفوع",       tone: "bg-success/12 text-success",        dot: "bg-success" },
  preparing:        { label: "قيد التحضير", tone: "bg-[hsl(var(--purple))]/12 text-[hsl(var(--purple))]", dot: "bg-[hsl(var(--purple))]" },
  ready:            { label: "جاهز",        tone: "bg-[hsl(var(--teal))]/12 text-[hsl(var(--teal))]", dot: "bg-[hsl(var(--teal))]" },
  out_for_delivery: { label: "قيد التوصيل", tone: "bg-[hsl(var(--indigo))]/12 text-[hsl(var(--indigo))]", dot: "bg-[hsl(var(--indigo))]" },
  delivered:        { label: "تم التسليم",  tone: "bg-success/12 text-success",        dot: "bg-success" },
  cancelled:        { label: "ملغي",        tone: "bg-destructive/12 text-destructive", dot: "bg-destructive" },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<typeof TABS[number]["key"]>("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("orders")
        .select("id,status,total,payment_method,notes,whatsapp_sent,user_id,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (cancelled) return;
      setOrders(Array.isArray(data) ? (data as Order[]) : []);
    };
    load();

    // Live order updates with cleanup on unmount.
    const channel = supabase
      .channel("admin-orders-list")
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "orders" },
        () => { if (!cancelled) load(); },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return null;
    let r = orders;
    if (tab === "pending")        r = r.filter(o => o.status === "pending");
    else if (tab === "active")    r = r.filter(o => ACTIVE.includes(o.status));
    else if (tab === "delivered") r = r.filter(o => o.status === "delivered");
    else if (tab === "cancelled") r = r.filter(o => o.status === "cancelled");
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      r = r.filter(o => o.id.toLowerCase().includes(t) || (o.notes ?? "").toLowerCase().includes(t));
    }
    return r;
  }, [orders, tab, q]);

  const counts = useMemo(() => ({
    all: orders?.length ?? 0,
    pending: orders?.filter(o => o.status === "pending").length ?? 0,
    active: orders?.filter(o => ACTIVE.includes(o.status)).length ?? 0,
  }), [orders]);

  return (
    <>
      <MobileTopbar title="الطلبات" />
      <div className="px-4 lg:px-6 pt-2 pb-6 max-w-5xl mx-auto">
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الطلب أو الملاحظات"
            className="w-full bg-surface-muted rounded-2xl h-11 pr-10 pl-4 text-[14px] placeholder:text-foreground-tertiary border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l: "الكل", v: counts.all, t: "text-foreground" },
            { l: "جديدة", v: counts.pending, t: "text-warning" },
            { l: "نشطة", v: counts.active, t: "text-info" },
          ].map(s => (
            <div key={s.l} className="bg-surface rounded-2xl border border-border/40 p-3 text-center">
              <p className={cn("font-display text-[22px] leading-none num", s.t)}>{s.v}</p>
              <p className="text-[11px] text-foreground-tertiary mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto -mx-4 px-4 mb-4 no-scrollbar">
          <div className="inline-flex gap-1.5 bg-surface-muted rounded-full p-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={cn(
                "px-4 h-8 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-base press",
                tab === t.key ? "bg-surface text-foreground shadow-sm" : "text-foreground-secondary"
              )}>{t.label}</button>
            ))}
          </div>
        </div>

        {filtered === null ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-surface-muted animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-3xl p-10 text-center border border-border/40">
            <Package className="h-10 w-10 mx-auto text-foreground-tertiary mb-3" />
            <p className="font-display text-[16px] mb-1">لا توجد طلبات</p>
            <p className="text-[13px] text-foreground-secondary">لم نعثر على طلبات تطابق التصفية.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(o => {
              const s = statusMap[o.status] ?? { label: o.status, tone: "bg-muted text-foreground-secondary", dot: "bg-muted-foreground" };
              return (
                <Link key={o.id} to="/admin/orders/$orderId" params={{ orderId: o.id }}>
                  <IOSCard className="active:bg-surface-muted">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-display text-[14px] font-mono num tracking-tight">#{String(o.id).slice(0, 8).toUpperCase()}</span>
                          {o.whatsapp_sent && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">WhatsApp ✓</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[12px] text-foreground-secondary">
                          {o.payment_method && <span>{paymentLabel(o.payment_method)}</span>}
                          <span>•</span>
                          <span>{fmtRelative(o.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-left flex flex-col items-end gap-1.5">
                        <span className="font-display text-[16px] num tracking-tight">{fmtMoney(o.total)}</span>
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap text-[11px] px-2 py-0.5", s.tone)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />{s.label}
                        </span>
                      </div>
                      <ChevronLeft className="h-4 w-4 text-foreground-tertiary self-center -ml-1 mt-1" />
                    </div>
                  </IOSCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function paymentLabel(m: string) {
  return ({ cash: "نقدًا", card: "بطاقة", wallet: "محفظة", bank_transfer: "تحويل بنكي" } as any)[m] ?? m;
}
