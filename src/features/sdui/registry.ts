/**
 * SDUI Component Registry — single source of truth for editable customer
 * sections. The admin editor and the runtime render engine both consume
 * this registry. Adding a new editable section means:
 *   1. Build the React component.
 *   2. Register a renderer in `LayoutFactory`'s REGISTRY.
 *   3. Add a metadata entry here so the admin editor can list/edit it.
 *
 * No arbitrary HTML, no string-eval — only props the registry approves.
 */
import type { SectionKey } from "@/features/storefront/home/types/sdui.types";

export type PageKey = "main_hub" | "home" | "sections" | "offers";

export type AllowedOverride =
  | "padding"
  | "tone"
  | "density"
  | "title"
  | "showTimer"
  | "sticky";

export type SectionMeta = {
  key: SectionKey;
  /** Arabic display label shown in the editor */
  label: string;
  /** One-line description for the editor */
  description: string;
  /** Which pages this section may appear on */
  pages: PageKey[];
  /** Default title — admin can override */
  defaultTitle?: string;
  /** Which style/behaviour overrides the editor exposes */
  allowedOverrides: AllowedOverride[];
  /** Lucide icon name (optional, for editor list) */
  iconKey?: string;
};

export const PAGE_LABELS: Record<PageKey, string> = {
  main_hub: "الواجهة الرئيسية (Hero)",
  home: "الصفحة الرئيسية (الكاملة)",
  sections: "صفحة الأقسام",
  offers: "صفحة العروض",
};

/** Default section order used when seeding a new page. */
export const DEFAULT_PAGE_ORDER: Record<PageKey, SectionKey[]> = {
  main_hub: ["MainSearchHeader", "StoryCircles", "PromotionSlider", "DepartmentGrid"],
  home: [
    "HeroBanner",
    "SearchAndFilters",
    "CategoriesGrid",
    "BundlesRail",
    "BestSellersRail",
    "ProductsGrid",
  ],
  sections: ["CategoriesGrid", "ProductsGrid"],
  offers: ["BundlesRail", "BestSellersRail", "ProductsGrid"],
};

export const SECTION_REGISTRY: Record<SectionKey, SectionMeta> = {
  // ---------- Main Hub stem cells ----------
  MainSearchHeader: {
    key: "MainSearchHeader",
    label: "ترويسة البحث الرئيسية",
    description: "شريط البحث وعنوان الترحيب أعلى الواجهة",
    pages: ["main_hub"],
    allowedOverrides: ["padding", "sticky"],
    iconKey: "Search",
  },
  StoryCircles: {
    key: "StoryCircles",
    label: "دوائر القصص",
    description: "دوائر تبرز المتاجر والعروض الجديدة",
    pages: ["main_hub"],
    allowedOverrides: ["padding"],
    iconKey: "Circle",
  },
  PromotionSlider: {
    key: "PromotionSlider",
    label: "شريط العروض",
    description: "بانر إعلاني متحرك أعلى الصفحة",
    pages: ["main_hub", "offers"],
    allowedOverrides: ["padding", "tone"],
    iconKey: "Image",
  },
  DepartmentGrid: {
    key: "DepartmentGrid",
    label: "شبكة الأقسام",
    description: "بطاقات الأقسام (سوبر ماركت، صيدلية، …)",
    pages: ["main_hub", "home"],
    allowedOverrides: ["padding", "density"],
    iconKey: "Grid3x3",
  },

  // ---------- Storefront sections ----------
  HeroBanner: {
    key: "HeroBanner",
    label: "البانر الرئيسي",
    description: "بطاقة العرض الترحيبية الكبيرة",
    pages: ["home"],
    allowedOverrides: ["padding", "tone", "title"],
    iconKey: "Crown",
  },
  SearchAndFilters: {
    key: "SearchAndFilters",
    label: "البحث والفلاتر",
    description: "شريط البحث + الفرز + الفلاتر",
    pages: ["home", "sections"],
    allowedOverrides: ["padding", "sticky"],
    iconKey: "Filter",
  },
  CategoriesGrid: {
    key: "CategoriesGrid",
    label: "شبكة الفئات",
    description: "تبويبات/فئات قابلة للنقر",
    pages: ["home", "sections"],
    allowedOverrides: ["padding", "density", "title"],
    iconKey: "Grid2x2",
  },
  BundlesRail: {
    key: "BundlesRail",
    label: "الحزم والعروض",
    description: "شريط أفقي للحزم والباقات",
    pages: ["home", "offers"],
    allowedOverrides: ["padding", "tone", "title"],
    iconKey: "Package",
  },
  BestSellersRail: {
    key: "BestSellersRail",
    label: "الأكثر مبيعاً",
    description: "شريط المنتجات الأكثر مبيعاً",
    pages: ["home", "offers"],
    allowedOverrides: ["padding", "tone", "title"],
    iconKey: "Flame",
  },
  ProductsGrid: {
    key: "ProductsGrid",
    label: "شبكة المنتجات",
    description: "شبكة المنتجات الرئيسية المتجاوبة",
    pages: ["home", "sections", "offers"],
    allowedOverrides: ["padding", "density", "title"],
    iconKey: "LayoutGrid",
  },
  FlashDeals: {
    key: "FlashDeals",
    label: "العروض السريعة",
    description: "عداد + عروض محدودة بزمن",
    pages: ["home", "offers"],
    allowedOverrides: ["padding", "tone", "showTimer", "title"],
    iconKey: "Zap",
  },
};

/** Ordered list of sections registered for a given page. */
export function sectionsForPage(page: PageKey): SectionMeta[] {
  return Object.values(SECTION_REGISTRY).filter((m) => m.pages.includes(page));
}

/** Whitelist a config object to only include keys allowed by the registry. */
export function sanitizeSectionConfig(
  key: SectionKey,
  cfg: Record<string, unknown>,
): Record<string, unknown> {
  const meta = SECTION_REGISTRY[key];
  if (!meta) return {};
  const allowed = new Set<string>(["enabled", ...meta.allowedOverrides]);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (allowed.has(k)) out[k] = v;
  }
  return out;
}

export const PADDING_CLASS: Record<NonNullable<import("@/features/storefront/home/types/sdui.types").SectionConfig["padding"]>, string> = {
  sm: "py-2",
  md: "py-4",
  lg: "py-8",
};

export const TONE_CLASS: Record<NonNullable<import("@/features/storefront/home/types/sdui.types").SectionConfig["tone"]>, string> = {
  primary: "bg-primary/5",
  accent:  "bg-[hsl(var(--accent))]/5",
  info:    "bg-info/5",
  success: "bg-success/5",
  warning: "bg-warning/5",
  teal:    "bg-[hsl(var(--teal))]/5",
};
