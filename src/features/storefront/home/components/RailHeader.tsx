/**
 * RailHeader — section header for content rails on the Home storefront.
 * Pure presentational stem cell. Verbatim extraction.
 */
import type { LucideIcon } from "lucide-react";

export const RailHeader = ({
  icon: Icon,
  title,
  sub,
  hue,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  hue: string;
}) => (
  <div className="flex items-end justify-between">
    <div>
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-white"
          style={{ background: `hsl(${hue})` }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h2 className="font-display text-lg font-extrabold text-foreground">
          {title}
        </h2>
      </div>
      {sub && (
        <p className="mt-0.5 ps-9 text-[11px] text-muted-foreground">{sub}</p>
      )}
    </div>
  </div>
);
