import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Package, RefreshCcw, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type SubOrderRow = {
  sub_order_id: string;
  status: string;
  total: number;
  notes: string | null;
  items: Array<{ product_name: string; quantity: number; price: number }> | null;
};

type RecentOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  user_id: string;
  sub_count: number;
};

export default function AllocationMonitor() {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<SubOrderRow[]>([]);
  const [reallocating, setReallocating] = useState(false);
  const [zoneInput, setZoneInput] = useState("M");

  async function loadOrders() {
    setLoading(true);
    const { data: orderRows } = await supabase
      .from("orders")
      .select("id,total,status,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!orderRows) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const ids = orderRows.map((o) => o.id);
    const { data: subs } = await supabase
      .from("sub_orders")
      .select("order_id")
      .in("order_id", ids);

    const counts = new Map<string, number>();
    (subs || []).forEach((s) => counts.set(s.order_id, (counts.get(s.order_id) || 0) + 1));

    setOrders(
      orderRows.map((o) => ({
        ...o,
        sub_count: counts.get(o.id) || 0,
      })),
    );
    setLoading(false);
  }

  async function loadAllocation(orderId: string) {
    setSelectedOrder(orderId);
    const { data, error } = await supabase.rpc("allocation_overview", { _order_id: orderId });
    if (error) {
      toast.error("تعذّر تحميل تفاصيل التوزيع");
      return;
    }
    setAllocation((data as unknown as SubOrderRow[]) || []);
  }

  async function reallocate(orderId: string) {
    setReallocating(true);
    const { data, error } = await supabase.rpc("allocate_order_inventory", {
      _order_id: orderId,
      _zone: zoneInput || "M",
    });
    setReallocating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as { allocated_items?: number; failed_items?: unknown[] } | null;
    toast.success(
      `تم التوزيع: ${result?.allocated_items ?? 0} عنصر${result?.failed_items?.length ? ` — ${result.failed_items.length} فشل` : ""}`,
    );
    await loadAllocation(orderId);
    await loadOrders();
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="space-y-4 p-4 pb-24">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" /> مراقبة التوزيع الذكي
          </h1>
          <p className="text-xs text-muted-foreground">تقسيم الطلبات على أقرب مخزن وحجز المخزون</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadOrders} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">آخر 50 طلباً</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد طلبات</p>
            ) : (
              orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => loadAllocation(o.id)}
                  className={`w-full text-right rounded-lg border p-3 transition ${
                    selectedOrder === o.id ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono">{o.id.slice(0, 8)}…</span>
                    <Badge variant={o.sub_count > 0 ? "default" : "destructive"}>
                      {o.sub_count > 0 ? `${o.sub_count} مخزن` : "غير موزّع"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{Number(o.total).toFixed(2)} ج.م</span>
                    <span>{new Date(o.created_at).toLocaleString("ar-EG")}</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" /> تفاصيل التوزيع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedOrder ? (
              <p className="text-sm text-muted-foreground">اختر طلباً لعرض التوزيع</p>
            ) : (
              <>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">منطقة (zone)</label>
                    <Input
                      value={zoneInput}
                      onChange={(e) => setZoneInput(e.target.value.toUpperCase())}
                      placeholder="M"
                      className="h-8"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => reallocate(selectedOrder)}
                    disabled={reallocating}
                  >
                    {reallocating ? <Loader2 className="h-4 w-4 animate-spin" /> : "إعادة التوزيع"}
                  </Button>
                </div>

                {allocation.length === 0 ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span>لم يُوزَّع هذا الطلب بعد. اضغط "إعادة التوزيع" لتشغيل المحرّك.</span>
                  </div>
                ) : (
                  allocation.map((sub) => (
                    <div key={sub.sub_order_id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{sub.status}</Badge>
                        <span className="text-xs font-bold">{Number(sub.total).toFixed(2)} ج.م</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{sub.notes}</p>
                      <div className="space-y-1">
                        {(sub.items || []).map((it, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span>
                              {it.product_name} ×{it.quantity}
                            </span>
                            <span className="text-muted-foreground">
                              {Number(it.price).toFixed(2)} ج.م
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
