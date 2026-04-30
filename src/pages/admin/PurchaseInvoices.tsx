import { useEffect, useState } from "react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { Loader2, ShieldAlert, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; cost_price: number | null };
type Item = { product_id: string; product_name: string; quantity: number; unit_cost: number };
type Invoice = {
  id: string; invoice_number: string | null; invoice_date: string; due_date: string | null;
  total: number; paid_amount: number; remaining: number; status: string; supplier_id: string;
  suppliers?: { name: string };
};

export default function PurchaseInvoices() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance") || hasRole("store_manager");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplier_id: "", invoice_number: "", invoice_date: new Date().toISOString().slice(0, 10),
    due_date: "", paid_amount: "0", tax: "0", notes: "",
  });
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState({ product_id: "", product_name: "", quantity: "1", unit_cost: "0" });

  const load = async () => {
    setLoading(true);
    const [s, p, i] = await Promise.all([
      (supabase as any).from("suppliers").select("id,name").eq("is_active", true).order("name"),
      (supabase as any).from("products").select("id,name,cost_price").eq("is_active", true).order("name").limit(500),
      (supabase as any).from("purchase_invoices").select("*, suppliers(name)").order("invoice_date", { ascending: false }).limit(50),
    ]);
    setSuppliers((s.data || []) as Supplier[]);
    setProducts((p.data || []) as Product[]);
    setInvoices((i.data || []) as Invoice[]);
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed]);

  const addItem = () => {
    if (!newItem.product_name && !newItem.product_id) return toast.error("اختر منتجاً");
    const qty = parseFloat(newItem.quantity);
    const cost = parseFloat(newItem.unit_cost);
    if (!(qty > 0) || !(cost >= 0)) return toast.error("قيم غير صالحة");
    const product = products.find((p) => p.id === newItem.product_id);
    setItems([...items, {
      product_id: newItem.product_id || "",
      product_name: product?.name || newItem.product_name,
      quantity: qty,
      unit_cost: cost,
    }]);
    setNewItem({ product_id: "", product_name: "", quantity: "1", unit_cost: "0" });
  };

  const submit = async () => {
    if (!form.supplier_id) return toast.error("اختر المورد");
    if (items.length === 0) return toast.error("أضف بنوداً");
    const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_cost, 0);
    const tax = parseFloat(form.tax) || 0;
    const total = subtotal + tax;
    const paid = parseFloat(form.paid_amount) || 0;

    const { data: inv, error } = await (supabase as any).from("purchase_invoices").insert({
      supplier_id: form.supplier_id,
      invoice_number: form.invoice_number || null,
      invoice_date: form.invoice_date,
      due_date: form.due_date || null,
      subtotal, tax, total,
      paid_amount: paid,
      notes: form.notes || null,
    }).select().single();

    if (error) return toast.error(error.message);

    const { error: itErr } = await (supabase as any).from("purchase_items").insert(
      items.map((it) => ({
        invoice_id: inv.id,
        product_id: it.product_id || null,
        product_name: it.product_name,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
      }))
    );
    if (itErr) toast.error("خطأ بنود: " + itErr.message);
    else toast.success("تم حفظ الفاتورة + تحديث التكاليف (WAC)");

    setItems([]); setShowForm(false);
    setForm({ supplier_id: "", invoice_number: "", invoice_date: new Date().toISOString().slice(0, 10), due_date: "", paid_amount: "0", tax: "0", notes: "" });
    load();
  };

  if (rolesLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (<><MobileTopbar title="فواتير المشتريات" /><div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>غير متاح</p></div></>);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_cost, 0);

  return (
    <>
      <MobileTopbar title="فواتير المشتريات" />
      <div className="px-4 lg:px-6 py-4 max-w-3xl mx-auto space-y-4" dir="rtl">
        <button onClick={() => setShowForm(!showForm)} className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> {showForm ? "إخفاء" : "فاتورة جديدة"}
        </button>

        {showForm && (
          <div className="bg-surface rounded-2xl p-4 border border-border/40 space-y-2">
            <select className="w-full bg-muted rounded-lg px-3 py-2 text-[14px]" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">— اختر المورد —</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="رقم الفاتورة" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
              <input type="date" className="bg-muted rounded-lg px-3 py-2 text-[14px]" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} />
              <input type="date" className="bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="استحقاق" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              <input className="bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="ضريبة" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} />
              <input className="col-span-2 bg-muted rounded-lg px-3 py-2 text-[14px]" placeholder="المدفوع نقداً" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} />
            </div>

            <div className="border-t border-border/40 pt-2 space-y-2">
              <p className="text-[12px] font-medium">البنود</p>
              <select className="w-full bg-muted rounded-lg px-3 py-2 text-[13px]" value={newItem.product_id} onChange={(e) => {
                const p = products.find((pp) => pp.id === e.target.value);
                setNewItem({ ...newItem, product_id: e.target.value, product_name: p?.name || "" });
              }}>
                <option value="">— اختر منتج —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-2">
                <input className="bg-muted rounded-lg px-3 py-2 text-[13px]" placeholder="كمية" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
                <input className="bg-muted rounded-lg px-3 py-2 text-[13px]" placeholder="تكلفة الوحدة" value={newItem.unit_cost} onChange={(e) => setNewItem({ ...newItem, unit_cost: e.target.value })} />
                <button onClick={addItem} className="bg-primary/10 text-primary rounded-lg text-[13px] font-medium">إضافة</button>
              </div>
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 bg-muted/40 rounded-lg p-2 text-[12px]">
                  <span className="flex-1">{it.product_name}</span>
                  <span>{it.quantity} × {fmtMoney(it.unit_cost)}</span>
                  <button onClick={() => setItems(items.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              ))}
              <p className="text-[12px] text-foreground-tertiary">الإجمالي قبل الضريبة: <span className="font-display">{fmtMoney(subtotal)}</span></p>
            </div>

            <button onClick={submit} className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-medium">حفظ الفاتورة + تحديث التكلفة (WAC)</button>
          </div>
        )}

        <div className="space-y-2">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-surface rounded-xl p-3 border border-border/40 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><FileText className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[14px] truncate">{inv.suppliers?.name} {inv.invoice_number ? `• ${inv.invoice_number}` : ""}</p>
                <p className="text-[11px] text-foreground-tertiary">{inv.invoice_date} • {inv.status}</p>
              </div>
              <div className="text-left">
                <p className="font-display text-[14px]">{fmtMoney(inv.total)}</p>
                {inv.remaining > 0 && <p className="text-[10px] text-destructive">متبقي {fmtMoney(inv.remaining)}</p>}
              </div>
            </div>
          ))}
          {invoices.length === 0 && <p className="text-center text-foreground-tertiary py-8 text-[13px]">لا توجد فواتير بعد</p>}
        </div>
      </div>
    </>
  );
}
