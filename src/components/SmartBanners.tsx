import { Link } from "@tanstack/react-router";
import { Wallet as WalletIcon, Zap, Share2, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "@/context/LocationContext";
import { toLatin } from "@/lib/format";

type Props = {
  walletBalance: number;
  hasReferralCode: boolean;
};

/**
 * Conditional, dismissible banners that surface only when there's a real
 * reason to show them. Designed to sit just above the main promo hero.
 */
const SmartBanners = ({ walletBalance, hasReferralCode }: Props) => {
  const { zone } = useLocation();

  const banners: {
    key: string;
    show: boolean;
    to: string;
    icon: typeof WalletIcon;
    title: string;
    sub: string;
    tint: string; // gradient using theme tokens
  }[] = [
    {
      key: "wallet",
      show: walletBalance > 0,
      to: "/wallet",
      icon: WalletIcon,
      title: `رصيدك ${toLatin(walletBalance.toFixed(0))} ج.م`,
      sub: "استخدمه الآن لتسوق أسرع",
      tint:
        "linear-gradient(135deg, hsl(var(--primary-soft)) 0%, hsl(var(--accent) / 0.45) 100%)",
    },
    {
      key: "zone",
      show: zone.id === "A" || zone.id === "B",
      to: "/account/addresses",
      icon: Zap,
      title: `أنت في نطاق ${zone.shortName} ⚡`,
      sub: `طلبك يصلك ${zone.etaLabel}`,
      tint:
        "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--primary-soft)) 100%)",
    },
    {
      key: "partner",
      show: hasReferralCode,
      to: "/wallet",
      icon: Share2,
      title: "شارك كودك واربح",
      sub: "عمولة على كل طلب جديد",
      tint:
        "linear-gradient(135deg, hsl(var(--accent) / 0.65) 0%, hsl(var(--primary-soft)) 100%)",
    },
  ];

  const visible = banners.filter((b) => b.show);
  if (visible.length === 0) return null;

  return (
    <section
      className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar snap-x snap-mandatory scroll-smooth"
      aria-label="تنبيهات ذكية"
    >
      <AnimatePresence>
        {visible.map((b, i) => {
          const Icon = b.icon;
          return (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ delay: i * 0.04 }}
              className="snap-start"
            >
              <Link
                to={b.to}
                className="group flex min-w-[260px] items-center gap-3 rounded-2xl px-3.5 py-2.5 ring-1 ring-border/60 shadow-soft"
                style={{ background: b.tint }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/80 ring-1 ring-border/40 backdrop-blur">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={2.4} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-[13px] font-extrabold text-foreground">
                    {b.title}
                  </span>
                  <span className="block truncate text-[10px] font-medium text-muted-foreground">
                    {b.sub}
                  </span>
                </span>
                <ChevronLeft className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" strokeWidth={2.4} />
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
};

export default SmartBanners;