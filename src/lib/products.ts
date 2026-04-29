import pTomato from "@/assets/p-tomato.jpg";
import pMilk from "@/assets/p-milk.jpg";
import pBread from "@/assets/p-bread.jpg";
import pBanana from "@/assets/p-banana.jpg";
import pEggs from "@/assets/p-eggs.jpg";
import pChicken from "@/assets/p-grilled-chicken.jpg";
import pSalmon from "@/assets/p-salmon.jpg";
import pRisotto from "@/assets/p-risotto.jpg";
import pBowl from "@/assets/p-bowl.jpg";
import pMedicine from "@/assets/p-medicine.jpg";
import pBook from "@/assets/p-book.jpg";
import pApple from "@/assets/p-apple.jpg";
import pCucumber from "@/assets/p-cucumber.jpg";
import pOrange from "@/assets/p-orange.jpg";
import pStrawberry from "@/assets/p-strawberry.jpg";
import pLettuce from "@/assets/p-lettuce.jpg";
import pCheese from "@/assets/p-cheese.jpg";
import pYogurt from "@/assets/p-yogurt.jpg";
import pButter from "@/assets/p-butter.jpg";
import pRice from "@/assets/p-rice.jpg";
import pPasta from "@/assets/p-pasta.jpg";
import pJuice from "@/assets/p-juice.jpg";
import pWater from "@/assets/p-water.jpg";
import pCoffee from "@/assets/p-coffee.jpg";
import pCereal from "@/assets/p-cereal.jpg";
import pOil from "@/assets/p-oil.jpg";
import pBeef from "@/assets/p-beef.jpg";
import pChickenRaw from "@/assets/p-chicken-raw.jpg";
import pCookies from "@/assets/p-cookies.jpg";
import pDiapers from "@/assets/p-diapers.jpg";
import pShampoo from "@/assets/p-shampoo.jpg";
import pIcecream from "@/assets/p-icecream.jpg";
import pPetfood from "@/assets/p-petfood.jpg";
import pStationery from "@/assets/p-stationery.jpg";
import pNotebook from "@/assets/p-notebook.jpg";
import pPens from "@/assets/p-pens.jpg";
import pCleaner from "@/assets/p-cleaner.jpg";
import pUtensils from "@/assets/p-utensils.jpg";
import { subscriptionMeals } from "./subscriptionMeals";

export type ProductVariant = {
  id: string;
  label: string;
  priceDelta: number; // added/subtracted from base price
};
export type ProductAddon = {
  id: string;
  label: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  brand?: string;
  unit: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating?: number;
  category: string;
  subCategory?: string;
  source:
    | "supermarket" | "kitchen" | "dairy" | "produce" | "recipes"
    | "pharmacy" | "library" | "wholesale" | "home"
    | "village" | "baskets" | "restaurants" | "meat" | "sweets";
  badge?: "best" | "trending" | "premium" | "new";
  variants?: ProductVariant[];
  addons?: ProductAddon[];
};

const sizeVariants: ProductVariant[] = [
  { id: "s", label: "صغير", priceDelta: -5 },
  { id: "m", label: "وسط", priceDelta: 0 },
  { id: "l", label: "كبير", priceDelta: 12 },
];
const weightVariants: ProductVariant[] = [
  { id: "500", label: "500غ", priceDelta: -8 },
  { id: "1000", label: "1 كجم", priceDelta: 0 },
  { id: "2000", label: "2 كجم", priceDelta: 18 },
];
const mealAddons: ProductAddon[] = [
  { id: "extra-sauce", label: "صلصة إضافية", price: 8 },
  { id: "extra-cheese", label: "جبنة إضافية", price: 12 },
  { id: "side-salad", label: "سلطة جانبية", price: 18 },
  { id: "drink", label: "مشروب", price: 14 },
];
const groceryAddons: ProductAddon[] = [
  { id: "gift-wrap", label: "تغليف هدية", price: 10 },
  { id: "express", label: "توصيل سريع 30 د", price: 15 },
];

export const products: Product[] = [
  // ========== Produce ==========
  { id: "tomato", name: "طماطم بلدي طازجة", unit: "كيلو", price: 18, oldPrice: 22, image: pTomato, rating: 4.8, category: "الخضار والفواكه", subCategory: "خضار طازجة", source: "produce", badge: "best", variants: weightVariants, addons: groceryAddons },
  { id: "cucumber", name: "خيار طازج", unit: "كيلو", price: 14, image: pCucumber, rating: 4.7, category: "الخضار والفواكه", subCategory: "خضار طازجة", source: "produce", variants: weightVariants },
  { id: "lettuce", name: "خس وخضروات ورقية", unit: "حزمة", price: 12, image: pLettuce, rating: 4.6, category: "الخضار والفواكه", subCategory: "خضروات ورقية", source: "produce" },
  { id: "banana", name: "موز إكوادوري", unit: "كيلو", price: 32, image: pBanana, rating: 4.7, category: "الخضار والفواكه", subCategory: "فواكه طازجة", source: "produce", badge: "trending", variants: weightVariants },
  { id: "apple", name: "تفاح أحمر مستورد", unit: "كيلو", price: 45, oldPrice: 55, image: pApple, rating: 4.9, category: "الخضار والفواكه", subCategory: "فواكه طازجة", source: "produce", badge: "best", variants: weightVariants },
  { id: "orange", name: "برتقال أبو سرّة", unit: "كيلو", price: 28, image: pOrange, rating: 4.8, category: "الخضار والفواكه", subCategory: "حمضيات", source: "produce", variants: weightVariants },
  { id: "strawberry", name: "فراولة طازجة", unit: "علبة 500غ", price: 38, image: pStrawberry, rating: 4.9, category: "الخضار والفواكه", subCategory: "توت وفواكه حمراء", source: "produce", badge: "premium" },

  // ========== Dairy ==========
  { id: "milk", name: "حليب طازج كامل الدسم", brand: "مزرعة الريف", unit: "1 لتر", price: 45, image: pMilk, rating: 4.9, category: "الألبان والبيض", subCategory: "حليب", source: "dairy", badge: "best", variants: [{ id: "1l", label: "1 لتر", priceDelta: 0 }, { id: "2l", label: "2 لتر", priceDelta: 35 }] },
  { id: "cheese", name: "جبنة بيضاء طرية", brand: "مزرعة الريف", unit: "500غ", price: 95, image: pCheese, rating: 4.8, category: "الألبان والبيض", subCategory: "أجبان", source: "dairy", badge: "trending" },
  { id: "yogurt", name: "زبادي يوناني طبيعي", brand: "مزرعة الريف", unit: "كوب 200غ", price: 22, image: pYogurt, rating: 4.7, category: "الألبان والبيض", subCategory: "زبادي", source: "dairy" },
  { id: "butter", name: "زبدة بلدي طبيعية", brand: "مزرعة الريف", unit: "200غ", price: 65, image: pButter, rating: 4.8, category: "الألبان والبيض", subCategory: "زبدة", source: "dairy" },
  { id: "eggs", name: "بيض بلدي حر", brand: "مزرعة الريف", unit: "10 حبات", price: 55, oldPrice: 65, image: pEggs, rating: 4.8, category: "الألبان والبيض", subCategory: "بيض", source: "dairy", badge: "trending", variants: [{ id: "10", label: "10 حبات", priceDelta: 0 }, { id: "30", label: "30 حبة", priceDelta: 100 }] },

  // ========== Bakery ==========
  { id: "bread", name: "خبز ساوردو حرفي", unit: "رغيف 500غ", price: 38, image: pBread, rating: 4.6, category: "المخبوزات", subCategory: "خبز", source: "supermarket", badge: "premium" },
  { id: "cookies", name: "كوكيز شوكولاتة بالشوفان", unit: "علبة 12 قطعة", price: 48, image: pCookies, rating: 4.7, category: "المخبوزات", subCategory: "حلويات", source: "supermarket" },

  // ========== Meat ==========
  { id: "beef", name: "لحم بقري طازج", unit: "كيلو", price: 380, image: pBeef, rating: 4.9, category: "اللحوم والدواجن", subCategory: "لحوم حمراء", source: "supermarket", badge: "premium", variants: weightVariants },
  { id: "chicken-raw", name: "صدور دجاج بلدي", unit: "كيلو", price: 145, oldPrice: 165, image: pChickenRaw, rating: 4.8, category: "اللحوم والدواجن", subCategory: "دواجن", source: "supermarket", badge: "best", variants: weightVariants },

  // ========== Pantry ==========
  { id: "rice", name: "أرز بسمتي ممتاز", unit: "5 كجم", price: 285, image: pRice, rating: 4.8, category: "البقالة الجافة", subCategory: "أرز", source: "supermarket", badge: "best" },
  { id: "pasta", name: "مكرونة سباجيتي إيطالية", unit: "500غ", price: 32, image: pPasta, rating: 4.6, category: "البقالة الجافة", subCategory: "مكرونة", source: "supermarket" },
  { id: "oil", name: "زيت زيتون بكر ممتاز", unit: "1 لتر", price: 220, image: pOil, rating: 4.9, category: "البقالة الجافة", subCategory: "زيوت", source: "supermarket", badge: "premium" },
  { id: "cereal", name: "جرانولا بالتوت والمكسرات", unit: "علبة 400غ", price: 95, image: pCereal, rating: 4.7, category: "البقالة الجافة", subCategory: "حبوب الإفطار", source: "supermarket", badge: "new" },

  // ========== Drinks ==========
  { id: "juice", name: "عصير برتقال طازج", unit: "زجاجة 1 لتر", price: 38, image: pJuice, rating: 4.8, category: "المشروبات", subCategory: "عصائر", source: "supermarket", badge: "trending" },
  { id: "water", name: "مياه معدنية فاخرة", unit: "1.5 لتر", price: 12, image: pWater, rating: 4.5, category: "المشروبات", subCategory: "مياه", source: "supermarket" },
  { id: "coffee", name: "قهوة عربية محمصة", unit: "250غ بن", price: 145, image: pCoffee, rating: 4.9, category: "المشروبات", subCategory: "قهوة", source: "supermarket", badge: "premium" },

  // ========== Frozen ==========
  { id: "icecream", name: "آيس كريم فانيلا طبيعي", unit: "علبة 500مل", price: 75, image: pIcecream, rating: 4.7, category: "المجمدات", subCategory: "آيس كريم", source: "supermarket" },

  // ========== Baby ==========
  { id: "diapers", name: "حفاضات أطفال طبيعية", unit: "عبوة 40 قطعة", price: 165, image: pDiapers, rating: 4.8, category: "أطعمة الأطفال", subCategory: "حفاضات", source: "supermarket", variants: [{ id: "n", label: "حديثي الولادة", priceDelta: 0 }, { id: "s", label: "صغير", priceDelta: 0 }, { id: "m", label: "وسط", priceDelta: 10 }, { id: "l", label: "كبير", priceDelta: 20 }] },

  // ========== Personal Care ==========
  { id: "shampoo", name: "شامبو طبيعي بالأعشاب", unit: "زجاجة 400مل", price: 95, image: pShampoo, rating: 4.6, category: "العناية الشخصية", subCategory: "شامبو", source: "supermarket" },

  // ========== Pets ==========
  { id: "petfood", name: "طعام كلاب جاف فاخر", unit: "3 كجم", price: 285, image: pPetfood, rating: 4.8, category: "أغذية الحيوانات", subCategory: "طعام كلاب", source: "supermarket" },

  // ========== Kitchen (ready meals) ==========
  { id: "chicken", name: "دجاج مشوي بالأعشاب", unit: "وجبة كاملة", price: 145, image: pChicken, rating: 4.9, category: "وجبات", source: "kitchen", badge: "best", variants: sizeVariants, addons: mealAddons },
  { id: "salmon", name: "سلمون مشوي بالليمون", unit: "وجبة 350غ", price: 220, image: pSalmon, rating: 4.8, category: "وجبات", source: "kitchen", badge: "premium", variants: sizeVariants, addons: mealAddons },

  // ========== Recipes ==========
  { id: "risotto", name: "ريزوتو الفطر بالبارميزان", unit: "وصفة شيف · شخصين", price: 180, image: pRisotto, rating: 4.9, category: "وصفات", source: "recipes", badge: "trending" },
  { id: "bowl", name: "بول البحر المتوسط", unit: "وصفة صحية · شخص", price: 95, oldPrice: 120, image: pBowl, rating: 4.7, category: "وصفات", source: "recipes", badge: "new" },

  // ========== Pharmacy ==========
  { id: "vitamin", name: "فيتامين د3 5000 وحدة", brand: "ناتشورال", unit: "60 كبسولة", price: 185, image: pMedicine, rating: 4.8, category: "فيتامينات", source: "pharmacy", badge: "trending" },

  // ========== Library / Stationery ==========
  { id: "book", name: "قصة العلم — للأطفال", unit: "كتاب مصور", price: 75, image: pBook, rating: 4.9, category: "قصص", source: "library", badge: "new" },
  { id: "stationery", name: "طقم قرطاسية مدرسية شامل", unit: "طقم 25 قطعة", price: 245, image: pStationery, rating: 4.8, category: "قرطاسية", subCategory: "أطقم", source: "library", badge: "best" },
  { id: "notebook", name: "كشاكيل جلد فاخرة", unit: "حزمة 5 كشاكيل", price: 165, image: pNotebook, rating: 4.7, category: "قرطاسية", subCategory: "كشاكيل", source: "library", badge: "trending" },
  { id: "pens", name: "أقلام حبر فاخرة", unit: "علبة 12 قلم", price: 95, image: pPens, rating: 4.6, category: "قرطاسية", subCategory: "أقلام", source: "library" },

  // ========== Home Tools ==========
  { id: "cleaner", name: "بخاخ تنظيف طبيعي", unit: "زجاجة 500مل", price: 65, image: pCleaner, rating: 4.7, category: "أدوات منزلية", subCategory: "تنظيف", source: "home", badge: "best" },
  { id: "utensils", name: "طقم أواني ستانلس", unit: "5 قطع", price: 850, oldPrice: 1100, image: pUtensils, rating: 4.9, category: "أدوات منزلية", subCategory: "مطبخ", source: "home", badge: "premium" },

  // ========== Village (منتجات القرية) ==========
  { id: "honey", name: "عسل نحل بلدي صافي", brand: "مناحل الريف", unit: "جرة 1 كجم", price: 320, oldPrice: 380, image: pButter, rating: 4.9, category: "خيرات الريف", subCategory: "عسل ومربى", source: "village", badge: "premium" },
  { id: "ghee", name: "سمن بلدي بقري", brand: "مزرعة الريف", unit: "1 كجم", price: 420, image: pButter, rating: 4.8, category: "خيرات الريف", subCategory: "ألبان بلدية", source: "village", badge: "best" },
  { id: "village-cheese", name: "جبنة قريش بلدية", brand: "مزرعة الريف", unit: "500غ", price: 75, image: pCheese, rating: 4.7, category: "خيرات الريف", subCategory: "ألبان بلدية", source: "village" },
  { id: "olives", name: "زيتون أخضر مخلل بلدي", unit: "علبة 1 كجم", price: 95, image: pOil, rating: 4.6, category: "خيرات الريف", subCategory: "مخللات", source: "village" },
  { id: "molasses", name: "عسل أسود بلدي", unit: "زجاجة 500غ", price: 110, image: pButter, rating: 4.7, category: "خيرات الريف", subCategory: "عسل ومربى", source: "village", badge: "trending" },
  { id: "village-eggs", name: "بيض بلدي حر مزرعة", brand: "مزرعة الريف", unit: "30 حبة", price: 145, image: pEggs, rating: 4.9, category: "خيرات الريف", subCategory: "ألبان بلدية", source: "village", badge: "best" },

  // ========== Baskets (سلال الريف) ==========
  { id: "basket-week", name: "سلة الأسبوع العائلية", unit: "12 صنف · يكفي 4 أفراد", price: 650, oldPrice: 780, image: pTomato, rating: 4.9, category: "السلال", subCategory: "أسبوعية", source: "baskets", badge: "best" },
  { id: "basket-fruit", name: "سلة فواكه موسمية", unit: "8 أنواع · 5 كجم", price: 285, oldPrice: 340, image: pApple, rating: 4.8, category: "السلال", subCategory: "فواكه", source: "baskets", badge: "trending" },
  { id: "basket-veg", name: "سلة خضار طازجة", unit: "10 أنواع · 6 كجم", price: 220, image: pLettuce, rating: 4.7, category: "السلال", subCategory: "خضار", source: "baskets" },
  { id: "basket-breakfast", name: "سلة الإفطار الصباحي", unit: "حليب · بيض · جبن · عسل", price: 245, image: pMilk, rating: 4.8, category: "السلال", subCategory: "إفطار", source: "baskets", badge: "new" },
  { id: "basket-bbq", name: "سلة الشواء", unit: "لحم · دجاج · توابل · فحم", price: 980, image: pBeef, rating: 4.9, category: "السلال", subCategory: "مناسبات", source: "baskets", badge: "premium" },

  // ========== Restaurants (مطاعم مختارة) ==========
  { id: "rest-koshary", name: "كشري المدينة الفاخر", brand: "مطعم المدينة", unit: "طبق كبير", price: 65, image: pBowl, rating: 4.8, category: "مطاعم", subCategory: "مصري", source: "restaurants", badge: "best", addons: mealAddons },
  { id: "rest-shawarma", name: "ساندويتش شاورما لحم", brand: "ركن الشام", unit: "ساندويتش جامبو", price: 95, image: pChicken, rating: 4.9, category: "مطاعم", subCategory: "شامي", source: "restaurants", badge: "trending", addons: mealAddons },
  { id: "rest-pizza", name: "بيتزا مارجريتا إيطالية", brand: "بيتزا توسكانا", unit: "وسط 30سم", price: 145, image: pRisotto, rating: 4.7, category: "مطاعم", subCategory: "إيطالي", source: "restaurants", variants: sizeVariants, addons: mealAddons },
  { id: "rest-burger", name: "برجر لحم بقري واجيو", brand: "برجر هاوس", unit: "وجبة + بطاطس + مشروب", price: 185, image: pBeef, rating: 4.8, category: "مطاعم", subCategory: "أمريكي", source: "restaurants", badge: "premium", addons: mealAddons },
  { id: "rest-sushi", name: "طبق سوشي مشكّل", brand: "ساكورا", unit: "16 قطعة", price: 320, image: pSalmon, rating: 4.9, category: "مطاعم", subCategory: "آسيوي", source: "restaurants", badge: "premium" },
  { id: "rest-grill", name: "مشكّل مشاوي على الفحم", brand: "مشاوي الريف", unit: "وجبة لشخصين", price: 420, image: pChicken, rating: 4.9, category: "مطاعم", subCategory: "مشويات", source: "restaurants", badge: "best", addons: mealAddons },

  // ========== Meat & Frozen (اللحوم والمجمدات) ==========
  { id: "meat-veal", name: "لحم بتلو طازج فاخر", unit: "كيلو", price: 480, image: pBeef, rating: 4.9, category: "لحوم ومجمدات", subCategory: "لحوم حمراء", source: "meat", badge: "premium", variants: weightVariants },
  { id: "meat-lamb", name: "ضأن بلدي طازج", unit: "كيلو", price: 520, image: pBeef, rating: 4.9, category: "لحوم ومجمدات", subCategory: "لحوم حمراء", source: "meat", badge: "best", variants: weightVariants },
  { id: "meat-whole-chicken", name: "دجاج بلدي كامل منظف", unit: "كيلو ونصف", price: 165, image: pChickenRaw, rating: 4.8, category: "لحوم ومجمدات", subCategory: "دواجن", source: "meat", badge: "trending" },
  { id: "meat-kofta", name: "كفتة لحم بلدي مفرومة", unit: "كيلو", price: 320, image: pBeef, rating: 4.7, category: "لحوم ومجمدات", subCategory: "مفرومات", source: "meat", variants: weightVariants },
  { id: "meat-fish", name: "سمك بلطي طازج", unit: "كيلو", price: 145, image: pSalmon, rating: 4.7, category: "لحوم ومجمدات", subCategory: "أسماك", source: "meat" },
  { id: "meat-shrimp", name: "جمبري جامبو مجمّد", unit: "علبة 1 كجم", price: 380, image: pSalmon, rating: 4.8, category: "لحوم ومجمدات", subCategory: "بحريات", source: "meat", badge: "premium" },
  { id: "meat-frozen-veg", name: "خضار مجمّدة مشكّلة", unit: "علبة 800غ", price: 65, image: pLettuce, rating: 4.6, category: "لحوم ومجمدات", subCategory: "مجمدات", source: "meat" },

  // ========== Sweets & Cakes (الحلويات والتورتة) ==========
  { id: "cake-choco", name: "تورتة الشوكولاتة الفاخرة", unit: "1 كجم", price: 320, image: pCookies, rating: 4.9, category: "حلويات", subCategory: "تورتات", source: "sweets", badge: "best", variants: sizeVariants },
  { id: "cake-cheese", name: "تشيز كيك الفراولة", unit: "علبة 8 شرائح", price: 285, image: pStrawberry, rating: 4.8, category: "حلويات", subCategory: "تورتات", source: "sweets", badge: "trending" },
  { id: "sweet-konafa", name: "كنافة بالقشطة بلدي", unit: "صينية متوسطة", price: 180, image: pCookies, rating: 4.9, category: "حلويات", subCategory: "شرقية", source: "sweets", badge: "premium" },
  { id: "sweet-baklava", name: "بقلاوة فستق حلبي", unit: "علبة 500غ", price: 220, image: pCookies, rating: 4.8, category: "حلويات", subCategory: "شرقية", source: "sweets" },
  { id: "sweet-macaron", name: "ماكرون فرنسي مشكّل", unit: "علبة 12 قطعة", price: 165, image: pCookies, rating: 4.7, category: "حلويات", subCategory: "غربية", source: "sweets", badge: "new" },
  { id: "sweet-donuts", name: "دونتس مغطّس بالشوكولاتة", unit: "علبة 6 حبات", price: 95, image: pCookies, rating: 4.6, category: "حلويات", subCategory: "غربية", source: "sweets" },
  { id: "sweet-ice-gelato", name: "جيلاتو إيطالي", brand: "جيلاتو روما", unit: "علبة 500مل", price: 110, image: pIcecream, rating: 4.8, category: "حلويات", subCategory: "مثلجات", source: "sweets", badge: "trending" },

  // ========== Subscription meals — also sold standalone in Kitchen at premium prices ==========
  // Subscribers pay subscriptionPrice (much lower). Standalone single-order price below
  // is intentionally ~75-85% higher to incentivize the subscription.
  ...subscriptionMeals.map<Product>((m) => ({
    id: `kitchen-${m.id}`,
    name: m.name,
    unit: `وجبة فردية · ${m.calories} سعرة`,
    price: m.standalonePrice,
    oldPrice: undefined,
    image: m.image,
    rating: 4.8,
    category: "وجبات",
    subCategory: "وجبات الاشتراك (طلب فردي)",
    source: "kitchen" as const,
    badge: "premium" as const,
    addons: mealAddons,
  })),
];

// Dynamically-generated product variants (e.g. wholesale bulk packs) register
// themselves here so getById can resolve them on the product detail page.
const extraProducts: Product[] = [];
export const registerProducts = (items: Product[]) => {
  for (const item of items) {
    if (!extraProducts.some((p) => p.id === item.id) && !products.some((p) => p.id === item.id)) {
      extraProducts.push(item);
    }
  }
};

export const getById = (id: string) =>
  products.find((p) => p.id === id) ?? extraProducts.find((p) => p.id === id);

export const byBadge = (badge: Product["badge"]) =>
  products.filter((p) => p.badge === badge);

export const bySource = (source: Product["source"]) =>
  products.filter((p) => p.source === source);

export const bySourceAndCategory = (source: Product["source"], category: string) =>
  products.filter((p) => p.source === source && p.category === category);
