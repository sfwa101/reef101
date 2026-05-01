/**
 * DriverSurgeBanner — high-contrast alert shown when one or more zones
 * are currently in surge. Tap-target irrelevant (read-only signal).
 *
 * Mobile-first: full width, ≥ 44px tall, brand amber for urgency,
 * works in dark + simplified view-mode.
 */
import { Flame } from "lucide-react";
import type { SurgeZone } from "../types/driver.types";

export const DriverSurgeBanner = ({ zones }: { zones: SurgeZone[] }) => {
  if (!zones.length) return null;

  const top = [...zones]
    .sort((a, b) => b.current_load_factor - a.current_load_factor)
    .slice(0, 3);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl bg-gradient-to-l from-amber-500 to-orange-600 px-4 py-3 text-white shadow-pill ring-2 ring-amber-300/60"
    >
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 shrink-0" />
        <p className="font-extrabold text-[14px]">
          ضغط عالٍ — مناطق نشطة الآن
        </p>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {top.map((z) => (
          <li
            key={z.zone_code}
            className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[12px] font-bold backdrop-blur"
          >
            {z.name}
            <span className="tabular-nums opacity-90">
              ×{z.current_load_factor.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[11px] opacity-90">
        عمولات أعلى متاحة على الطلبات في هذه المناطق.
      </p>
    </div>
  );
};
