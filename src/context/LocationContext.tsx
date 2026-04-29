import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_ZONE_ID,
  detectZoneFromAddress,
  getZone,
  type DeliveryZone,
  type ZoneId,
} from "@/lib/geoZones";

type LocationCtx = {
  zoneId: ZoneId;
  zone: DeliveryZone;
  /** Manually set the active zone (e.g. from address selection). */
  setZoneId: (id: ZoneId) => void;
  /** Convenience: derive + set zone from a free-form (city, district) pair. */
  setFromAddress: (city?: string | null, district?: string | null) => void;
};

const Ctx = createContext<LocationCtx | null>(null);
const STORAGE_KEY = "reef-zone-v1";

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [zoneId, setZoneIdState] = useState<ZoneId>(DEFAULT_ZONE_ID);

  // Hydrate from localStorage (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && ["A", "B", "C", "D", "M", "E"].includes(raw)) {
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

  const setFromAddress = useCallback((city?: string | null, district?: string | null) => {
    setZoneIdState(detectZoneFromAddress(city, district));
  }, []);

  const value = useMemo<LocationCtx>(() => ({
    zoneId,
    zone: getZone(zoneId),
    setZoneId,
    setFromAddress,
  }), [zoneId, setZoneId, setFromAddress]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLocation = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocation must be used within LocationProvider");
  return v;
};