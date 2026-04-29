import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IOSCard({ children, className, padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={cn("bg-surface rounded-2xl shadow-sm border border-border/40", padded && "p-4", className)}>
      {children}
    </div>
  );
}

export function IOSSection({ title, action, children, className }: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      {title && (
        <div className="flex items-end justify-between px-1">
          <h2 className="font-display text-[20px] tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function IOSList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("bg-surface rounded-2xl border border-border/40 overflow-hidden ios-divider", className)}>
      {children}
    </div>
  );
}

export function IOSRow({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag: any = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-right press transition-base",
        onClick && "hover:bg-surface-muted",
        className
      )}
    >
      {children}
    </Tag>
  );
}
