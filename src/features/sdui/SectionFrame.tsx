/**
 * SectionFrame — wraps every SDUI-rendered section.
 * Applies admin-controlled, schema-validated style overrides:
 *   - padding (sm/md/lg)
 *   - tone (background tint)
 *   - title (custom Arabic header text)
 * No raw HTML, no inline style strings from the DB — only enum tokens
 * mapped to safe Tailwind classes.
 */
import type { ReactNode } from "react";
import type { SectionConfig } from "@/features/storefront/home/types/sdui.types";
import { PADDING_CLASS, TONE_CLASS } from "./registry";
import { cn } from "@/lib/utils";

export function SectionFrame({
  cfg,
  customTitle,
  children,
}: {
  cfg: SectionConfig;
  customTitle?: string | null;
  children: ReactNode;
}) {
  const padding = cfg.padding ? PADDING_CLASS[cfg.padding] : "";
  const tone = cfg.tone ? TONE_CLASS[cfg.tone] : "";
  const sticky = cfg.sticky ? "sticky top-0 z-20" : "";

  return (
    <div className={cn(padding, tone, sticky)}>
      {customTitle ? (
        <h2 className="px-4 mb-2 font-display text-base font-extrabold text-foreground">
          {customTitle}
        </h2>
      ) : null}
      {children}
    </div>
  );
}
