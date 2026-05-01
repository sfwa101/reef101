/**
 * useHomeOrchestrator — single source of truth for the Home Goods
 * storefront page state.
 *
 * Owns:
 *   - search query, active category, fulfillment filter, sort, price cap
 *   - bottom-sheet (filters) + product detail overlay open state
 *   - derived: filtered list, best sellers, opened product, filtersActive flag
 *
 * Pure orchestration: NO data fetching today (catalog is static), no
 * side-effects beyond local state. The shape mirrors the original inline
 * logic exactly so swapping the legacy monolith is behaviourally a no-op.
 */
import { useMemo, useState } from "react";

import { CATALOG, BESTSELLER_IDS } from "../data";
import type {
  CatId,
  FulfillmentFilter,
  HGProduct,
  SortId,
} from "../types";

export type HomeOrchestrator = {
  // ─── primitive state ───
  cat: CatId;
  setCat: (c: CatId) => void;
  q: string;
  setQ: (q: string) => void;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  sort: SortId;
  setSort: (s: SortId) => void;
  fulFilter: FulfillmentFilter;
  setFulFilter: (f: FulfillmentFilter) => void;
  filtersOpen: boolean;
  setFiltersOpen: (b: boolean) => void;
  priceMax: number;
  setPriceMax: (n: number) => void;
  priceMaxAvail: number;

  // ─── derived ───
  filtered: HGProduct[];
  bestSellers: HGProduct[];
  opened: HGProduct | null;
  filtersActive: boolean;

  // ─── compound actions ───
  resetAll: () => void;
  resetFilters: () => void;
};

export const useHomeOrchestrator = (): HomeOrchestrator => {
  const [cat, setCat] = useState<CatId>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortId>("relevance");
  const [fulFilter, setFulFilter] = useState<FulfillmentFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const priceMaxAvail = useMemo(
    () => Math.max(...CATALOG.map((p) => p.price)),
    [],
  );
  const [priceMax, setPriceMax] = useState(priceMaxAvail);

  const filtered = useMemo(() => {
    const term = q.trim();
    let list = CATALOG.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (fulFilter !== "all" && p.fulfillment !== fulFilter) return false;
      if (p.price > priceMax) return false;
      if (!term) return true;
      return (
        p.name.includes(term) ||
        p.brand.includes(term) ||
        p.tagline.includes(term)
      );
    });
    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        list = [...list].sort((a, b) => {
          const da = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
          const db = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
          return db - da;
        });
        break;
      default:
        break;
    }
    return list;
  }, [cat, q, sort, fulFilter, priceMax]);

  const bestSellers = useMemo(
    () => CATALOG.filter((p) => BESTSELLER_IDS.includes(p.id)),
    [],
  );

  const opened = openId
    ? CATALOG.find((p) => p.id === openId) ?? null
    : null;

  const filtersActive =
    fulFilter !== "all" || priceMax < priceMaxAvail || sort !== "relevance";

  const resetFilters = () => {
    setFulFilter("all");
    setPriceMax(priceMaxAvail);
    setSort("relevance");
  };

  const resetAll = () => {
    setQ("");
    setFulFilter("all");
    setPriceMax(priceMaxAvail);
    setSort("relevance");
    setCat("all");
  };

  return {
    cat,
    setCat,
    q,
    setQ,
    openId,
    setOpenId,
    sort,
    setSort,
    fulFilter,
    setFulFilter,
    filtersOpen,
    setFiltersOpen,
    priceMax,
    setPriceMax,
    priceMaxAvail,
    filtered,
    bestSellers,
    opened,
    filtersActive,
    resetAll,
    resetFilters,
  };
};
