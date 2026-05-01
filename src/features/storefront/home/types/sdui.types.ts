/**
 * Phase 20 — Server-Driven UI types
 * ---------------------------------
 * Mirrors the `public.ui_layouts` table. The Admin ERP can edit
 * `section_order` (which sections render and in what order) and
 * `section_config` (per-section style/behaviour overrides) without
 * any code change — true Elementor-tier customisation.
 */

export type SectionKey =
  | "HeroBanner"
  | "CategoriesGrid"
  | "FlashDeals"
  | "BestSellersRail"
  | "BundlesRail"
  | "ProductsGrid"
  | "SearchAndFilters"
  // Phase 26 — Main Hub stem cells
  | "MainSearchHeader"
  | "StoryCircles"
  | "PromotionSlider"
  | "DepartmentGrid";

export type SectionConfig = {
  /** when false, the section is hidden even if listed in `section_order` */
  enabled?: boolean;
  /** Per-section style overrides — interpreted by individual sections. */
  variant?: string;
  padding?: "sm" | "md" | "lg";
  tone?: "primary" | "accent" | "info" | "success" | "warning" | "teal";
  sticky?: boolean;
  hue?: string;
  showTimer?: boolean;
  density?: "compact" | "comfortable" | "spacious";
};

export type UiLayout = {
  id: string;
  page_key: string;
  section_order: SectionKey[];
  section_config: Partial<Record<SectionKey, SectionConfig>>;
  is_active: boolean;
};
