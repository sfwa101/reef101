import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Branch = {
  id: string;
  code: string;
  name: string;
  country: string;
  country_code: string;
  currency: string;
  timezone: string;
  default_locale: string;
  supported_locales: string[];
  is_active: boolean;
};

export default function Branches() {
  const [items, setItems] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    code: "", name: "", country: "", country_code: "",
    currency: "EGP", timezone: "Africa/Cairo", default_locale: "ar",
  });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("branches").select("*").order("created_at");
    if (error) toast.error(error.message);
    setItems((data as Branch[]) || []);
    setLoading(false);
  }

  async function create() {
    if (!draft.code || !draft.name || !draft.country_code) {
      toast.error("املأ الحقول الأساسية");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("branches").insert({
      ...draft,
      country_code: draft.country_code.toUpperCase(),
      supported_locales: [draft.default_locale],
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إنشاء الفرع");
    setDraft({ code: "", name: "", country: "", country_code: "", currency: "EGP", timezone: "Africa/Cairo", default_locale: "ar" });
    load();
  }

  async function toggleActive(b: Branch) {
    const { error } = await supabase.from("branches").update({ is_active: !b.is_active }).eq("id", b.id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4 p-4 pb-24">
      <header>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Globe className="h-5 w-5" /> الفروع الدولية
        </h1>
        <p className="text-xs text-muted-foreground">إدارة فروع الدول والعملات واللغات</p>
      </header>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> فرع جديد</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">كود</Label><Input value={draft.code} onChange={(e)=>setDraft({...draft,code:e.target.value.toUpperCase()})} placeholder="TR-IST" /></div>
          <div><Label className="text-xs">الاسم</Label><Input value={draft.name} onChange={(e)=>setDraft({...draft,name:e.target.value})} placeholder="ريف المدينة - تركيا" /></div>
          <div><Label className="text-xs">الدولة</Label><Input value={draft.country} onChange={(e)=>setDraft({...draft,country:e.target.value})} placeholder="Turkey" /></div>
          <div><Label className="text-xs">رمز ISO</Label><Input value={draft.country_code} onChange={(e)=>setDraft({...draft,country_code:e.target.value})} placeholder="TR" maxLength={2} /></div>
          <div><Label className="text-xs">العملة</Label><Input value={draft.currency} onChange={(e)=>setDraft({...draft,currency:e.target.value.toUpperCase()})} placeholder="TRY" /></div>
          <div><Label className="text-xs">المنطقة الزمنية</Label><Input value={draft.timezone} onChange={(e)=>setDraft({...draft,timezone:e.target.value})} placeholder="Europe/Istanbul" /></div>
          <div><Label className="text-xs">اللغة الافتراضية</Label><Input value={draft.default_locale} onChange={(e)=>setDraft({...draft,default_locale:e.target.value.toLowerCase()})} placeholder="tr" /></div>
          <div className="col-span-2"><Button onClick={create} disabled={creating} className="w-full">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء الفرع"}</Button></div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> :
         items.length === 0 ? <p className="text-sm text-muted-foreground text-center">لا توجد فروع</p> :
         items.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold">{b.name}</h3>
                  <Badge variant="outline">{b.code}</Badge>
                  <Badge>{b.currency}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{b.country} · {b.timezone} · {b.default_locale}</p>
              </div>
              <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} />
            </CardContent>
          </Card>
         ))
        }
      </div>
    </div>
  );
}
