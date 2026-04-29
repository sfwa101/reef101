/**
 * Sweets & Cakes — Smart Fulfillment Logic
 * ----------------------------------------
 * Maps every sweets product to one of three fulfillment types and exposes
 * helpers used across:
 *   - product cards (badge color/label)
 *   - product modal (date/time picker for Type C)
 *   - cart segmentation (split shipment groups)
 *   - checkout rules (disable COD, force deposit on large bookings)
 *
 * Type A = ready in stock, instant delivery (e.g. ice cream, packaged donuts)
 * Type B = made fresh by Reef Kitchen, same day later slot (e.g. konafa, baklava trays)
 * Type C = pre-order from home producers, next-day or scheduled (cakes, custom orders)
 */

export type FulfillmentType = "A" | "B" | "C";

export type FulfillmentMeta = {
  /** Logical type used by all the rules engines */
  type: FulfillmentType;
  /** Short Arabic label shown on the product badge */
  badge: string;
  /** Emoji prefix for the badge */
  emoji: string;
  /** Tailwind background class (HSL var-based, theme-friendly) */
  badgeBg: string;
  /** Tailwind text class */
  badgeText: string;
  /** Free-form Arabic explainer shown in the product modal */
  description: string;
  /** Earliest pickup offset (in hours) from "now" */
  minLeadHours: number;
  /** Friendly source name shown in the cart group header */
  sourceLabel: string;
};

/**
 * The mapping rule the user picked: drive type from `subCategory` so we
 * don't need a database migration. We accept overrides through
 * `productTypeOverrides` for the few exceptions.
 */
const productTypeOverrides: Record<string, FulfillmentType> = {
  // Cheesecake is made fresh same-day
  "cake-cheese": "B",
  // Donuts box is shelf-stable, instant
  "sweet-donuts": "A",
  // Macarons travel from a producer — pre-order
  "sweet-macaron": "C",
};

/** Resolve the fulfillment type for a given sweets product id + subCategory. */
export const fulfillmentTypeFor = (
  productId: string,
  subCategory?: string,
): FulfillmentType => {
  if (productId in productTypeOverrides) return productTypeOverrides[productId];
  if (subCategory === "مثلجات") return "A";
  if (subCategory === "شرقية" || subCategory === "غربية") return "B";
  if (subCategory === "تورتات") return "C";
  // Default conservative: treat unknown sweets as same-day fresh
  return "B";
};

/** UI metadata for each type (badge, copy, lead time). */
export const fulfillmentMeta: Record<FulfillmentType, FulfillmentMeta> = {
  A: {
    type: "A",
    badge: "جاهز للتوصيل",
    emoji: "🟢",
    badgeBg: "bg-emerald-500/95",
    badgeText: "text-white",
    description: "متوفّر الآن في المخزن — يصلك مع توصيلك الفوري.",
    minLeadHours: 0,
    sourceLabel: "ريف المدينة — جاهز",
  },
  B: {
    type: "B",
    badge: "يُحضّر طازجاً",
    emoji: "⏱️",
    badgeBg: "bg-amber-500/95",
    badgeText: "text-white",
    description: "يُحضّر طازجاً في مطبخ ريف المدينة — يصلك خلال 4 ساعات.",
    minLeadHours: 4,
    sourceLabel: "مطبخ ريف المدينة",
  },
  C: {
    type: "C",
    badge: "حجز مسبق",
    emoji: "📅",
    badgeBg: "bg-violet-600/95",
    badgeText: "text-white",
    description:
      "يُحضّر خصيصاً لك بأيدي الأسر المنتجة — اختر تاريخ ووقت الاستلام.",
    minLeadHours: 18,
    sourceLabel: "الأسر المنتجة — حجز مسبق",
  },
};

/** True only for sweets products. Other products are exempt from this engine. */
export const isSweetsProduct = (source: string): boolean => source === "sweets";

/** True if the given line item requires a scheduled delivery slot. */
export const requiresBooking = (
  source: string,
  productId: string,
  subCategory?: string,
): boolean =>
  isSweetsProduct(source) &&
  fulfillmentTypeFor(productId, subCategory) === "C";

/* ============ Payment rules ============ */

/** Threshold above which the deposit becomes mandatory (EGP). */
export const DEPOSIT_THRESHOLD = 300;

/** Deposit percentage charged upfront on Type C subtotal. */
export const DEPOSIT_PCT = 0.5;

/**
 * Given the subtotal of all Type C lines in the cart, decide:
 *   - whether COD must be disabled (always when any C item exists)
 *   - whether deposit is required (mandatory for big bookings)
 *   - how much the user must pay upfront
 */
export type SweetsPaymentRules = {
  hasBooking: boolean;
  bookingSubtotal: number;
  /** Disable cash-on-delivery in the payment selector */
  blockCOD: boolean;
  /** Show the user a deposit notice */
  showDepositNotice: boolean;
  /** When true, deposit is forced (cannot be turned off) */
  depositRequired: boolean;
  /** Suggested upfront deposit (EGP) */
  depositAmount: number;
  /** Remainder to collect on delivery — only meaningful when split */
  remainderOnDelivery: number;
};

export const computeSweetsRules = (
  bookingSubtotal: number,
  cartGrandTotal: number,
): SweetsPaymentRules => {
  const hasBooking = bookingSubtotal > 0;
  const depositRequired = bookingSubtotal >= DEPOSIT_THRESHOLD;
  const depositAmount = hasBooking
    ? Math.round(bookingSubtotal * DEPOSIT_PCT)
    : 0;
  return {
    hasBooking,
    bookingSubtotal,
    blockCOD: hasBooking,
    showDepositNotice: hasBooking,
    depositRequired,
    depositAmount,
    remainderOnDelivery: hasBooking
      ? Math.max(0, cartGrandTotal - depositAmount)
      : 0,
  };
};

/* ============ Time-slot helpers ============ */

/** Build the next N pickup days for the booking date picker. */
export const buildBookingDays = (count: number = 7): Date[] => {
  const days: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  // First slot is tomorrow (Type C minLeadHours = 18h)
  for (let i = 1; i <= count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
};

/** Available pickup time slots within a day. */
export const bookingTimeSlots: { id: string; label: string }[] = [
  { id: "morning", label: "صباحاً (10ص — 12م)" },
  { id: "noon", label: "ظهراً (12م — 3م)" },
  { id: "evening", label: "مساءً (5م — 8م)" },
  { id: "night", label: "ليلاً (8م — 10م)" },
];

export const formatBookingDate = (d: Date): string => {
  const weekday = d.toLocaleDateString("ar-EG", { weekday: "long" });
  const day = d.toLocaleDateString("ar-EG", { day: "numeric", month: "long" });
  return `${weekday} ${day}`;
};

export const formatBookingShort = (d: Date): string => {
  const weekday = d.toLocaleDateString("ar-EG", { weekday: "short" });
  const day = d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" });
  return `${weekday} · ${day}`;
};