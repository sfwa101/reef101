import { useState } from "react";
import { motion } from "framer-motion";
import {
  PiggyBank,
  Target,
  Settings2,
  ChevronLeft,
  Plus,
  Minus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toLatin } from "@/lib/format";
import { fireMiniConfetti } from "@/lib/confetti";
import { formatDate } from "@/features/wallet/lib/walletAdvisor";
import type { SavingsJar, SavingsTx } from "@/features/wallet/types/wallet.types";

/* ================= SAVINGS TILE (collapsed surface) ================= */
export const SavingsJarTile = ({
  jar,
  onOpen,
}: {
  jar: SavingsJar | null;
  onOpen: () => void;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15, duration: 0.4 }}
    onClick={onOpen}
    className="relative cursor-pointer overflow-hidden rounded-2xl p-4 shadow-soft ring-1 ring-border/50"
    style={{
      background: "linear-gradient(135deg, hsl(var(--primary-soft)) 0%, hsl(45 70% 92%) 100%)",
    }}
  >
    <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
    <div className="relative flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[hsl(45_80%_55%)] text-white shadow-pill">
        <PiggyBank className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-extrabold text-foreground">حصّالتي</h3>
          {jar?.auto_save_enabled && (
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-extrabold text-primary">
              تلقائي ON
            </span>
          )}
        </div>
        <p className="text-[10px] text-foreground/70">تقريب القروش من كل طلب لتوفير ذكي</p>
      </div>
      <div className="text-right">
        <p className="font-display text-2xl font-extrabold text-foreground tabular-nums">
          {toLatin(Math.round(jar?.balance ?? 0))}
        </p>
        <p className="text-[9px] text-foreground/60">ج.م مُدّخَرة</p>
      </div>
    </div>
    {jar?.goal && jar.goal > 0 && (
      <div className="relative mt-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-foreground/70">{jar.goal_label || "هدفك"}</span>
          <span className="font-extrabold tabular-nums text-foreground">
            {toLatin(Math.min(100, Math.round((jar.balance / jar.goal) * 100)))}٪
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-[hsl(45_80%_55%)]"
            style={{ width: `${Math.min(100, (jar.balance / jar.goal) * 100)}%` }}
          />
        </div>
      </div>
    )}
  </motion.section>
);

/* ================= SAVINGS JAR DIALOG (expanded surface) ================= */
export const SavingsJarDialog = ({
  onClose,
  userId,
  jar,
  txs,
  onUpdate,
}: {
  onClose: () => void;
  userId: string;
  jar: SavingsJar;
  txs: SavingsTx[];
  onUpdate: (j: SavingsJar, t: SavingsTx[]) => void;
}) => {
  const [autoSave, setAutoSave] = useState(jar.auto_save_enabled);
  const [roundTo, setRoundTo] = useState(jar.round_to);
  const [goal, setGoal] = useState(jar.goal ? String(jar.goal) : "");
  const [goalLabel, setGoalLabel] = useState(jar.goal_label ?? "");
  const [depositAmount, setDepositAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [{ data: j }, { data: t }] = await Promise.all([
      supabase
        .from("savings_jar")
        .select("balance,auto_save_enabled,round_to,goal,goal_label")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("savings_transactions")
        .select("id,amount,kind,label,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    onUpdate(
      (j ?? {
        balance: 0,
        auto_save_enabled: false,
        round_to: 5,
        goal: null,
        goal_label: null,
      }) as SavingsJar,
      (t ?? []) as SavingsTx[],
    );
  };

  const upsertJar = async (patch: Partial<SavingsJar> & { balance?: number }) => {
    const next = { ...jar, ...patch, user_id: userId };
    const { error } = await supabase
      .from("savings_jar")
      .upsert(next as any, { onConflict: "user_id" });
    if (error) {
      toast.error("تعذّر الحفظ");
      return false;
    }
    return true;
  };

  const saveSettings = async () => {
    setBusy(true);
    const ok = await upsertJar({
      auto_save_enabled: autoSave,
      round_to: roundTo,
      goal: goal ? Number(goal) : null,
      goal_label: goalLabel || null,
    });
    setBusy(false);
    if (ok) {
      toast.success("تم حفظ إعدادات الحصّالة");
      await refresh();
    }
  };

  const deposit = async (amount: number, label: string, kind = "deposit") => {
    if (amount <= 0) return;
    setBusy(true);
    const newBalance = Number(jar.balance || 0) + amount;
    const ok = await upsertJar({ balance: newBalance });
    if (ok) {
      await supabase
        .from("savings_transactions")
        .insert({ user_id: userId, amount, kind, label });
      fireMiniConfetti();
      toast.success(`+${toLatin(amount)} ج.م في حصّالتك 🐷`);
      await refresh();
      setDepositAmount("");
    }
    setBusy(false);
  };

  const withdraw = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) return;
    if (amt > Number(jar.balance || 0)) {
      toast.error("الرصيد غير كافٍ");
      return;
    }
    setBusy(true);
    const newBalance = Number(jar.balance || 0) - amt;
    const ok = await upsertJar({ balance: newBalance });
    if (ok) {
      await supabase.from("savings_transactions").insert({
        user_id: userId,
        amount: amt,
        kind: "withdraw",
        label: "سحب من الحصّالة",
      });
      toast.success(`تم تحويل ${toLatin(amt)} ج.م إلى محفظتك`);
      await refresh();
      setDepositAmount("");
    }
    setBusy(false);
  };

  const goalPct =
    jar.goal && jar.goal > 0 ? Math.min(100, (Number(jar.balance) / Number(jar.goal)) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="font-display text-lg font-extrabold">الحصّالة الذكية</h2>
              <p className="text-[11px] text-muted-foreground">ادّخر بدون أن تشعر</p>
            </div>
          </div>
        </div>

        <div
          className="relative mb-4 overflow-hidden rounded-2xl p-5 text-white"
          style={{
            background:
              "linear-gradient(135deg, hsl(220 25% 12%), hsl(150 35% 18%) 60%, hsl(45 55% 28%))",
          }}
        >
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[hsl(45_80%_55%)]/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <PiggyBank className="h-7 w-7 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-white/70">الرصيد المُدّخَر</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">
                {toLatin(Math.round(jar.balance))}{" "}
                <span className="text-sm text-white/70">ج.م</span>
              </p>
            </div>
          </div>
          {jar.goal && jar.goal > 0 && (
            <div className="relative mt-4">
              <div className="flex items-center justify-between text-[10px] text-white/85">
                <span className="flex items-center gap-1 font-bold">
                  <Target className="h-3 w-3" /> {jar.goal_label || "هدفك"}
                </span>
                <span className="font-extrabold tabular-nums">
                  {toLatin(Math.round(jar.balance))} / {toLatin(Math.round(jar.goal))} ج
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/15">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPct}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-gradient-to-r from-[hsl(45_85%_60%)] to-white"
                />
              </div>
            </div>
          )}
        </div>

        <p className="mb-2 text-[11px] font-bold text-muted-foreground">إيداع سريع (ج.م)</p>
        <div className="mb-2 grid grid-cols-4 gap-2">
          {[5, 10, 25, 50].map((v) => (
            <button
              key={v}
              onClick={() => deposit(v, `إيداع يدوي ${v} ج.م`)}
              disabled={busy}
              className="rounded-xl bg-primary/10 py-2.5 text-xs font-extrabold text-primary transition active:scale-95 disabled:opacity-50"
            >
              +{toLatin(v)}
            </button>
          ))}
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="مبلغ مخصص"
            className="flex-1 rounded-xl bg-foreground/5 px-3 py-2.5 text-sm font-bold tabular-nums outline-none"
          />
          <button
            onClick={() => deposit(Number(depositAmount), `إيداع يدوي ${depositAmount} ج.م`)}
            disabled={busy || !depositAmount}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
          </button>
          <button
            onClick={withdraw}
            disabled={busy || !depositAmount}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground/10 text-foreground disabled:opacity-50"
          >
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>

        <div className="mb-4 rounded-2xl bg-foreground/5 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <p className="text-[12px] font-extrabold">الادخار التلقائي</p>
            </div>
            <button
              onClick={() => setAutoSave((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition ${
                autoSave ? "bg-primary" : "bg-foreground/20"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  autoSave ? "right-0.5" : "right-[calc(100%-1.375rem)]"
                }`}
              />
            </button>
          </div>
          <p className="mb-2 text-[10px] text-muted-foreground">
            يُقرّب كل طلب لأقرب مضاعف ويضع الفرق في حصّالتك تلقائيًا
          </p>
          <p className="mb-1.5 text-[10px] font-bold text-muted-foreground">قرّب لأقرب</p>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10, 25].map((r) => (
              <button
                key={r}
                onClick={() => setRoundTo(r)}
                className={`rounded-lg py-2 text-[11px] font-extrabold transition ${
                  roundTo === r ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                }`}
              >
                {toLatin(r)} ج
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="text"
              value={goalLabel}
              onChange={(e) => setGoalLabel(e.target.value)}
              placeholder="اسم الهدف (مثلاً: عمرة)"
              className="rounded-lg bg-background px-3 py-2 text-[12px] font-bold outline-none"
            />
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={goal}
              onChange={(e) => setGoal(e.target.value.replace(/\D/g, ""))}
              placeholder="مبلغ الهدف"
              className="rounded-lg bg-background px-3 py-2 text-[12px] font-bold tabular-nums outline-none"
            />
          </div>

          <button
            onClick={saveSettings}
            disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[12px] font-extrabold text-primary-foreground disabled:opacity-50"
          >
            حفظ الإعدادات
          </button>
        </div>

        {txs.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-bold text-muted-foreground">آخر العمليات</p>
            <div className="space-y-1.5">
              {txs.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl bg-foreground/5 px-3 py-2 text-[11px]"
                >
                  <div>
                    <p className="font-bold">{t.label}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDate(t.created_at)}</p>
                  </div>
                  <span
                    className={`font-extrabold tabular-nums ${
                      t.kind === "withdraw" ? "text-destructive" : "text-primary"
                    }`}
                  >
                    {t.kind === "withdraw" ? "-" : "+"}
                    {toLatin(Math.round(Math.abs(Number(t.amount))))} ج
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
