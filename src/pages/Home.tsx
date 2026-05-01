/**
 * Home — Phase 26 Main Super App Hub.
 *
 * The top of the page is now driven by the SDUI engine (LayoutFactory
 * + ui_layouts page_key='main_hub'). Admins can re-order the four hero
 * stem cells (MainSearchHeader, StoryCircles, PromotionSlider,
 * DepartmentGrid) from /admin/design without touching code.
 *
 * Below the SDUI hero we preserve the existing personalization rails
 * (slot picks, recommendations, buy-it-again, trending, smart shortcuts)
 * to maintain 100% functional parity with pre-Phase-26 behaviour.
 */
import { Sparkles, Clock, Flame, Award, ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProductCarousel from "@/components/ProductCarousel";
import ProductCard from "@/components/ProductCard";
import { products, isPerishable, useProductsVersion } from "@/lib/products";
import {
  getTimeSlot,
  personalizedProducts,
  productsForSlot,
  slotMeta,
  smartOffers,
} from "@/lib/personalize";
import SmartBanners from "@/components/SmartBanners";
import LiveBanners from "@/components/LiveBanners";
import MegaEventBanner from "@/components/MegaEventBanner";
import LoyaltyProgress from "@/components/LoyaltyProgress";
import InactivityNudger from "@/components/InactivityNudger";
import FlashSalesRail from "@/components/FlashSalesRail";
import { buyAgainProducts } from "@/lib/buyAgain";
import { useLocation } from "@/context/LocationContext";
import { logBehavior } from "@/lib/behavior";

import { LayoutFactory } from "@/features/storefront/home/components/LayoutFactory";
import { storeThemes } from "@/lib/storeThemes";

const cv = { contentVisibility: "auto" as const, containIntrinsicSize: "1px 360px" };

const HomePage = () => {
  const _pv = useProductsVersion();
  const { user, profile } = useAuth();
  const { zone } = useLocation();
  const [walletBalance, setWalletBalance] = useState(0);
  const [hasReferralCode, setHasReferralCode] = useState(false);
  const [, force] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch wallet + referral state for SmartBanners
  useEffect(() => {
    if (!user) {
      setWalletBalance(0);
      setHasReferralCode(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [walletRes, refRes] = await Promise.all([
        supabase.from("wallet_balances").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("referral_codes").select("code").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setWalletBalance(Number(walletRes.data?.balance ?? 0));
      setHasReferralCode(!!refRes.data?.code);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (user?.id) void logBehavior({ event: "app_open", force: true });
  }, [user?.id]);

  const slot = (mounted ? getTimeSlot() : "breakfast") as ReturnType<typeof getTimeSlot>;
  const meta = slotMeta[slot];

  const zoneSafePool = useMemo(
    () => (zone.acceptsPerishables ? products : products.filter((p) => !isPerishable(p))),
    [zone.acceptsPerishables],
  );
  const recommended = useMemo(
    () => personalizedProducts(profile, { limit: 10, pool: zoneSafePool, slot }),
    [profile, zoneSafePool, slot],
  );
  const slotPicks = useMemo(
    () => productsForSlot(slot, 16).filter((p) => zone.acceptsPerishables || !isPerishable(p)).slice(0, 10),
    [slot, zone.acceptsPerishables],
  );
  const personalizedOffers = useMemo(() => smartOffers(profile, 10), [profile]);
  const buyAgain = useMemo(() => buyAgainProducts(zoneSafePool, 12), [zoneSafePool, mounted]);
  const trendingInZone = useMemo(
    () =>
      [...zoneSafePool]
        .filter((p) => (p.rating ?? 0) >= 4.6)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 10),
    [zoneSafePool],
  );

  return (
    <div
      className="space-y-6 pb-12"
      style={{ background: "var(--gradient-aurora)" }}
    >
      {/* SDUI HERO — admin-controlled order via /admin/design */}
      <LayoutFactory pageKey="main_hub" theme={storeThemes.homeTools} />

      {/* Contextual smart banners */}
      <SmartBanners walletBalance={walletBalance} hasReferralCode={hasReferralCode} />
      <LiveBanners placement="hero" />

      <InactivityNudger />
      <MegaEventBanner />
      <LoyaltyProgress />
      <FlashSalesRail />

      {/* BUY IT AGAIN */}
      {mounted && buyAgain.length > 0 && (
        <section style={cv}>
          <ProductCarousel
            title="اشترِ مجدداً"
            subtitle="منتجات اعتدت طلبها — أعدها بضغطة"
            accent="🛍️ سهل وسريع"
            products={buyAgain}
            seeAllTo="/account/orders"
          />
        </section>
      )}

      {/* Time-of-day smart section */}
      {mounted && (
        <section className="animate-float-up">
          <div
            className="relative overflow-hidden rounded-[1.5rem] p-4 shadow-soft"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary-soft)), hsl(var(--secondary)))",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-primary">{meta.emoji} {meta.subtitle}</p>
                <h2 className="mt-0.5 font-display text-xl font-extrabold text-foreground">{meta.title}</h2>
              </div>
              <Link to="/sections" className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-pill">
                {meta.cta}
              </Link>
            </div>
          </div>
          <div className="mt-3 -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory scroll-smooth">
            {slotPicks.slice(0, 8).map((p) => (
              <div key={p.id} className="w-40 shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {mounted && (
        <>
          <div style={cv}>
            <ProductCarousel title="مختارات لك" subtitle="بناءً على تفضيلاتك ووقتك" accent="✨ مخصص" products={recommended} seeAllTo="/sections" />
          </div>
          <div style={cv}>
            <ProductCarousel title="عروض ذكية" subtitle="خصومات تناسب ذوقك" accent="🔥 وفّر أكثر" products={personalizedOffers} seeAllTo="/offers" />
          </div>
          <div style={cv}>
            <ProductCarousel
              title={`رائج في ${zone.shortName}`}
              subtitle="الأكثر طلباً في منطقتك الآن"
              accent="📍 قريب منك"
              products={trendingInZone}
              seeAllTo="/sections"
            />
          </div>
        </>
      )}

      {/* Explore your way — quick discovery tiles */}
      <section className="animate-float-up" style={cv}>
        <h2 className="mb-3 px-1 font-display text-xl font-extrabold text-foreground">استكشف بطريقتك</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Sparkles, title: "مختارات لك", sub: "بناءً على تفضيلاتك", to: "/sections" },
            { icon: Clock,    title: "تحت 30 دقيقة", sub: "وجبات سريعة",       to: "/store/kitchen" },
            { icon: Flame,    title: "خصومات حارة",  sub: "حتى 40٪",          to: "/offers" },
            { icon: Award,    title: "الأعلى تقييمًا", sub: "من العملاء",        to: "/sections" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={i}
                to={c.to}
                className="glass-strong flex flex-col gap-2 rounded-2xl p-4 shadow-soft transition ease-apple hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="font-display text-sm font-extrabold text-foreground">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">{c.sub}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-1">
        <Link to="/sections" className="flex items-center gap-1 text-xs font-bold text-primary">
          استكشف كل الأقسام <ChevronLeft className="h-3 w-3" />
        </Link>
      </section>

      <p className="pt-2 text-center text-[11px] font-medium text-muted-foreground">
        ريف المدينة · عبق الريف داخل المدينة
      </p>
    </div>
  );
};

export default HomePage;
