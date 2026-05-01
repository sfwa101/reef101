/**
 * Wallet domain — shared type contracts.
 *
 * Pure data shapes. No React, no Supabase calls.
 * Imported by hooks (controllers) and components (views) alike,
 * so view code never re-declares balance/transaction shapes.
 */

export type WalletBalance = {
  balance: number;
  points: number;
  coupons: number;
  cashback: number;
};

export type Tx = {
  id: string;
  label: string;
  amount: number;
  kind: string;
  created_at: string;
  source?: string | null;
};

export type CategoryStat = {
  name: string;
  key: string;
  value: number;
  color: string;
};

export type ReferralRow = {
  id: string;
  status: string;
  commission: number;
  first_order_at: string | null;
  created_at: string;
};

export type SavingsJar = {
  balance: number;
  auto_save_enabled: boolean;
  round_to: number;
  goal: number | null;
  goal_label: string | null;
};

export type SavingsTx = {
  id: string;
  amount: number;
  kind: string;
  label: string;
  created_at: string;
};

export type Budget = {
  category: string;
  monthly_limit: number;
};

export type Profile = {
  full_name: string | null;
};

export type PaymentMethodId = "instapay" | "vodafone-cash" | "bank" | "cash";

export type PaymentMethod = {
  id: string;
  label: string;
  icon: any;
  sub: string;
};

export type WalletTab = "balance" | "budgets" | "affiliate";

/* ============== Domain constants ============== */

export const CATEGORY_LABELS: Record<string, string> = {
  supermarket: "السوبر ماركت",
  produce: "خضار وفاكهة",
  meat: "لحوم ودواجن",
  dairy: "ألبان",
  sweets: "حلويات",
  pharmacy: "صيدلية",
  kitchen: "أدوات مطبخ",
  baskets: "سلال",
  restaurants: "مطاعم",
  village: "منتجات الريف",
  wholesale: "جملة",
  library: "مكتبة",
};

export const PIE_COLORS = [
  "hsl(150 50% 35%)",
  "hsl(45 85% 55%)",
  "hsl(200 70% 50%)",
  "hsl(15 75% 55%)",
  "hsl(280 50% 55%)",
  "hsl(170 45% 45%)",
  "hsl(35 80% 55%)",
];

export const BUDGETABLE_CATEGORIES = [
  "meat",
  "dairy",
  "produce",
  "supermarket",
  "restaurants",
  "sweets",
];

export const TOPUP_PRESETS = [200, 500, 1000, 2000];
