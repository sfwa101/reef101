import { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload, Loader2, ImageIcon, AlertTriangle, Shield, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { refetchProducts } from "@/lib/products";
import { useAdminRoles } from "@/components/admin/RoleGuard";

export type ProductRow = {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  price: number | string;
  old_price: number | string | null;
  cost_price: number | string | null;
  affiliate_commission_pct: number | string | null;
  image: string | null;
  image_url: string | null;
  image_path: string | null;
  rating: number | null;
  category: string;
  sub_category: string | null;
  source: string;
  badge: string | null;
  stock: number;
  sort_order: number;
  is_active: boolean;
  store_id: string | null;
  category_id: string | null;
  description: string | null;
  perishable: boolean | null;
};

const SOURCES = [
  { v: "supermarket", l: "سوبر ماركت" },
  { v: "kitchen", l: "مطبخ" },
  { v: "dairy", l: "ألبان" },
  { v: "produce", l: "خضار وفاكهة" },
  { v: "meat", l: "لحوم" },
  { v: "sweets", l: "حلويات" },
  { v: "pharmacy", l: "صيدلية" },
  { v: "library", l: "مكتبة" },
  { v: "wholesale", l: "جملة" },
  { v: "home", l: "أدوات منزلية" },
  { v: "village", l: "قرية" },
  { v: "baskets", l: "سلال" },
  { v: "restaurants", l: "مطاعم" },
  { v: "recipes", l: "وصفات" },
];

const BADGES = [
  { v: "", l: "بدون" },
  { v: "best", l: "الأكثر مبيعاً" },
  { v: "trending", l: "رائج" },
  { v: "premium", l: "بريميوم" },
  { v: "new", l: "جديد" },
];

const empty: ProductRow = {
  id: "",
  name: "",
  brand: "",
  unit: "قطعة",
  price: 0,
  old_price: null,
  cost_price: null,
  affiliate_commission_pct: 0,
  image: null,
  image_url: null,
  image_path: null,
  rating: null,
  category: "",
  sub_category: null,
  source: "supermarket",
  badge: null,
  stock: 100,
  sort_order: 0,
  is_active: true,
  store_id: null,
  category_id: null,
  description: null,
  perishable: null,
};

export function ProductEditor({
  product,
  categories,
  stores,
  onClose,
  onSaved,
}: {
  product: ProductRow | null;
  categories: { id: string; name: string; icon: string | null }[];
  stores: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !product;
  const [form, setForm] = useState<ProductRow>(product ?? empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [showOverride, setShowOverride] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { hasRole } = useAdminRoles();
  const canOverride = hasRole("admin") || hasRole("store_manager");

  useEffect(() => {
    setForm(product ?? empty);
    setShowOverride(false);
    setOverrideReason("");
  }, [product]);

  const update = <K extends keyof ProductRow>(k: K, v: ProductRow[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Live margin/discount analysis
  const marginInfo = useMemo(() => {
    const sale = Number(form.price) || 0;
    const cost = Number(form.cost_price) || 0;
    const old = Number(form.old_price) || 0;
    const affiliate = Number(form.affiliate_commission_pct) || 0;

    if (cost <= 0 || sale <= 0) {
      return { kind: "no_cost" as const };
    }
    const margin = sale - cost;
    const marginPct = (margin / sale) * 100;
    const affiliateAmount = (sale * affiliate) / 100;
    const netProfit = margin - affiliateAmount;

    let discountStatus: "ok" | "warn" | "block" = "ok";
    let discountInfo: { discount: number; max: number; pct: number } | null = null;
    if (old > sale) {
      const discount = old - sale;
      const max = (old - cost) * 0.5;
      discountInfo = { discount, max, pct: (discount / old) * 100 };
      if (margin <= 0) discountStatus = "block";
      else if (discount > max) discountStatus = "block";
      else if (discount > max * 0.85) discountStatus = "warn";
    }

    let affiliateStatus: "ok" | "warn" | "block" = "ok";
    if (affiliate > 0) {
      if (netProfit < 0) affiliateStatus = "block";
      else if (netProfit < margin * 0.2) affiliateStatus = "warn";
    }

    return {
      kind: "ok" as const,
      sale, cost, margin, marginPct,
      affiliate, affiliateAmount, netProfit,
      discountStatus, discountInfo, affiliateStatus,
    };
  }, [form.price, form.cost_price, form.old_price, form.affiliate_commission_pct]);

  const blocksSave =
    marginInfo.kind === "ok" &&
    ((marginInfo.discountStatus === "block" || marginInfo.affiliateStatus === "block")) &&
    !showOverride;

  const requiresOverride =
    marginInfo.kind === "ok" &&
    (marginInfo.discountStatus === "block" || marginInfo.affiliateStatus === "block");

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${form.source || "misc"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl, image_path: path }));
      toast.success("تم رفع الصورة");
    } catch (err) {
      toast.error("فشل رفع الصورة: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("الاسم مطلوب"); return; }
    if (!form.category.trim()) { toast.error("الفئة مطلوبة"); return; }

    // Block save if discount violates 50% rule (unless override approved)
    if (requiresOverride && !showOverride) {
      setShowOverride(true);
      toast.error("هذا الخصم يهدد الأرباح. ادخل سبب التجاوز اليدوي.");
      return;
    }
    if (requiresOverride && showOverride && overrideReason.trim().length < 10) {
      toast.error("سبب التجاوز يجب ألا يقل عن 10 أحرف");
      return;
    }

    setSaving(true);
    try {
      const productId = form.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const payload = {
        id: productId,
        name: form.name.trim(),
        brand: form.brand || null,
        unit: form.unit || "قطعة",
        price: Number(form.price) || 0,
        old_price: form.old_price ? Number(form.old_price) : null,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        affiliate_commission_pct: Number(form.affiliate_commission_pct) || 0,
        image_url: form.image_url,
        image_path: form.image_path,
        rating: form.rating ? Number(form.rating) : null,
        category: form.category.trim(),
        sub_category: form.sub_category || null,
        source: form.source,
        badge: form.badge || null,
        stock: Number(form.stock) || 0,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
        store_id: form.store_id || null,
        category_id: form.category_id || null,
        description: form.description || null,
        perishable: form.perishable,
      };

      const { error } = isNew
        ? await supabase.from("products").insert(payload)
        : await supabase.from("products").update(payload).eq("id", form.id);

      if (error) throw error;

      // Log override if applicable
      if (requiresOverride && showOverride && marginInfo.kind === "ok" && marginInfo.discountInfo) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();
        await supabase.from("discount_overrides" as never).insert({
          product_id: productId,
          product_name: form.name.trim(),
          override_by: user!.id,
          override_by_name: profile?.full_name ?? null,
          cost_price: marginInfo.cost,
          sale_price: Number(form.old_price) || marginInfo.sale,
          attempted_discount: marginInfo.discountInfo.discount,
          margin_amount: marginInfo.margin,
          reason: overrideReason.trim(),
        } as never);
      }

      toast.success(isNew ? "تم إنشاء المنتج" : "تم الحفظ");
      await refetchProducts();
      onSaved();
    } catch (err) {
      toast.error("خطأ: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center" onClick={onClose}>
      <div
        className="bg-background w-full lg:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40 px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-[18px]">{isNew ? "منتج جديد" : "تعديل المنتج"}</h2>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-surface-muted flex items-center justify-center press">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image */}
          <div>
            <Label>صورة المنتج</Label>
            <div className="flex items-center gap-3">
              <div className="h-24 w-24 rounded-2xl bg-surface-muted overflow-hidden flex items-center justify-center border border-border/40">
                {form.image_url || form.image ? (
                  <img src={form.image_url || form.image || ""} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-foreground-tertiary opacity-40" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 press disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  رفع صورة
                </button>
                <input
                  value={form.image_url ?? ""}
                  onChange={(e) => update("image_url", e.target.value)}
                  placeholder="أو الصق رابط صورة"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <Field label="الاسم *">
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputCls} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="العلامة التجارية">
              <input value={form.brand ?? ""} onChange={(e) => update("brand", e.target.value)} className={inputCls} />
            </Field>
            <Field label="الوحدة">
              <input value={form.unit} onChange={(e) => update("unit", e.target.value)} placeholder="قطعة / كجم / لتر" className={inputCls} />
            </Field>
          </div>

          {/* Pricing block with margin protection */}
          <div className="rounded-2xl border border-border/60 bg-surface/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-[13px] font-bold text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              التسعير وحماية الهامش
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Field label="سعر التكلفة">
                <input
                  type="number" step="0.01"
                  value={(form.cost_price as number) ?? ""}
                  onChange={(e) => update("cost_price", e.target.value || null)}
                  placeholder="ج.م"
                  className={inputCls + " num text-right"}
                />
              </Field>
              <Field label="سعر البيع *">
                <input
                  type="number" step="0.01"
                  value={form.price as number}
                  onChange={(e) => update("price", e.target.value)}
                  className={inputCls + " num text-right"}
                />
              </Field>
              <Field label="السعر قبل الخصم">
                <input
                  type="number" step="0.01"
                  value={(form.old_price as number) ?? ""}
                  onChange={(e) => update("old_price", e.target.value || null)}
                  className={inputCls + " num text-right"}
                />
              </Field>
            </div>

            <Field label="نسبة عمولة الأفلييت %">
              <input
                type="number" step="0.5" min="0" max="50"
                value={(form.affiliate_commission_pct as number) ?? 0}
                onChange={(e) => update("affiliate_commission_pct", e.target.value)}
                className={inputCls + " num text-right"}
              />
            </Field>

            {/* Margin analysis */}
            {marginInfo.kind === "no_cost" ? (
              <div className="rounded-xl bg-warning/10 border border-warning/30 p-3 text-[12px] text-warning flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>أدخل سعر التكلفة لتفعيل حماية الهامش وحساب صافي الربح.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="هامش ربح" value={marginInfo.margin.toFixed(2)} sub={`${marginInfo.marginPct.toFixed(0)}%`} tone="primary" />
                  <Stat label="عمولة شريك" value={marginInfo.affiliateAmount.toFixed(2)} sub={`${marginInfo.affiliate}%`} tone="info" />
                  <Stat
                    label="صافي الربح"
                    value={marginInfo.netProfit.toFixed(2)}
                    sub="ج.م"
                    tone={marginInfo.netProfit < 0 ? "destructive" : marginInfo.netProfit < marginInfo.margin * 0.2 ? "warning" : "success"}
                  />
                </div>

                {marginInfo.discountInfo && (
                  <div className={`rounded-xl p-3 text-[12px] flex items-start gap-2 border ${
                    marginInfo.discountStatus === "block" ? "bg-destructive/10 border-destructive/40 text-destructive" :
                    marginInfo.discountStatus === "warn" ? "bg-warning/10 border-warning/30 text-warning" :
                    "bg-success/10 border-success/30 text-success"
                  }`}>
                    <TrendingDown className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      {marginInfo.discountStatus === "block" ? (
                        <>
                          <strong>عذراً، هذا الخصم يهدد استدامة الأرباح.</strong>
                          <div className="mt-1">
                            الخصم: <span className="num">{marginInfo.discountInfo.discount.toFixed(2)}</span> ج.م ({marginInfo.discountInfo.pct.toFixed(0)}%)
                            • الحد الأقصى: <span className="num">{marginInfo.discountInfo.max.toFixed(2)}</span> ج.م (50% من الهامش)
                          </div>
                        </>
                      ) : marginInfo.discountStatus === "warn" ? (
                        <>الخصم قريب من الحد المسموح ({marginInfo.discountInfo.max.toFixed(2)} ج.م)</>
                      ) : (
                        <>الخصم آمن: {marginInfo.discountInfo.discount.toFixed(2)} ج.م من حد {marginInfo.discountInfo.max.toFixed(2)}</>
                      )}
                    </div>
                  </div>
                )}

                {marginInfo.affiliateStatus !== "ok" && (
                  <div className={`rounded-xl p-3 text-[12px] flex items-start gap-2 border ${
                    marginInfo.affiliateStatus === "block" ? "bg-destructive/10 border-destructive/40 text-destructive" :
                    "bg-warning/10 border-warning/30 text-warning"
                  }`}>
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {marginInfo.affiliateStatus === "block"
                        ? "تحذير: مجموع الخصم وعمولة الشريك يتجاوز هامش الربح — خسارة!"
                        : "تحذير ذكي: العمولة تستهلك أكثر من 80% من الهامش بعد الخصم."}
                    </span>
                  </div>
                )}

                {requiresOverride && canOverride && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/30 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-[12.5px] font-bold text-destructive">
                      <Shield className="h-4 w-4" /> تجاوز يدوي مطلوب (سيُسجل باسمك)
                    </div>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={2}
                      placeholder="اكتب سبب التجاوز (10 أحرف على الأقل) - سيُسجل في سجل الأرباح"
                      className={inputCls + " resize-none py-2 h-auto"}
                    />
                    <button
                      onClick={() => setShowOverride(true)}
                      disabled={overrideReason.trim().length < 10}
                      className="w-full h-10 rounded-xl bg-destructive text-destructive-foreground text-[12.5px] font-bold press disabled:opacity-40"
                    >
                      أوافق على التجاوز ومسؤولية القرار
                    </button>
                  </div>
                )}
                {requiresOverride && !canOverride && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-[12px] text-destructive flex items-start gap-2">
                    <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>صلاحية التجاوز اليدوي للمدير فقط. عدّل السعر أو راجع المسؤول.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="المخزون">
              <input type="number" value={form.stock} onChange={(e) => update("stock", Number(e.target.value))} className={inputCls + " num text-right"} />
            </Field>
            <Field label="الترتيب">
              <input type="number" value={form.sort_order} onChange={(e) => update("sort_order", Number(e.target.value))} className={inputCls + " num text-right"} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="القسم *">
              <select value={form.source} onChange={(e) => update("source", e.target.value)} className={inputCls}>
                {SOURCES.map((s) => (
                  <option key={s.v} value={s.v}>{s.l}</option>
                ))}
              </select>
            </Field>
            <Field label="الشارة">
              <select value={form.badge ?? ""} onChange={(e) => update("badge", e.target.value || null)} className={inputCls}>
                {BADGES.map((b) => (
                  <option key={b.v} value={b.v}>{b.l}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="الفئة *">
              <input value={form.category} onChange={(e) => update("category", e.target.value)} list="cat-list" className={inputCls} />
              <datalist id="cat-list">
                {categories.map((c) => <option key={c.id} value={c.name} />)}
              </datalist>
            </Field>
            <Field label="الفئة الفرعية">
              <input value={form.sub_category ?? ""} onChange={(e) => update("sub_category", e.target.value || null)} className={inputCls} />
            </Field>
          </div>

          <Field label="المتجر">
            <select value={form.store_id ?? ""} onChange={(e) => update("store_id", e.target.value || null)} className={inputCls}>
              <option value="">— بدون —</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>

          <Field label="الوصف">
            <textarea
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value || null)}
              rows={3}
              className={inputCls + " resize-none py-2"}
            />
          </Field>

          <div className="flex items-center gap-3 flex-wrap">
            <Toggle checked={form.is_active} onChange={(v) => update("is_active", v)} label="نشط" />
            <Toggle
              checked={form.perishable === true}
              onChange={(v) => update("perishable", v ? true : null)}
              label="قابل للتلف"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/40 px-5 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl bg-surface-muted text-[14px] font-semibold press">
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving || blocksSave}
            className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground text-[14px] font-semibold press flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isNew ? "إنشاء" : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full h-11 rounded-xl bg-surface-muted px-3 text-[14px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-foreground-secondary mb-1.5">{children}</label>;
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 press"
    >
      <span
        className={
          "w-10 h-6 rounded-full transition-colors relative " +
          (checked ? "bg-primary" : "bg-surface-muted border border-border/60")
        }
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all " +
            (checked ? "right-0.5" : "right-[18px]")
          }
        />
      </span>
      <span className="text-[13px] font-semibold">{label}</span>
    </button>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "primary" | "info" | "success" | "warning" | "destructive" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className={`rounded-xl py-2 px-1 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold opacity-80">{label}</p>
      <p className="font-display text-[15px] num leading-tight">{value}</p>
      <p className="text-[9.5px] opacity-70 num">{sub}</p>
    </div>
  );
}
