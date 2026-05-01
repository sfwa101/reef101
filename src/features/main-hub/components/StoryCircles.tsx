/**
 * StoryCircles — Phase 26 stem cell.
 * Instagram-style circular discovery rail (Flash deals, Fresh, Chef's new).
 *
 * Each circle uses a gradient ring + emoji glyph for a tactile,
 * "billion-dollar" feel without heavy image assets.
 */
import { Link } from "@tanstack/react-router";
import { useUI } from "@/context/UIContext";

type Story = {
  id: string;
  title: string;
  emoji: string;
  to: string;
  ringFrom: string;
  ringTo: string;
};

const STORIES: Story[] = [
  { id: "flash",     title: "عروض البرق", emoji: "⚡", to: "/offers",            ringFrom: "350 85% 60%", ringTo: "30 90% 60%" },
  { id: "fresh",     title: "طازج اليوم", emoji: "🌿", to: "/store/produce",     ringFrom: "120 60% 45%", ringTo: "160 55% 55%" },
  { id: "chef",      title: "جديد الشيف", emoji: "👨‍🍳", to: "/store/recipes",     ringFrom: "265 70% 60%", ringTo: "320 70% 60%" },
  { id: "trending",  title: "رائج الآن",   emoji: "🔥", to: "/sections",          ringFrom: "10 90% 58%",  ringTo: "45 95% 60%" },
  { id: "sweets",    title: "حلويات",      emoji: "🍰", to: "/store/sweets",      ringFrom: "330 70% 65%", ringTo: "20 80% 65%" },
  { id: "village",   title: "من القرية",   emoji: "🌾", to: "/store/village",     ringFrom: "36 80% 50%",  ringTo: "60 75% 55%" },
  { id: "wholesale", title: "جملة",         emoji: "📦", to: "/store/wholesale",   ringFrom: "210 70% 50%", ringTo: "240 70% 60%" },
];

export const StoryCircles = () => {
  const { viewMode } = useUI();
  const size = viewMode === "simplified" ? 78 : 68;

  return (
    <section className="-mx-4 px-4 animate-float-up" style={{ animationDelay: "80ms" }}>
      <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory scroll-smooth">
        {STORIES.map((s) => (
          <Link
            key={s.id}
            to={s.to}
            className="group flex shrink-0 snap-start flex-col items-center gap-1.5 transition active:scale-95"
            style={{ width: size + 12 }}
          >
            <div
              className="rounded-full p-[2.5px] shadow-soft transition group-hover:shadow-tile"
              style={{
                width: size,
                height: size,
                background: `conic-gradient(from 180deg, hsl(${s.ringFrom}), hsl(${s.ringTo}), hsl(${s.ringFrom}))`,
              }}
            >
              <div
                className="flex h-full w-full items-center justify-center rounded-full bg-card text-2xl"
                style={{ fontSize: viewMode === "simplified" ? "1.75rem" : "1.5rem" }}
              >
                <span aria-hidden>{s.emoji}</span>
              </div>
            </div>
            <span className="font-display text-[10.5px] font-extrabold text-foreground line-clamp-1">
              {s.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default StoryCircles;
