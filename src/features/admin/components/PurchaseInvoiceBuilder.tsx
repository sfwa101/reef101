/**
 * PurchaseInvoiceBuilder — Phase 23 Procurement UI.
 *
 * Atomic invoice creation via `submit_purchase_invoice` RPC:
 *  - inserts invoice header + line items
 *  - increases product stock
 *  - recalculates Moving Average Cost
 *  - updates supplier balance
 *
 * Pure presentation: no direct table inserts, no MAC math on the client.
 */
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Search, Loader2, PackagePlus, Calculator } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; cost_price: number | null; stock: number | null };
type Line = { product_id: string; product_name: string; quantity: number; unit_cost: number };

const LineSchema = z.object({
  product_id: z.string().min(1),
  product_name: z.string().min(1).max(200),
  quantity: z.number().positive().max(100000),
  unit_cost: z.number().min(0).max(1_000_000),
});

const HeaderSchema = z.object({
  supplier_id: z.string().uuid(),
  invoice_number: z.string().trim().max(60).optional().or(z.literal("")),
  invoice_date: z.string().min(1),
  paid_amount: z.number().min(0),
  tax: z.number().min(0),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export function PurchaseInvoiceBuilder({ onCreated }: { onCreated?: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    paid_amount: "0",
    tax: "0",
    notes: "",
  });
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoadingRefs(true);
      const [s, p] = await Promise.all([
        supabase.from("suppliers").select("id,name").eq("is_active", true).order("name"),
        supabase.from("products").select("id,name,cost_price,stock").eq("is_active", true).order("name").limit(800),
      ]);
      if (cancel) return;
      setSuppliers((s.data ?? []) as Supplier[]);
      setProducts((p.data ?? []) as Product[]);
      setLoadingRefs(false);
    })();
    return () => { cancel = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 50);
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .slice(0, 50);
  }, [products, search]);

  const addLine = (p: Product) => {
    if (lines.some((l) => l.product_id === p.id)) {
      toast.message("المنتج مضاف بالفعل");
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        product_id: p.id,
        product_name: p.name,
        quantity: 1,
        unit_cost: Number(p.cost_price ?? 0),
      },
    ]);
    setSearch("");
  };

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.quantity * l.unit_cost, 0),
    [lines],
  );
  const tax = Number(form.tax) || 0;
  const total = subtotal + tax;
  const paid = Number(form.paid_amount) || 0;
  const remaining = Math.max(0, total - paid);

  const submit = async () => {
    const headerParsed = HeaderSchema.safeParse({
      supplier_id: form.supplier_id,
      invoice_number: form.invoice_number,
      invoice_date: form.invoice_date,
      paid_amount: paid,
      tax,
      notes: form.notes,
    });
    if (!headerParsed.success) {
      toast.error("بيانات الفاتورة غير مكتملة");
      return;
    }
    if (lines.length === 0) {
      toast.error("أضف بنداً واحداً على الأقل");
      return;
    }
    for (const l of lines) {
      const r = LineSchema.safeParse(l);
      if (!r.success) {
        toast.error(`بيانات بند غير صحيحة: ${l.product_name}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("submit_purchase_invoice", {
        _supplier_id: form.supplier_id,
        _items: lines.map((l) => ({
          product_id: l.product_id,
          product_name: l.product_name,
          quantity: l.quantity,
          unit_cost: l.unit_cost,
        })),
        _total_amount: total,
        _invoice_number: form.invoice_number || null,
        _invoice_date: form.invoice_date,
        _paid_amount: paid,
        _tax: tax,
        _notes: form.notes || null,
      });
      if (error) throw error;
      toast.success("تم حفظ الفاتورة + تحديث المخزون والتكلفة (MAC)", {
        description: `فاتورة #${String((data as any)?.invoice_id ?? "").slice(0, 8)}`,
      });
      setLines([]);
      setForm((f) => ({
        ...f,
        invoice_number: "",
        paid_amount: "0",
        tax: "0",
        notes: "",
      }));
      onCreated?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "تعذّر الحفظ";
      toast.error(
        msg.includes("forbidden") ? "غير مصرّح" :
        msg.includes("invalid_line") ? "قيم البنود غير صحيحة" :
        msg.includes("supplier_required") ? "اختر المورد" :
        msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRefs) {
    return (
      <div className="glass-strong rounded-2xl p-12 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-strong shadow-soft rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <PackagePlus className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base">فاتورة شراء جديدة</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">المورد</Label>
            <select
              className="w-full bg-card rounded-xl px-3 py-2 text-sm ring-1 ring-border/50"
              value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
            >
              <option value="">— اختر —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">تاريخ الفاتورة</Label>
            <Input
              type="date"
              value={form.invoice_date}
              onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">رقم الفاتورة (اختياري)</Label>
            <Input
              value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              maxLength={60}
            />
          </div>
          <div>
            <Label className="text-xs">المدفوع نقداً</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.paid_amount}
              onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Product picker */}
      <div className="glass-strong shadow-soft rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-foreground-tertiary" />
          <Input
            placeholder="ابحث عن منتج لإضافته…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search.trim() && (
          <ul className="max-h-56 overflow-y-auto rounded-xl bg-card ring-1 ring-border/40 divide-y divide-border/40">
            {filteredProducts.length === 0 && (
              <li className="p-3 text-center text-xs text-foreground-tertiary">لا نتائج</li>
            )}
            {filteredProducts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addLine(p)}
                  className="w-full text-right px-3 py-2.5 hover:bg-accent/15 press flex items-center justify-between gap-3"
                >
                  <span className="text-sm truncate">{p.name}</span>
                  <span className="text-[10px] text-foreground-tertiary tabular-nums shrink-0">
                    تكلفة: {fmtMoney(Number(p.cost_price ?? 0))} • مخزون: {p.stock ?? 0}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lines */}
      {lines.length > 0 && (
        <div className="glass-strong shadow-soft rounded-2xl p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground-tertiary px-1">
            البنود ({lines.length})
          </p>
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li key={l.product_id} className="bg-card rounded-xl p-3 ring-1 ring-border/40">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold flex-1 truncate">{l.product_name}</p>
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="h-7 w-7 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center press"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px]">الكمية</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={l.quantity}
                      onChange={(e) => updateLine(i, { quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">تكلفة الوحدة</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={l.unit_cost}
                      onChange={(e) => updateLine(i, { unit_cost: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px]">الإجمالي</Label>
                    <div className="h-9 rounded-md bg-muted px-3 flex items-center text-sm font-mono tabular-nums">
                      {fmtMoney(l.quantity * l.unit_cost)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Totals */}
      <div className="glass-strong shadow-soft rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">الإجماليات</p>
        </div>
        <Row label="المجموع الفرعي" value={fmtMoney(subtotal)} />
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs text-foreground-secondary">الضريبة</Label>
          <Input
            className="max-w-[140px]"
            type="number"
            inputMode="decimal"
            value={form.tax}
            onChange={(e) => setForm({ ...form, tax: e.target.value })}
          />
        </div>
        <Row label="الإجمالي" value={fmtMoney(total)} bold />
        <Row label="المتبقي" value={fmtMoney(remaining)} muted={remaining === 0} />

        <Button
          onClick={submit}
          disabled={submitting || lines.length === 0 || !form.supplier_id}
          className={cn("w-full mt-2 h-11 font-semibold", submitting && "opacity-70")}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> حفظ الفاتورة وتحديث التكلفة
            </span>
          )}
        </Button>
        <p className="text-[10px] text-foreground-tertiary text-center">
          سيتم تحديث المخزون وإعادة احتساب التكلفة (MAC) ورصيد المورد تلقائياً.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground-secondary">{label}</span>
      <span className={cn("font-mono tabular-nums", bold && "font-extrabold text-base", muted && "text-foreground-tertiary")}>
        {value}
      </span>
    </div>
  );
}
