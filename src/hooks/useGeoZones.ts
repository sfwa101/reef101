// TanStack Query layer for delivery zones.
// ----------------------------------------------------
// Reads from the `geo_zones` table (single source of truth, admin-editable).
// Falls back to the static `src/lib/geoZones.ts` module if the network
// request fails or the table is unreachable, so the storefront never
// loses zone info even offline.

import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ZONES as STATIC_ZONES, type DeliveryZone, type ZoneId } from "@/lib/geoZones";

type GeoZoneRow = {
  zone_code: string;
  name: string;
  short_name: string;
  districts: string[] | null;
  delivery_fee: number;
  free_delivery_threshold: number | null;
  eta_label: string;
  eta_minutes: number | null;
  cod_allowed: boolean;
  accepts_perishables: boolean;
  accent: string | null;
  sort_order: number;
};

const VALID_ZONE_CODES: ZoneId[] = ["A", "B", "C", "D", "M", "E"];

function rowToZone(row: GeoZoneRow): DeliveryZone | null {
  if (!VALID_ZONE_CODES.includes(row.zone_code as ZoneId)) return null;
  return {
    id: row.zone_code as ZoneId,
    name: row.name,
    shortName: row.short_name,
    districts: row.districts ?? [],
    deliveryFee: Number(row.delivery_fee),
    freeDeliveryThreshold:
      row.free_delivery_threshold != null ? Number(row.free_delivery_threshold) : null,
    etaLabel: row.eta_label,
    etaMinutes: row.eta_minutes ?? undefined,
    codAllowed: row.cod_allowed,
    acceptsPerishables: row.accepts_perishables,
    accent: row.accent ?? "text-emerald-600",
  };
}

async function fetchGeoZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from("geo_zones")
    .select(
      "zone_code,name,short_name,districts,delivery_fee,free_delivery_threshold,eta_label,eta_minutes,cod_allowed,accepts_perishables,accent,sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    if (error) console.error("[geo_zones] fetch failed, using static fallback:", error);
    return STATIC_ZONES;
  }

  const mapped = (data as GeoZoneRow[])
    .map(rowToZone)
    .filter((z): z is DeliveryZone => z !== null);

  return mapped.length > 0 ? mapped : STATIC_ZONES;
}

export const geoZonesQueryOptions = () =>
  queryOptions({
    queryKey: ["geo_zones"] as const,
    queryFn: fetchGeoZones,
    staleTime: 5 * 60_000, // zones rarely change
    gcTime: 30 * 60_000,
  });

export function useGeoZones() {
  return useQuery(geoZonesQueryOptions());
}
