import { useMemo, useState } from "react";
import { MapPin, Search, Sparkles } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import RestaurantBlock from "@/components/restaurants/RestaurantBlock";
import { storeThemes } from "@/lib/storeThemes";
import { restaurants as ALL_RESTAURANTS } from "@/lib/restaurants";
import { useLocation } from "@/context/LocationContext";

const Restaurants = () => {
  const theme = storeThemes.restaurants;
  const { zone } = useLocation();
  const [query, setQuery] = useState("");

  // Split into "available in your zone" vs "soon" so user always sees the list
  const { available, comingSoon } = useMemo(() => {
    const q = query.trim();
    const matchSearch = (name: string, tagline: string) =>
      !q || name.includes(q) || tagline.includes(q);
    const available = ALL_RESTAURANTS.filter(
      (r) => r.servesZones.includes(zone.id) && matchSearch(r.name, r.tagline),
    );
    const comingSoon = ALL_RESTAURANTS.filter(
      (r) => !r.servesZones.includes(zone.id) && matchSearch(r.name, r.tagline),
    );
    return { available, comingSoon };
  }, [zone.id, query]);

  return (
    <div className="space-y-4 pb-12">
      <BackHeader
        title="مجمع المطاعم"
        subtitle="ألذ الوجبات من أفضل مطاعم المدينة"
        accent="مطاعم"
        themeKey="restaurants"
      />

      {/* Hero */}
      <section
        className="rounded-[1.75rem] p-5 shadow-tile"
        style={{ background: theme.gradient }}
      >
        <span className="text-[10px] font-bold text-foreground/80">مجمع ذكي · توصيل موحّد</span>
        <h2 className="font-display text-2xl font-extrabold text-foreground">طعمك المفضّل</h2>
        <p className="mt-1 text-xs text-foreground/70">
          اطلب من أكثر من مطعم في نفس السلة — نوصل لباب البيت
        </p>
      </section>

      {/* Zone bar */}
      <div className="flex items-center gap-2 rounded-2xl bg-primary-soft px-4 py-2.5 ring-1 ring-primary/15">
        <MapPin className="h-4 w-4 text-primary" />
        <p className="flex-1 text-[12px] font-extrabold text-foreground">
          مطاعم مجهّزة للتوصيل إلى:{" "}
          <span className="text-primary">{zone.name}</span>
        </p>
        <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-extrabold text-muted-foreground">
          {available.length} مطعم
        </span>
      </div>

      {/* Search */}
      <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.4} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن مطعم أو نوع مطبخ…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Available list */}
      {available.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display text-base font-extrabold">
              يوصّل لمنطقتك
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
              <Sparkles className="h-3 w-3" /> كاش باك على المحفظة
            </span>
          </div>
          {available.map((r) => (
            <RestaurantBlock key={r.id} restaurant={r} />
          ))}
        </section>
      ) : (
        <section className="rounded-[1.75rem] bg-card p-6 text-center shadow-soft ring-1 ring-border/40">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-display text-base font-extrabold">
            نعمل على جلب أفضل المطاعم لمنطقتك قريباً!
          </h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            حالياً لا توجد مطاعم تخدم {zone.name}، لكن المطاعم أدناه ستصل قريبًا.
          </p>
        </section>
      )}

      {/* Coming soon */}
      {comingSoon.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-1 font-display text-base font-extrabold text-muted-foreground">
            قريبًا في منطقتك
          </h3>
          {comingSoon.map((r) => (
            <RestaurantBlock key={r.id} restaurant={r} unavailable />
          ))}
        </section>
      )}
    </div>
  );
};
export default Restaurants;