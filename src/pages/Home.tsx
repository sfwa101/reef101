import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

const sections: { to: "/store/supermarket" | "/store/kitchen" | "/store/dairy" | "/store/produce" | "/store/recipes" | "/store/pharmacy"; title: string; sub: string }[] = [
  { to: "/store/supermarket", title: "السوبرماركت", sub: "كل احتياجاتك اليومية" },
  { to: "/store/kitchen", title: "المطبخ الجاهز", sub: "وجبات منزلية طازجة" },
  { to: "/store/dairy", title: "الألبان والأجبان", sub: "من المزرعة لباب البيت" },
  { to: "/store/produce", title: "الخضار والفاكهة", sub: "موسمية وطازجة" },
  { to: "/store/recipes", title: "وصفات بالمكونات", sub: "اطبخ من غير حسابات" },
  { to: "/store/pharmacy", title: "العطارة", sub: "الأعشاب والعطور الطبيعية" },
];

const HomePage = () => {
  return (
    <div className="space-y-6 pt-2">
      <section className="glass-tinted rounded-[2rem] p-5 shadow-tile animate-float-up">
        <p className="text-xs font-semibold text-primary/80">أهلاً بك في</p>
        <h2 className="font-display text-2xl font-extrabold text-foreground mt-1">ريف المدينة</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          عبق الريف داخل المدينة — منتجات طبيعية وطازجة توصل لباب بيتك.
        </p>
        <Link
          to="/sections"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-pill ease-apple transition hover:opacity-95"
        >
          تصفّح الأقسام
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </section>

      <section>
        <h3 className="font-display text-base font-bold text-foreground mb-3">أقسامنا</h3>
        <div className="grid grid-cols-2 gap-3">
          {sections.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="glass-strong rounded-3xl p-4 shadow-soft transition active:scale-[0.98] ease-apple"
            >
              <p className="font-display text-sm font-bold text-foreground">{s.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.sub}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
