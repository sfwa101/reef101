/**
 * Smart Food Court — Multi-Vendor Hub
 * -----------------------------------
 * Mock restaurant directory used by the Restaurants page (brand-blocks UI),
 * the multi-vendor cart segmentation, and the per-vendor WhatsApp routing
 * at checkout time.
 *
 * Each restaurant is linked to existing menu items via `productIds` that
 * resolve against the global `products` array (source = "restaurants").
 */
import type { ZoneId } from "@/lib/geoZones";

export type Restaurant = {
  id: string;
  /** Display name (Arabic) */
  name: string;
  /** Cuisine tag shown next to the rating */
  tagline: string;
  /** 1-letter logo monogram (used by the generated SVG logo) */
  monogram: string;
  /** Star rating 0–5 */
  rating: number;
  /** Review count for the rating chip */
  reviews: number;
  /** Brand HSL color used for the gradient header — "h s% l%" (no hsl() wrapper) */
  brandHue: string;
  /** Soft tint (lighter) used as the second gradient stop */
  brandSoft: string;
  /** Average prep + dispatch label */
  etaLabel: string;
  /** Minimum order in EGP */
  minOrder: number;
  /** Cashback % credited to wallet when paying with the smart wallet */
  cashbackPct: number;
  /** Commission % the platform takes from each order (used in routing message) */
  commissionPct: number;
  /** Zones this restaurant delivers to */
  servesZones: ZoneId[];
  /** WhatsApp number for the restaurant management (digits only, no +) */
  whatsapp: string;
  /** Best-seller product ids (resolve from `products.ts`) */
  productIds: string[];
  /** Catchy tagline shown on the brand banner CTA area */
  hook?: string;
  /** Categorised full menu used by the restaurant detail page */
  menu?: { id: string; label: string; productIds: string[] }[];
};

/**
 * NOTE: The product ids below are picked from the existing `restaurants`
 * source items in `src/lib/products.ts`. We intentionally let several
 * restaurants share the same dish ids (mock data) — each block presents
 * them under its own brand identity.
 */
export const restaurants: Restaurant[] = [
  {
    id: "rest-madina",
    name: "مطعم المدينة",
    tagline: "الأكلات المصرية الشعبية",
    monogram: "م",
    rating: 4.8,
    reviews: 1240,
    brandHue: "18 78% 48%",
    brandSoft: "22 90% 94%",
    etaLabel: "30-45 دقيقة",
    minOrder: 60,
    cashbackPct: 7,
    commissionPct: 12,
    servesZones: ["A", "B", "M"],
    whatsapp: "201080068681",
    productIds: ["rest-koshary", "rest-grill", "rest-burger"],
  },
  {
    id: "rest-sham",
    name: "ركن الشام",
    tagline: "شاورما ومشاوي شامية",
    monogram: "ش",
    rating: 4.9,
    reviews: 2103,
    brandHue: "5 70% 45%",
    brandSoft: "10 85% 94%",
    etaLabel: "25-40 دقيقة",
    minOrder: 80,
    cashbackPct: 8,
    commissionPct: 13,
    servesZones: ["A", "B", "C", "M"],
    whatsapp: "201080068682",
    productIds: ["rest-shawarma", "rest-grill", "rest-koshary"],
  },
  {
    id: "rest-toscana",
    name: "بيتزا توسكانا",
    tagline: "بيتزا إيطالي على الحطب",
    monogram: "T",
    rating: 4.7,
    reviews: 856,
    brandHue: "150 55% 38%",
    brandSoft: "145 60% 93%",
    etaLabel: "35-50 دقيقة",
    minOrder: 120,
    cashbackPct: 6,
    commissionPct: 14,
    servesZones: ["A", "B", "C", "M"],
    whatsapp: "201080068683",
    productIds: ["rest-pizza", "rest-burger", "rest-koshary"],
  },
  {
    id: "rest-burger-house",
    name: "برجر هاوس",
    tagline: "برجر أمريكي واجيو",
    monogram: "B",
    rating: 4.8,
    reviews: 1502,
    brandHue: "38 90% 50%",
    brandSoft: "42 95% 94%",
    etaLabel: "30-40 دقيقة",
    minOrder: 100,
    cashbackPct: 10,
    commissionPct: 15,
    servesZones: ["A", "B", "M"],
    whatsapp: "201080068684",
    productIds: ["rest-burger", "rest-pizza", "rest-shawarma"],
  },
  {
    id: "rest-sakura",
    name: "ساكورا",
    tagline: "سوشي ومأكولات يابانية",
    monogram: "桜",
    rating: 4.9,
    reviews: 612,
    brandHue: "330 65% 50%",
    brandSoft: "330 80% 95%",
    etaLabel: "40-55 دقيقة",
    minOrder: 200,
    cashbackPct: 5,
    commissionPct: 16,
    servesZones: ["A", "B"],
    whatsapp: "201080068685",
    productIds: ["rest-sushi", "rest-burger", "rest-pizza"],
  },
  {
    id: "rest-rural-grill",
    name: "مشاوي الريف",
    tagline: "مشويات على الفحم البلدي",
    monogram: "R",
    rating: 4.9,
    reviews: 1880,
    brandHue: "5 60% 38%",
    brandSoft: "10 65% 93%",
    etaLabel: "45-60 دقيقة",
    minOrder: 150,
    cashbackPct: 9,
    commissionPct: 12,
    servesZones: ["A", "B", "C", "D", "M"],
    whatsapp: "201080068686",
    productIds: ["rest-grill", "rest-shawarma", "rest-koshary"],
  },
];

/* ============ HELPERS ============ */

/** Restaurants available for delivery in the given zone. */
export const restaurantsForZone = (zoneId: ZoneId): Restaurant[] =>
  restaurants.filter((r) => r.servesZones.includes(zoneId));

/** Lookup by id. */
export const getRestaurant = (id: string): Restaurant | undefined =>
  restaurants.find((r) => r.id === id);

/**
 * Reverse lookup: given a product id, find the restaurant that "owns" it.
 * Used by the cart to segment lines per vendor and route WhatsApp messages.
 * Returns undefined for non-restaurant items (supermarket, kitchen, etc.).
 */
export const restaurantForProductId = (productId: string): Restaurant | undefined => {
  for (const r of restaurants) {
    if (r.productIds.includes(productId)) return r;
  }
  return undefined;
};

/** Vendor key shown in cart segmentation for non-restaurant items. */
export type VendorKey =
  | { kind: "restaurant"; restaurant: Restaurant }
  | { kind: "kitchen" }
  | { kind: "store" };

/** Friendly vendor label (used in cart group headers + WhatsApp split). */
export const vendorLabel = (v: VendorKey): string => {
  if (v.kind === "restaurant") return v.restaurant.name;
  if (v.kind === "kitchen") return "مطبخ ريف المدينة";
  return "متجر ريف المدينة";
};

export const vendorBrandHue = (v: VendorKey): string => {
  if (v.kind === "restaurant") return v.restaurant.brandHue;
  if (v.kind === "kitchen") return "18 75% 50%";
  return "142 55% 38%";
};

/** Resolve a vendor for a product (used in CartContext-side grouping). */
export const vendorForProduct = (
  productId: string,
  source: string,
): VendorKey => {
  const r = restaurantForProductId(productId);
  if (r) return { kind: "restaurant", restaurant: r };
  if (source === "kitchen" || productId.startsWith("kitchen-") || productId.startsWith("kc-"))
    return { kind: "kitchen" };
  return { kind: "store" };
};