import { ArrowDownRight, ArrowUpRight, Gift } from "lucide-react";
import { toLatin } from "@/lib/format";
import { CATEGORY_LABELS } from "@/features/wallet/types/wallet.types";

/** Icon for a transaction kind. */
export const iconFor = (kind: string) =>
  kind === "credit" ? ArrowDownRight : kind === "reward" ? Gift : ArrowUpRight;

/** Whether a transaction kind increases the balance. */
export const isPositive = (kind: string) => kind === "credit" || kind === "reward";

/** Localized, RTL-friendly relative date. */
export const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 36e5;
  if (diffH < 24)
    return `اليوم · ${toLatin(d.getHours().toString().padStart(2, "0"))}:${toLatin(d.getMinutes().toString().padStart(2, "0"))}`;
  if (diffH < 48) return "أمس";
  return toLatin(d.toLocaleDateString("en-GB"));
};

/** Tone tokens for a budget progress bar (within / approaching / over limit). */
export const progressTone = (pct: number) => {
  if (pct >= 1)
    return {
      bar: "bg-destructive",
      text: "text-destructive",
      chip: "bg-destructive/10 text-destructive",
    };
  if (pct >= 0.75)
    return {
      bar: "bg-orange-500",
      text: "text-orange-600",
      chip: "bg-orange-500/10 text-orange-600",
    };
  return {
    bar: "bg-primary",
    text: "text-primary",
    chip: "bg-primary/10 text-primary",
  };
};

/** Top-up bonus ladder. */
export const bonusFor = (
  amount: number,
): { cash: number; points: number; label: string } | null => {
  if (amount >= 2000) return { cash: 150, points: 200, label: "هدية 150 ج.م + 200 نقطة" };
  if (amount >= 1000) return { cash: 50, points: 100, label: "هدية 50 ج.م + 100 نقطة" };
  if (amount >= 500) return { cash: 20, points: 40, label: "هدية 20 ج.م + 40 نقطة" };
  if (amount >= 200) return { cash: 0, points: 20, label: "20 نقطة هدية" };
  return null;
};

/** Generate a contextual monthly insight (overspend warning, subscription tip, ...). */
export const monthAdvisor = (
  monthByCat: Record<string, number>,
  budgets: Record<string, number>,
): { text: string; cta?: { to: string; label: string } } | null => {
  // 1) overspend warning vs budget
  const overspend = Object.entries(monthByCat)
    .map(([k, v]) => ({ k, v, lim: budgets[k] || 0, pct: budgets[k] ? v / budgets[k] : 0 }))
    .filter((x) => x.lim > 0 && x.pct >= 0.85)
    .sort((a, b) => b.pct - a.pct)[0];
  if (overspend) {
    const lbl = CATEGORY_LABELS[overspend.k] || overspend.k;
    if (overspend.pct >= 1) {
      return {
        text: `تجاوزت ميزانية "${lbl}" بنسبة ${toLatin(Math.round((overspend.pct - 1) * 100))}٪. خفّض الإنفاق أو ارفع حدّك الشهري.`,
        cta: { to: "/sections" as const, label: "تصفّح أقسام أخرى" },
      };
    }
    return {
      text: `اقتربت من سقف ميزانية "${lbl}" — استخدمت ${toLatin(Math.round(overspend.pct * 100))}٪. باقي ${toLatin(Math.max(0, Math.round(overspend.lim - overspend.v)))} ج.م لهذا الشهر.`,
    };
  }
  // 2) dairy → subscription tip
  if ((monthByCat["dairy"] || 0) >= 350) {
    const save = Math.round(monthByCat["dairy"] * 0.15);
    return {
      text: `أنفقت ${toLatin(Math.round(monthByCat["dairy"]))} ج.م على الألبان هذا الشهر. وفّر حوالي ${toLatin(save)} ج.م مع سلة الألبان الأسبوعية!`,
      cta: { to: "/store/baskets-subs" as const, label: "اشترك الآن" },
    };
  }
  // 3) restaurants → kitchen
  if ((monthByCat["restaurants"] || 0) >= 500) {
    return {
      text: `وفّر حتى 40٪ على المطاعم — جرّب وجبات مطبخ ريف بنفس الجودة وبأقل من نصف السعر.`,
      cta: { to: "/store/kitchen" as const, label: "مطبخ ريف" },
    };
  }
  return {
    text: `بناءً على عاداتك، السلال الأسبوعية أوفر لك بحوالي 12-18٪ شهريًا. جرّبها وراقب الفرق في حصّالتك.`,
    cta: { to: "/store/baskets" as const, label: "اعرض السلال" },
  };
};
