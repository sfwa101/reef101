import { motion } from "framer-motion";
import { Banknote, Gift, Users } from "lucide-react";
import { toLatin } from "@/lib/format";

/**
 * SlidingTabs — animated 3-up tab switcher (Balance / Analytics / Affiliate).
 * Pure presentation; consumer owns the active id and onChange callback.
 */
export const SlidingTabs = ({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; icon: any }[];
  active: string;
  onChange: (id: string) => void;
}) => {
  const idx = tabs.findIndex((t) => t.id === active);
  return (
    <div className="relative grid grid-cols-3 gap-1 rounded-2xl bg-foreground/5 p-1 ring-1 ring-border/40">
      <motion.div
        className="absolute inset-y-1 rounded-xl bg-card shadow-soft ring-1 ring-border/40"
        initial={false}
        animate={{
          left: `calc(${(idx / tabs.length) * 100}% + 4px)`,
          width: `calc(${100 / tabs.length}% - 8px)`,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
      />
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-extrabold transition ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

/**
 * MiniStatGrid — compact 3-tile reward summary
 * (coupons / cashback / successful referrals).
 */
export const MiniStatGrid = ({
  coupons,
  cashback,
  refs,
}: {
  coupons: number;
  cashback: number;
  refs: number;
}) => (
  <section className="grid grid-cols-3 gap-2.5">
    {[
      { label: "كوبوناتي", value: toLatin(coupons), icon: Gift },
      { label: "كاش باك", value: toLatin(Math.round(cashback)), icon: Banknote, suffix: "ج" },
      { label: "إحالات", value: toLatin(refs), icon: Users },
    ].map((p, i) => (
      <motion.div
        key={p.label}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 * i, duration: 0.35 }}
        className="glass-strong rounded-2xl p-3 shadow-soft"
      >
        <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <p.icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </div>
        <p className="font-display text-lg font-extrabold tabular-nums">
          {p.value}
          {p.suffix && <span className="text-[10px] text-muted-foreground"> {p.suffix}</span>}
        </p>
        <p className="text-[10px] text-muted-foreground">{p.label}</p>
      </motion.div>
    ))}
  </section>
);
