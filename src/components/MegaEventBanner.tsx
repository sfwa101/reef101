import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Event = {
  id: string;
  trigger_kind: string;
  banner_title: string;
  banner_subtitle: string | null;
  banner_color_hex: string;
  global_discount_pct: number;
};

function isFirstFridayOfMonth(d: Date) {
  return d.getDay() === 5 && d.getDate() <= 7;
}

export default function MegaEventBanner() {
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const today = new Date();
    const dow = today.getDay(); // 0=Sun..5=Fri..6=Sat
    const firstFri = isFirstFridayOfMonth(today);
    let kind: string | null = null;
    if (firstFri) kind = "first_friday_of_month";
    else if (dow === 5) kind = "weekday_friday";
    else if (dow === 2) kind = "weekday_tuesday";
    if (!kind) return;

    (async () => {
      const { data } = await (supabase as any)
        .from("mega_events")
        .select("id,trigger_kind,banner_title,banner_subtitle,banner_color_hex,global_discount_pct")
        .eq("trigger_kind", kind)
        .eq("is_active", true)
        .maybeSingle();
      if (data) setEvent(data as Event);
    })();
  }, []);

  if (!event) return null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl p-4 text-white shadow-tile"
      style={{ background: `linear-gradient(135deg, ${event.banner_color_hex}, ${event.banner_color_hex}cc)` }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-extrabold leading-tight">{event.banner_title}</p>
          {event.banner_subtitle && <p className="text-[11px] opacity-90">{event.banner_subtitle}</p>}
        </div>
        {event.global_discount_pct > 0 && (
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold" style={{ color: event.banner_color_hex }}>
            -{Math.round(Number(event.global_discount_pct))}٪
          </span>
        )}
      </div>
    </section>
  );
}
