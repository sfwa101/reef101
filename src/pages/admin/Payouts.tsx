/**
 * Admin Payouts — Phase 22 unified payout reconciliation.
 * Shows pending + recent vendor and user (affiliate) withdrawal requests.
 */
import { useState } from "react";
import { Banknote, Hourglass, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { UniversalAdminGrid } from "@/components/admin/UniversalAdminGrid";
import { fmtMoney, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

type UserPayout = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  bank_details: Record<string, unknown> | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

type VendorPayout = {
  id: string;
  vendor_id: string;
  amount: number;
  method: string;
  bank_details: Record<string, unknown> | null;
  status: string;
  created_at: string;
};

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "تحويل بنكي",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
  cash: "كاش",
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warning/15 text-warning",
  processing: "bg-info/15 text-info",
  completed: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار", processing: "قيد التنفيذ",
  completed: "مكتمل", rejected: "مرفوض",
};

type Tab = "users" | "vendors";

export default function AdminPayouts() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="space-y-5">
      <header className="glass-strong shadow-soft rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <Banknote className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl">إدارة المدفوعات الخارجة</h1>
            <p className="text-xs text-foreground-tertiary mt-0.5">
              مراجعة طلبات السحب من البائعين وشركاء الإحالة وتنفيذها بأمان.
            </p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="inline-flex glass-strong rounded-2xl p-1 shadow-soft">
        {([
          { id: "users" as const, label: "أرباح الإحالات", icon: Wallet },
          { id: "vendors" as const, label: "البائعون", icon: Banknote },
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
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "users" ? (
        <UniversalAdminGrid<UserPayout>
          title="طلبات سحب أرباح الإحالات"
          subtitle="طلبات السحب الواردة من المستخدمين عبر النظام الجديد (Phase 22)."
          dataSource={{
            table: "user_payout_requests",
            select: "id,user_id,amount,method,bank_details,status,rejection_reason,created_at",
            orderBy: { column: "created_at", ascending: false },
            limit: 200,
            searchKeys: ["id", "user_id", "method", "status"],
          }}
          metrics={[
            {
              key: "pending", label: "بانتظار المراجعة", icon: Hourglass, tone: "warning",
              compute: (rows) => fmtNum((rows as UserPayout[]).filter(r => r.status === "pending").length),
              urgent: (rows) => (rows as UserPayout[]).filter(r => r.status === "pending").length > 0,
            },
            {
              key: "pending_amt", label: "إجمالي مُجمَّد", icon: Wallet, tone: "primary",
              compute: (rows) => fmtMoney((rows as UserPayout[])
                .filter(r => r.status === "pending" || r.status === "processing")
                .reduce((s, r) => s + Number(r.amount || 0), 0)),
            },
            {
              key: "completed", label: "تم الصرف", icon: CheckCircle2, tone: "success",
              compute: (rows) => fmtNum((rows as UserPayout[]).filter(r => r.status === "completed").length),
            },
            {
              key: "rejected", label: "مرفوض", icon: XCircle, tone: "pink",
              compute: (rows) => fmtNum((rows as UserPayout[]).filter(r => r.status === "rejected").length),
            },
          ]}
          columns={[
            {
              key: "id", className: "flex-1",
              render: (r) => (
                <>
                  <p className="text-[13px] font-mono">#{r.id.slice(0, 8)}</p>
                  <p className="text-[11px] text-foreground-tertiary truncate">
                    {new Date(r.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })} • مستخدم {r.user_id.slice(0, 6)}
                  </p>
                </>
              ),
            },
            {
              key: "amount", className: "shrink-0 text-right",
              render: (r) => (
                <>
                  <p className="text-[13px] font-extrabold tabular-nums">{fmtMoney(Number(r.amount))}</p>
                  <p className="text-[10px] text-foreground-tertiary">{METHOD_LABEL[r.method] ?? r.method}</p>
                </>
              ),
            },
            {
              key: "status", className: "shrink-0",
              render: (r) => (
                <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold", STATUS_TONE[r.status] ?? "bg-muted")}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              ),
            },
          ]}
          rowKey={(r) => r.id}
        />
      ) : (
        <UniversalAdminGrid<VendorPayout>
          title="طلبات سحب البائعين"
          subtitle="طلبات السحب من المحافظ الخاصة بالبائعين."
          dataSource={{
            table: "vendor_payout_requests",
            select: "id,vendor_id,amount,method,bank_details,status,created_at",
            orderBy: { column: "created_at", ascending: false },
            limit: 200,
            searchKeys: ["id", "vendor_id", "method", "status"],
          }}
          metrics={[
            {
              key: "pending", label: "بانتظار", icon: Hourglass, tone: "warning",
              compute: (rows) => fmtNum((rows as VendorPayout[]).filter(r => r.status === "pending").length),
            },
            {
              key: "pending_amt", label: "مُجمَّد", icon: Wallet, tone: "primary",
              compute: (rows) => fmtMoney((rows as VendorPayout[])
                .filter(r => r.status === "pending" || r.status === "processing")
                .reduce((s, r) => s + Number(r.amount || 0), 0)),
            },
            {
              key: "completed", label: "مكتمل", icon: CheckCircle2, tone: "success",
              compute: (rows) => fmtNum((rows as VendorPayout[]).filter(r => r.status === "completed").length),
            },
            {
              key: "rejected", label: "مرفوض", icon: XCircle, tone: "pink",
              compute: (rows) => fmtNum((rows as VendorPayout[]).filter(r => r.status === "rejected").length),
            },
          ]}
          columns={[
            {
              key: "id", className: "flex-1",
              render: (r) => (
                <>
                  <p className="text-[13px] font-mono">#{r.id.slice(0, 8)}</p>
                  <p className="text-[11px] text-foreground-tertiary truncate">
                    {new Date(r.created_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })} • بائع {r.vendor_id.slice(0, 6)}
                  </p>
                </>
              ),
            },
            {
              key: "amount", className: "shrink-0 text-right",
              render: (r) => (
                <>
                  <p className="text-[13px] font-extrabold tabular-nums">{fmtMoney(Number(r.amount))}</p>
                  <p className="text-[10px] text-foreground-tertiary">{METHOD_LABEL[r.method] ?? r.method}</p>
                </>
              ),
            },
            {
              key: "status", className: "shrink-0",
              render: (r) => (
                <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold", STATUS_TONE[r.status] ?? "bg-muted")}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              ),
            },
          ]}
          rowKey={(r) => r.id}
        />
      )}
    </div>
  );
}
