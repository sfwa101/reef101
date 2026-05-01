import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Search, Package, Image as ImageIcon, Pencil, Trash2, Sparkles, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { fmtMoney, fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ProductEditor, type ProductRow } from "@/components/admin/ProductEditor";
import { toast } from "sonner";
import { runMegaSeed } from "@/lib/megaSeed";

type Category = { id: string; name: string; icon: string | null };

export default function Products() {
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [fixingImages, setFixingImages] = useState(false);

  const FIX_IMAGE_MAP: Record<string, string> = {
    supermarket: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    produce: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
    meat: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=600&q=80",
    dairy: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80",
    sweets: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    pharmacy: "https://images.unsplash.com/photo-1584308666744-24d5e4a8b792?auto=format&fit=crop&w=600&q=80",
    library: "https://images.unsplash.com/photo-1542856204-0010166edc11?auto=format&fit=crop&w=600&q=80",
    restaurants: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    recipes: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
  };
  const FIX_IMAGE_DEFAULT = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=600&q=80";

  const handleFixImages = async () => {
    if (!confirm("سيتم تحديث صور جميع المنتجات الحالية بصور احترافية ثابتة. متابعة؟")) return;
    setFixingImages(true);
    const t = toast.loading("جاري إصلاح الصور…");
    try {
      const { data, error } = await supabase.from("products").select("id, source").limit(5000);
      if (error) throw error;
      const all = (data ?? []) as { id: string; source: string | null }[];
      // Group ids by target URL
      const groups = new Map<string, string[]>();
      for (const row of all) {
        const url = FIX_IMAGE_MAP[(row.source ?? "").toLowerCase()] ?? FIX_IMAGE_DEFAULT;
        if (!groups.has(url)) groups.set(url, []);
        groups.get(url)!.push(row.id);
      }
      let updated = 0;
      const errors: string[] = [];
      for (const [url, ids] of groups) {
        // chunk of 50
        for (let i = 0; i < ids.length; i += 50) {
          const chunk = ids.slice(i, i + 50);
          const { error: upErr } = await supabase
            .from("products")
            .update({ image_url: url, image: url })
            .in("id", chunk);
          if (upErr) errors.push(upErr.message);
          else updated += chunk.length;
        }
      }
      toast.dismiss(t);
      if (errors.length) toast.error(`تم تحديث ${updated}/${all.length} — خطأ: ${errors[0]}`);
      else toast.success(`✨ تم تحديث صور ${updated} منتج`);
      await load();
    } catch (e) {
      toast.dismiss(t);
      toast.error("فشل الإصلاح: " + (e as Error).message);
    } finally {
      setFixingImages(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("سيتم حقن أكثر من 500 منتج محلي مصري في الكتالوج. متابعة؟")) return;
    setSeeding(true);
    const t = toast.loading("جاري توليد الكتالوج المحلي…");
    try {
      const res = await runMegaSeed();
      toast.dismiss(t);
      if (res.errors.length > 0) {
        toast.error(`تم حقن ${res.inserted}/${res.total} — أخطاء: ${res.errors[0]}`);
      } else {
        toast.success(`✨ تم حقن ${res.inserted} منتج بنجاح!`);
      }
      await load();
    } catch (e) {
      toast.dismiss(t);
      toast.error("فشل الحقن: " + (e as Error).message);
    } finally {
      setSeeding(false);
    }
  };

  const load = useCallback(async () => {
    setProducts(null);
    const [p, c, s] = await Promise.all([
      supabase.from("products").select("*").order("sort_order", { ascending: true }).limit(2000),
      supabase.from("categories").select("id,name,icon").order("sort_order"),
      supabase.from("stores").select("id,name").eq("is_active", true).order("name"),
    ]);
    setProducts((p.data ?? []) as ProductRow[]);
    setCategories((c.data ?? []) as Category[]);
    setStores((s.data ?? []) as { id: string; name: string }[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!products) return null;
    let r = products;
    if (cat !== "all") r = r.filter((p) => p.category === cat || p.category_id === cat);
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      r = r.filter((p) => p.name.toLowerCase().includes(t) || (p.brand ?? "").toLowerCase().includes(t));
    }
    return r;
  }, [products, cat, q]);

  const stats = useMemo(() => {
    if (!products) return { total: 0, active: 0, low: 0 };
    return {
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      low: products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 20).length,
    };
  }, [products]);

  const handleDelete = async (p: ProductRow) => {
    if (!confirm(`حذف "${p.name}"؟`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      toast.error("فشل الحذف: " + error.message);
      return;
    }
    toast.success("تم الحذف");
    load();
  };

  const handleToggle = async (p: ProductRow) => {
    const { error } = await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(p.is_active ? "تم إيقاف المنتج" : "تم تفعيل المنتج");
    load();
  };

  const cats = useMemo(() => {
    const set = new Set<string>();
    (products ?? []).forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  return (
    <>
      <MobileTopbar title="المنتجات" />
      <div className="px-4 lg:px-6 pt-2 pb-6 max-w-6xl mx-auto">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن منتج (اسم/علامة)"
              className="w-full bg-surface-muted rounded-2xl h-11 pr-10 pl-4 text-[14px] placeholder:text-foreground-tertiary border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground flex items-center gap-1.5 press shadow-sm font-semibold text-[13px]"
          >
            <Plus className="h-4 w-4" />
            <span>جديد</span>
          </button>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="h-11 px-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center gap-1.5 press shadow-sm font-semibold text-[12px] disabled:opacity-60"
            title="حقن أكثر من 500 منتج محلي"
          >
            <Sparkles className="h-4 w-4" />
            <span>{seeding ? "جاري…" : "حقن 500+"}</span>
          </button>
          <button
            onClick={handleFixImages}
            disabled={fixingImages}
            className="h-11 px-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center gap-1.5 press shadow-sm font-semibold text-[12px] disabled:opacity-60"
            title="تحديث صور المنتجات الحالية"
          >
            <Wand2 className="h-4 w-4" />
            <span>{fixingImages ? "جاري…" : "إصلاح الصور"}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l: "الإجمالي", v: stats.total, t: "text-foreground" },
            { l: "نشطة", v: stats.active, t: "text-success" },
            { l: "مخزون منخفض", v: stats.low, t: "text-warning" },
          ].map((s) => (
            <div key={s.l} className="bg-surface rounded-2xl border border-border/40 p-3 text-center">
              <p className={cn("font-display text-[22px] leading-none num", s.t)}>{fmtNum(s.v)}</p>
              <p className="text-[11px] text-foreground-tertiary mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto -mx-4 px-4 mb-4 no-scrollbar">
          <div className="inline-flex gap-1.5">
            <Pill active={cat === "all"} onClick={() => setCat("all")} icon="📦" label="الكل" />
            {cats.map((c) => (
              <Pill key={c} active={cat === c} onClick={() => setCat(c)} icon="•" label={c} />
            ))}
          </div>
        </div>

        {filtered === null ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-3xl p-10 text-center border border-border/40">
            <Package className="h-10 w-10 mx-auto text-foreground-tertiary mb-3" />
            <p className="font-display text-[16px] mb-1">لا توجد منتجات</p>
            <p className="text-[13px] text-foreground-secondary">أضف منتجاً جديداً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const lowStock = (p.stock ?? 0) > 0 && (p.stock ?? 0) < 20;
              const out = (p.stock ?? 0) <= 0;
              const status = !p.is_active ? "archived" : out ? "out_of_stock" : "active";
              const statusBadge: Record<string, string> = {
                active: "bg-success/12 text-success",
                archived: "bg-foreground-tertiary/15 text-foreground-secondary",
                out_of_stock: "bg-destructive/12 text-destructive",
              };
              const statusLabel: Record<string, string> = { active: "نشط", archived: "موقوف", out_of_stock: "نفد" };
              return (
                <div key={p.id} className="text-right">
                  <IOSCard padded={false} className="overflow-hidden">
                    <button onClick={() => setEditing(p)} className="block w-full press">
                      <div className="aspect-square bg-gradient-to-br from-surface-muted to-secondary flex items-center justify-center relative">
                        {p.image_url || p.image ? (
                          <img src={p.image_url || p.image || ""} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-foreground-tertiary opacity-40" />
                        )}
                        <span className={cn("absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full", statusBadge[status])}>
                          {statusLabel[status]}
                        </span>
                      </div>
                      <div className="p-3 text-right">
                        <p className="text-[13.5px] font-semibold truncate mb-1">{p.name}</p>
                        <div className="flex items-baseline gap-1.5 mb-1.5">
                          <span className="font-display text-[15px] num tracking-tight">{fmtMoney(Number(p.price))}</span>
                          {p.old_price && Number(p.old_price) > Number(p.price) && (
                            <span className="text-[10.5px] text-foreground-tertiary line-through num">{fmtMoney(Number(p.old_price))}</span>
                          )}
                        </div>
                        <p className={cn("text-[11px]", lowStock ? "text-warning" : "text-foreground-tertiary")}>
                          المخزون: <span className="num font-semibold">{fmtNum(p.stock ?? 0)}</span> {p.unit}
                        </p>
                      </div>
                    </button>
                    <div className="flex border-t border-border/40">
                      <button onClick={() => setEditing(p)} className="flex-1 h-9 text-[12px] font-semibold text-primary press flex items-center justify-center gap-1">
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </button>
                      <button onClick={() => handleToggle(p)} className="flex-1 h-9 text-[12px] font-semibold text-foreground-secondary press border-r border-border/40">
                        {p.is_active ? "إيقاف" : "تفعيل"}
                      </button>
                      <button onClick={() => handleDelete(p)} className="h-9 w-10 text-destructive press border-r border-border/40 flex items-center justify-center">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </IOSCard>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sheet rendered at root level — escapes any card overflow/z-index trap */}
      <ProductEditor
        open={creating || !!editing}
        product={editing}
        categories={categories}
        stores={stores}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          load();
        }}
      />
    </>
  );
}

function Pill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 h-9 px-4 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition-base press border",
        active ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-surface text-foreground-secondary border-border/40",
      )}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
