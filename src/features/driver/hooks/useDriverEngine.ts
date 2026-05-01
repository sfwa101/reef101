/**
 * useDriverEngine — single source of truth for the Driver operational surface.
 *
 * Responsibilities (KISS, mobile-first):
 *   - Resolve the current driver row from auth.uid()
 *   - Load + Realtime-subscribe to `delivery_tasks` for that driver
 *   - Hydrate joined customer/order info from `orders` + `profiles`
 *   - Track active surge zones from `geo_zones` (realtime-aware)
 *   - Drive the FSM via existing RPCs:
 *       fireEvent(taskId, 'out_for_delivery' | 'arrived' | 'location_ping')
 *       completeDelivery(task)  → handles barcode + COD prompts
 *   - Derive shift earnings (deliveredToday, forecast, COD-in-hand)
 *
 * Backend-first contract — we DO NOT change schemas. Optimistic UI is
 * applied only on advance/arrived to keep tap-latency low; the realtime
 * channel reconciles authoritative state.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  DriverEarnings,
  DriverEvent,
  DriverTask,
  GpsFix,
  OrderInfo,
  SurgeZone,
  TaskStatus,
} from "../types/driver.types";

/** Status set the driver actively works on (excludes terminal states). */
const ACTIVE_STATUSES: TaskStatus[] = ["pending", "out_for_delivery", "arrived"];

/** Ask the device for a high-accuracy GPS fix; resolves null on denial/timeout. */
const getGPS = (): Promise<GpsFix> =>
  new Promise((res) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      (p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => res(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });

export type DriverEngine = {
  // identity
  driverId: string | null;
  loading: boolean;

  // data
  tasks: DriverTask[];
  orders: Record<string, OrderInfo>;
  surgeZones: SurgeZone[];
  earnings: DriverEarnings;

  // status flags
  busyTaskId: string | null;

  // actions (FSM)
  fireEvent: (taskId: string, ev: DriverEvent) => Promise<void>;
  completeDelivery: (task: DriverTask) => Promise<void>;
  refresh: () => Promise<void>;
};

export const useDriverEngine = (): DriverEngine => {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<DriverTask[]>([]);
  const [orders, setOrders] = useState<Record<string, OrderInfo>>({});
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>([]);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  /** Tracks delivered-today counter from realtime UPDATE→delivered transitions. */
  const deliveredTodayRef = useRef(0);

  /* ─── core load: tasks + joined order/profile data ─── */
  const load = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;
    const auth = await supabase.auth.getUser();
    const uid = auth.data.user?.id;
    if (!uid) {
      setDriverId(null);
      setLoading(false);
      return;
    }

    const { data: drv } = await sb
      .from("drivers")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();
    const id = drv?.id ?? null;
    setDriverId(id);

    if (!id) {
      setTasks([]);
      setOrders({});
      setLoading(false);
      return;
    }

    const { data: t } = await sb
      .from("delivery_tasks")
      .select("*")
      .eq("driver_id", id)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: false });

    const list = (t ?? []) as DriverTask[];
    setTasks(list);

    if (list.length) {
      const orderIds = list.map((x) => x.order_id);
      const { data: ods } = await sb
        .from("orders")
        .select("id,total,user_id")
        .in("id", orderIds);

      const userIds = (ods ?? []).map((o: OrderInfo) => o.user_id);
      const { data: profs } = await sb
        .from("profiles")
        .select("id,full_name,phone")
        .in("id", userIds);

      const map: Record<string, OrderInfo> = {};
      (ods ?? []).forEach((o: OrderInfo) => {
        const p = (profs ?? []).find(
          (x: { id: string }) => x.id === o.user_id,
        );
        map[o.id] = { ...o, full_name: p?.full_name, phone: p?.phone };
      });
      setOrders(map);
    } else {
      setOrders({});
    }
    setLoading(false);
  }, []);

  /* ─── surge zones from geo_zones ─── */
  const loadSurge = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("geo_zones")
      .select("zone_code,name,current_load_factor,surge_active")
      .eq("is_active", true);
    setSurgeZones(((data ?? []) as SurgeZone[]).filter((z) => z.surge_active));
  }, []);

  /* ─── boot + realtime subscriptions ─── */
  useEffect(() => {
    load();
    loadSurge();

    const tasksCh = supabase
      .channel("driver-engine-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "delivery_tasks" },
        (payload) => {
          // Track delivered-today increments locally for the earnings bar.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const n = (payload.new ?? {}) as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const o = (payload.old ?? {}) as any;
          if (n?.status === "delivered" && o?.status !== "delivered") {
            deliveredTodayRef.current += 1;
          }
          load();
        },
      )
      .subscribe();

    const zonesCh = supabase
      .channel("driver-engine-zones")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "geo_zones" },
        () => loadSurge(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksCh);
      supabase.removeChannel(zonesCh);
    };
  }, [load, loadSurge]);

  /* ─── FSM actions ─── */
  const fireEvent = useCallback(
    async (taskId: string, ev: DriverEvent) => {
      setBusyTaskId(taskId);
      const gps = await getGPS();

      // Optimistic transition for state-advancing events (skip for pings).
      if (ev !== "location_ping") {
        const nextStatus: TaskStatus =
          ev === "out_for_delivery" ? "out_for_delivery" : "arrived";
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)),
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc("driver_log_event", {
        _task_id: taskId,
        _event: ev,
        _lat: gps?.lat,
        _lng: gps?.lng,
      });
      setBusyTaskId(null);

      if (error) {
        toast.error(error.message);
        load(); // reconcile authoritative state on failure
        return;
      }
      toast.success(
        ev === "out_for_delivery"
          ? "تم تسجيل الخروج للتوصيل"
          : ev === "arrived"
            ? "تم تسجيل الوصول"
            : "تحديث الموقع",
      );
    },
    [load],
  );

  const completeDelivery = useCallback(
    async (task: DriverTask) => {
      setBusyTaskId(task.id);
      const gps = await getGPS();

      let scanned: string | null = null;
      if (task.customer_barcode) {
        scanned = window.prompt("امسح/أدخل باركود العميل لتأكيد التسليم:");
        if (!scanned) {
          setBusyTaskId(null);
          return;
        }
      }

      const cod =
        task.cod_amount > 0
          ? window.confirm(`هل حصّلت ${task.cod_amount} ج.م نقداً؟`)
          : false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error, data } = await (supabase as any).rpc("complete_delivery", {
        _task_id: task.id,
        _scanned_barcode: scanned,
        _lat: gps?.lat,
        _lng: gps?.lng,
        _cod_collected: cod,
      });
      setBusyTaskId(null);

      if (error) {
        toast.error(
          error.message === "barcode_mismatch"
            ? "الباركود غير مطابق"
            : error.message === "gps_proof_required"
              ? "يجب تفعيل الموقع GPS"
              : error.message,
        );
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const commission = (data as any)?.commission ?? task.commission_amount ?? 0;
      toast.success(`تم التسليم! عمولة: ${commission} ج.م`);
    },
    [],
  );

  /* ─── derived earnings ─── */
  const earnings = useMemo<DriverEarnings>(() => {
    const forecastEgp = tasks.reduce((s, t) => s + (t.commission_amount ?? 0), 0);
    const codInHandEgp = tasks.reduce((s, t) => s + (t.cod_amount ?? 0), 0);
    return {
      deliveredToday: deliveredTodayRef.current,
      activeCount: tasks.length,
      forecastEgp: Math.round(forecastEgp * 100) / 100,
      codInHandEgp: Math.round(codInHandEgp * 100) / 100,
    };
  }, [tasks]);

  return {
    driverId,
    loading,
    tasks,
    orders,
    surgeZones,
    earnings,
    busyTaskId,
    fireEvent,
    completeDelivery,
    refresh: load,
  };
};
