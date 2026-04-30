import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MessageCircle, Navigation, ScanLine, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Task = {
  id: string; order_id: string; status: string; service_type: string;
  delivery_zone: string | null; customer_barcode: string | null;
  cod_amount: number; commission_amount: number;
  driver_lat: number | null; driver_lng: number | null;
};
type OrderInfo = { id: string; total: number; user_id: string; phone?: string | null; full_name?: string | null; address?: string | null };

export default function DriverTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const { data: drv } = await sb.from("drivers").select("id").eq("user_id", (await supabase.auth.getUser()).data.user?.id).maybeSingle();
    if (!drv?.id) return;
    const { data: t } = await sb.from("delivery_tasks").select("*").eq("driver_id", drv.id)
      .in("status", ["pending", "out_for_delivery", "arrived"]).order("created_at", { ascending: false });
    setTasks((t ?? []) as Task[]);
    if (t && t.length) {
      const ids = t.map((x: Task) => x.order_id);
      const { data: ods } = await sb.from("orders").select("id,total,user_id").in("id", ids);
      const { data: profs } = await sb.from("profiles").select("id,full_name,phone").in("id", (ods ?? []).map((o: OrderInfo) => o.user_id));
      const map: Record<string, OrderInfo> = {};
      (ods ?? []).forEach((o: OrderInfo) => {
        const p = (profs ?? []).find((p: { id: string }) => p.id === o.user_id);
        map[o.id] = { ...o, full_name: p?.full_name, phone: p?.phone };
      });
      setOrders(map);
    }
  }, []);

  useEffect(() => { load(); const ch = supabase.channel("driver-tasks")
    .on("postgres_changes", { event: "*", schema: "public", table: "delivery_tasks" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const getGPS = (): Promise<{ lat: number; lng: number } | null> =>
    new Promise(res => {
      if (!navigator.geolocation) return res(null);
      navigator.geolocation.getCurrentPosition(
        p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => res(null), { enableHighAccuracy: true, timeout: 8000 });
    });

  const fireEvent = async (taskId: string, ev: "out_for_delivery" | "arrived" | "location_ping") => {
    setBusy(taskId);
    const gps = await getGPS();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("driver_log_event", { _task_id: taskId, _event: ev, _lat: gps?.lat, _lng: gps?.lng });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(ev === "out_for_delivery" ? "تم تسجيل الخروج للتوصيل" : ev === "arrived" ? "تم تسجيل الوصول" : "تحديث الموقع");
    load();
  };

  const completeDelivery = async (task: Task) => {
    setBusy(task.id);
    const gps = await getGPS();
    let scanned: string | null = null;
    if (task.customer_barcode) {
      scanned = window.prompt("امسح/أدخل باركود العميل لتأكيد التسليم:");
      if (!scanned) { setBusy(null); return; }
    }
    const cod = task.cod_amount > 0 ? window.confirm(`هل حصّلت ${task.cod_amount} ج.م نقداً؟`) : false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error, data } = await (supabase as any).rpc("complete_delivery", {
      _task_id: task.id, _scanned_barcode: scanned, _lat: gps?.lat, _lng: gps?.lng, _cod_collected: cod,
    });
    setBusy(null);
    if (error) return toast.error(error.message === "barcode_mismatch" ? "الباركود غير مطابق" :
      error.message === "gps_proof_required" ? "يجب تفعيل الموقع GPS" : error.message);
    toast.success(`تم التسليم! عمولة: ${data?.commission ?? 0} ج.م`);
    load();
  };

  if (!tasks.length) return <p className="text-center text-foreground-tertiary py-8">لا توجد طلبات حالياً.</p>;

  return (
    <div className="space-y-3">
      {tasks.map(t => {
        const o = orders[t.order_id];
        return (
          <Card key={t.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-[15px]">{o?.full_name ?? "عميل"}</p>
                  <p className="text-[12px] text-foreground-tertiary num" dir="ltr">#{t.order_id.slice(0,8)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={t.service_type === "express" ? "destructive" : "secondary"}>
                    {t.service_type === "express" ? "سريع" : "عادي"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-[12px]">
                <span className="bg-muted rounded-md px-2 py-1">المبلغ: {o?.total ?? 0} ج.م</span>
                {t.cod_amount > 0 && <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-md px-2 py-1">COD: {t.cod_amount}</span>}
                {t.delivery_zone && <span className="bg-muted rounded-md px-2 py-1">{t.delivery_zone}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {o?.phone && <>
                  <Button size="sm" variant="outline" asChild><a href={`tel:${o.phone}`}><Phone className="h-4 w-4 ml-1" />اتصال</a></Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={`https://wa.me/${o.phone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4 ml-1" />واتساب
                    </a>
                  </Button>
                </>}
                <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => fireEvent(t.id, "location_ping")}>
                  <Navigation className="h-4 w-4 ml-1" />موقعي
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {t.status === "pending" && (
                  <Button size="sm" className="col-span-3" disabled={busy === t.id} onClick={() => fireEvent(t.id, "out_for_delivery")}>
                    خرجت للتوصيل
                  </Button>
                )}
                {t.status === "out_for_delivery" && (
                  <Button size="sm" className="col-span-3" variant="secondary" disabled={busy === t.id} onClick={() => fireEvent(t.id, "arrived")}>
                    <MapPin className="h-4 w-4 ml-1" />وصلت
                  </Button>
                )}
                {(t.status === "arrived" || t.status === "out_for_delivery") && (
                  <Button size="sm" className="col-span-3" disabled={busy === t.id} onClick={() => completeDelivery(t)}>
                    {t.customer_barcode ? <ScanLine className="h-4 w-4 ml-1" /> : <CheckCircle2 className="h-4 w-4 ml-1" />}
                    تأكيد التسليم
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
