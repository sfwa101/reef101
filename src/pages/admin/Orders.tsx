import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Order = {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_method: string | null;
  notes: string | null;
  whatsapp_sent: boolean;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "قيد المراجعة" },
  { value: "confirmed", label: "مؤكد" },
  { value: "preparing", label: "قيد التحضير" },
  { value: "shipping", label: "قيد الشحن" },
  { value: "delivered", label: "تم التوصيل" },
  { value: "cancelled", label: "ملغي" },
];

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  preparing: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  shipping: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  delivered: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (search && !o.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [orders, filter, search]);

  const toggleExpand = async (orderId: string) => {
    if (expanded === orderId) {
      setExpanded(null);
      return;
    }
    setExpanded(orderId);
    if (!items[orderId]) {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);
      setItems((prev) => ({ ...prev, [orderId]: (data ?? []) as OrderItem[] }));
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    const prev = orders;
    setOrders((o) => o.map((x) => (x.id === orderId ? { ...x, status } : x)));
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) {
      setOrders(prev);
      toast.error("فشل تحديث الحالة");
    } else {
      toast.success("تم تحديث الحالة");
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">الطلبات</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            تحديث الحالة فوريّ — التغييرات تنعكس مباشرةً على العميل
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label="الكل"
          count={counts.all ?? 0}
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {STATUS_OPTIONS.map((s) => (
          <FilterChip
            key={s.value}
            label={s.label}
            count={counts[s.value] ?? 0}
            active={filter === s.value}
            onClick={() => setFilter(s.value)}
          />
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث برقم الطلب…"
          className="w-full rounded-2xl border border-border bg-card py-2.5 pr-10 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Orders list */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">جارٍ التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            لا توجد طلبات مطابقة
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((order) => {
              const isOpen = expanded === order.id;
              const orderItems = items[order.id] ?? [];
              return (
                <div key={order.id}>
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="flex w-full items-center gap-4 p-4 text-right transition-colors hover:bg-muted/40"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            STATUS_TONE[order.status] ?? "bg-muted text-muted-foreground",
                          )}
                        >
                          {STATUS_OPTIONS.find((s) => s.value === order.status)?.label ??
                            order.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("ar-EG", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {order.payment_method && <> · {order.payment_method}</>}
                      </div>
                    </div>
                    <div className="text-sm font-bold">{Number(order.total).toFixed(2)} ج.م</div>
                  </button>

                  {isOpen && (
                    <div className="space-y-4 bg-muted/20 px-4 pb-5 pt-2">
                      {/* Status updater */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          تغيير الحالة:
                        </span>
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => updateStatus(order.id, s.value)}
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                              order.status === s.value
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-card text-foreground hover:bg-muted",
                            )}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {/* Items */}
                      <div className="rounded-2xl border border-border bg-card p-3">
                        <div className="mb-2 text-xs font-semibold text-muted-foreground">
                          المنتجات
                        </div>
                        {orderItems.length === 0 ? (
                          <div className="py-3 text-center text-xs text-muted-foreground">
                            جارٍ التحميل…
                          </div>
                        ) : (
                          <ul className="divide-y divide-border">
                            {orderItems.map((it) => (
                              <li
                                key={it.id}
                                className="flex items-center gap-3 py-2.5 text-sm"
                              >
                                {it.product_image && (
                                  <img
                                    src={it.product_image}
                                    alt=""
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-medium">{it.product_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {it.quantity} × {Number(it.price).toFixed(2)} ج.م
                                  </div>
                                </div>
                                <div className="font-semibold">
                                  {(it.quantity * Number(it.price)).toFixed(2)} ج.م
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {order.notes && (
                        <div className="rounded-2xl border border-border bg-card p-3 text-sm">
                          <div className="mb-1 text-xs font-semibold text-muted-foreground">
                            ملاحظات العميل
                          </div>
                          {order.notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-pill"
          : "border border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px]",
          active ? "bg-primary-foreground/20" : "bg-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}