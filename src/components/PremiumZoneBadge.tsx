import { Link } from "@tanstack/react-router";
import { Zap, ChevronLeft } from "lucide-react";
import { useLocation } from "@/context/LocationContext";

/**
 * Glassmorphism + green-glow "premium badge" replacing the plain zone alert.
 * Shows only when the user is in a fast-delivery zone (A or B).
 */
const PremiumZoneBadge = () => {
  const { zone } = useLocation();
  if (zone.id !== "A" && zone.id !== "B") return null;

  return (
    <Link
      to="/account/addresses"
      className="animate-glow-pulse glass relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 ring-1 ring-primary/25 animate-float-up"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--primary-soft) / 0.85), hsl(var(--card) / 0.7))",
      }}
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-pill">
        <Zap className="h-4 w-4" strokeWidth={2.6} />
        <span className="absolute -inset-0.5 rounded-xl bg-primary/40 blur-md -z-10" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[12.5px] font-extrabold text-foreground">
          نطاق {zone.shortName} السريع ⚡
        </span>
        <span className="block text-[10.5px] font-medium text-muted-foreground">
          طلبك يصلك {zone.etaLabel} — توصيل ممتاز
        </span>
      </span>
      <ChevronLeft className="h-4 w-4 text-primary" strokeWidth={2.6} />
    </Link>
  );
};

export default PremiumZoneBadge;