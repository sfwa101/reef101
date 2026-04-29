import { Link } from "@tanstack/react-router";

type Item = {
  id: string;
  title: string;
  emoji: string;
  to: string;
  /** pastel hsl tuple, e.g. "142 50% 92%" */
  tint: string;
  unavailable?: boolean;
};

/**
 * Refined store grid — pastel mini-cards with a large emoji glyph.
 * Replaces the heavy image-tile grid at the bottom of Home.
 */
const MiniStoreGrid = ({ items }: { items: Item[] }) => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((s) => {
        const body = (
          <span
            className="relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-2xl ring-1 ring-border/60 shadow-soft transition active:scale-[0.97]"
            style={{
              background: `linear-gradient(160deg, hsl(${s.tint} / 0.85), hsl(${s.tint} / 0.45))`,
            }}
          >
            <span className="text-3xl drop-shadow-sm">{s.emoji}</span>
            <span className="line-clamp-1 px-1 text-center text-[11px] font-extrabold text-foreground/90">
              {s.title}
            </span>
            {s.unavailable && (
              <span className="absolute inset-x-1.5 top-1.5 rounded-full bg-background/90 px-1.5 py-0.5 text-center text-[9px] font-bold text-muted-foreground backdrop-blur">
                قريبًا
              </span>
            )}
          </span>
        );
        return s.unavailable ? (
          <div key={s.id} className="opacity-70">{body}</div>
        ) : (
          <Link key={s.id} to={s.to}>{body}</Link>
        );
      })}
    </div>
  );
};

export default MiniStoreGrid;