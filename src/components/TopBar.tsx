import { Link } from "@tanstack/react-router";
import reefLogo from "@/assets/reef-logo.webp";
import { useCartCount, useCartTotal } from "@/context/CartContext";
import { fmtMoney } from "@/lib/format";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toLatin } from "@/lib/format";
import { useLocation as useDeliveryLocation } from "@/context/LocationContext";

interface TopBarProps {
  title?: string;
}

/**
 * Slim, glassmorphic header that shrinks on scroll.
 * - Removes the chunky cart pill in favor of a thin SVG icon button
 * - No "delivery range" green button — we surface zone state as a tiny
 *   pulsing badge next to the brand title.
 */
const TopBar = ({ title = "ريف المدينة" }: TopBarProps) => {
  const count = useCartCount();
  const total = useCartTotal();
  const { user } = useAuth();
  const { zone } = useDeliveryLocation();
  const [balance, setBalance] = useState<number | null>(null);
  const [shrunk, setShrunk] = useState(false);

  useEffect(() => {
    if (!user) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("wallet_balances")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setBalance(Number(data?.balance ?? 0));
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Shrinking header on scroll
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setShrunk(window.scrollY > 16);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const fastZone = zone.id === "A" || zone.id === "B";

  return (
    <header
      className="header-slim fixed inset-x-0 top-0 z-40"
      data-shrunk={shrunk ? "true" : "false"}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div
        className={`mx-auto flex max-w-md items-center justify-between gap-2 px-3.5 transition-[padding] duration-300 ease-apple lg:max-w-[1400px] lg:px-6 ${shrunk ? "py-1.5 lg:py-2" : "py-2.5 lg:py-3"}`}
      >
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <img
            src={reefLogo}
            alt=""
            width={36}
            height={36}
            className={`object-contain transition-all duration-300 ease-apple ${shrunk ? "h-7 w-7" : "h-8 w-8 lg:h-10 lg:w-10"}`}
            style={{ background: "transparent" }}
          />
          <div className="min-w-0">
            <p
              className={`font-display font-extrabold tracking-tight text-foreground leading-none transition-[font-size] duration-300 ${shrunk ? "text-[14px]" : "text-[15.5px] lg:text-lg"}`}
            >
              {title}
            </p>
            {/* Tiny zone badge — replaces the chunky green CTA */}
            <span
              className={`mt-1 inline-flex items-center gap-1 text-[9.5px] font-bold leading-none transition-opacity ${shrunk ? "opacity-0 h-0 mt-0" : "opacity-100"}`}
            >
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 rounded-full ${fastZone ? "bg-emerald-500 animate-pulse-soft" : "bg-amber-500"}`}
              />
              <span className={fastZone ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}>
                {fastZone ? `توصيل سريع · ${zone.shortName}` : zone.shortName}
              </span>
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          {balance !== null && balance > 0 && (
            <Link
              to="/wallet"
              aria-label="المحفظة"
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-[10.5px] font-extrabold text-foreground ring-1 ring-accent/25 hover:bg-accent/25 transition lg:hidden"
            >
              <WalletGlyph className="h-3.5 w-3.5 text-accent" />
              <span className="tabular-nums">{toLatin(Math.round(balance))}</span>
            </Link>
          )}
          <Link
            to="/cart"
            aria-label="السلة"
            className="group relative inline-flex h-9 items-center gap-1.5 rounded-full bg-card/70 pl-1.5 pr-2.5 ring-1 ring-border/60 backdrop-blur-md transition hover:bg-card lg:hidden"
          >
            {count > 0 && (
              <span
                key={total}
                className="font-display text-[12px] font-extrabold text-foreground tabular-nums whitespace-nowrap animate-cart-capsule"
              >
                {fmtMoney(total)}
              </span>
            )}
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <BagGlyph className="h-3.5 w-3.5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-accent-foreground ring-2 ring-card">
                  {toLatin(count)}
                </span>
              )}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

/* Slim SVG glyphs — no external icon font weight */
const BagGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M5 8h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M9 8V6a3 3 0 1 1 6 0v2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const WalletGlyph = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <rect x="3" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M16 13h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 10h13a3 3 0 0 1 3 3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

export default TopBar;
