import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ChevronLeft, Inbox, type LucideIcon } from "lucide-react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * UniversalAdminGrid — "Stem Cell" polymorphic component
 * ------------------------------------------------------
 * One core that becomes any admin screen (Bento KPI grid + searchable data table)
 * by injecting a `DataSource` descriptor. No business logic is duplicated.
 */

// -------- Types --------

export type BentoTone =
  | "primary" | "info" | "success" | "warning" | "accent" | "purple" | "pink" | "teal" | "indigo";

export type BentoMetric = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone?: BentoTone;
  /** computed from rows; fallback to formatted count */
  compute?: (rows: any[]) => string | number;
  /** when urgent → pulses */
  urgent?: (rows: any[]) => boolean;
  to?: string;
};

export type Column<T = any> = {
  key: string;
  label?: string;
  render?: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
};

export type RowAction<T = any> = {
  label: string;
  onClick: (row: T) => void;
  icon?: LucideIcon;
  tone?: "default" | "destructive" | "success";
};

export type DataSource<T = any> = {
  /** Supabase table name. If omitted, `fetcher` must be provided. */
  table?: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  /** Custom fetcher overrides table */
  fetcher?: () => Promise<T[]>;
  /** client-side search predicate */
  searchKeys?: (keyof T | string)[];
  /** map raw → normalized rows */
  map?: (row: any) => T;
};

export type EmptyState = {
  icon?: LucideIcon;
  title: string;
  hint?: string;
};

export type UniversalAdminGridProps<T = any> = {
  title: string;
  subtitle?: string;
  metrics?: BentoMetric[];
  columns?: Column<T>[];
  dataSource: DataSource<T>;
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
  rowActions?: RowAction<T>[];
  searchPlaceholder?: string;
  empty?: EmptyState;
  /** custom slot rendered above table */
  topSlot?: ReactNode;
  /** custom slot rendered instead of table (rare) */
  renderList?: (rows: T[]) => ReactNode;
};

// -------- Tone palette --------

const TONE: Record<BentoTone, string> = {
  primary: "from-primary to-primary-glow",
  info: "from-[hsl(var(--info))] to-[hsl(var(--indigo))]",
  success: "from-[hsl(var(--success))] to-[hsl(var(--teal))]",
  warning: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]",
  accent: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]",
  purple: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]",
  pink: "from-[hsl(var(--pink))] to-[hsl(var(--purple))]",
  teal: "from-[hsl(var(--teal))] to-[hsl(var(--info))]",
  indigo: "from-[hsl(var(--indigo))] to-[hsl(var(--info))]",
};

// -------- Bento tile --------

function BentoTile({
  metric, value, urgent,
}: { metric: BentoMetric; value: string | number; urgent?: boolean }) {
  const Icon = metric.icon;
  const tone = TONE[metric.tone ?? "primary"];
  const Wrapper: any = metric.to ? Link : "div";
  const wrapperProps = metric.to ? { to: metric.to } : {};
  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group relative overflow-hidden rounded-3xl p-4 bg-card border shadow-soft transition-all press",
        urgent ? "border-[hsl(var(--accent))]/40" : "border-border/50",
        metric.to ? "hover:shadow-tile hover:-translate-y-0.5" : "",
      )}
    >
      <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br text-white flex items-center justify-center mb-3 shadow-sm", tone)}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
      </div>
      <p className="text-[11px] text-foreground-tertiary leading-tight">{metric.label}</p>
      <p className="font-display text-[20px] num leading-tight mt-0.5">{value}</p>
      {urgent && <span className="absolute top-3 left-3 h-2 w-2 rounded-full bg-[hsl(var(--accent))] animate-pulse" />}
    </Wrapper>
  );
}

// -------- Main component --------

export function UniversalAdminGrid<T = any>({
  title, subtitle, metrics, columns, dataSource, rowKey,
  onRowClick, rowActions, searchPlaceholder, empty, topSlot, renderList,
}: UniversalAdminGridProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let data: any[] = [];
        if (dataSource.fetcher) {
          data = await dataSource.fetcher();
        } else if (dataSource.table) {
          let query: any = (supabase as any)
            .from(dataSource.table)
            .select(dataSource.select ?? "*");
          if (dataSource.orderBy) {
            query = query.order(dataSource.orderBy.column, { ascending: dataSource.orderBy.ascending ?? false });
          }
          if (dataSource.limit) query = query.limit(dataSource.limit);
          const { data: res, error } = await query;
          if (error) throw error;
          data = res ?? [];
        }
        const mapped = dataSource.map ? data.map(dataSource.map) : (data as T[]);
        if (!cancelled) setRows(mapped);
      } catch (e) {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dataSource.table, dataSource.select, dataSource.limit, dataSource.orderBy?.column, dataSource.orderBy?.ascending]);

  const filtered = useMemo(() => {
    if (!q.trim() || !dataSource.searchKeys?.length) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter((row: any) =>
      dataSource.searchKeys!.some((k) => String(row?.[k as string] ?? "").toLowerCase().includes(needle)),
    );
  }, [rows, q, dataSource.searchKeys]);

  const EmptyIcon = empty?.icon ?? Inbox;

  return (
    <>
      <MobileTopbar title={title} />

      <div className="hidden lg:block px-6 pt-8 pb-3 max-w-[1400px] mx-auto">
        <h1 className="font-display text-[30px] tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-foreground-secondary mt-1">{subtitle}</p>}
      </div>

      <div className="px-4 lg:px-6 pt-3 pb-10 max-w-[1400px] mx-auto space-y-5">
        {/* Bento metrics */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {metrics.map((m) => {
              const v = m.compute ? m.compute(rows) : fmtNum(rows.length);
              const urg = m.urgent?.(rows);
              return <BentoTile key={m.key} metric={m} value={v} urgent={urg} />;
            })}
          </div>
        )}

        {topSlot}

        {/* Search */}
        {dataSource.searchKeys?.length ? (
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder ?? "بحث..."}
              className="w-full bg-surface border border-border/50 rounded-2xl pr-10 pl-4 py-2.5 text-[13.5px] outline-none focus:border-primary/50 transition"
            />
          </div>
        ) : null}

        {/* Data list */}
        <section className="bg-surface rounded-3xl border border-border/50 shadow-soft overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyIcon className="h-10 w-10 mx-auto mb-2 text-foreground-tertiary opacity-50" />
              <p className="font-display text-[15px]">{empty?.title ?? "لا توجد بيانات"}</p>
              {empty?.hint && <p className="text-[12px] text-foreground-tertiary mt-1">{empty.hint}</p>}
            </div>
          ) : renderList ? (
            renderList(filtered)
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((row: any, idx) => {
                const key = rowKey ? rowKey(row) : (row.id ?? idx);
                return (
                  <div
                    key={key}
                    role={onRowClick ? "button" : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "px-4 lg:px-5 py-3 flex items-center gap-3 transition text-right",
                      onRowClick && "hover:bg-surface-muted/50 cursor-pointer press",
                    )}
                  >
                    {columns?.map((col) => (
                      <div
                        key={col.key}
                        className={cn(
                          "min-w-0",
                          col.hideOnMobile && "hidden md:block",
                          col.className ?? "flex-1",
                        )}
                      >
                        {col.render ? col.render(row) : <span className="text-[13.5px]">{String(row?.[col.key] ?? "—")}</span>}
                      </div>
                    ))}
                    {rowActions?.length ? (
                      <div className="flex items-center gap-1 shrink-0">
                        {rowActions.map((a) => {
                          const AIcon = a.icon;
                          return (
                            <button
                              key={a.label}
                              onClick={(e) => { e.stopPropagation(); a.onClick(row); }}
                              className={cn(
                                "h-8 px-3 rounded-xl text-[12px] font-semibold press border",
                                a.tone === "destructive" && "bg-destructive/10 text-destructive border-destructive/20",
                                a.tone === "success" && "bg-success/10 text-success border-success/20",
                                (!a.tone || a.tone === "default") && "bg-primary-soft text-primary border-primary/20",
                              )}
                            >
                              {AIcon && <AIcon className="h-3.5 w-3.5 inline -mt-0.5 ml-1" />}
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : onRowClick ? (
                      <ChevronLeft className="h-4 w-4 text-foreground-tertiary shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default UniversalAdminGrid;
