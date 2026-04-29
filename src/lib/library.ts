// Library / Student Hub configuration
// Pricing for cloud printing & borrowing rules.

export type BorrowDuration = "3d" | "7d" | "14d";

export const BORROW_DURATIONS: { id: BorrowDuration; label: string; days: number; ratio: number }[] = [
  { id: "3d", label: "3 أيام", days: 3, ratio: 0.15 },
  { id: "7d", label: "أسبوع", days: 7, ratio: 0.25 },
  { id: "14d", label: "أسبوعين", days: 14, ratio: 0.40 },
];

export const BORROW_DEPOSIT_RATIO = 1.0; // refundable deposit = full book price
export const BORROW_LATE_FEE_PER_DAY = 5; // EGP

export const PRINT_PRICES = {
  perPageBW: 1,
  perPageColor: 3,
  doubleSidedDiscount: 0.20, // 20% off when double-sided
  binding: { none: 0, spiral: 10, plastic: 15, thermal: 20 } as const,
};

export type BindingKey = keyof typeof PRINT_PRICES.binding;

export type PrintConfig = {
  pages: number;
  copies: number;
  colorMode: "bw" | "color";
  sided: "single" | "double";
  binding: BindingKey;
};

export function calcPrintTotal(c: PrintConfig): number {
  const base = c.colorMode === "color" ? PRINT_PRICES.perPageColor : PRINT_PRICES.perPageBW;
  const sidedFactor = c.sided === "double" ? (1 - PRINT_PRICES.doubleSidedDiscount) : 1;
  const pageCost = c.pages * base * sidedFactor;
  const subtotal = (pageCost + PRINT_PRICES.binding[c.binding]) * c.copies;
  return Math.round(subtotal * 100) / 100;
}

export function calcBorrowPrice(bookPrice: number, duration: BorrowDuration): {
  rental: number; deposit: number; total: number;
} {
  const cfg = BORROW_DURATIONS.find((d) => d.id === duration)!;
  const rental = Math.round(bookPrice * cfg.ratio);
  const deposit = Math.round(bookPrice * BORROW_DEPOSIT_RATIO);
  return { rental, deposit, total: rental + deposit };
}

// Bundles (cross-sell combos). IDs map to product IDs in src/lib/products.ts
export type LibraryBundle = {
  id: string;
  name: string;
  emoji: string;
  subtitle: string;
  productIds: string[]; // composes a virtual bundle preview
  price: number;
  oldPrice?: number;
  category: "engineering" | "medical" | "exam";
};

export const LIBRARY_BUNDLES: LibraryBundle[] = [
  {
    id: "bundle-engineering",
    name: "طقم هندسة وفنون متكامل",
    emoji: "📐",
    subtitle: "مساطر T · ألوان زيت · ورق فابريانو · بيكار",
    productIds: ["stationery", "pens", "notebook"],
    price: 480,
    oldPrice: 580,
    category: "engineering",
  },
  {
    id: "bundle-medical",
    name: "طقم طب وصيدلة",
    emoji: "🩺",
    subtitle: "بالطو · هايلايتر · نوت بوك طبية · أقلام",
    productIds: ["pens", "notebook", "stationery"],
    price: 520,
    oldPrice: 640,
    category: "medical",
  },
  {
    id: "bundle-exam-night",
    name: "سلة ليلة الامتحان 🌙",
    emoji: "☕",
    subtitle: "قهوة + شوكولاتة + مشروب طاقة + هايلايتر",
    productIds: ["coffee", "cookies", "juice", "pens"],
    price: 285,
    oldPrice: 340,
    category: "exam",
  },
];

export const PRINT_PREP_HOURS = 2;
