// Offline / network-failure fallback catalog.
// ----------------------------------------------------
// Used ONLY when the Supabase `products` query fails (network error,
// auth issue, cold start). The list is intentionally tiny and covers
// the storefront's most-visited surfaces so the UI never renders empty.
// Real catalog lives in the database; this is a graceful-degradation seed.

import type { Product } from "./products";

const FALLBACK_IMG =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3C/svg%3E";

export const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "fb-sm-rice",
    name: "أرز الضحى أبيض",
    brand: "الضحى",
    unit: "كيلو",
    price: 38,
    image: FALLBACK_IMG,
    category: "غذائية أساسية",
    source: "supermarket",
  },
  {
    id: "fb-sm-oil",
    name: "زيت عباد الشمس",
    brand: "هلا",
    unit: "لتر",
    price: 75,
    image: FALLBACK_IMG,
    category: "غذائية أساسية",
    source: "supermarket",
  },
  {
    id: "fb-sm-sugar",
    name: "سكر أبيض ناعم",
    unit: "كيلو",
    price: 32,
    image: FALLBACK_IMG,
    category: "غذائية أساسية",
    source: "supermarket",
  },
  {
    id: "fb-dairy-milk",
    name: "حليب طازج جهينة",
    brand: "جهينة",
    unit: "لتر",
    price: 42,
    image: FALLBACK_IMG,
    category: "ألبان",
    source: "dairy",
    perishable: true,
  },
  {
    id: "fb-prod-tomato",
    name: "طماطم بلدي",
    unit: "كيلو",
    price: 18,
    image: FALLBACK_IMG,
    category: "خضروات",
    source: "produce",
    perishable: true,
  },
];
