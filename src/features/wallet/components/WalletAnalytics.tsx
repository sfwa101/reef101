import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3, Wand2, Pencil, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";
import {
  BUDGETABLE_CATEGORIES,
  CATEGORY_LABELS,
  type CategoryStat,
} from "@/features/wallet/types/wallet.types";
import { monthAdvisor, progressTone } from "@/features/wallet/lib/walletAdvisor";

/* ================= SPENDING DONUT ================= */
export const SpendingDonut = ({ stats }: { stats: CategoryStat[] }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="glass-strong rounded-2xl p-4 shadow-soft"
  >
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <BarChart3 className="h-4 w-4" />
      </div>
      <div>
        <h2 className="font-display text-sm font-extrabold">تحليل الإنفاق</h2>
        <p className="text-[10px] text-muted-foreground">توزيع مصاريفك على الأقسام (الإجمالي)</p>
      </div>
    </div>

    {stats.length === 0 ? (
      <div className="py-8 text-center text-xs text-muted-foreground">
        ابدأ التسوق لرؤية تحليل ذكي لمصاريفك
      </div>
    ) : (
      <div className="grid grid-cols-[140px_1fr] items-center gap-3">
        <div className="h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats}
                dataKey="value"
                innerRadius={38}
                outerRadius={62}
                paddingAngle={2}
                stroke="none"
              >
                {stats.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: any) => [`${toLatin(v)} ج.م`, ""]}
                contentStyle={{
                  borderRadius: 10,
                  border: "none",
                  fontSize: 11,
                  background: "hsl(var(--card))",
                  boxShadow: "var(--shadow-soft)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {stats.map((c) => {
            const total = stats.reduce((s, x) => s + x.value, 0);
            const pct = Math.round((c.value / total) * 100);
            return (
              <div key={c.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: c.color }}
                  />
                  <span className="truncate font-bold">{c.name}</span>
                </div>
                <span className="font-extrabold tabular-nums text-muted-foreground">
                  {toLatin(pct)}٪
                </span>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </motion.section>
);

/* ================= AI ADVISOR ================= */
export const AIAdvisor = ({
  monthByCat,
  budgets,
}: {
  monthByCat: Record<string, number>;
  budgets: Record<string, number>;
}) => {
  const tip = useMemo(() => monthAdvisor(monthByCat, budgets), [monthByCat, budgets]);
  if (!tip) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-4 shadow-soft ring-1 ring-primary/15"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary-soft)) 0%, hsl(200 60% 92%) 100%)",
      }}
    >
      <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[hsl(200_70%_45%)] text-white shadow-pill">
          <Wand2 className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
            المستشار المالي الذكي
          </p>
          <p className="mt-1 text-[12px] font-bold leading-relaxed text-foreground">{tip.text}</p>
          {tip.cta && (
            <Link
              to={tip.cta.to}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-extrabold text-primary-foreground shadow-pill"
            >
              {tip.cta.label} ←
            </Link>
          )}
        </div>
      </div>
    </motion.section>
  );
};

/* ================= BUDGET TRACKER ================= */
export const BudgetTracker = ({
  userId,
  monthByCat,
  budgets,
  onChange,
}: {
  userId: string;
  monthByCat: Record<string, number>;
  budgets: Record<string, number>;
  onChange: (b: Record<string, number>) => void;
}) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const start = (cat: string) => {
    setEditing(cat);
    setDraft(String(budgets[cat] || ""));
  };

  const save = async (cat: string) => {
    const n = Number(draft.replace(/\D/g, "")) || 0;
    setBusy(true);
    if (n === 0) {
      await supabase
        .from("category_budgets")
        .delete()
        .eq("user_id", userId)
        .eq("category", cat);
    } else {
      await supabase
        .from("category_budgets")
        .upsert(
          { user_id: userId, category: cat, monthly_limit: n },
          { onConflict: "user_id,category" },
        );
    }
    const next = { ...budgets };
    if (n === 0) delete next[cat];
    else next[cat] = n;
    onChange(next);
    setEditing(null);
    setBusy(false);
    toast.success("تم حفظ الميزانية");
  };

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-base font-extrabold">ميزانياتي الشهرية</h2>
        <span className="text-[10px] font-bold text-muted-foreground">حدّد سقف لكل قسم</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {BUDGETABLE_CATEGORIES.map((cat) => {
          const spent = Math.round(monthByCat[cat] || 0);
          const limit = budgets[cat] || 0;
          const pct = limit > 0 ? spent / limit : 0;
          const tone = progressTone(pct);
          const isEditing = editing === cat;
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-3.5 shadow-soft ring-1 ring-border/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[13px] font-extrabold">
                    {CATEGORY_LABELS[cat]}
                  </span>
                  {limit > 0 && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${tone.chip}`}>
                      {toLatin(Math.round(Math.min(pct, 9.99) * 100))}٪
                    </span>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="w-20 rounded-lg bg-foreground/5 px-2 py-1 text-right text-[12px] font-extrabold tabular-nums outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      onClick={() => save(cat)}
                      disabled={busy}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => start(cat)}
                    className="flex items-center gap-1 rounded-lg bg-foreground/5 px-2 py-1 text-[10px] font-extrabold text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                    {limit > 0 ? `${toLatin(limit)} ج` : "حدّد سقف"}
                  </button>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="font-bold">
                  أنفقت <span className={`tabular-nums ${tone.text}`}>{toLatin(spent)}</span> ج.م
                  هذا الشهر
                </span>
                {limit > 0 && (
                  <span className="font-bold tabular-nums">
                    المتبقي {toLatin(Math.max(0, limit - spent))} ج
                  </span>
                )}
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${tone.bar}`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
