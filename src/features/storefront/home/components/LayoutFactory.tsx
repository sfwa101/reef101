/**
 * LayoutFactory — Phase 20 Server-Driven UI renderer.
 * ---------------------------------------------------
 * Reads the `ui_layouts` row for a given `page_key` and renders the
 * registered sections in the DB-defined order. Unknown sections (e.g.
 * a future "FlashDeals" listed in the DB before the component ships)
 * are silently skipped, never breaking the page.
 *
 * The factory is intentionally PURE PRESENTATION:
 *   - no fetching of product data (the orchestrator owns that)
 *   - no business logic
 *   - just wiring DB metadata → JSX
 *
 * To add an Elementor-style section: register a renderer in `REGISTRY`,
 * push the key into the seed migration's `section_order`, and a future
 * Admin UI can re-order without code changes.
 */
import type { ReactElement } from "react";
import { BestSellersRail } from "./BestSellersRail";
import { BundlesRail } from "./BundlesRail";
import { CategoriesGrid } from "./CategoriesGrid";
import { HeroBanner } from "./HeroBanner";
import { ProductsGrid } from "./ProductsGrid";
import { SearchAndFilters } from "./SearchAndFilters";
import { useUiLayout } from "../hooks/useUiLayout";
import type { SectionConfig, SectionKey } from "../types/sdui.types";
import type { HomeOrchestrator } from "../hooks/useHomeOrchestrator";
import type { CatId } from "../types";
import { SectionFrame } from "@/features/sdui/SectionFrame";

// Phase 26 — Main Hub stem cells (orchestrator-free, self-contained)
import { MainSearchHeader } from "@/features/main-hub/components/MainSearchHeader";
import { StoryCircles } from "@/features/main-hub/components/StoryCircles";
import { PromotionSlider } from "@/features/main-hub/components/PromotionSlider";
import { DepartmentGrid } from "@/features/main-hub/components/DepartmentGrid";

type FactoryContext = {
  /** Orchestrator is optional — Main Hub sections don't need it. */
  orchestrator: HomeOrchestrator | null;
  theme: { hue: string; ink: string; soft: string; gradient: string };
  showRails: boolean;
};

type SectionRenderer = (ctx: FactoryContext, cfg: SectionConfig) => ReactElement | null;

const REGISTRY: Partial<Record<SectionKey, SectionRenderer>> = {
  HeroBanner: ({ theme }) => <HeroBanner theme={theme} />,
  SearchAndFilters: ({ orchestrator: o, theme }) =>
    o ? (
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
    ) : null,
  CategoriesGrid: ({ orchestrator: o, theme }) =>
    o ? <CategoriesGrid cat={o.cat} setCat={o.setCat} hue={theme.hue} /> : null,
  BundlesRail: ({ theme, showRails }) =>
    showRails ? <BundlesRail hue={theme.hue} /> : null,
  BestSellersRail: ({ orchestrator: o, theme, showRails }) =>
    showRails && o ? (
      <BestSellersRail
        items={o.bestSellers}
        hue={theme.hue}
        onOpen={(id) => o.setOpenId(id)}
      />
    ) : null,
  ProductsGrid: ({ orchestrator: o, theme }) =>
    o ? (
      <ProductsGrid
        cat={o.cat as CatId}
        filtered={o.filtered}
        hue={theme.hue}
        onOpen={(id) => o.setOpenId(id)}
        onResetAll={o.resetAll}
      />
    ) : null,

  // Phase 26 — Main Hub (no orchestrator dependency)
  MainSearchHeader: () => <MainSearchHeader />,
  StoryCircles: () => <StoryCircles />,
  PromotionSlider: () => <PromotionSlider />,
  DepartmentGrid: () => <DepartmentGrid />,
};

export const LayoutFactory = ({
  pageKey,
  orchestrator = null,
  theme,
}: {
  pageKey: string;
  orchestrator?: HomeOrchestrator | null;
  theme: { hue: string; ink: string; soft: string; gradient: string };
}) => {
  const { layout } = useUiLayout(pageKey);
  if (!layout) return null;

  const showRails = orchestrator
    ? orchestrator.cat === "all" && !orchestrator.q
    : true;
  const ctx: FactoryContext = { orchestrator, theme, showRails };

  return (
    <>
      {layout.section_order.map((key, idx) => {
        const cfg = layout.section_config?.[key] ?? {};
        if (cfg.enabled === false) return null;
        const Render = REGISTRY[key];
        if (!Render) return null; // gracefully skip unknown sections
        const node = Render(ctx, cfg);
        if (!node) return null;
        const customTitle = layout.section_titles?.[key] ?? null;
        return (
          <SectionFrame key={`${key}-${idx}`} cfg={cfg} customTitle={customTitle}>
            {node}
          </SectionFrame>
        );
      })}
    </>
  );
};

