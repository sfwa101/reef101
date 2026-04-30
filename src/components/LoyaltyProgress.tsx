import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

type Progress = {
  current_level: "bronze" | "silver" | "gold" | "platinum";
  current_count: number;
  next_level: string | null;
  target: number;
  remaining: number;
};

const LEVEL_AR: Record<string, string> = {
  bronze: "البرونزي",
  silver: "الفضي",
  gold: "الذهبي",
  platinum: "البلاتيني",
};

const LEVEL_COLOR: Record<string, string> = {
  bronze: "#A97142",
  silver: "#9CA3AF",
  gold: "#D4A93A",
  platinum: "#5E7B9A",
};

export default function LoyaltyProgress() {
  const { user } = useAuth();
  const [p, setP] = useState<Progress | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await (supabase as any).rpc("progress_to_next_level", { _user_id: user.id });
      if (data) setP(data as Progress);
    })();
  }, [user?.id]);

  if (!p) return null;
  const color = LEVEL_COLOR[p.current_level] ?? "#3F5226";
  const pct = p.next_level
    ? Math.min(100, Math.round((p.current_count / Math.max(1, p.target)) * 100))
    : 100;

  return (
    <section className="rounded-2xl bg-surface p-4 ring-1 ring-border/40">
      <div className="mb-2 flex items-center gap-2">
        <Award className="h-4 w-4" style={{ color }} />
        <p className="text-[13px] font-extrabold">
          مستواك: <span style={{ color }}>{LEVEL_AR[p.current_level]}</span>
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        {p.next_level
          ? `تبقّى لك ${p.remaining} طلب${p.remaining === 1 ? "" : "ات"} لتصل لمستوى ${LEVEL_AR[p.next_level]} وتفتح عروضاً حصرية.`
          : "وصلت لأعلى مستوى — كل العروض الحصرية متاحة لك."}
      </p>
    </section>
  );
}
