import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_ZONE_ID,
  ZONES as STATIC_ZONES,
  detectZoneFromAddress as detectFromStatic,
  type DeliveryZone,
  type ZoneId,
} from "@/lib/geoZones";
import { useGeoZones } from "@/hooks/useGeoZones";

type LocationCtx = {
  zoneId: ZoneId;
  zone: DeliveryZone;
  /** All known zones (live from DB, falls back to static). */
  zones: DeliveryZone[];
  /** Manually set the active zone (e.g. from address selection). */
  setZoneId: (id: ZoneId) => void;
  /** Convenience: derive + set zone from a free-form (city, district) pair. */
  setFromAddress: (city?: string | null, district?: string | null) => void;
};

const Ctx = createContext<LocationCtx | null>(null);
const STORAGE_KEY = "reef-zone-v1";

const VALID_ZONE_CODES: ZoneId[] = ["A", "B", "C", "D", "M", "E"];

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [zoneId, setZoneIdState] = useState<ZoneId>(DEFAULT_ZONE_ID);

  // Live zones from DB; static module is initialData for instant first paint
  // AND the fallback if the query errors out.
  const { data: liveZones } = useGeoZones();
  const zones: DeliveryZone[] = liveZones ?? STATIC_ZONES;

  // Hydrate from localStorage (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && VALID_ZONE_CODES.includes(raw as ZoneId)) {
        setZoneIdState(raw as ZoneId);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, zoneId);
    } catch {
      /* ignore */
    }
  }, [zoneId]);

  const setZoneId = useCallback((id: ZoneId) => setZoneIdState(id), []);

  const resolveZone = useCallback(
    (id: ZoneId): DeliveryZone => zones.find((z) => z.id === id) ?? zones[0] ?? STATIC_ZONES[0],
    [zones],
  );

  const setFromAddress = useCallback(
    (city?: string | null, district?: string | null) => {
      // First try matching against the live zones list; fall back to the
      // static detector (which knows the full governorate list for Zone E).
      const c = (city ?? "").trim();
      const d = (district ?? "").trim();
      const direct =
        zones.find((z) => z.name === c || z.shortName === c) ??
        zones.find((z) => z.id !== "E" && z.districts.some((dist) => dist === d));
      if (direct) {
        setZoneIdState(direct.id);
        return;
      }
      setZoneIdState(detectFromStatic(city, district));
    },
    [zones],
  );

  const value = useMemo<LocationCtx>(
    () => ({
      zoneId,
      zone: resolveZone(zoneId),
      zones,
      setZoneId,
      setFromAddress,
    }),
    [zoneId, zones, resolveZone, setZoneId, setFromAddress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLocation = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocation must be used within LocationProvider");
  return v;
};
