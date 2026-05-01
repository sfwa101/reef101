/**
 * Home (Home Goods storefront) — aggregator shell.
 *
 * After the Phase 14 decomposition, this file is intentionally tiny: it
 * orchestrates layout only. All state lives in `useHomeOrchestrator`,
 * all visuals live in `src/features/storefront/home/components/*`.
 *
 * Behaviour parity is 1:1 with the previous monolith — no new features,
 * no removed features.
 *
 * Accessibility: the page reads `viewMode` from `UIContext` and mirrors
 * it onto its root container as `data-view-mode`, so descendant components
 * can opt-in to simplified-mode CSS overrides via a single semantic
 * selector (`[data-view-mode="simplified"] …`) without prop drilling.
 * The same attribute already exists on `<html>` (set by `UIProvider`) —
 * having it on this shell makes the contract explicit at the page boundary.
 */
import BackHeader from "@/components/BackHeader";
import { useUI } from "@/context/UIContext";
import { storeThemes } from "@/lib/storeThemes";

import { BestSellersRail } from "@/features/storefront/home/components/BestSellersRail";
import { BundlesRail } from "@/features/storefront/home/components/BundlesRail";
import { CategoriesGrid } from "@/features/storefront/home/components/CategoriesGrid";
import { CompareBar } from "@/features/storefront/home/components/CompareBar";
import { DetailSheet } from "@/features/storefront/home/components/DetailSheet";
import { FiltersSheet } from "@/features/storefront/home/components/FiltersSheet";
import { HeroBanner } from "@/features/storefront/home/components/HeroBanner";
import { ProductsGrid } from "@/features/storefront/home/components/ProductsGrid";
import { SearchAndFilters } from "@/features/storefront/home/components/SearchAndFilters";
import { useHomeOrchestrator } from "@/features/storefront/home/hooks/useHomeOrchestrator";

const HomeStore = () => {
  const theme = storeThemes.homeTools;
  const { viewMode } = useUI();
  const o = useHomeOrchestrator();

  const showRails = o.cat === "all" && !o.q;

  return (
    <div
      data-view-mode={viewMode}
      className="min-h-screen pb-32"
      style={{
        background: `linear-gradient(180deg, hsl(${theme.soft}) 0%, hsl(var(--background)) 320px)`,
      }}
    >
      <BackHeader title="الأدوات المنزلية" />

      <HeroBanner theme={theme} />

      <SearchAndFilters
        q={o.q}
        setQ={o.setQ}
        filtersActive={o.filtersActive}
        onOpenFilters={() => o.setFiltersOpen(true)}
        fulFilter={o.fulFilter}
        setFulFilter={o.setFulFilter}
        sort={o.sort}
        setSort={o.setSort}
        hue={theme.hue}
      />

      <CategoriesGrid cat={o.cat} setCat={o.setCat} hue={theme.hue} />

      {showRails && <BundlesRail hue={theme.hue} />}
      {showRails && (
        <BestSellersRail
          items={o.bestSellers}
          hue={theme.hue}
          onOpen={(id) => o.setOpenId(id)}
        />
      )}

      <ProductsGrid
        cat={o.cat}
        filtered={o.filtered}
        hue={theme.hue}
        onOpen={(id) => o.setOpenId(id)}
        onResetAll={o.resetAll}
      />

      <CompareBar />

      {o.filtersOpen && (
        <FiltersSheet
          sort={o.sort}
          setSort={o.setSort}
          priceMax={o.priceMax}
          setPriceMax={o.setPriceMax}
          priceMaxAvail={o.priceMaxAvail}
          fulFilter={o.fulFilter}
          setFulFilter={o.setFulFilter}
          onClose={() => o.setFiltersOpen(false)}
          onReset={o.resetFilters}
          hue={theme.hue}
        />
      )}

      {o.opened && (
        <DetailSheet
          product={o.opened}
          onClose={() => o.setOpenId(null)}
        />
      )}
    </div>
  );
};

export default HomeStore;
