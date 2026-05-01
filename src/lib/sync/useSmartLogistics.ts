/**
 * Smart Logistics Engine
 * ----------------------
 * Subscribes to `geo_zones` operational metrics in realtime and exposes
 * pure helpers for dynamic delivery fees and ETA strings.
 *
 * Backend-first: the UI just consumes `dynamicFee` / `dynamicEta` from
 * the LocationContext — no UI rewrite required.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DeliveryZone } from "@/lib/geoZones";

export type ZoneOpsMetrics = {
  zone_code: string;
  current_load_factor: number;
  base_eta_minutes: number | null;
  surge_active: boolean;
};

type OpsMap = Record<string, ZoneOpsMetrics>;

/** Pure helper — dynamic delivery fee respecting free-delivery threshold. */
export function calculateDynamicDelivery(
  zone: DeliveryZone,
  subtotal: number,
  ops?: ZoneOpsMetrics,
): { fee: number; surge: boolean; loadFactor: number } {
  const loadFactor = ops?.current_load_factor ?? 1;
  const surge = !!ops?.surge_active;

  if (
    zone.freeDeliveryThreshold != null &&
    subtotal >= zone.freeDeliveryThreshold
  ) {
    return { fee: 0, surge, loadFactor };
  }

  const base = zone.deliveryFee;
  const fee = surge ? Math.round(base * loadFactor * 100) / 100 : base;
  return { fee, surge, loadFactor };
}

/** Pure helper — human-readable ETA factoring in load. */
export function calculateDynamicETA(
  zone: DeliveryZone,
  ops?: ZoneOpsMetrics,
): { label: string; minutes: number; pressure: "normal" | "elevated" | "high" } {
  const baseMinutes =
    ops?.base_eta_minutes ?? zone.etaMinutes ?? 90;
  const factor = ops?.current_load_factor ?? 1;
  const adjusted = Math.round(baseMinutes * factor);

  let pressure: "normal" | "elevated" | "high" = "normal";
  if (factor >= 1.6) pressure = "high";
  else if (factor >= 1.2) pressure = "elevated";

  let label: string;
  if (pressure === "high") {
    label =
      adjusted >= 90
        ? `ضغط عالي - خلال ${Math.round(adjusted / 60)} ساعات`
        : `ضغط عالي - خلال ${adjusted} دقيقة`;
  } else if (adjusted <= 60) {
    label = `خلال ${adjusted} دقيقة`;
  } else if (adjusted % 60 === 0) {
    const hrs = adjusted / 60;
    label = hrs === 1 ? "خلال ساعة" : hrs === 2 ? "خلال ساعتين" : `خلال ${hrs} ساعات`;
  } else {
    label = `خلال ${adjusted} دقيقة`;
  }

  return { label, minutes: adjusted, pressure };
}

/** Realtime hook: keeps a map of zone_code → ops metrics. */
export function useSmartLogistics() {
  const [ops, setOps] = useState<OpsMap>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("geo_zones")
        .select("zone_code,current_load_factor,base_eta_minutes,surge_active")
        .eq("is_active", true);
      if (!active) return;
      if (error || !data) {
        setLoaded(true);
        return;
      }
      const next: OpsMap = {};
      for (const row of data as ZoneOpsMetrics[]) {
        next[row.zone_code] = {
          zone_code: row.zone_code,
          current_load_factor: Number(row.current_load_factor ?? 1),
          base_eta_minutes: row.base_eta_minutes ?? null,
          surge_active: !!row.surge_active,
        };
      }
      setOps(next);
      setLoaded(true);
    };

    load();

    const channel = supabase
      .channel("geo-zones-ops")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "geo_zones" },
        (payload) => {
          const row = (payload.new ?? payload.old) as
            | (ZoneOpsMetrics & { is_active?: boolean })
            | undefined;
          if (!row?.zone_code) return;
          setOps((prev) => ({
            ...prev,
            [row.zone_code]: {
              zone_code: row.zone_code,
              current_load_factor: Number(row.current_load_factor ?? 1),
              base_eta_minutes: row.base_eta_minutes ?? null,
              surge_active: !!row.surge_active,
            },
          }));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { ops, loaded };
}
