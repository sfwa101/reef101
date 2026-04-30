import { Sparkles } from "lucide-react";
import { useMegaEvent } from "@/hooks/useMegaEvent";

/**
 * Server-resolved mega event banner. The RPC `current_mega_event` decides
 * which event is live (Tuesday / Friday / first Friday / specific date /
 * manual). `useMegaEvent` also applies a CSS variable `--mega-accent` on
 * <html> so the rest of the UI can react to the theme.
 */
export default function MegaEventBanner() {
  const event = useMegaEvent();
  if (!event) return null;

  const accent = event.banner_color_hex || "#dc2626";
  const pct = Number(event.global_discount_pct ?? 0);

  return (
    <section
      className="relative overflow-hidden rounded-2xl p-4 text-white shadow-tile"
      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-extrabold leading-tight">
            {event.banner_title ?? event.name}
          </p>
          {event.banner_subtitle && (
            <p className="text-[11px] opacity-90">{event.banner_subtitle}</p>
          )}
        </div>
        {pct > 0 && (
          <span
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold"
            style={{ color: accent }}
          >
            -{Math.round(pct)}٪
          </span>
        )}
      </div>
    </section>
  );
}
