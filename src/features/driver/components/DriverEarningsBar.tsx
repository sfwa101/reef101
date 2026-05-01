/**
 * DriverEarningsBar — sticky shift summary card.
 *
 * Drivers want one number: "كم في إيدي" / "كم هكسب لو خلصت كل ده".
 * Three tiles: delivered-today count, forecast commission, COD-in-hand.
 */
import { CheckCircle2, Coins, Wallet } from "lucide-react";
import type { DriverEarnings } from "../types/driver.types";

const Tile = ({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) => (
  <div
    className={`flex flex-col items-center gap-0.5 rounded-2xl p-3 ring-1 ${
      tone === "good"
        ? "bg-emerald-500/10 ring-emerald-500/30"
        : tone === "warn"
          ? "bg-amber-500/10 ring-amber-500/30"
          : "bg-card ring-border/50"
    }`}
  >
    <div className="flex items-center gap-1 text-[11px] font-bold text-foreground-tertiary">
      {icon}
      <span>{label}</span>
    </div>
    <div className="font-display text-[18px] font-extrabold tabular-nums">
      {value}
    </div>
  </div>
);

export const DriverEarningsBar = ({
  earnings,
}: {
  earnings: DriverEarnings;
}) => (
  <div className="grid grid-cols-3 gap-2">
    <Tile
      icon={<CheckCircle2 className="h-3.5 w-3.5" />}
      label="مهام منجزة"
      value={String(earnings.deliveredToday)}
      tone="good"
    />
    <Tile
      icon={<Coins className="h-3.5 w-3.5" />}
      label="عمولة متوقعة"
      value={`${earnings.forecastEgp} ج.م`}
    />
    <Tile
      icon={<Wallet className="h-3.5 w-3.5" />}
      label="عهدة نقدية"
      value={`${earnings.codInHandEgp} ج.م`}
      tone={earnings.codInHandEgp > 0 ? "warn" : "neutral"}
    />
  </div>
);
