/**
 * Home Storefront — domain types.
 *
 * Pure type definitions extracted from the legacy `pages/store/Home.tsx`
 * monolith. No runtime, no React. Safe to import anywhere.
 */

export type CatId = "all" | "majors" | "small" | "kitchen" | "clean" | "decor";

export type Fulfillment = "instant" | "preorder";

export type HGProduct = {
  id: string;
  name: string;
  brand: string;
  unit: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: CatId;
  fulfillment: Fulfillment;
  /** for preorder */
  depositPct?: number;
  etaDays?: number;
  tagline: string;
  badges: string[];
  warranty?: string;
};

export type Bundle = {
  id: string;
  title: string;
  desc: string;
  itemIds: string[];
  bundlePrice: number;
  badge: string;
};

export type SortId =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "discount";

export type FulfillmentFilter = "all" | "instant" | "preorder";
