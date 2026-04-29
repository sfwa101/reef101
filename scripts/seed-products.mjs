// One-shot seed: uploads product images to Storage and inserts products into DB.
// Run with: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/seed-products.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://aqqxravppmtdbalsjyam.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const ASSETS = path.resolve("src/assets");
const BUCKET = "product-images";

// Image filename map (matches imports in src/lib/products.ts)
const IMG = {
  pTomato: "p-tomato.jpg", pMilk: "p-milk.jpg", pBread: "p-bread.jpg",
  pBanana: "p-banana.jpg", pEggs: "p-eggs.jpg", pChicken: "p-grilled-chicken.jpg",
  pSalmon: "p-salmon.jpg", pRisotto: "p-risotto.jpg", pBowl: "p-bowl.jpg",
  pMedicine: "p-medicine.jpg", pBook: "p-book.jpg", pApple: "p-apple.jpg",
  pCucumber: "p-cucumber.jpg", pOrange: "p-orange.jpg", pStrawberry: "p-strawberry.jpg",
  pLettuce: "p-lettuce.jpg", pCheese: "p-cheese.jpg", pYogurt: "p-yogurt.jpg",
  pButter: "p-butter.jpg", pRice: "p-rice.jpg", pPasta: "p-pasta.jpg",
  pJuice: "p-juice.jpg", pWater: "p-water.jpg", pCoffee: "p-coffee.jpg",
  pCereal: "p-cereal.jpg", pOil: "p-oil.jpg", pBeef: "p-beef.jpg",
  pChickenRaw: "p-chicken-raw.jpg", pCookies: "p-cookies.jpg", pDiapers: "p-diapers.jpg",
  pShampoo: "p-shampoo.jpg", pIcecream: "p-icecream.jpg", pPetfood: "p-petfood.jpg",
  pStationery: "p-stationery.jpg", pNotebook: "p-notebook.jpg", pPens: "p-pens.jpg",
  pCleaner: "p-cleaner.jpg", pUtensils: "p-utensils.jpg",
};

// Variants/addons (mirror products.ts)
const sizeVariants = [{ id: "s", label: "صغير", priceDelta: -5 }, { id: "m", label: "وسط", priceDelta: 0 }, { id: "l", label: "كبير", priceDelta: 12 }];
const weightVariants = [{ id: "500", label: "500غ", priceDelta: -8 }, { id: "1000", label: "1 كجم", priceDelta: 0 }, { id: "2000", label: "2 كجم", priceDelta: 18 }];
const mealAddons = [{ id: "extra-sauce", label: "صلصة إضافية", price: 8 }, { id: "extra-cheese", label: "جبنة إضافية", price: 12 }, { id: "side-salad", label: "سلطة جانبية", price: 18 }, { id: "drink", label: "مشروب", price: 14 }];
const groceryAddons = [{ id: "gift-wrap", label: "تغليف هدية", price: 10 }, { id: "express", label: "توصيل سريع 30 د", price: 15 }];
const cakeSizeVariants = [{ id: "cake-1kg", label: "1 كجم — يكفي 8 أشخاص", priceDelta: 0 }, { id: "cake-2kg", label: "2 كجم — يكفي 16 شخص", priceDelta: 220 }, { id: "cake-3kg", label: "3 كجم — يكفي 24 شخص", priceDelta: 420 }];
const cakeAddons = [{ id: "cake-name", label: "كتابة اسم على التورتة", price: 25 }, { id: "cake-candles", label: "شموع عيد ميلاد", price: 20 }, { id: "cake-topper", label: "ديكور علوي خاص", price: 60 }, { id: "cake-box", label: "علبة هدية فاخرة", price: 35 }];
const sweetTrayVariants = [{ id: "tray-s", label: "صينية صغيرة", priceDelta: -40 }, { id: "tray-m", label: "صينية متوسطة", priceDelta: 0 }, { id: "tray-l", label: "صينية كبيرة", priceDelta: 90 }];

const products = [
  // Produce
  { id: "tomato", name: "طماطم بلدي طازجة", unit: "كيلو", price: 18, old_price: 22, img: IMG.pTomato, rating: 4.8, category: "الخضار والفواكه", sub_category: "خضار طازجة", source: "produce", badge: "best", variants: weightVariants, addons: groceryAddons },
  { id: "cucumber", name: "خيار طازج", unit: "كيلو", price: 14, img: IMG.pCucumber, rating: 4.7, category: "الخضار والفواكه", sub_category: "خضار طازجة", source: "produce", variants: weightVariants },
  { id: "lettuce", name: "خس وخضروات ورقية", unit: "حزمة", price: 12, img: IMG.pLettuce, rating: 4.6, category: "الخضار والفواكه", sub_category: "خضروات ورقية", source: "produce" },
  { id: "banana", name: "موز إكوادوري", unit: "كيلو", price: 32, img: IMG.pBanana, rating: 4.7, category: "الخضار والفواكه", sub_category: "فواكه طازجة", source: "produce", badge: "trending", variants: weightVariants },
  { id: "apple", name: "تفاح أحمر مستورد", unit: "كيلو", price: 45, old_price: 55, img: IMG.pApple, rating: 4.9, category: "الخضار والفواكه", sub_category: "فواكه طازجة", source: "produce", badge: "best", variants: weightVariants },
  { id: "orange", name: "برتقال أبو سرّة", unit: "كيلو", price: 28, img: IMG.pOrange, rating: 4.8, category: "الخضار والفواكه", sub_category: "حمضيات", source: "produce", variants: weightVariants },
  { id: "strawberry", name: "فراولة طازجة", unit: "علبة 500غ", price: 38, img: IMG.pStrawberry, rating: 4.9, category: "الخضار والفواكه", sub_category: "توت وفواكه حمراء", source: "produce", badge: "premium" },
  // Dairy
  { id: "milk", name: "حليب طازج كامل الدسم", brand: "مزرعة الريف", unit: "1 لتر", price: 45, img: IMG.pMilk, rating: 4.9, category: "الألبان والبيض", sub_category: "حليب", source: "dairy", badge: "best", variants: [{ id: "1l", label: "1 لتر", priceDelta: 0 }, { id: "2l", label: "2 لتر", priceDelta: 35 }] },
  { id: "cheese", name: "جبنة بيضاء طرية", brand: "مزرعة الريف", unit: "500غ", price: 95, img: IMG.pCheese, rating: 4.8, category: "الألبان والبيض", sub_category: "أجبان", source: "dairy", badge: "trending" },
  { id: "yogurt", name: "زبادي يوناني طبيعي", brand: "مزرعة الريف", unit: "كوب 200غ", price: 22, img: IMG.pYogurt, rating: 4.7, category: "الألبان والبيض", sub_category: "زبادي", source: "dairy" },
  { id: "butter", name: "زبدة بلدي طبيعية", brand: "مزرعة الريف", unit: "200غ", price: 65, img: IMG.pButter, rating: 4.8, category: "الألبان والبيض", sub_category: "زبدة", source: "dairy" },
  { id: "eggs", name: "بيض بلدي حر", brand: "مزرعة الريف", unit: "10 حبات", price: 55, old_price: 65, img: IMG.pEggs, rating: 4.8, category: "الألبان والبيض", sub_category: "بيض", source: "dairy", badge: "trending", variants: [{ id: "10", label: "10 حبات", priceDelta: 0 }, { id: "30", label: "30 حبة", priceDelta: 100 }] },
  // Bakery
  { id: "bread", name: "خبز ساوردو حرفي", unit: "رغيف 500غ", price: 38, img: IMG.pBread, rating: 4.6, category: "المخبوزات", sub_category: "خبز", source: "supermarket", badge: "premium" },
  { id: "cookies", name: "كوكيز شوكولاتة بالشوفان", unit: "علبة 12 قطعة", price: 48, img: IMG.pCookies, rating: 4.7, category: "المخبوزات", sub_category: "حلويات", source: "supermarket" },
  // Meat (supermarket)
  { id: "beef", name: "لحم بقري طازج", unit: "كيلو", price: 380, img: IMG.pBeef, rating: 4.9, category: "اللحوم والدواجن", sub_category: "لحوم حمراء", source: "supermarket", badge: "premium", variants: weightVariants },
  { id: "chicken-raw", name: "صدور دجاج بلدي", unit: "كيلو", price: 145, old_price: 165, img: IMG.pChickenRaw, rating: 4.8, category: "اللحوم والدواجن", sub_category: "دواجن", source: "supermarket", badge: "best", variants: weightVariants },
  // Pantry
  { id: "rice", name: "أرز بسمتي ممتاز", unit: "5 كجم", price: 285, img: IMG.pRice, rating: 4.8, category: "البقالة الجافة", sub_category: "أرز", source: "supermarket", badge: "best" },
  { id: "pasta", name: "مكرونة سباجيتي إيطالية", unit: "500غ", price: 32, img: IMG.pPasta, rating: 4.6, category: "البقالة الجافة", sub_category: "مكرونة", source: "supermarket" },
  { id: "oil", name: "زيت زيتون بكر ممتاز", unit: "1 لتر", price: 220, img: IMG.pOil, rating: 4.9, category: "البقالة الجافة", sub_category: "زيوت", source: "supermarket", badge: "premium" },
  { id: "cereal", name: "جرانولا بالتوت والمكسرات", unit: "علبة 400غ", price: 95, img: IMG.pCereal, rating: 4.7, category: "البقالة الجافة", sub_category: "حبوب الإفطار", source: "supermarket", badge: "new" },
  // Drinks
  { id: "juice", name: "عصير برتقال طازج", unit: "زجاجة 1 لتر", price: 38, img: IMG.pJuice, rating: 4.8, category: "المشروبات", sub_category: "عصائر", source: "supermarket", badge: "trending" },
  { id: "water", name: "مياه معدنية فاخرة", unit: "1.5 لتر", price: 12, img: IMG.pWater, rating: 4.5, category: "المشروبات", sub_category: "مياه", source: "supermarket" },
  { id: "coffee", name: "قهوة عربية محمصة", unit: "250غ بن", price: 145, img: IMG.pCoffee, rating: 4.9, category: "المشروبات", sub_category: "قهوة", source: "supermarket", badge: "premium" },
  // Frozen
  { id: "icecream", name: "آيس كريم فانيلا طبيعي", unit: "علبة 500مل", price: 75, img: IMG.pIcecream, rating: 4.7, category: "المجمدات", sub_category: "آيس كريم", source: "supermarket" },
  // Baby
  { id: "diapers", name: "حفاضات أطفال طبيعية", unit: "عبوة 40 قطعة", price: 165, img: IMG.pDiapers, rating: 4.8, category: "أطعمة الأطفال", sub_category: "حفاضات", source: "supermarket", variants: [{ id: "n", label: "حديثي الولادة", priceDelta: 0 }, { id: "s", label: "صغير", priceDelta: 0 }, { id: "m", label: "وسط", priceDelta: 10 }, { id: "l", label: "كبير", priceDelta: 20 }] },
  // Personal care
  { id: "shampoo", name: "شامبو طبيعي بالأعشاب", unit: "زجاجة 400مل", price: 95, img: IMG.pShampoo, rating: 4.6, category: "العناية الشخصية", sub_category: "شامبو", source: "supermarket" },
  // Pets
  { id: "petfood", name: "طعام كلاب جاف فاخر", unit: "3 كجم", price: 285, img: IMG.pPetfood, rating: 4.8, category: "أغذية الحيوانات", sub_category: "طعام كلاب", source: "supermarket" },
  // Kitchen meals
  { id: "chicken", name: "دجاج مشوي بالأعشاب", unit: "وجبة كاملة", price: 145, img: IMG.pChicken, rating: 4.9, category: "وجبات", source: "kitchen", badge: "best", variants: sizeVariants, addons: mealAddons },
  { id: "salmon", name: "سلمون مشوي بالليمون", unit: "وجبة 350غ", price: 220, img: IMG.pSalmon, rating: 4.8, category: "وجبات", source: "kitchen", badge: "premium", variants: sizeVariants, addons: mealAddons },
  // Recipes
  { id: "risotto", name: "ريزوتو الفطر بالبارميزان", unit: "وصفة شيف · شخصين", price: 180, img: IMG.pRisotto, rating: 4.9, category: "وصفات", source: "recipes", badge: "trending" },
  { id: "bowl", name: "بول البحر المتوسط", unit: "وصفة صحية · شخص", price: 95, old_price: 120, img: IMG.pBowl, rating: 4.7, category: "وصفات", source: "recipes", badge: "new" },
  // Pharmacy
  { id: "vitamin", name: "فيتامين د3 5000 وحدة", brand: "ناتشورال", unit: "60 كبسولة", price: 185, img: IMG.pMedicine, rating: 4.8, category: "فيتامينات", source: "pharmacy", badge: "trending" },
  // Library
  { id: "book", name: "قصة العلم — للأطفال", unit: "كتاب مصور", price: 75, img: IMG.pBook, rating: 4.9, category: "قصص", source: "library", badge: "new" },
  { id: "stationery", name: "طقم قرطاسية مدرسية شامل", unit: "طقم 25 قطعة", price: 245, img: IMG.pStationery, rating: 4.8, category: "قرطاسية", sub_category: "أطقم", source: "library", badge: "best" },
  { id: "notebook", name: "كشاكيل جلد فاخرة", unit: "حزمة 5 كشاكيل", price: 165, img: IMG.pNotebook, rating: 4.7, category: "قرطاسية", sub_category: "كشاكيل", source: "library", badge: "trending" },
  { id: "pens", name: "أقلام حبر فاخرة", unit: "علبة 12 قلم", price: 95, img: IMG.pPens, rating: 4.6, category: "قرطاسية", sub_category: "أقلام", source: "library" },
  // Home
  { id: "cleaner", name: "بخاخ تنظيف طبيعي", unit: "زجاجة 500مل", price: 65, img: IMG.pCleaner, rating: 4.7, category: "أدوات منزلية", sub_category: "تنظيف", source: "home", badge: "best" },
  { id: "utensils", name: "طقم أواني ستانلس", unit: "5 قطع", price: 850, old_price: 1100, img: IMG.pUtensils, rating: 4.9, category: "أدوات منزلية", sub_category: "مطبخ", source: "home", badge: "premium" },
  // Village
  { id: "honey", name: "عسل نحل بلدي صافي", brand: "مناحل الريف", unit: "جرة 1 كجم", price: 320, old_price: 380, img: IMG.pButter, rating: 4.9, category: "خيرات الريف", sub_category: "عسل ومربى", source: "village", badge: "premium" },
  { id: "ghee", name: "سمن بلدي بقري", brand: "مزرعة الريف", unit: "1 كجم", price: 420, img: IMG.pButter, rating: 4.8, category: "خيرات الريف", sub_category: "ألبان بلدية", source: "village", badge: "best" },
  { id: "village-cheese", name: "جبنة قريش بلدية", brand: "مزرعة الريف", unit: "500غ", price: 75, img: IMG.pCheese, rating: 4.7, category: "خيرات الريف", sub_category: "ألبان بلدية", source: "village" },
  { id: "olives", name: "زيتون أخضر مخلل بلدي", unit: "علبة 1 كجم", price: 95, img: IMG.pOil, rating: 4.6, category: "خيرات الريف", sub_category: "مخللات", source: "village" },
  { id: "molasses", name: "عسل أسود بلدي", unit: "زجاجة 500غ", price: 110, img: IMG.pButter, rating: 4.7, category: "خيرات الريف", sub_category: "عسل ومربى", source: "village", badge: "trending" },
  { id: "village-eggs", name: "بيض بلدي حر مزرعة", brand: "مزرعة الريف", unit: "30 حبة", price: 145, img: IMG.pEggs, rating: 4.9, category: "خيرات الريف", sub_category: "ألبان بلدية", source: "village", badge: "best" },
  // Baskets
  { id: "basket-week", name: "سلة الأسبوع العائلية", unit: "12 صنف · يكفي 4 أفراد", price: 650, old_price: 780, img: IMG.pTomato, rating: 4.9, category: "السلال", sub_category: "أسبوعية", source: "baskets", badge: "best" },
  { id: "basket-fruit", name: "سلة فواكه موسمية", unit: "8 أنواع · 5 كجم", price: 285, old_price: 340, img: IMG.pApple, rating: 4.8, category: "السلال", sub_category: "فواكه", source: "baskets", badge: "trending" },
  { id: "basket-veg", name: "سلة خضار طازجة", unit: "10 أنواع · 6 كجم", price: 220, img: IMG.pLettuce, rating: 4.7, category: "السلال", sub_category: "خضار", source: "baskets" },
  { id: "basket-breakfast", name: "سلة الإفطار الصباحي", unit: "حليب · بيض · جبن · عسل", price: 245, img: IMG.pMilk, rating: 4.8, category: "السلال", sub_category: "إفطار", source: "baskets", badge: "new" },
  { id: "basket-bbq", name: "سلة الشواء", unit: "لحم · دجاج · توابل · فحم", price: 980, img: IMG.pBeef, rating: 4.9, category: "السلال", sub_category: "مناسبات", source: "baskets", badge: "premium" },
  // Restaurants
  { id: "rest-koshary", name: "كشري المدينة الفاخر", brand: "مطعم المدينة", unit: "طبق كبير", price: 65, img: IMG.pBowl, rating: 4.8, category: "مطاعم", sub_category: "مصري", source: "restaurants", badge: "best", addons: mealAddons },
  { id: "rest-shawarma", name: "ساندويتش شاورما لحم", brand: "ركن الشام", unit: "ساندويتش جامبو", price: 95, img: IMG.pChicken, rating: 4.9, category: "مطاعم", sub_category: "شامي", source: "restaurants", badge: "trending", addons: mealAddons },
  { id: "rest-pizza", name: "بيتزا مارجريتا إيطالية", brand: "بيتزا توسكانا", unit: "وسط 30سم", price: 145, img: IMG.pRisotto, rating: 4.7, category: "مطاعم", sub_category: "إيطالي", source: "restaurants", variants: sizeVariants, addons: mealAddons },
  { id: "rest-burger", name: "برجر لحم بقري واجيو", brand: "برجر هاوس", unit: "وجبة + بطاطس + مشروب", price: 185, img: IMG.pBeef, rating: 4.8, category: "مطاعم", sub_category: "أمريكي", source: "restaurants", badge: "premium", addons: mealAddons },
  { id: "rest-sushi", name: "طبق سوشي مشكّل", brand: "ساكورا", unit: "16 قطعة", price: 320, img: IMG.pSalmon, rating: 4.9, category: "مطاعم", sub_category: "آسيوي", source: "restaurants", badge: "premium" },
  { id: "rest-grill", name: "مشكّل مشاوي على الفحم", brand: "مشاوي الريف", unit: "وجبة لشخصين", price: 420, img: IMG.pChicken, rating: 4.9, category: "مطاعم", sub_category: "مشويات", source: "restaurants", badge: "best", addons: mealAddons },
  // Meat
  { id: "meat-veal", name: "لحم بتلو طازج فاخر", unit: "كيلو", price: 480, img: IMG.pBeef, rating: 4.9, category: "لحوم ومجمدات", sub_category: "لحوم حمراء", source: "meat", badge: "premium", variants: weightVariants },
  { id: "meat-lamb", name: "ضأن بلدي طازج", unit: "كيلو", price: 520, img: IMG.pBeef, rating: 4.9, category: "لحوم ومجمدات", sub_category: "لحوم حمراء", source: "meat", badge: "best", variants: weightVariants },
  { id: "meat-whole-chicken", name: "دجاج بلدي كامل منظف", unit: "كيلو ونصف", price: 165, img: IMG.pChickenRaw, rating: 4.8, category: "لحوم ومجمدات", sub_category: "دواجن", source: "meat", badge: "trending" },
  { id: "meat-kofta", name: "كفتة لحم بلدي مفرومة", unit: "كيلو", price: 320, img: IMG.pBeef, rating: 4.7, category: "لحوم ومجمدات", sub_category: "مفرومات", source: "meat", variants: weightVariants },
  { id: "meat-fish", name: "سمك بلطي طازج", unit: "كيلو", price: 145, img: IMG.pSalmon, rating: 4.7, category: "لحوم ومجمدات", sub_category: "أسماك", source: "meat" },
  { id: "meat-shrimp", name: "جمبري جامبو مجمّد", unit: "علبة 1 كجم", price: 380, img: IMG.pSalmon, rating: 4.8, category: "لحوم ومجمدات", sub_category: "بحريات", source: "meat", badge: "premium" },
  { id: "meat-frozen-veg", name: "خضار مجمّدة مشكّلة", unit: "علبة 800غ", price: 65, img: IMG.pLettuce, rating: 4.6, category: "لحوم ومجمدات", sub_category: "مجمدات", source: "meat" },
  // Sweets
  { id: "cake-choco", name: "تورتة الشوكولاتة الفاخرة", unit: "1 كجم", price: 320, img: IMG.pCookies, rating: 4.9, category: "حلويات", sub_category: "تورتات", source: "sweets", badge: "best", variants: cakeSizeVariants, addons: cakeAddons },
  { id: "cake-cheese", name: "تشيز كيك الفراولة", unit: "علبة 8 شرائح", price: 285, img: IMG.pStrawberry, rating: 4.8, category: "حلويات", sub_category: "تورتات", source: "sweets", badge: "trending", variants: cakeSizeVariants, addons: cakeAddons },
  { id: "sweet-konafa", name: "كنافة بالقشطة بلدي", unit: "صينية متوسطة", price: 180, img: IMG.pCookies, rating: 4.9, category: "حلويات", sub_category: "شرقية", source: "sweets", badge: "premium", variants: sweetTrayVariants, addons: [{ id: "extra-nuts", label: "مكسرات إضافية", price: 15 }, { id: "gift-wrap", label: "تغليف هدية", price: 10 }] },
  { id: "sweet-baklava", name: "بقلاوة فستق حلبي", unit: "علبة 500غ", price: 220, img: IMG.pCookies, rating: 4.8, category: "حلويات", sub_category: "شرقية", source: "sweets", variants: weightVariants, addons: [{ id: "gift-wrap", label: "تغليف هدية", price: 10 }] },
  { id: "sweet-macaron", name: "ماكرون فرنسي مشكّل", unit: "علبة 12 قطعة", price: 165, img: IMG.pCookies, rating: 4.7, category: "حلويات", sub_category: "غربية", source: "sweets", badge: "new", variants: [{ id: "mac-6", label: "علبة 6 قطع", priceDelta: -70 }, { id: "mac-12", label: "علبة 12 قطعة", priceDelta: 0 }, { id: "mac-24", label: "علبة 24 قطعة", priceDelta: 140 }], addons: [{ id: "gift-wrap", label: "تغليف هدية", price: 10 }] },
  { id: "sweet-donuts", name: "دونتس مغطّس بالشوكولاتة", unit: "علبة 6 حبات", price: 95, img: IMG.pCookies, rating: 4.6, category: "حلويات", sub_category: "غربية", source: "sweets", variants: [{ id: "dn-6", label: "6 قطع", priceDelta: 0 }, { id: "dn-12", label: "12 قطعة", priceDelta: 80 }] },
  { id: "sweet-ice-gelato", name: "جيلاتو إيطالي", brand: "جيلاتو روما", unit: "علبة 500مل", price: 110, img: IMG.pIcecream, rating: 4.8, category: "حلويات", sub_category: "مثلجات", source: "sweets", badge: "trending", variants: [{ id: "ice-250", label: "250مل", priceDelta: -45 }, { id: "ice-500", label: "500مل", priceDelta: 0 }, { id: "ice-1000", label: "1 لتر", priceDelta: 95 }] },
  // Kitchen tools
  { id: "kt-pan-24", name: "مقلاة تيفال ٢٤سم", unit: "قطعة", price: 380, img: IMG.pUtensils, rating: 4.7, category: "ادوات المطبخ", sub_category: "مقالي وحلل", source: "kitchen" },
  { id: "kt-pot-4l", name: "حلة استانلس ٤ لتر", unit: "قطعة", price: 620, img: IMG.pUtensils, rating: 4.8, category: "ادوات المطبخ", sub_category: "مقالي وحلل", source: "kitchen", badge: "best" },
  { id: "kt-knife-chef", name: "سكين شيف ٢٠سم", unit: "قطعة", price: 320, img: IMG.pUtensils, rating: 4.9, category: "ادوات المطبخ", sub_category: "أدوات تقطيع", source: "kitchen" },
  { id: "kt-board", name: "لوح تقطيع خشبي", unit: "قطعة", price: 180, img: IMG.pUtensils, rating: 4.6, category: "ادوات المطبخ", sub_category: "أدوات تقطيع", source: "kitchen" },
  { id: "kt-whisk", name: "مضرب يدوي", unit: "قطعة", price: 90, img: IMG.pUtensils, rating: 4.5, category: "ادوات المطبخ", sub_category: "إكسسوارات", source: "kitchen" },
  { id: "kt-measure", name: "أكواب وملاعق قياس", unit: "طقم", price: 110, img: IMG.pUtensils, rating: 4.7, category: "ادوات المطبخ", sub_category: "إكسسوارات", source: "kitchen" },
  { id: "kt-bowl-cer", name: "بول تقديم سيراميك", unit: "قطعة", price: 140, img: IMG.pUtensils, rating: 4.6, category: "ادوات المطبخ", sub_category: "تقديم", source: "kitchen" },
  { id: "kt-tray-bake", name: "صينية فرن مينا", unit: "قطعة", price: 280, img: IMG.pUtensils, rating: 4.7, category: "ادوات المطبخ", sub_category: "أدوات فرن", source: "kitchen" },
];

async function uploadImage(filename) {
  const filepath = path.join(ASSETS, filename);
  const buf = await fs.readFile(filepath);
  const { error } = await supabase.storage.from(BUCKET).upload(filename, buf, {
    contentType: "image/jpeg", upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { url: data.publicUrl, path: filename };
}

async function main() {
  const uniqueImages = [...new Set(products.map((p) => p.img))];
  console.log(`Uploading ${uniqueImages.length} images to Storage...`);
  const urlMap = {};
  for (const f of uniqueImages) {
    const { url } = await uploadImage(f);
    urlMap[f] = url;
    console.log(`  ✓ ${f}`);
  }

  console.log(`\nUpserting ${products.length} products...`);
  const rows = products.map((p) => ({
    id: p.id, name: p.name, brand: p.brand ?? null, unit: p.unit,
    price: p.price, old_price: p.old_price ?? null,
    image: urlMap[p.img], image_url: urlMap[p.img], image_path: p.img,
    rating: p.rating ?? null,
    category: p.category, sub_category: p.sub_category ?? null,
    source: p.source, badge: p.badge ?? null,
    stock: 100, is_active: true, sort_order: 0,
    variants: p.variants ?? null, addons: p.addons ?? null,
    perishable: null,
  }));

  // upsert in chunks of 30
  for (let i = 0; i < rows.length; i += 30) {
    const chunk = rows.slice(i, i + 30);
    const { error } = await supabase.from("products").upsert(chunk, { onConflict: "id" });
    if (error) { console.error(error); process.exit(1); }
    console.log(`  ✓ rows ${i + 1}–${i + chunk.length}`);
  }
  console.log("\nDone ✓");
}
main().catch((e) => { console.error(e); process.exit(1); });
