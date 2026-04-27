import { ChevronLeft } from "lucide-react";

interface FeatureTile {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  size: "lg" | "md";
  tone: "light" | "dark";
}

interface FeatureTileGridProps {
  tiles: FeatureTile[];
  onSelect: (id: string) => void;
}

const FeatureTileGrid = ({ tiles, onSelect }: FeatureTileGridProps) => {
  return (
    <div className="grid grid-cols-2 auto-rows-[140px] gap-3">
      {tiles.map((tile, idx) => {
        const big = tile.size === "lg";
        return (
          <button
            key={tile.id}
            onClick={() => onSelect(tile.id)}
            className={`tile-overlay group relative overflow-hidden rounded-[1.75rem] text-right shadow-tile transition-transform duration-500 ease-apple hover:-translate-y-0.5 active:scale-[0.98] ${
              big ? "row-span-2" : ""
            } animate-float-up`}
            style={{ animationDelay: `${idx * 60}ms` }}
            aria-label={tile.title}
          >
            <img
              src={tile.image}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-apple group-hover:scale-105"
            />
            <div className="relative z-10 flex h-full flex-col justify-end p-4">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <h3 className={`font-display font-extrabold leading-tight text-white drop-shadow ${big ? "text-2xl" : "text-lg"}`}>
                    {tile.title}
                  </h3>
                  <p className="mt-1 text-[11px] font-medium text-white/85 drop-shadow">
                    {tile.subtitle}
                  </p>
                </div>
                <div className="glass-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                  <ChevronLeft className="h-4 w-4 text-foreground" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default FeatureTileGrid;
export type { FeatureTile };