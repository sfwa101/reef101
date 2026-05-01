/**
 * Home Storefront — static catalog & dictionaries.
 *
 * Extracted verbatim from the legacy `pages/store/Home.tsx`. Pure data:
 * no React, no side effects. This module is the canonical source for
 * Home Goods catalog, bundles, categories, sort options, and the
 * money formatter.
 */
import {
  ChefHat,
  Lamp,
  Microwave,
  Sparkle,
  Sparkles,
  WashingMachine,
  type LucideIcon,
} from "lucide-react";

import imgCookware from "@/assets/hg-cookware.jpg";
import imgBlender from "@/assets/hg-blender.jpg";
import imgFridge from "@/assets/hg-fridge.jpg";
import imgWasher from "@/assets/hg-washer.jpg";
import imgVacuum from "@/assets/hg-vacuum.jpg";
import imgAirfryer from "@/assets/hg-airfryer.jpg";
import imgCleankit from "@/assets/hg-cleankit.jpg";
import imgLamp from "@/assets/hg-smartlamp.jpg";

import { toLatin } from "@/lib/format";
import type {
  Bundle,
  CatId,
  HGProduct,
  SortId,
} from "./types";

export const CATS: { id: CatId; name: string; icon: LucideIcon }[] = [
  { id: "all", name: "الكل", icon: Sparkle },
  { id: "majors", name: "أجهزة كهربائية كبرى", icon: WashingMachine },
  { id: "small", name: "أجهزة مطبخ صغيرة", icon: Microwave },
  { id: "kitchen", name: "أدوات مطبخ", icon: ChefHat },
  { id: "clean", name: "أدوات تنظيف", icon: Sparkles },
  { id: "decor", name: "ديكور ذكي", icon: Lamp },
];

export const CATALOG: HGProduct[] = [
  {
    id: "hg-cookware",
    name: "طقم أواني ستانلس استيل ٥ قطع",
    brand: "ReefHome",
    unit: "٥ قطع — قاعدة ثلاثية",
    price: 850,
    oldPrice: 1100,
    image: imgCookware,
    rating: 4.9,
    reviews: 2480,
    category: "kitchen",
    fulfillment: "instant",
    tagline: "ثقيلة ومتينة — توزيع حراري احترافي",
    badges: ["خالي من PFOA", "مناسب للحث الكهرومغناطيسي"],
  },
  {
    id: "hg-cleankit",
    name: "بخاخ تنظيف طبيعي + مناشف ميكروفايبر",
    brand: "EcoLeaf",
    unit: "زجاجة 500 مل + قطعتين",
    price: 95,
    oldPrice: 130,
    image: imgCleankit,
    rating: 4.7,
    reviews: 1320,
    category: "clean",
    fulfillment: "instant",
    tagline: "آمن للأطفال — رائحة ليمون منعشة",
    badges: ["مكونات طبيعية", "خالي من الأمونيا"],
  },
  {
    id: "hg-airfryer",
    name: "قلاية هوائية رقمية ٥٫٥ لتر",
    brand: "Phillon",
    unit: "1700 واط — شاشة لمس",
    price: 2490,
    oldPrice: 3200,
    image: imgAirfryer,
    rating: 4.8,
    reviews: 3120,
    category: "small",
    fulfillment: "instant",
    tagline: "قلي بدون زيت — ٨ برامج جاهزة",
    badges: ["موفر للكهرباء", "سهل التنظيف"],
    warranty: "ضمان وكيل سنتين",
  },
  {
    id: "hg-blender",
    name: "خلاط كهربائي عالي القوة 1500W",
    brand: "Phillon",
    unit: "إبريق زجاج 2 لتر",
    price: 1290,
    oldPrice: 1600,
    image: imgBlender,
    rating: 4.7,
    reviews: 980,
    category: "small",
    fulfillment: "instant",
    tagline: "شفرات تيتانيوم — ٦ سرعات",
    badges: ["محرك نحاسي", "إبريق زجاج مقاوم"],
    warranty: "ضمان وكيل سنة",
  },
  {
    id: "hg-lamp",
    name: "مصباح ذكي LED بإضاءة دافئة",
    brand: "LumiSmart",
    unit: "تحكم بالتطبيق — RGB",
    price: 420,
    image: imgLamp,
    rating: 4.6,
    reviews: 540,
    category: "decor",
    fulfillment: "instant",
    tagline: "متوافق مع المساعدات الصوتية",
    badges: ["WiFi", "موفر للطاقة"],
  },
  {
    id: "hg-fridge",
    name: "ثلاجة فرنش دور — 580 لتر — انفرتر",
    brand: "Samsung",
    unit: "نوفروست — موفر طاقة A++",
    price: 38900,
    oldPrice: 44900,
    image: imgFridge,
    rating: 4.9,
    reviews: 412,
    category: "majors",
    fulfillment: "preorder",
    depositPct: 25,
    etaDays: 7,
    tagline: "تبريد ذكي مزدوج — موزع ماء وثلج",
    badges: ["انفرتر هادئ", "تحكم بالتطبيق"],
    warranty: "ضمان وكيل ٥ سنوات على المحرك",
  },
  {
    id: "hg-washer",
    name: "غسالة أوتوماتيك أمامية 9 كجم",
    brand: "LG",
    unit: "1400 لفة — بخار",
    price: 19500,
    oldPrice: 22900,
    image: imgWasher,
    rating: 4.8,
    reviews: 678,
    category: "majors",
    fulfillment: "preorder",
    depositPct: 25,
    etaDays: 7,
    tagline: "تقنية AI Direct Drive — تنظيف بالبخار",
    badges: ["موفر للماء", "هادئة جدًا"],
    warranty: "ضمان وكيل ١٠ سنوات على المحرك",
  },
  {
    id: "hg-vacuum",
    name: "روبوت مكنسة ذكي + ممسحة",
    brand: "Roborock",
    unit: "خرائط ليزر — تطبيق",
    price: 7900,
    oldPrice: 9500,
    image: imgVacuum,
    rating: 4.7,
    reviews: 1102,
    category: "small",
    fulfillment: "preorder",
    depositPct: 25,
    etaDays: 5,
    tagline: "ينظف ويمسح — يعود للشحن وحده",
    badges: ["خرائط ذكية", "بطارية طويلة"],
    warranty: "ضمان وكيل سنتين",
  },
];

export const BUNDLES: Bundle[] = [
  {
    id: "b1",
    title: "حزمة المطبخ الذكي",
    desc: "طقم أواني + خلاط 1500W",
    itemIds: ["hg-cookware", "hg-blender"],
    bundlePrice: 1890,
    badge: "وفّر 250 ج.م",
  },
  {
    id: "b2",
    title: "حزمة الطبخ الصحي",
    desc: "قلاية هوائية + بخاخ تنظيف طبيعي",
    itemIds: ["hg-airfryer", "hg-cleankit"],
    bundlePrice: 2499,
    badge: "وفّر 86 ج.م",
  },
  {
    id: "b3",
    title: "حزمة البيت الذكي",
    desc: "روبوت مكنسة + مصباح LED ذكي",
    itemIds: ["hg-vacuum", "hg-lamp"],
    bundlePrice: 8190,
    badge: "وفّر 130 ج.م",
  },
];

export const BESTSELLER_IDS = [
  "hg-airfryer",
  "hg-washer",
  "hg-fridge",
  "hg-vacuum",
];

export const SORTS: { id: SortId; label: string }[] = [
  { id: "relevance", label: "الأنسب" },
  { id: "price-asc", label: "السعر: الأقل أولًا" },
  { id: "price-desc", label: "السعر: الأعلى أولًا" },
  { id: "rating", label: "الأعلى تقييمًا" },
  { id: "discount", label: "الأكثر خصمًا" },
];

/** Egyptian-pound formatter — Latin digits, "ج.م" suffix. */
export const fmt = (n: number) =>
  `${toLatin(n.toLocaleString("en-US"))} ج.م`;
