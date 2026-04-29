import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "info" | "success" | "warning" | "destructive" | "purple" | "pink" | "teal" | "indigo";
}

const toneBg: Record<string, string> = {
  primary: "from-primary to-primary-glow",
  accent: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]",
  info: "from-[hsl(var(--info))] to-[hsl(var(--indigo))]",
  success: "from-[hsl(var(--success))] to-[hsl(var(--teal))]",
  warning: "from-[hsl(var(--warning))] to-[hsl(35_100%_65%)]",
  destructive: "from-[hsl(var(--destructive))] to-[hsl(var(--pink))]",
  purple: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]",
  pink: "from-[hsl(var(--pink))] to-[hsl(335_80%_70%)]",
  teal: "from-[hsl(var(--teal))] to-[hsl(var(--info))]",
  indigo: "from-[hsl(var(--indigo))] to-[hsl(var(--purple))]",
};

export function StatTile({ label, value, delta, icon: Icon, tone = "primary" }: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border/40 press">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("h-9 w-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-sm", toneBg[tone])}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
        </div>
        {delta !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",
            positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
          )}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span className="num">{Math.abs(delta).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-[11px] text-foreground-tertiary font-medium mb-1">{label}</p>
      <p className="font-display text-[22px] tracking-tight num leading-none">{value}</p>
    </div>
  );
}
