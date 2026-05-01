/**
 * Admin · Purchase Invoices — Phase 23 unified surface.
 *
 * Combines the existing invoice list with the new atomic
 * `PurchaseInvoiceBuilder` (RPC-driven, MAC-aware).
 */
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, FileText, PackagePlus } from "lucide-react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PurchaseInvoiceBuilder } from "@/features/admin/components/PurchaseInvoiceBuilder";

type Invoice = {
  id: string;
  invoice_number: string | null;
  invoice_date: string;
  due_date: string | null;
  total: number;
  paid_amount: number;
  remaining: number;
  status: string;
  supplier_id: string;
  suppliers?: { name: string } | null;
};

type Tab = "list" | "new";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  received: "bg-success/15 text-success",
  paid: "bg-primary/15 text-primary",
  cancelled: "bg-destructive/15 text-destructive",
};

export default function PurchaseInvoices() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance") || hasRole("store_manager");
  const [tab, setTab] = useState<Tab>("list");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("purchase_invoices")
      .select("*, suppliers(name)")
      .order("invoice_date", { ascending: false })
      .limit(50);
    setInvoices((data ?? []) as unknown as Invoice[]);
    setLoading(false);
  };

  useEffect(() => {
    if (allowed) load();
    else setLoading(false);
  }, [allowed]);

  if (rolesLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <>
        <MobileTopbar title="فواتير المشتريات" />
        <div className="p-8 text-center" dir="rtl">
          <ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" />
          <p>غير متاح</p>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileTopbar title="فواتير المشتريات" />
      <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto space-y-4" dir="rtl">
        {/* Tabs */}
        <div className="inline-flex glass-strong rounded-2xl p-1 shadow-soft">
          {([
            { id: "list" as const, label: "الفواتير", icon: FileText },
            { id: "new" as const, label: "فاتورة جديدة", icon: PackagePlus },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold press transition-base",
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-foreground-secondary hover:bg-accent/15",
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "new" ? (
          <PurchaseInvoiceBuilder
            onCreated={() => {
              setTab("list");
              load();
            }}
          />
        ) : invoices.length === 0 ? (
          <div className="glass-strong rounded-2xl p-10 text-center text-foreground-tertiary">
            لا توجد فواتير بعد — أنشئ فاتورة جديدة لتحديث المخزون والتكلفة.
          </div>
        ) : (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="glass-strong shadow-soft rounded-2xl p-3.5 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">
                      {inv.suppliers?.name ?? "—"}
                    </p>
                    <span className="text-[10px] font-mono text-foreground-tertiary">
                      #{(inv.invoice_number ?? inv.id).toString().slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-tertiary mt-0.5">
                    {new Date(inv.invoice_date).toLocaleDateString("ar-EG")}
                    {inv.due_date && ` • استحقاق ${new Date(inv.due_date).toLocaleDateString("ar-EG")}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold tabular-nums">{fmtMoney(Number(inv.total))}</p>
                  <p className="text-[10px] text-foreground-tertiary">
                    متبقي {fmtMoney(Number(inv.remaining ?? 0))}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold",
                    STATUS_TONE[inv.status] ?? "bg-muted",
                  )}
                >
                  {inv.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
