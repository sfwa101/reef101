import FeatureTileGrid, { type FeatureTile } from "@/components/FeatureTileGrid";
import SmallSectionGrid from "@/components/SmallSectionGrid";
import { useNavigate } from "@tanstack/react-router";
import tileSupermarket from "@/assets/tile-supermarket.jpg";
import tileKitchen from "@/assets/tile-kitchen.jpg";
import tileDairy from "@/assets/tile-dairy.jpg";
import tileProduce from "@/assets/tile-produce.jpg";
import tileRecipes from "@/assets/tile-recipes.jpg";
import tileSubscription from "@/assets/tile-subscription.jpg";
import tileLibrary from "@/assets/tile-library.jpg";
import tilePharmacy from "@/assets/tile-pharmacy.jpg";
import tileWholesale from "@/assets/tile-wholesale.jpg";
import tileHome from "@/assets/tile-home.jpg";

const tiles: FeatureTile[] = [
  { id: "supermarket", title: "السوبرماركت", subtitle: "كل ما تحتاجه يوميًا", image: tileSupermarket, size: "lg", tone: "dark" },
  { id: "kitchen", title: "مطبخ ريف", subtitle: "وجبات طازجة كل يوم", image: tileKitchen, size: "md", tone: "dark" },
  { id: "wholesale", title: "ريف الجملة", subtitle: "وفّر بالحجم الكبير", image: tileWholesale, size: "md", tone: "dark" },
  { id: "produce", title: "الخضار والفواكه", subtitle: "حصاد اليوم", image: tileProduce, size: "lg", tone: "dark" },
  { id: "dairy", title: "الألبان", subtitle: "من المزرعة مباشرة", image: tileDairy, size: "md", tone: "light" },
  { id: "recipes", title: "وصفات الشيف", subtitle: "أسبوع من الإلهام", image: tileRecipes, size: "md", tone: "dark" },
  { id: "subscription", title: "اشتراكات الريف", subtitle: "وجبات بخطة ذكية", image: tileSubscription, size: "md", tone: "light" },
  { id: "library", title: "مكتبة الطلبة", subtitle: "قرطاسية وكتب", image: tileLibrary, size: "md", tone: "dark" },
  { id: "pharmacy", title: "الصيدلية", subtitle: "صحتك أولًا", image: tilePharmacy, size: "md", tone: "light" },
  { id: "home", title: "الأدوات المنزلية", subtitle: "كل ما يلزم بيتك", image: tileHome, size: "md", tone: "dark" },
];

const Sections = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <section className="animate-float-up">
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">الأقسام</h1>
        <p className="mt-1 text-xs text-muted-foreground">٩ متاجر مصغّرة داخل تطبيق واحد، بحساب وسلة موحّدة.</p>
      </section>
      <section className="animate-float-up" style={{ animationDelay: "80ms" }}>
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="font-display text-xl font-extrabold text-foreground">المتاجر داخل ريف</h2>
          <span className="text-[11px] font-medium text-muted-foreground">٩ تطبيقات</span>
        </div>
        <FeatureTileGrid tiles={tiles} onSelect={(id) => navigate({ to: `/store/${id}` as never })} />
      </section>
      <SmallSectionGrid />
      <p className="pt-4 text-center text-[11px] font-medium text-muted-foreground">ريف المدينة · عبق الريف داخل المدينة</p>
    </div>
  );
};

export default Sections;
