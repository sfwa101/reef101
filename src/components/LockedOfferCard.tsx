import { Lock, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Level = "bronze" | "silver" | "gold" | "platinum";
const RANK: Record<Level, number> = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
const LABEL: Record<Level, string> = {
  bronze: "ضيف",
  silver: "جار الريف",
  gold: "شريك المدينة",
  platinum: "VIP",
};

export type LockedOfferCardProps = {
  title: string;
  subtitle?: string;
  /** Required tier to unlock the offer. */
  requiredTier: Level;
  /** Current user tier. Pass null for guests. */
  currentTier: Level | null;
  /** Number of orders done so far (for the progress bar). */
  ordersCount?: number;
  /** Target orders for the next tier (from progress_to_next_level). */
  ordersTarget?: number;
  /** Click handler for unlocked state. */
  href?: string;
  onClick?: () => void;
  /** Compact one-line variant. */
  compact?: boolean;
};

/**
 * Renders an offer with a "locked" overlay when the user has not reached the
 * required tier yet. Shows a teaser message + progress bar to motivate
 * additional purchases.
 */
export default function LockedOfferCard({
  title,
  subtitle,
  requiredTier,
  currentTier,
  ordersCount = 0,
  ordersTarget,
  href,
  onClick,
  compact,
}: LockedOfferCardProps) {
  const need = RANK[requiredTier];
  const have = currentTier ? RANK[currentTier] : 0;
  const locked = have < need;

  const progress =
    ordersTarget && ordersTarget > 0
      ? Math.min(100, Math.round((ordersCount / ordersTarget) * 100))
      : 0;
  const remaining = ordersTarget ? Math.max(0, ordersTarget - ordersCount) : 0;

  const inner = (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 ring-1 ring-border/30 ${
        locked
          ? "bg-muted/40"
          : "bg-gradient-to-br from-primary/10 via-card to-accent/10 shadow-soft"
      } ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            locked
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {locked ? <Lock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-extrabold leading-tight">{title}</p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{subtitle}</p>
          )}
          {locked ? (
            <div className="mt-2 space-y-1">
              <p className="text-[10.5px] font-bold text-foreground/80">
                مغلق — مخصص لمستوى{" "}
                <span className="text-primary">{LABEL[requiredTier]}</span>
              </p>
              {ordersTarget ? (
                <>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    تبقّى {remaining} طلب لفتح هذا العرض
                  </p>
                </>
              ) : null}
            </div>
          ) : (
            <span className="mt-1 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold text-primary">
              مفتوح لك
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (locked) return inner;
  if (href) return <Link to={href as any}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} className="w-full text-right">{inner}</button>;
  return inner;
}
