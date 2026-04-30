import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { RoleGuard } from "@/components/admin/RoleGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type Driver = {
  id: string; full_name: string; phone: string; driver_type: string;
  current_zone: string | null; base_salary: number; commission_pct: number | null;
  vehicle_plate: string | null; is_active: boolean;
};

export default function AdminDrivers() {
  return (
    <RoleGuard roles={["admin", "finance"]}>
      <MobileTopbar title="المناديب" />
      <DriversInner />
    </RoleGuard>
  );
}

function DriversInner() {
  const [list, setList] = useState<Driver[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", driver_type: "salary_comm",
    current_zone: "", base_salary: "0", commission_pct: "", vehicle_plate: "",
  });

  const load = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any).from("drivers").select("*").order("created_at", { ascending: false });
    setList((data ?? []) as Driver[]);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.full_name || !form.phone) return toast.error("الاسم والهاتف مطلوبان");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("drivers").insert({
      full_name: form.full_name, phone: form.phone, driver_type: form.driver_type,
      current_zone: form.current_zone || null, base_salary: Number(form.base_salary) || 0,
      commission_pct: form.commission_pct ? Number(form.commission_pct) : null,
      vehicle_plate: form.vehicle_plate || null,
    });
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء المندوب");
    setOpen(false); load();
  };

  const toggle = async (d: Driver) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("drivers").update({ is_active: !d.is_active }).eq("id", d.id);
    load();
  };

  return (
    <div dir="rtl" className="p-4 max-w-3xl mx-auto space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-[20px]">المناديب ({list.length})</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 ml-1" />إضافة</Button></DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>مندوب جديد</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>الاسم</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div>
                <Label>نوع السائق</Label>
                <Select value={form.driver_type} onValueChange={v => setForm({ ...form, driver_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary_comm">راتب + عمولة</SelectItem>
                    <SelectItem value="commission_only">عمولة فقط</SelectItem>
                    <SelectItem value="third_party">شركة خارجية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>المنطقة</Label><Input value={form.current_zone} onChange={e => setForm({ ...form, current_zone: e.target.value })} /></div>
                <div><Label>اللوحة</Label><Input value={form.vehicle_plate} onChange={e => setForm({ ...form, vehicle_plate: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>الراتب الأساسي</Label><Input type="number" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} /></div>
                <div><Label>عمولة % (اختياري)</Label><Input type="number" value={form.commission_pct} onChange={e => setForm({ ...form, commission_pct: e.target.value })} /></div>
              </div>
              <Button onClick={create} className="w-full">حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {list.map(d => (
        <Card key={d.id}>
          <CardContent className="p-4 flex justify-between items-start gap-3">
            <div className="flex-1">
              <p className="font-display text-[15px]">{d.full_name}</p>
              <p className="text-[12px] num text-foreground-tertiary" dir="ltr">{d.phone}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="secondary">{d.driver_type}</Badge>
                {d.current_zone && <Badge variant="outline">{d.current_zone}</Badge>}
                {d.vehicle_plate && <Badge variant="outline">{d.vehicle_plate}</Badge>}
                <Badge variant={d.is_active ? "default" : "destructive"}>{d.is_active ? "نشط" : "موقوف"}</Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => toggle(d)}>{d.is_active ? "إيقاف" : "تفعيل"}</Button>
          </CardContent>
        </Card>
      ))}
      {!list.length && <p className="text-center text-foreground-tertiary py-8">لا يوجد مناديب بعد.</p>}
    </div>
  );
}
