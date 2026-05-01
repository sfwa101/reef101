/**
 * Admin UI Primitives — Phase 1 of the Admin OS overhaul.
 *
 * A small, opinionated layer of building blocks every future admin page
 * (orders/products/vendors/customers/drivers/finance) should compose from.
 *
 * Goals:
 *  - Consistent typography, spacing, depth and dark/light behaviour.
 *  - 44×44 tap targets on touch.
 *  - Strong RTL: works because we rely on logical properties + flex (no manual right/left).
 *  - Zero new color literals — everything pulls from semantic tokens in styles.css.
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Section ---------- */

export function AdminSection({
  title,
  subtitle,
  action,
  children,
  className,
  pad = true,
  tone = "default",
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
  tone?: "default" | "muted" | "transparent";
}) {
  const surface =
    tone === "transparent"
      ? ""
      : tone === "muted"
        ? "bg-surface-muted/60 border border-border/40"
        : "bg-card border border-border/50 shadow-soft";

  return (
    <section className={cn("rounded-3xl overflow-hidden", surface, className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-4 lg:px-5 py-3 border-b border-border/40">
          <div className="min-w-0">
            {title && (
              <h2 className="font-display text-[16px] leading-tight truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-[11.5px] text-foreground-tertiary leading-tight mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(pad ? "p-4 lg:p-5" : "")}>{children}</div>
    </section>
  );
}

/* ---------- KpiCard ---------- */

export function KpiCard({
  label,
  value,
  hint,
  delta,
  icon: Icon,
  tone = "primary",
  to,
  urgent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: number; // signed percent
  icon?: LucideIcon;
  tone?: "primary" | "info" | "success" | "warning" | "destructive" | "accent";
  to?: string;
  urgent?: boolean;
}) {
  const toneBg: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    accent: "bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]",
  };

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        {Icon && (
          <div
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center",
              toneBg[tone],
            )}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </div>
        )}
        {typeof delta === "number" && (
          <span
            className={cn(
              "text-[10.5px] font-semibold rounded-full px-2 py-0.5 num",
              delta >= 0
                ? "bg-success/12 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-[11.5px] text-foreground-tertiary leading-tight mt-3">
        {label}
      </p>
      <p className="font-display text-[22px] lg:text-[24px] num leading-tight mt-0.5 tracking-tight">
        {value}
      </p>
      {hint && (
        <p className="text-[11px] text-foreground-tertiary leading-tight mt-1 truncate">
          {hint}
        </p>
      )}
      {urgent && (
        <span className="absolute top-3 left-3 h-2 w-2 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
      )}
    </>
  );

  const cls = cn(
    "relative overflow-hidden rounded-3xl p-4 lg:p-5 bg-card border border-border/50 shadow-soft min-h-[124px]",
    to && "hover:shadow-tile hover:-translate-y-0.5 transition-all press cursor-pointer",
    urgent && "border-[hsl(var(--accent))]/40",
  );

  if (to) return <Link to={to} className={cls}>{inner}</Link>;
  return <div className={cls}>{inner}</div>;
}

/* ---------- Sparkline (pure SVG, no deps) ---------- */

export function Sparkline({
  data,
  width = 120,
  height = 36,
  strokeWidth = 2,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}) {
  if (!data?.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${points.join(" L ")}`;
  const fillPath = `${path} L ${width},${height} L 0,${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#spark-fill)" />
      <path
        d={path}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- MiniBars — labelled horizontal bar list ---------- */

export function MiniBars({
  rows,
  formatValue = (v) => String(v),
}: {
  rows: { label: string; value: number; hint?: string }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length)
    return (
      <p className="text-[12.5px] text-foreground-tertiary py-6 text-center">
        لا توجد بيانات
      </p>
    );
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-[12.5px]">
            <span className="truncate text-foreground-secondary">{r.label}</span>
            <span className="font-display num shrink-0">
              {formatValue(r.value)}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
              style={{ width: `${Math.max(4, (r.value / max) * 100)}%` }}
            />
          </div>
          {r.hint && (
            <p className="text-[10.5px] text-foreground-tertiary">{r.hint}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Funnel — order pipeline visualization ---------- */

export function Funnel({
  steps,
}: {
  steps: { label: string; value: number; tone?: string }[];
}) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        return (
          <div key={s.label}>
            <div className="flex items-center justify-between text-[12.5px] mb-1">
              <span className="text-foreground-secondary">{s.label}</span>
              <span className="font-display num">{s.value}</span>
            </div>
            <div className="h-2.5 rounded-full bg-surface-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  s.tone ?? "bg-gradient-to-r from-primary to-primary-glow",
                )}
                style={{ width: `${Math.max(6, pct)}%` }}
              />
            </div>
            {i < steps.length - 1 && (
              <div className="h-3 flex items-center justify-center">
                <span className="h-3 w-px bg-border/60" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- ActivityRow — recent / alerts list item ---------- */

export function ActivityRow({
  icon: Icon,
  title,
  hint,
  time,
  tone = "muted",
  to,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  hint?: React.ReactNode;
  time?: string;
  tone?: "muted" | "info" | "success" | "warning" | "destructive";
  to?: string;
}) {
  const toneBg: Record<string, string> = {
    muted: "bg-surface-muted text-foreground-secondary",
    info: "bg-info/12 text-info",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  const Wrap: React.ElementType = to ? Link : "div";
  const props = to ? { to } : {};
  return (
    <Wrap
      {...props}
      className={cn(
        "flex items-center gap-3 px-1 py-2.5 rounded-xl",
        to && "hover:bg-surface-muted/60 transition-base press",
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
          toneBg[tone],
        )}
      >
        <Icon className="h-[16px] w-[16px]" strokeWidth={2.4} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] truncate">{title}</p>
        {hint && (
          <p className="text-[11px] text-foreground-tertiary truncate">{hint}</p>
        )}
      </div>
      {time && (
        <span className="text-[10.5px] text-foreground-tertiary shrink-0 num">
          {time}
        </span>
      )}
      {to && (
        <ChevronLeft className="h-4 w-4 text-foreground-tertiary shrink-0" />
      )}
    </Wrap>
  );
}

/* ---------- EmptyState ---------- */

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="h-12 w-12 rounded-2xl bg-surface-muted text-foreground-tertiary flex items-center justify-center mx-auto mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-semibold">{title}</p>
      {hint && (
        <p className="text-[12px] text-foreground-tertiary mt-1">{hint}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ---------- SectionHeaderLink ---------- */

export function SectionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="text-[12px] text-primary hover:underline flex items-center gap-0.5 px-2 py-1 rounded-lg"
    >
      {label} <ChevronLeft className="h-3.5 w-3.5" />
    </Link>
  );
}
