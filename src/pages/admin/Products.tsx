import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Search, Package, Image as ImageIcon, Pencil, Trash2, Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductEditor, type ProductRow } from "@/components/admin/ProductEditor";
import { toast } from "sonner";
import { runMegaSeed } from "@/lib/megaSeed";

type Category = { id: string; name: string; icon: string | null };

export default function Products() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [fixingImages, setFixingImages] = useState(false);

  // Keyword-based image matcher: لكل منتج صورة مناسبة لاسمه
  const KEYWORD_IMAGES: { keys: string[]; url: string }[] = [
    { keys: ["زيت", "سمن", "oil"], url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80" },
    { keys: ["أرز", "ارز", "rice"], url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80" },
    { keys: ["مكرونة", "مكرونه", "اسباجتي", "إسباجتي", "pasta"], url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80" },
    { keys: ["سكر", "sugar"], url: "https://images.unsplash.com/photo-1610137310793-f02e2e553d1a?auto=format&fit=crop&w=600&q=80" },
    { keys: ["ملح", "salt"], url: "https://images.unsplash.com/photo-1518110925495-b37653e75e7e?auto=format&fit=crop&w=600&q=80" },
    { keys: ["دقيق", "طحين", "flour"], url: "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?auto=format&fit=crop&w=600&q=80" },
    { keys: ["شاي", "tea"], url: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80" },
    { keys: ["قهوة", "قهوه", "بن", "نسكافيه", "coffee"], url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80" },
    { keys: ["عصير", "juice"], url: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80" },
    { keys: ["مياه", "ماء", "water"], url: "https://images.unsplash.com/photo-1564725075388-cc5e9bbb2a76?auto=format&fit=crop&w=600&q=80" },
    { keys: ["كولا", "بيبسي", "سبرايت", "صودا", "غازي", "cola"], url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80" },
    { keys: ["شيبس", "بيج", "سناك", "chips"], url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80" },
    { keys: ["شوكولا", "شيكولا", "كاكاو", "chocolate"], url: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=600&q=80" },
    { keys: ["بسكويت", "بسكوت", "كوكيز", "biscuit"], url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80" },
    { keys: ["كيك", "كعك", "cake"], url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80" },
    { keys: ["كنافة", "بقلاوة", "بسبوسة", "حلاوة", "حلويات"], url: "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=600&q=80" },
    { keys: ["عسل", "honey"], url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=600&q=80" },
    { keys: ["مربى", "jam"], url: "https://images.unsplash.com/photo-1597528380144-5f95293c5d09?auto=format&fit=crop&w=600&q=80" },
    { keys: ["حليب", "لبن", "milk"], url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80" },
    { keys: ["زبادي", "روب", "yogurt"], url: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=600&q=80" },
    { keys: ["جبن", "جبنة", "cheese"], url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80" },
    { keys: ["زبدة", "butter"], url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80" },
    { keys: ["قشطة", "قشده", "cream"], url: "https://images.unsplash.com/photo-1626078299034-94d6ee07ecb8?auto=format&fit=crop&w=600&q=80" },
    { keys: ["بيض", "egg"], url: "https://images.unsplash.com/photo-1518569656558-1f25e69d93d7?auto=format&fit=crop&w=600&q=80" },
    { keys: ["لحم", "لحمة", "كندوز", "بقري", "beef"], url: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=600&q=80" },
    { keys: ["دجاج", "فراخ", "chicken"], url: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80" },
    { keys: ["سمك", "أسماك", "اسماك", "بلطي", "fish"], url: "https://images.unsplash.com/photo-1535007813616-79dc02ba4021?auto=format&fit=crop&w=600&q=80" },
    { keys: ["جمبري", "روبيان", "shrimp"], url: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80" },
    { keys: ["كبدة", "كبده"], url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80" },
    { keys: ["نقانق", "سجق", "هوت دوج", "sausage"], url: "https://images.unsplash.com/photo-1601565124284-2e1c6800a673?auto=format&fit=crop&w=600&q=80" },
    { keys: ["طماطم", "بندورة", "tomato"], url: "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=600&q=80" },
    { keys: ["بطاطس", "بطاطا", "potato"], url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80" },
    { keys: ["بصل", "onion"], url: "https://images.unsplash.com/photo-1620574387735-3624d75b2dbc?auto=format&fit=crop&w=600&q=80" },
    { keys: ["ثوم", "garlic"], url: "https://images.unsplash.com/photo-1615477550927-6ec8888d5a07?auto=format&fit=crop&w=600&q=80" },
    { keys: ["جزر", "carrot"], url: "https://images.unsplash.com/photo-1582515073490-39981397c445?auto=format&fit=crop&w=600&q=80" },
    { keys: ["خيار", "cucumber"], url: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=80" },
    { keys: ["فلفل", "pepper"], url: "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=600&q=80" },
    { keys: ["باذنجان", "eggplant"], url: "https://images.unsplash.com/photo-1601648764658-cf37e8c89b70?auto=format&fit=crop&w=600&q=80" },
    { keys: ["كوسة"], url: "https://images.unsplash.com/photo-1583687355032-89b902b7335f?auto=format&fit=crop&w=600&q=80" },
    { keys: ["خس", "lettuce", "جرجير", "سبانخ"], url: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80" },
    { keys: ["ملوخية"], url: "https://images.unsplash.com/photo-1607301406259-dfb186e15de7?auto=format&fit=crop&w=600&q=80" },
    { keys: ["تفاح", "apple"], url: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=600&q=80" },
    { keys: ["موز", "banana"], url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=600&q=80" },
    { keys: ["برتقال", "يوسفي", "orange"], url: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=600&q=80" },
    { keys: ["مانجو", "mango"], url: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&w=600&q=80" },
    { keys: ["عنب", "grape"], url: "https://images.unsplash.com/photo-1599819177626-b8e5f1d61937?auto=format&fit=crop&w=600&q=80" },
    { keys: ["فراولة", "strawberry"], url: "https://images.unsplash.com/photo-1543528176-61b239494933?auto=format&fit=crop&w=600&q=80" },
    { keys: ["بطيخ", "watermelon"], url: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=600&q=80" },
    { keys: ["شمام", "كانتالوب"], url: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50?auto=format&fit=crop&w=600&q=80" },
    { keys: ["تين", "fig"], url: "https://images.unsplash.com/photo-1601379329542-31c59cf5e1c4?auto=format&fit=crop&w=600&q=80" },
    { keys: ["بلح", "تمر", "date"], url: "https://images.unsplash.com/photo-1609501676725-7186f017a4b7?auto=format&fit=crop&w=600&q=80" },
    { keys: ["ليمون", "lemon"], url: "https://images.unsplash.com/photo-1582287014914-1db836ad12b9?auto=format&fit=crop&w=600&q=80" },
    { keys: ["فول", "بسلة", "حمص", "عدس", "فاصوليا", "لوبيا"], url: "https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=600&q=80" },
    { keys: ["خبز", "عيش", "توست", "bread"], url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" },
    { keys: ["دواء", "أقراص", "اقراص", "شراب", "كبسول", "مرهم", "كريم", "فيتامين", "بنادول", "كونجستال"], url: "https://images.unsplash.com/photo-1584308666744-24d5e4a8b792?auto=format&fit=crop&w=600&q=80" },
    { keys: ["شامبو", "صابون", "معجون", "فرشاة", "منظف", "مسحوق", "غسيل"], url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80" },
    { keys: ["كراسة", "كراس", "قلم", "دفتر", "كتاب", "مسطرة", "ألوان", "الوان"], url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80" },
    { keys: ["كشري", "بيتزا", "برجر", "ساندوتش", "شاورما", "وجبة", "وجبه"], url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80" },
    { keys: ["سلة", "باسكت", "basket"], url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80" },
  ];

  const SOURCE_POOL: Record<string, string[]> = {
    supermarket: [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80",
    ],
    produce: [
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=600&q=80",
    ],
    meat: [
      "https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80",
    ],
    dairy: [
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80",
    ],
    sweets: [
      "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
    ],
    pharmacy: [
      "https://images.unsplash.com/photo-1584308666744-24d5e4a8b792?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=600&q=80",
    ],
    library: ["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80"],
    restaurants: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"],
    recipes: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"],
    baskets: ["https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"],
  };
  const FIX_IMAGE_DEFAULT = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80";

  const pickImageFor = (name: string, source: string | null, idx: number): string => {
    const n = (name || "").toLowerCase();
    for (const entry of KEYWORD_IMAGES) {
      if (entry.keys.some((k) => n.includes(k.toLowerCase()))) return entry.url;
    }
    const pool = SOURCE_POOL[(source ?? "").toLowerCase()];
    if (pool && pool.length) return pool[idx % pool.length];
    return FIX_IMAGE_DEFAULT;
  };

  const handleFixImages = async () => {
    if (!confirm("سيتم توليد صورة فريدة لكل منتج. متابعة؟")) return;
    setFixingImages(true);
    const t = toast.loading("جاري إصلاح الصور…");
    try {
      const KEYWORDS: Record<string, string> = {
        supermarket: "groceries,snacks",
        produce: "vegetables,fruits",
        meat: "raw,meat,chicken",
        dairy: "dairy,milk,cheese",
        sweets: "desserts,pastry",
        pharmacy: "pills,pharmacy",
        library: "stationery,books",
        restaurants: "cooked,meals",
        recipes: "food,recipe",
        baskets: "basket,harvest",
        wholesale: "boxes,warehouse",
      };

      const { data, error } = await supabase.from("products").select("id, source").limit(5000);
      if (error) throw error;
      const allProducts = data ?? [];
      const total = allProducts.length;
      let updated = 0;
      const errors: string[] = [];

      for (let i = 0; i < allProducts.length; i += 50) {
        const chunk = allProducts.slice(i, i + 50);
        toast.loading(`جاري إصلاح الصور… ${updated}/${total}`, { id: t });

        await Promise.all(
          chunk.map(async (product, idx) => {
            const globalIdx = i + idx;
            const sourceKey = (product.source || "").toLowerCase();
            const keyword = KEYWORDS[sourceKey] || "product";
            const uniqueUrl = `https://loremflickr.com/600/600/${keyword}?lock=${globalIdx}`;

            const { error: upErr } = await supabase
              .from("products")
              .update({ image_url: uniqueUrl, image: uniqueUrl })
              .eq("id", product.id);

            if (upErr) errors.push(upErr.message);
            else updated++;
          })
        );
      }

      toast.dismiss(t);
      if (errors.length > 0) toast.error(`تم: ${updated} • فشل: ${errors.length}`);
      else toast.success(`✨ تم إصلاح ${updated} صورة فريدة بنجاح`);
      await load();
    } catch (e) {
      toast.dismiss(t);
      toast.error("فشل الإصلاح: " + (e as Error).message);
    } finally {
      setFixingImages(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("سيتم حقن كتالوج السوبر ماركت المحلي المصري. متابعة؟")) return;
    setSeeding(true);
    const t = toast.loading("جاري حقن منتجات السوبر ماركت…");
    try {
      // كتالوج محلي مصري — السوبر ماركت
      type SeedItem = { name: string; brand?: string; sub: string; price: number; old?: number; stock?: number };
      const items: SeedItem[] = [
        // مشروبات — توب كولا (نكهات)
        { name: "توب كولا تفاح 330مل", brand: "توب كولا", sub: "مشروبات", price: 8, old: 10, stock: 200 },
        { name: "توب كولا ليمون 330مل", brand: "توب كولا", sub: "مشروبات", price: 8, old: 10, stock: 200 },
        { name: "توب كولا برتقال 330مل", brand: "توب كولا", sub: "مشروبات", price: 8, old: 10, stock: 200 },
        { name: "توب كولا أناناس 330مل", brand: "توب كولا", sub: "مشروبات", price: 8, old: 10, stock: 200 },
        { name: "توب كولا تفاح 1 لتر", brand: "توب كولا", sub: "مشروبات", price: 18, stock: 120 },
        { name: "توب كولا ليمون 1 لتر", brand: "توب كولا", sub: "مشروبات", price: 18, stock: 120 },
        { name: "سينا كولا 330مل", brand: "سينا كولا", sub: "مشروبات", price: 9, stock: 180 },
        { name: "سينا كولا 1 لتر", brand: "سينا كولا", sub: "مشروبات", price: 20, stock: 100 },
        { name: "سينا كولا 2 لتر", brand: "سينا كولا", sub: "مشروبات", price: 32, stock: 80 },
        { name: "مياه داش 600 مل", brand: "داش", sub: "مشروبات", price: 5, stock: 300 },
        { name: "مياه داش 1.5 لتر", brand: "داش", sub: "مشروبات", price: 10, stock: 200 },
        { name: "مياه داش 19 لتر", brand: "داش", sub: "مشروبات", price: 35, stock: 50 },
        { name: "شاي العروسة 40 جم", brand: "العروسة", sub: "مشروبات", price: 12, stock: 150 },
        { name: "شاي العروسة 100 جم", brand: "العروسة", sub: "مشروبات", price: 28, stock: 120 },
        { name: "شاي العروسة 250 جم", brand: "العروسة", sub: "مشروبات", price: 65, old: 75, stock: 80 },

        // تسالي
        { name: "تايجر شطة 25 جم", brand: "تايجر", sub: "تسالي", price: 5, stock: 250 },
        { name: "تايجر جبنة 25 جم", brand: "تايجر", sub: "تسالي", price: 5, stock: 250 },
        { name: "تايجر ملح 25 جم", brand: "تايجر", sub: "تسالي", price: 5, stock: 250 },
        { name: "بيج شيبس بطاطس ملح 30 جم", brand: "بيج شيبس", sub: "تسالي", price: 7, stock: 200 },
        { name: "بيج شيبس بطاطس شطة 30 جم", brand: "بيج شيبس", sub: "تسالي", price: 7, stock: 200 },
        { name: "توبس جبنة 25 جم", brand: "توبس", sub: "تسالي", price: 5, stock: 220 },
        { name: "توبس شطة 25 جم", brand: "توبس", sub: "تسالي", price: 5, stock: 220 },
        { name: "كاراتيه ذرة 30 جم", brand: "كاراتيه", sub: "تسالي", price: 5, stock: 240 },
        { name: "برافو شيبس بطاطس 35 جم", brand: "برافو", sub: "تسالي", price: 6, stock: 200 },

        // غذائية أساسية
        { name: "مكرونة الملكة اسباجتي 400 جم", brand: "الملكة", sub: "غذائية أساسية", price: 18, stock: 180 },
        { name: "مكرونة الملكة شعرية 400 جم", brand: "الملكة", sub: "غذائية أساسية", price: 18, stock: 180 },
        { name: "مكرونة الملكة كوع 400 جم", brand: "الملكة", sub: "غذائية أساسية", price: 18, stock: 180 },
        { name: "مكرونة المصرية اسباجتي 400 جم", brand: "المصرية", sub: "غذائية أساسية", price: 17, stock: 200 },
        { name: "مكرونة المصرية بنّة 400 جم", brand: "المصرية", sub: "غذائية أساسية", price: 17, stock: 180 },
        { name: "أرز الضحى 1 كجم", brand: "الضحى", sub: "غذائية أساسية", price: 38, old: 42, stock: 250 },
        { name: "أرز الضحى 5 كجم", brand: "الضحى", sub: "غذائية أساسية", price: 180, old: 200, stock: 80 },
        { name: "أرز ريم 1 كجم", brand: "ريم", sub: "غذائية أساسية", price: 36, stock: 200 },
        { name: "أرز ريم 5 كجم", brand: "ريم", sub: "غذائية أساسية", price: 175, stock: 60 },
        { name: "زيت هلا عباد الشمس 800 مل", brand: "هلا", sub: "غذائية أساسية", price: 75, old: 85, stock: 150 },
        { name: "زيت هلا عباد الشمس 1.5 لتر", brand: "هلا", sub: "غذائية أساسية", price: 135, stock: 100 },
        { name: "زيت عباد الشمس 800 مل", brand: "عافية", sub: "غذائية أساسية", price: 78, stock: 120 },
        { name: "سمن كريستال 1 كجم", brand: "كريستال", sub: "غذائية أساسية", price: 110, stock: 90 },
        { name: "سمن كريستال 2 كجم", brand: "كريستال", sub: "غذائية أساسية", price: 215, stock: 50 },
        { name: "سمن روابي 1 كجم", brand: "روابي", sub: "غذائية أساسية", price: 105, stock: 80 },

        // ألبان
        { name: "حليب جهينة كامل الدسم 1 لتر", brand: "جهينة", sub: "ألبان", price: 32, stock: 150 },
        { name: "حليب جهينة قليل الدسم 1 لتر", brand: "جهينة", sub: "ألبان", price: 32, stock: 150 },
        { name: "حليب لمار 1 لتر", brand: "لمار", sub: "ألبان", price: 30, stock: 140 },
        { name: "حليب لمار 200 مل", brand: "لمار", sub: "ألبان", price: 8, stock: 250 },
        { name: "جبنة عبور لاند مثلثات 8 قطع", brand: "عبور لاند", sub: "ألبان", price: 22, stock: 180 },
        { name: "جبنة عبور لاند بيضاء 500 جم", brand: "عبور لاند", sub: "ألبان", price: 55, stock: 120 },
        { name: "جبنة دومتي مثلثات 8 قطع", brand: "دومتي", sub: "ألبان", price: 24, stock: 180 },
        { name: "جبنة دومتي قريش 200 جم", brand: "دومتي", sub: "ألبان", price: 18, stock: 150 },
        { name: "زبادي مزارع دينا 170 جم", brand: "مزارع دينا", sub: "ألبان", price: 9, stock: 250 },
        { name: "زبادي مزارع دينا 1 كجم", brand: "مزارع دينا", sub: "ألبان", price: 38, stock: 100 },

        // منظفات
        { name: "أوكسي مسحوق غسيل 2.5 كجم", brand: "أوكسي", sub: "منظفات", price: 95, old: 110, stock: 120 },
        { name: "أوكسي مسحوق غسيل 5 كجم", brand: "أوكسي", sub: "منظفات", price: 175, stock: 80 },
        { name: "أوكسي جل غسيل 2 لتر", brand: "أوكسي", sub: "منظفات", price: 110, stock: 90 },
        { name: "صابون جوي سائل أطباق 750 مل", brand: "جوي", sub: "منظفات", price: 45, stock: 150 },
        { name: "صابون جوي سائل أطباق 1.25 لتر", brand: "جوي", sub: "منظفات", price: 70, stock: 120 },
        { name: "صابون كامينا قطعة 125 جم", brand: "كامينا", sub: "منظفات", price: 8, stock: 300 },
        { name: "كلوريل مبيض 1 لتر", brand: "كلوريل", sub: "منظفات", price: 22, stock: 200 },
        { name: "كلوريل مبيض 2.5 لتر", brand: "كلوريل", sub: "منظفات", price: 50, stock: 120 },
      ];

      const idBase = `sm-${Date.now()}`;
      const rows = items.map((it, idx) => {
        const uniqueUrl = `https://loremflickr.com/600/600/groceries,packaging?lock=${idx + 1}`;
        return {
          id: `${idBase}-${idx}`,
          name: it.name,
          brand: it.brand ?? null,
          unit: "قطعة",
          price: it.price,
          old_price: it.old ?? null,
          image: uniqueUrl,
          image_url: uniqueUrl,
          category: "السوبر ماركت",
          sub_category: it.sub,
          source: "supermarket",
          stock: it.stock ?? 100,
          is_active: true,
          sort_order: idx,
          fulfillment_type: "stock",
          affiliate_commission_pct: 0,
          metadata: {},
        };
      });

      let inserted = 0;
      const errors: string[] = [];
      for (let i = 0; i < rows.length; i += 25) {
        const chunk = rows.slice(i, i + 25);
        const { error } = await supabase.from("products").insert(chunk as never);
        if (error) errors.push(error.message);
        else inserted += chunk.length;
        toast.loading(`جاري الحقن… ${inserted}/${rows.length}`, { id: t });
      }

      toast.dismiss(t);
      if (errors.length > 0) toast.error(`تم: ${inserted}/${rows.length} — خطأ: ${errors[0]}`);
      else toast.success(`✨ تم حقن ${inserted} منتج سوبر ماركت بنجاح!`);
      await load();
    } catch (e) {
      toast.dismiss(t);
      toast.error("فشل الحقن: " + (e as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  const load = useCallback(async () => {
    setProducts(null);
    const [p, c, s] = await Promise.all([
      supabase.from("products").select("*").order("sort_order", { ascending: true }).limit(2000),
      supabase.from("categories").select("id,name,icon").order("sort_order"),
      supabase.from("stores").select("id,name").eq("is_active", true).order("name"),
    ]);
    setProducts((p.data ?? []) as ProductRow[]);
    setCategories((c.data ?? []) as Category[]);
    setStores((s.data ?? []) as { id: string; name: string }[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!products) return null;
    let r = products;
    if (cat !== "all") r = r.filter((p) => p.category === cat || p.category_id === cat);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      r = r.filter((p) => p.name.toLowerCase().includes(t) || (p.brand ?? "").toLowerCase().includes(t));
    }
    return r;
  }, [products, cat, q]);

  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, low: 0 };
    return {
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      low: products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 20).length,
    };
  }, [products]);

  const handleDelete = async (p: ProductRow) => {
    if (!confirm(`حذف "${p.name}"؟`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      toast.error("فشل الحذف: " + error.message);
      return;
    }
    toast.success("تم الحذف");
    load();
  };

  const handleToggle = async (p: ProductRow) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(p.is_active ? "تم إيقاف المنتج" : "تم تفعيل المنتج");
    load();
  };

  const cats = useMemo(() => {
    const set = new Set<string>();
    (products ?? []).forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  return (
    <>
      <MobileTopbar title="المنتجات" />
      <div className="px-4 lg:px-6 pt-2 pb-6 max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative w-full sm:flex-1 sm:w-auto">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن منتج (اسم/علامة)"
              className="w-full bg-surface-muted rounded-2xl h-11 pr-10 pl-4 text-[14px] placeholder:text-foreground-tertiary border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground flex items-center gap-1.5 press shadow-sm font-semibold text-[13px]"
          >
            <Plus className="h-4 w-4" />
            <span>جديد</span>
          </button>
          <button
            onClick={handleFixImages}
            disabled={fixingImages}
            className="h-11 px-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center gap-1.5 press shadow-sm font-semibold text-[12px] disabled:opacity-60"
            title="تحديث صور المنتجات الحالية"
          >
            <Wand2 className="h-4 w-4" />
            <span>{fixingImages ? "جاري…" : "إصلاح الصور"}</span>
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="h-11 px-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center gap-1.5 press shadow-sm font-semibold text-[12px] disabled:opacity-60"
            title="حقن كتالوج السوبر ماركت المصري"
          >
            <Sparkles className="h-4 w-4" />
            <span>{seeding ? "جاري…" : "حقن السوبر ماركت"}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l: "الإجمالي", v: stats.total, t: "text-foreground" },
            { l: "نشطة", v: stats.active, t: "text-success" },
            { l: "مخزون منخفض", v: stats.low, t: "text-warning" },
          ].map((s) => (
            <div key={s.l} className="bg-surface rounded-2xl border border-border/40 p-3 text-center">
              <p className={cn("font-display text-[22px] leading-none num", s.t)}>{fmtNum(s.v)}</p>
              <p className="text-[11px] text-foreground-tertiary mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto -mx-4 px-4 mb-4 no-scrollbar">
          <div className="inline-flex gap-1.5">
            <Pill active={cat === "all"} onClick={() => setCat("all")} icon="📦" label="الكل" />
            {cats.map((c) => (
              <Pill key={c} active={cat === c} onClick={() => setCat(c)} icon="•" label={c} />
            ))}
          </div>
        </div>

        {filtered === null ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-3xl p-10 text-center border border-border/40">
            <Package className="h-10 w-10 mx-auto text-foreground-tertiary mb-3" />
            <p className="font-display text-[16px] mb-1">لا توجد منتجات</p>
            <p className="text-[13px] text-foreground-secondary">أضف منتجاً جديداً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const lowStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) < 20;
              const out = (p.stock ?? 0) <= 0;
              const status = !p.is_active ? "archived" : out ? "out_of_stock" : "active";
              const statusBadge: Record<string, string> = {
                active: "bg-success/12 text-success",
                archived: "bg-foreground-tertiary/15 text-foreground-secondary",
                out_of_stock: "bg-destructive/12 text-destructive",
              };
              const statusLabel: Record<string, string> = { active: "نشط", archived: "موقوف", out_of_stock: "نفد" };
              return (
                <div key={p.id} className="text-right">
                  <IOSCard padded={false} className="overflow-hidden">
                    <button onClick={() => setEditing(p)} className="block w-full press">
                      <div className="aspect-square bg-gradient-to-br from-surface-muted to-secondary flex items-center justify-center relative">
                        {p.image_url || p.image ? (
                          <img src={p.image_url || p.image || ""} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-foreground-tertiary opacity-40" />
                        )}
                        <span className={cn("absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full", statusBadge[status])}>
                          {statusLabel[status]}
                        </span>
                      </div>
                      <div className="p-3 text-right">
                        <p className="text-[13.5px] font-semibold truncate mb-1">{p.name}</p>
                        <div className="flex items-baseline gap-1.5 mb-1.5">
                          <span className="font-display text-[15px] num tracking-tight">{fmtMoney(Number(p.price))}</span>
                          {p.old_price && Number(p.old_price) > Number(p.price) && (
                            <span className="text-[10.5px] text-foreground-tertiary line-through num">{fmtMoney(Number(p.old_price))}</span>
                          )}
                        </div>
                        <p className={cn("text-[11px]", lowStock ? "text-warning" : "text-foreground-tertiary")}>
                          المخزون: <span className="num font-semibold">{fmtNum(p.stock ?? 0)}</span> {p.unit}
                        </p>
                      </div>
                    </button>
                    <div className="flex border-t border-border/40">
                      <button onClick={() => setEditing(p)} className="flex-1 h-9 text-[12px] font-semibold text-primary press flex items-center justify-center gap-1">
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </button>
                      <button onClick={() => handleToggle(p)} className="flex-1 h-9 text-[12px] font-semibold text-foreground-secondary press border-r border-border/40">
                        {p.is_active ? "إيقاف" : "تفعيل"}
                      </button>
                      <button onClick={() => handleDelete(p)} className="h-9 w-10 text-destructive press border-r border-border/40 flex items-center justify-center">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </IOSCard>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sheet rendered at root level — escapes any card overflow/z-index trap */}
      <ProductEditor
        open={creating || !!editing}
        product={editing}
        categories={categories}
        stores={stores}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          load();
        }}
      />
    </>
  );
}

function Pill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 h-9 px-4 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-base press border",
        active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-surface text-foreground-secondary border-border/40",
      )}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
