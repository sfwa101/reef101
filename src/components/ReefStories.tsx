import { Link } from "@tanstack/react-router";

type Story = {
  id: string;
  title: string;
  emoji: string;
  to: string;
  search?: Record<string, string>;
  ringFrom: string; // hsl tuple e.g. "var(--primary)"
  ringTo: string;
};

const stories: Story[] = [
  { id: "flash", title: "عروض فلاش", emoji: "⚡️", to: "/offers", ringFrom: "0 84% 58%", ringTo: "36 100% 60%" },
  { id: "fresh", title: "طازج من المزرعة", emoji: "🥩", to: "/store/meat", ringFrom: "var(--primary)", ringTo: "var(--accent)" },
  { id: "chef", title: "جديد الشيف", emoji: "👨‍🍳", to: "/store/recipes", search: { tag: "" }, ringFrom: "265 70% 60%", ringTo: "var(--primary)" },
  { id: "baskets", title: "سلال الأسبوع", emoji: "🧺", to: "/store/baskets", ringFrom: "var(--primary)", ringTo: "138 60% 55%" },
  { id: "village", title: "خيرات الريف", emoji: "🌾", to: "/store/village", ringFrom: "36 80% 55%", ringTo: "var(--primary)" },
  { id: "kitchen", title: "وجبات سريعة", emoji: "🍽️", to: "/store/kitchen", ringFrom: "var(--accent)", ringTo: "0 70% 55%" },
  { id: "sweets", title: "حلويات اليوم", emoji: "🧁", to: "/store/sweets", ringFrom: "330 80% 70%", ringTo: "36 95% 60%" },
];

const wrapHsl = (v: string) => (v.startsWith("var(") ? `hsl(${v})` : `hsl(${v})`);

/**
 * Instagram-style horizontal stories rail under the search bar.
 * Each ring uses a colorful gradient and points to a curated section.
 */
const ReefStories = () => {
  return (
    <section
      className="-mx-4 px-4 animate-float-up"
      style={{ animationDelay: "100ms" }}
      aria-label="قصص ريف"
    >
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-1">
        {stories.map((s) => {
          const ring = `linear-gradient(135deg, ${wrapHsl(s.ringFrom)}, ${wrapHsl(s.ringTo)})`;
          return (
            <Link
              key={s.id}
              to={s.to}
              search={s.search as never}
              className="group flex w-[68px] shrink-0 snap-start flex-col items-center gap-1.5"
            >
              <span
                className="flex h-[64px] w-[64px] items-center justify-center rounded-full p-[2.5px] shadow-soft transition active:scale-95"
                style={{ background: ring }}
              >
                <span className="flex h-full w-full items-center justify-center rounded-full bg-card text-2xl ring-2 ring-card">
                  {s.emoji}
                </span>
              </span>
              <span className="line-clamp-1 text-center text-[10px] font-bold text-foreground/80">
                {s.title}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ReefStories;