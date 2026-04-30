import { Search, MapPin, Sparkles, Clock, Flame, Award, ChevronLeft, ChevronDown, Plus, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProductCarousel from "@/components/ProductCarousel";
import ProductCard from "@/components/ProductCard";
import { products, isPerishable, useProductsVersion } from "@/lib/products";
import {
  getSmartGreeting,
  getTimeSlot,
  getWelcomeLine,
  personalizedProducts,
  productsForSlot,
  rankCategoriesForProfile,
  SEARCH_PLACEHOLDERS,
  slotMeta,
  smartOffers,
} from "@/lib/personalize";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SmartBanners from "@/components/SmartBanners";
import TypewriterPlaceholder from "@/components/TypewriterPlaceholder";
import ReefStories from "@/components/ReefStories";
import PromoCarousel from "@/components/PromoCarousel";
import MiniStoreGrid from "@/components/MiniStoreGrid";
import FlashSalesRail from "@/components/FlashSalesRail";
import MegaEventBanner from "@/components/MegaEventBanner";
import LoyaltyProgress from "@/components/LoyaltyProgress";
import InactivityNudger from "@/components/InactivityNudger";
import { buyAgainProducts } from "@/lib/buyAgain";
import { useLocation } from "@/context/LocationContext";
import { logBehavior, fetchCategoryAffinity } from "@/lib/behavior";

import tileSupermarket from "@/assets/tile-supermarket.jpg";
import tileKitchen from "@/assets/tile-kitchen.jpg";
import tileRecipes from "@/assets/tile-recipes.jpg";
import tileWholesale from "@/assets/tile-wholesale.jpg";
import tileDairy from "@/assets/tile-dairy.jpg";
import tileProduce from "@/assets/tile-produce.jpg";
import tileSubscription from "@/assets/tile-subscription.jpg";
import tileLibrary from "@/assets/tile-library.jpg";
import tilePharmacy from "@/assets/tile-pharmacy.jpg";
import tileHome from "@/assets/tile-home.jpg";

const quickShortcuts = [
  { id: "supermarket", title: "السوبرماركت", img: tileSupermarket, to: "/store/supermarket" },
  { id: "kitchen", title: "مطبخ ريف", img: tileKitchen, to: "/store/kitchen" },
  { id: "recipes", title: "وصفات الشيف", img: tileRecipes, to: "/store/recipes" },
  { id: "wholesale", title: "ريف الجملة", img: tileWholesale, to: "/store/wholesale" },
];

const allStores = [
  { id: "supermarket", title: "السوبرماركت", img: tileSupermarket, to: "/store/supermarket", emoji: "🛒", tint: "142 50% 92%" },
  { id: "produce",     title: "خضار وفاكهة",   img: tileProduce,     to: "/store/produce",     emoji: "🥬", tint: "100 55% 90%" },
  { id: "dairy",       title: "الألبان",       img: tileDairy,       to: "/store/dairy",       emoji: "🥛", tint: "210 70% 94%" },
  { id: "kitchen",     title: "مطبخ ريف",      img: tileKitchen,     to: "/store/kitchen",     emoji: "🍳", tint: "30 85% 92%" },
  { id: "recipes",     title: "وصفات الشيف",   img: tileRecipes,     to: "/store/recipes",     emoji: "👨‍🍳", tint: "265 70% 94%" },
  { id: "subscription",title: "الاشتراكات",    img: tileSubscription,to: "/store/subscription",emoji: "📦", tint: "175 55% 90%" },
  { id: "wholesale",   title: "ريف الجملة",    img: tileWholesale,   to: "/store/wholesale",   emoji: "🏷️", tint: "36 80% 90%" },
  { id: "pharmacy",    title: "الصيدلية",      img: tilePharmacy,    to: "/store/pharmacy",    emoji: "💊", tint: "200 70% 94%" },
  { id: "library",     title: "مكتبة الطلبة",  img: tileLibrary,     to: "/store/library",     emoji: "📚", tint: "50 80% 90%" },
  { id: "home",        title: "الأدوات المنزلية", img: tileHome,    to: "/store/home",        emoji: "🏠", tint: "330 70% 94%" },
];

type Addr = {
  id: string;
  label: string;
  city: string;
  district: string | null;
  is_default: boolean;
};

// content-visibility helper for offscreen heavy sections (60fps scroll)
const cv = { contentVisibility: "auto" as const, containIntrinsicSize: "1px 360px" };

const HomePage = () => {
  const _pv = useProductsVersion();
  const { user, profile } = useAuth();
  const { zone } = useLocation();
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [activeAddrId, setActiveAddrId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [hasReferralCode, setHasReferralCode] = useState(false);
  const [, force] = useState(0);
  // SSR-safe: time-based copy only renders after hydration to avoid mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Re-evaluate time-based content every 5 min
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) {
      setAddresses([]); setActiveAddrId(null);
      setWalletBalance(0); setHasReferralCode(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [addrRes, walletRes, refRes] = await Promise.all([
        supabase
          .from("addresses")
          .select("id,label,city,district,is_default")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false }),
        supabase
          .from("wallet_balances")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("referral_codes")
          .select("code")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      const addrs = (addrRes.data as Addr[] | null) ?? [];
      setAddresses(addrs);
      const def = addrs.find((a) => a.is_default) ?? addrs[0];
      setActiveAddrId(def?.id ?? null);
      setWalletBalance(Number(walletRes.data?.balance ?? 0));
      setHasReferralCode(!!refRes.data?.code);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const setDefault = async (id: string) => {
    if (!user) return;
    setActiveAddrId(id);
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  };

  const activeAddr = addresses.find((a) => a.id === activeAddrId);
  const locationLabel = activeAddr
    ? [activeAddr.district, activeAddr.city].filter(Boolean).join("، ")
    : "حدد عنوان التوصيل";

  const greetingName = profile?.full_name?.split(" ")[0];
  const greeting = mounted ? getSmartGreeting() : "أهلًا بك";
  const welcome = mounted ? getWelcomeLine() : "تسوّق ما يناسب يومك";
  // Use a fixed slot during SSR/first render to avoid hydration mismatch.
  const slot = (mounted ? getTimeSlot() : "breakfast") as ReturnType<typeof getTimeSlot>;
  const meta = slotMeta[slot];

  // Filter out perishables for far zones so we don't tease the user
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
  const trending = useMemo(
    () => personalizedProducts(profile, { limit: 10, pool: zoneSafePool.filter((p) => p.badge === "trending" || p.badge === "best"), slot }),
    [profile, zoneSafePool, slot],
  );
  const newForYou = useMemo(
    () => personalizedProducts(profile, { limit: 10, pool: zoneSafePool.filter((p) => p.badge === "new" || p.badge === "premium"), slot }),
    [profile, zoneSafePool, slot],
  );

  // Buy-it-again — pulled from local interaction history
  const buyAgain = useMemo(
    () => buyAgainProducts(zoneSafePool, 12),
    [zoneSafePool, mounted],
  );

  // Trending in your zone — bias top-rated/best products available locally
  const trendingInZone = useMemo(() => {
    return [...zoneSafePool]
      .filter((p) => (p.rating ?? 0) >= 4.6)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 10);
  }, [zoneSafePool]);

  // Smart category ordering (and zone-aware availability)
  const baseRanks = useMemo(() => rankCategoriesForProfile(profile), [profile]);
  const [behaviorRanks, setBehaviorRanks] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!user?.id) return;
    void logBehavior({ event: "app_open", force: true });
    fetchCategoryAffinity(user.id).then((cats) => {
      const map: Record<string, number> = {};
      cats.forEach((c, i) => { map[c] = (cats.length - i) * 5; });
      setBehaviorRanks(map);
    });
  }, [user?.id]);
  const categoryRanks = useMemo(() => {
    const merged: Record<string, number> = { ...baseRanks };
    Object.entries(behaviorRanks).forEach(([k, v]) => {
      merged[k] = (merged[k] ?? 0) + v;
    });
    return merged;
  }, [baseRanks, behaviorRanks]);
  const PERISHABLE_STORE_IDS = new Set(["produce", "dairy", "kitchen", "recipes"]);
  const sortedStores = useMemo(() => {
    return [...allStores]
      .map((s) => ({
        ...s,
        unavailable: !zone.acceptsPerishables && PERISHABLE_STORE_IDS.has(s.id),
        rank: categoryRanks[s.id] ?? 0,
      }))
      .sort((a, b) => {
        // Available first, then by rank desc
        if (a.unavailable !== b.unavailable) return a.unavailable ? 1 : -1;
        return b.rank - a.rank;
      });
  }, [categoryRanks, zone.acceptsPerishables]);
  const sortedShortcuts = useMemo(() => {
    return [...quickShortcuts].sort(
      (a, b) => (categoryRanks[b.id] ?? 0) - (categoryRanks[a.id] ?? 0),
    );
  }, [categoryRanks]);

  return (
    <div className="space-y-7">
      <section className="animate-float-up">
        <Popover>
          <PopoverTrigger asChild>
            <button className="group flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" strokeWidth={2.4} />
              <span>التوصيل إلى</span>
              <span className="font-bold text-foreground">{locationLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition group-hover:text-primary" strokeWidth={2.4} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 rounded-2xl p-2" dir="rtl">
            {addresses.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                لا توجد عناوين محفوظة بعد
              </div>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-auto">
                {addresses.map((a) => {
                  const active = a.id === activeAddrId;
                  return (
                    <li key={a.id}>
                      <button
                        onClick={() => setDefault(a.id)}
                        className={`flex w-full items-start gap-2 rounded-xl px-3 py-2 text-right transition ${
                          active ? "bg-primary/10" : "hover:bg-muted"
                        }`}
                      >
                        <MapPin className={`mt-0.5 h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2.2} />
                        <span className="flex-1">
                          <span className="block text-sm font-bold text-foreground">{a.label}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {[a.district, a.city].filter(Boolean).join("، ")}
                          </span>
                        </span>
                        {active && <Check className="h-4 w-4 text-primary" strokeWidth={2.4} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-1 border-t border-border pt-1">
              <Link
                to="/account/addresses"
                className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                إضافة عنوان جديد
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-balance">
          {greeting}
          {greetingName ? <span className="text-primary"> {greetingName}</span> : null}،
          <br />
          <span className="text-muted-foreground text-2xl font-bold">{welcome}</span>
        </h1>
      </section>

      {/* Floating premium search */}
      <Link
        to="/search"
        search={{ q: "" }}
        className="glass-strong flex w-full items-center gap-3 rounded-3xl px-5 py-4 text-right shadow-float ring-1 ring-border/60 animate-float-up transition active:scale-[0.99]"
        style={{ animationDelay: "60ms" }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Search className="h-4 w-4" strokeWidth={2.6} />
        </span>
        <TypewriterPlaceholder
          options={SEARCH_PLACEHOLDERS}
          className="text-[13.5px] font-medium text-muted-foreground"
        />
      </Link>

      {/* Reef Stories — Instagram-style discovery rail */}
      <ReefStories />

      {/* Smart contextual banners (wallet / referral) */}
      <SmartBanners walletBalance={walletBalance} hasReferralCode={hasReferralCode} />

      {/* Hero Slider — pure CSS mesh gradients, zero images */}
      <PromoCarousel />

      <InactivityNudger />
      <MegaEventBanner />
      <LoyaltyProgress />
      <FlashSalesRail />

      {/* BUY IT AGAIN — only when we have history */}
      {mounted && buyAgain.length > 0 && (
        <section style={{ contentVisibility: "auto", containIntrinsicSize: "1px 320px" }}>
          <ProductCarousel
            title="اشترِ مجدداً"
            subtitle="منتجات اعتدت طلبها — أعدها بضغطة"
            accent="🛍️ سهل وسريع"
            products={buyAgain}
            seeAllTo="/account/orders"
          />
        </section>
      )}

      <section className="animate-float-up" style={{ animationDelay: "160ms" }}>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar snap-x snap-mandatory scroll-smooth">
          {sortedShortcuts.map((s) => (
            <Link
              key={s.id}
              to={s.to}
              className="group relative flex h-24 w-32 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl shadow-soft tile-overlay transition active:scale-[0.98]"
            >
              <img src={s.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <span className="relative z-10 p-2.5 font-display text-sm font-bold text-white drop-shadow">
                {s.title}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Time-of-day smart section — client-only to avoid SSR slot mismatch */}
      {mounted && (
      <section className="animate-float-up">
        <div
          className="relative overflow-hidden rounded-[1.5rem] p-4 shadow-soft"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary-soft)), hsl(var(--secondary)))",
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

      {/* Wrap below-fold rails in content-visibility:auto so the browser
          skips painting offscreen sections — keeps scroll at 60fps.
          Gate slot-dependent rails behind `mounted` to avoid SSR/CSR drift. */}
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
          <div style={cv}>
            <ProductCarousel title="رائج لك" accent="📈 الأعلى تفاعلًا" products={trending} seeAllTo="/sections" />
          </div>
          <div style={cv}>
            <ProductCarousel title="جديد ومميز لك" accent="⭐ مختار" products={newForYou} seeAllTo="/sections" />
          </div>
        </>
      )}

      <section className="animate-float-up" style={cv}>
        <h2 className="mb-3 px-1 font-display text-xl font-extrabold text-foreground">استكشف بطريقتك</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Sparkles, title: "مختارات لك", sub: "بناءً على تفضيلاتك", to: "/sections" },
            { icon: Clock, title: "تحت 30 دقيقة", sub: "وجبات سريعة", to: "/store/kitchen" },
            { icon: Flame, title: "خصومات حارة", sub: "حتى 40٪", to: "/offers" },
            { icon: Award, title: "الأعلى تقييمًا", sub: "من العملاء", to: "/sections" },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <Link key={i} to={c.to} className="glass-strong flex flex-col gap-2 rounded-2xl p-4 shadow-soft transition ease-apple hover:-translate-y-0.5 active:scale-[0.98]">
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

      <section style={cv}>
        <h2 className="mb-3 px-1 font-display text-xl font-extrabold text-foreground">يناسبك الآن</h2>
        <div className="grid grid-cols-2 gap-3.5">
          {recommended.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="font-display text-xl font-extrabold text-foreground">أقسام المتجر</h2>
          <Link to="/sections" className="flex items-center gap-1 text-xs font-bold text-primary">
            الكل <ChevronLeft className="h-3 w-3" />
          </Link>
        </div>
        <MiniStoreGrid
          items={sortedStores.map((s) => ({
            id: s.id,
            title: s.title,
            emoji: s.emoji,
            to: s.to,
            tint: s.tint,
            unavailable: s.unavailable,
          }))}
        />
      </section>

      <p className="pt-4 text-center text-[11px] font-medium text-muted-foreground">
        ريف المدينة · عبق الريف داخل المدينة
      </p>
    </div>
  );
};

export default HomePage;