import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useBanners } from "@/hooks/useMarketing";

/**
 * LiveBanners — public-facing storefront carousel of admin-managed banners.
 * Auto-rotates every 5s. SSR-safe (no Date.now() at first render).
 */
export default function LiveBanners({ placement = "hero" }: { placement?: string }) {
  const { data: banners } = useBanners(placement);
  const [idx, setIdx] = useState(0);
  const list = banners ?? [];

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 5000);
    return () => clearInterval(t);
  }, [list.length]);

  if (list.length === 0) return null;

  return (
    <section className="-mx-4 px-4 animate-float-up">
      <div className="relative h-40 sm:h-48 overflow-hidden rounded-3xl shadow-soft ring-1 ring-border/40">
        {list.map((b, i) => {
          const Wrapper: any = b.link_url ? Link : "div";
          const wrapperProps = b.link_url ? { to: b.link_url } : {};
          return (
            <Wrapper
              key={b.id}
              {...wrapperProps}
              className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <img
                src={b.image_url}
                alt={b.title}
                loading={i === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="font-display text-lg font-extrabold drop-shadow-md">{b.title}</h3>
                {b.subtitle && <p className="text-[12.5px] opacity-95 drop-shadow">{b.subtitle}</p>}
              </div>
            </Wrapper>
          );
        })}
        {list.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {list.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
