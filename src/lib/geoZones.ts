/**
 * Geo-Zones System for Reef Al-Madinah
 * -------------------------------------
 * Defines delivery zones, fees, ETA, free-delivery thresholds, and
 * payment-method restrictions per geographical area.
 *
 * Used by:
 *  - Address form (city → districts cascade)
 *  - LocationContext (global state)
 *  - Cart (delivery fee, free-delivery threshold, ETA, COD allowance)
 *  - Product filtering (hide perishables for far zones)
 */

export type ZoneId = "A" | "B" | "C" | "D" | "M" | "E";

export type DeliveryZone = {
  id: ZoneId;
  name: string;          // city / region label
  shortName: string;     // chip label
  districts: string[];   // selectable districts in this zone
  deliveryFee: number;   // EGP
  freeDeliveryThreshold: number | null; // null = never free for this zone
  etaLabel: string;      // user-facing wait time
  etaMinutes?: number;   // numeric ballpark, optional
  codAllowed: boolean;   // cash on delivery available?
  acceptsPerishables: boolean; // fresh / chilled / frozen items?
  accent: string;        // tailwind/text utility for badges
};

/* ============ ZONE DEFINITIONS ============ */

export const ZONES: DeliveryZone[] = [
  {
    id: "A",
    name: "جمصة",
    shortName: "جمصة (السريع)",
    districts: ["الصفا", "المروة", "جمصة غرب", "جمصة شرق", "شجرة الدر"],
    deliveryFee: 25,
    freeDeliveryThreshold: 300,
    etaLabel: "خلال ساعة",
    etaMinutes: 60,
    codAllowed: true,
    acceptsPerishables: true,
    accent: "text-emerald-600",
  },
  {
    id: "B",
    name: "جمصة الموسعة",
    shortName: "جمصة الموسعة",
    districts: ["العاشر", "15 مايو", "جمصة 1", "جمصة 2", "جمصة 3", "جمصة 4"],
    deliveryFee: 30,
    freeDeliveryThreshold: 500,
    etaLabel: "خلال ساعتين",
    etaMinutes: 120,
    codAllowed: true,
    acceptsPerishables: true,
    accent: "text-emerald-600",
  },
  {
    id: "C",
    name: "دمياط الجديدة",
    shortName: "دمياط الجديدة",
    districts: [
      "الحي الأول",
      "الحي الثاني",
      "الحي الثالث",
      "الحي الرابع",
      "الحي الخامس",
      "الحي السادس",
      "الـ 60",
      "الـ 70",
      "النوعية",
      "الصناعية",
    ],
    deliveryFee: 35,
    freeDeliveryThreshold: 700,
    etaLabel: "3 أيام في الأسبوع",
    codAllowed: false,
    acceptsPerishables: true,
    accent: "text-amber-600",
  },
  {
    id: "M",
    name: "المنصورة الجديدة",
    shortName: "المنصورة الجديدة",
    districts: ["الحي الأول", "الحي الثاني", "الحي الثالث", "الحي الرابع"],
    deliveryFee: 40,
    freeDeliveryThreshold: 700,
    etaLabel: "خلال 24 ساعة",
    codAllowed: true, // exception: COD allowed here
    acceptsPerishables: true,
    accent: "text-amber-600",
  },
  {
    id: "D",
    name: "قرى دمياط",
    shortName: "قرى دمياط",
    districts: ["الركابية", "الوسطاني", "كفر الغاب"],
    deliveryFee: 35,
    freeDeliveryThreshold: 700,
    etaLabel: "اليوم التالي",
    codAllowed: false,
    acceptsPerishables: true,
    accent: "text-orange-600",
  },
  {
    id: "E",
    name: "باقي محافظات مصر",
    shortName: "محافظات أخرى",
    districts: [], // governorates list below
    deliveryFee: 70,
    freeDeliveryThreshold: null,
    etaLabel: "3 إلى 7 أيام",
    codAllowed: false,
    acceptsPerishables: false, // long shipping → no fresh/cold items
    accent: "text-sky-600",
  },
];

/* Other Egyptian governorates (alphabetical), used as the "districts" of Zone E */
export const OTHER_GOVERNORATES: string[] = [
  "الإسكندرية",
  "الإسماعيلية",
  "الأقصر",
  "البحر الأحمر",
  "البحيرة",
  "الجيزة",
  "الدقهلية",
  "السويس",
  "الشرقية",
  "الغربية",
  "الفيوم",
  "القاهرة",
  "القليوبية",
  "المنوفية",
  "المنيا",
  "الوادي الجديد",
  "أسوان",
  "أسيوط",
  "بني سويف",
  "بورسعيد",
  "بورفؤاد",
  "جنوب سيناء",
  "دمياط",
  "سوهاج",
  "شمال سيناء",
  "قنا",
  "كفر الشيخ",
  "مطروح",
].sort((a, b) => a.localeCompare(b, "ar"));

/* ============ HELPERS ============ */

/** Cities/regions list for the city dropdown — UX ordering matters. */
export const ORDERED_CITIES = ZONES.map((z) => ({ id: z.id, name: z.name }));

export const DEFAULT_ZONE_ID: ZoneId = "A"; // جمصة افتراضيًا

/** Resolve a zone by its id. */
export const getZone = (id: ZoneId | null | undefined): DeliveryZone =>
  ZONES.find((z) => z.id === id) ?? ZONES[0];

/** Districts list for a given zone (Zone E returns governorates). */
export const districtsForZone = (zoneId: ZoneId): string[] => {
  if (zoneId === "E") return OTHER_GOVERNORATES;
  return getZone(zoneId).districts;
};

/**
 * Best-effort match from a saved address (city + district free text)
 * back to one of our zones.
 */
export const detectZoneFromAddress = (
  city?: string | null,
  district?: string | null,
): ZoneId => {
  const c = (city ?? "").trim();
  const d = (district ?? "").trim();
  // First try an exact city match
  for (const z of ZONES) {
    if (z.name === c || z.shortName === c) return z.id;
  }
  // Fall back to district lookup across A..D, M
  for (const z of ZONES) {
    if (z.id === "E") continue;
    if (z.districts.some((dist) => dist === d)) return z.id;
  }
  // Governorate match → Zone E
  if (OTHER_GOVERNORATES.includes(c) || OTHER_GOVERNORATES.includes(d)) return "E";
  return DEFAULT_ZONE_ID;
};

/** Calculate delivery fee given a zone and a subtotal. */
export const calcDeliveryFee = (zoneId: ZoneId, subtotal: number): number => {
  if (subtotal <= 0) return 0;
  const z = getZone(zoneId);
  if (z.freeDeliveryThreshold !== null && subtotal >= z.freeDeliveryThreshold) return 0;
  return z.deliveryFee;
};

/** Available payment-method ids for a zone (filters out cash where forbidden). */
export const allowedPaymentMethods = (
  zoneId: ZoneId,
  all: string[],
): string[] => {
  const z = getZone(zoneId);
  if (z.codAllowed) return all;
  return all.filter((id) => id !== "cash");
};