import { motion } from "framer-motion";
import {
  Wallet as WalletIcon,
  Plus,
  CreditCard,
  Sparkles,
  TrendingUp,
  ScanLine,
  Send,
  ShieldCheck,
} from "lucide-react";
import { toLatin } from "@/lib/format";

/**
 * WalletBalanceCard (a.k.a. DigitalCard) — hero balance panel.
 *
 * Pure / dumb component. Renders the gradient credit-card surface,
 * tier badge, balance, points / savings tile, primary action row,
 * and the optional "trust limit" hint. All data is passed via props.
 */
export const WalletBalanceCard = ({
  name,
  balance,
  points,
  savings,
  tierLabel,
  trustLimit,
  onTopup,
  onTransfer,
  onPos,
}: {
  name: string;
  balance: number;
  points: number;
  savings: number;
  tierLabel?: string;
  trustLimit: number;
  onTopup: () => void;
  onTransfer: () => void;
  onPos: () => void;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 14, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="relative overflow-hidden rounded-[1.75rem] p-5 shadow-float ring-1 ring-white/10"
    style={{
      background:
        "linear-gradient(135deg, hsl(150 45% 14%) 0%, hsl(160 40% 22%) 50%, hsl(45 60% 30%) 100%)",
    }}
  >
    <div
      className="absolute -top-20 -right-16 h-56 w-56 rounded-full blur-3xl"
      style={{ background: "hsl(45 80% 55% / 0.25)" }}
    />
    <div
      className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full blur-3xl"
      style={{ background: "hsl(150 60% 40% / 0.25)" }}
    />
    <div
      className="absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />

    <div className="relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
            <WalletIcon className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold tracking-[0.18em] text-white/85">
            REEF · DIGITAL
          </span>
        </div>
        <CreditCard className="h-5 w-5 text-white/50" />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">حامل البطاقة</p>
          <p className="mt-0.5 font-display text-sm font-extrabold text-white">{name}</p>
        </div>
        {tierLabel && (
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-white ring-1 ring-white/20">
            {tierLabel}
          </span>
        )}
      </div>

      <p className="mt-3 text-[11px] font-bold text-white/70">الرصيد المتاح</p>
      <motion.p
        key={balance}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl font-extrabold text-white tabular-nums"
      >
        {toLatin(Math.round(balance))} <span className="text-base font-medium text-white/70">ج.م</span>
      </motion.p>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-2.5 ring-1 ring-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(45_90%_70%)]" />
          <div>
            <p className="text-[9px] text-white/70">نقاط الولاء</p>
            <p className="font-display text-sm font-extrabold text-white tabular-nums">
              {toLatin(points)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-white/15 pr-2">
          <TrendingUp className="h-3.5 w-3.5 text-[hsl(140_70%_70%)]" />
          <div>
            <p className="text-[9px] text-white/70">وفّرت معنا</p>
            <p className="font-display text-sm font-extrabold text-white tabular-nums">
              {toLatin(savings)} ج
            </p>
          </div>
        </div>
      </div>

      {/* primary actions */}
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <button
          onClick={onPos}
          className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white py-2.5 text-foreground shadow-pill transition active:scale-95"
        >
          <ScanLine className="h-4 w-4" strokeWidth={2.4} />
          <span className="text-[10px] font-extrabold leading-none">الدفع في الفرع</span>
        </button>
        <button
          onClick={onTopup}
          className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 py-2.5 text-white ring-1 ring-white/20 transition active:scale-95"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          <span className="text-[10px] font-extrabold leading-none">شحن الرصيد</span>
        </button>
        <button
          onClick={onTransfer}
          className="flex flex-col items-center justify-center gap-1 rounded-xl bg-white/15 py-2.5 text-white ring-1 ring-white/20 transition active:scale-95"
        >
          <Send className="h-4 w-4" strokeWidth={2.4} />
          <span className="text-[10px] font-extrabold leading-none">تحويل</span>
        </button>
      </div>

      {trustLimit > 0 && (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-white/10 p-2 ring-1 ring-white/15">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-white/90" />
          <p className="flex-1 text-[10px] font-bold text-white/90">
            رصيد ثقة متاح حتى{" "}
            <span className="font-extrabold tabular-nums">{toLatin(trustLimit)} ج.م</span> · يُستخدم
            تلقائيًا عند الحاجة
          </p>
        </div>
      )}
    </div>
  </motion.section>
);
