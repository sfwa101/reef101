import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Coupon = { id: string; code: string; description: string | null; discount_pct: number | null; discount_amount: number | null; min_order_total: number | null; min_user_level: string | null; max_uses: number | null; uses_count: number; is_active: boolean; ends_at: string | null };
type Discount = { id: string; name: string; scope: string; scope_value: string | null; discount_pct: number | null; discount_amount: number | null; min_user_level: string | null; is_active: boolean };
type MegaEvent = { id: string; name: string; trigger_kind: string; active_date: string | null; banner_title: string | null; banner_subtitle: string | null; global_discount_pct: number | null; is_active: boolean };

export default function Offers() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [events, setEvents] = useState<MegaEvent[]>([]);

  // forms
  const [cForm, setCForm] = useState({ code: "", description: "", discount_pct: "", discount_amount: "", min_order_total: "", min_user_level: "", max_uses: "", ends_at: "" });
  const [dForm, setDForm] = useState({ name: "", scope: "global", scope_value: "", discount_pct: "", min_user_level: "" });
  const [eForm, setEForm] = useState({ name: "", trigger_kind: "manual", active_date: "", banner_title: "", banner_subtitle: "", global_discount_pct: "" });

  const loadAll = async () => {
    const [c, d, e] = await Promise.all([
      (supabase as any).from("coupons").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("discounts").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("mega_events").select("*").order("created_at", { ascending: false }),
    ]);
    setCoupons((c.data ?? []) as Coupon[]);
    setDiscounts((d.data ?? []) as Discount[]);
    setEvents((e.data ?? []) as MegaEvent[]);
  };
  useEffect(() => { void loadAll(); }, []);

  const saveCoupon = async () => {
    if (!cForm.code.trim()) return toast.error("الكود مطلوب");
    const payload: any = {
      code: cForm.code.trim().toUpperCase(),
      description: cForm.description || null,
      discount_pct: cForm.discount_pct ? Number(cForm.discount_pct) : null,
      discount_amount: cForm.discount_amount ? Number(cForm.discount_amount) : null,
      min_order_total: cForm.min_order_total ? Number(cForm.min_order_total) : null,
      min_user_level: cForm.min_user_level || null,
      max_uses: cForm.max_uses ? Number(cForm.max_uses) : null,
      ends_at: cForm.ends_at || null,
      is_active: true,
    };
    const { error } = await (supabase as any).from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الكوبون");
    setCForm({ code: "", description: "", discount_pct: "", discount_amount: "", min_order_total: "", min_user_level: "", max_uses: "", ends_at: "" });
    void loadAll();
  };

  const toggleCoupon = async (id: string, current: boolean) => {
    await (supabase as any).from("coupons").update({ is_active: !current }).eq("id", id);
    void loadAll();
  };

  const saveDiscount = async () => {
    if (!dForm.name) return toast.error("الاسم مطلوب");
    const payload: any = {
      name: dForm.name,
      scope: dForm.scope,
      scope_value: dForm.scope_value || null,
      discount_pct: dForm.discount_pct ? Number(dForm.discount_pct) : null,
      min_user_level: dForm.min_user_level || null,
      is_active: true,
    };
    const { error } = await (supabase as any).from("discounts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الخصم");
    setDForm({ name: "", scope: "global", scope_value: "", discount_pct: "", min_user_level: "" });
    void loadAll();
  };

  const toggleDiscount = async (id: string, current: boolean) => {
    await (supabase as any).from("discounts").update({ is_active: !current }).eq("id", id);
    void loadAll();
  };

  const saveEvent = async () => {
    if (!eForm.name) return toast.error("الاسم مطلوب");
    const payload: any = {
      name: eForm.name,
      trigger_kind: eForm.trigger_kind,
      active_date: eForm.active_date || null,
      banner_title: eForm.banner_title || null,
      banner_subtitle: eForm.banner_subtitle || null,
      global_discount_pct: eForm.global_discount_pct ? Number(eForm.global_discount_pct) : null,
      is_active: true,
    };
    const { error } = await (supabase as any).from("mega_events").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الحدث");
    setEForm({ name: "", trigger_kind: "manual", active_date: "", banner_title: "", banner_subtitle: "", global_discount_pct: "" });
    void loadAll();
  };

  const toggleEvent = async (id: string, current: boolean) => {
    await (supabase as any).from("mega_events").update({ is_active: !current }).eq("id", id);
    void loadAll();
  };

  return (
    <div className="container mx-auto p-4 space-y-4" dir="rtl">
      <h1 className="font-display text-2xl font-extrabold">العروض والولاء</h1>

      <Tabs defaultValue="coupons">
        <TabsList>
          <TabsTrigger value="coupons">الكوبونات</TabsTrigger>
          <TabsTrigger value="discounts">الخصومات</TabsTrigger>
          <TabsTrigger value="events">الأحداث الكبرى</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>إنشاء كوبون</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div><Label>الكود</Label><Input value={cForm.code} onChange={(e) => setCForm({ ...cForm, code: e.target.value })} /></div>
              <div><Label>الوصف</Label><Input value={cForm.description} onChange={(e) => setCForm({ ...cForm, description: e.target.value })} /></div>
              <div><Label>نسبة الخصم %</Label><Input type="number" value={cForm.discount_pct} onChange={(e) => setCForm({ ...cForm, discount_pct: e.target.value })} /></div>
              <div><Label>مبلغ ثابت</Label><Input type="number" value={cForm.discount_amount} onChange={(e) => setCForm({ ...cForm, discount_amount: e.target.value })} /></div>
              <div><Label>حد أدنى للطلب</Label><Input type="number" value={cForm.min_order_total} onChange={(e) => setCForm({ ...cForm, min_order_total: e.target.value })} /></div>
              <div>
                <Label>الحد الأدنى للمستوى</Label>
                <select className="w-full rounded-md border bg-background p-2" value={cForm.min_user_level} onChange={(e) => setCForm({ ...cForm, min_user_level: e.target.value })}>
                  <option value="">بدون شرط</option>
                  <option value="bronze">برونز</option>
                  <option value="silver">فضي</option>
                  <option value="gold">ذهبي</option>
                  <option value="platinum">بلاتيني</option>
                </select>
              </div>
              <div><Label>أقصى عدد استخدامات</Label><Input type="number" value={cForm.max_uses} onChange={(e) => setCForm({ ...cForm, max_uses: e.target.value })} /></div>
              <div><Label>تاريخ الانتهاء</Label><Input type="datetime-local" value={cForm.ends_at} onChange={(e) => setCForm({ ...cForm, ends_at: e.target.value })} /></div>
              <Button className="col-span-2" onClick={saveCoupon}>حفظ الكوبون</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الكوبونات الحالية ({coupons.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {coupons.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-bold">{c.code} {c.discount_pct ? `— ${c.discount_pct}%` : c.discount_amount ? `— ${c.discount_amount} ج` : ""}</p>
                    <p className="text-xs text-muted-foreground">{c.description} {c.min_user_level && `• مستوى ${c.min_user_level}+`} • استُخدم {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}</p>
                  </div>
                  <Button size="sm" variant={c.is_active ? "secondary" : "outline"} onClick={() => toggleCoupon(c.id, c.is_active)}>
                    {c.is_active ? "نشط" : "متوقف"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>إنشاء خصم</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div><Label>الاسم</Label><Input value={dForm.name} onChange={(e) => setDForm({ ...dForm, name: e.target.value })} /></div>
              <div>
                <Label>النطاق</Label>
                <select className="w-full rounded-md border bg-background p-2" value={dForm.scope} onChange={(e) => setDForm({ ...dForm, scope: e.target.value })}>
                  <option value="global">عام</option>
                  <option value="category">تصنيف</option>
                  <option value="product">منتج</option>
                </select>
              </div>
              <div><Label>قيمة النطاق (تصنيف/منتج)</Label><Input value={dForm.scope_value} onChange={(e) => setDForm({ ...dForm, scope_value: e.target.value })} /></div>
              <div><Label>نسبة الخصم %</Label><Input type="number" value={dForm.discount_pct} onChange={(e) => setDForm({ ...dForm, discount_pct: e.target.value })} /></div>
              <div>
                <Label>الحد الأدنى للمستوى</Label>
                <select className="w-full rounded-md border bg-background p-2" value={dForm.min_user_level} onChange={(e) => setDForm({ ...dForm, min_user_level: e.target.value })}>
                  <option value="">بدون شرط</option>
                  <option value="bronze">برونز</option>
                  <option value="silver">فضي</option>
                  <option value="gold">ذهبي</option>
                  <option value="platinum">بلاتيني</option>
                </select>
              </div>
              <Button className="col-span-2" onClick={saveDiscount}>حفظ الخصم</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الخصومات الحالية ({discounts.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {discounts.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-bold">{d.name} — {d.discount_pct}%</p>
                    <p className="text-xs text-muted-foreground">{d.scope}{d.scope_value ? `: ${d.scope_value}` : ""} {d.min_user_level && `• مستوى ${d.min_user_level}+`}</p>
                  </div>
                  <Button size="sm" variant={d.is_active ? "secondary" : "outline"} onClick={() => toggleDiscount(d.id, d.is_active)}>
                    {d.is_active ? "نشط" : "متوقف"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>إنشاء حدث كبير</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div><Label>الاسم</Label><Input value={eForm.name} onChange={(e) => setEForm({ ...eForm, name: e.target.value })} /></div>
              <div>
                <Label>المُحفّز</Label>
                <select className="w-full rounded-md border bg-background p-2" value={eForm.trigger_kind} onChange={(e) => setEForm({ ...eForm, trigger_kind: e.target.value })}>
                  <option value="manual">يدوي</option>
                  <option value="tuesday">الثلاثاء</option>
                  <option value="friday">الجمعة</option>
                  <option value="first_friday">أول جمعة</option>
                </select>
              </div>
              <div><Label>التاريخ</Label><Input type="date" value={eForm.active_date} onChange={(e) => setEForm({ ...eForm, active_date: e.target.value })} /></div>
              <div><Label>عنوان البانر</Label><Input value={eForm.banner_title} onChange={(e) => setEForm({ ...eForm, banner_title: e.target.value })} /></div>
              <div className="col-span-2"><Label>وصف البانر</Label><Input value={eForm.banner_subtitle} onChange={(e) => setEForm({ ...eForm, banner_subtitle: e.target.value })} /></div>
              <div><Label>خصم عام %</Label><Input type="number" value={eForm.global_discount_pct} onChange={(e) => setEForm({ ...eForm, global_discount_pct: e.target.value })} /></div>
              <Button className="col-span-2" onClick={saveEvent}>حفظ الحدث</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الأحداث الحالية ({events.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-bold">{ev.name} {ev.global_discount_pct ? `— ${ev.global_discount_pct}%` : ""}</p>
                    <p className="text-xs text-muted-foreground">{ev.trigger_kind} {ev.active_date && `• ${ev.active_date}`} • {ev.banner_title}</p>
                  </div>
                  <Button size="sm" variant={ev.is_active ? "secondary" : "outline"} onClick={() => toggleEvent(ev.id, ev.is_active)}>
                    {ev.is_active ? "نشط" : "متوقف"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
