import { useEffect, useMemo, useRef, useState } from "react";
import BackHeader from "@/components/BackHeader";
import {
  MapPin, Plus, Home, Briefcase, Trash2, Check, Loader2, Search, X,
  Building2, Star, Sparkles, ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZONES, ORDERED_CITIES, DEFAULT_ZONE_ID, getZone, districtsForZone,
  detectZoneFromAddress, type ZoneId,
} from "@/lib/geoZones";
import { useLocation } from "@/context/LocationContext";
import { toLatin } from "@/lib/format";

type Addr = {
  id: string;
  label: string;
  city: string;
  district: string | null;
  street: string | null;
  building: string | null;
  notes: string | null;
  is_default: boolean;
};

const LABEL_OPTIONS: { id: string; label: string; Icon: typeof Home }[] = [
  { id: "المنزل", label: "المنزل", Icon: Home },
  { id: "العمل", label: "العمل", Icon: Briefcase },
  { id: "أخرى", label: "أخرى", Icon: Star },
];

const labelIcon = (label: string) =>
  label.includes("عمل") ? Briefcase : label.includes("أخرى") ? Star : Home;

/* ============ Searchable Combobox ============ */
const Combobox = ({
  value,
  options,
  onChange,
  placeholder,
  emptyHint,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder: string;
  emptyHint?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim();
    if (!s) return options;
    return options.filter((o) => o.includes(s));
  }, [q, options]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-border/60 bg-background/80 px-4 py-3.5 text-right text-sm font-bold transition active:scale-[0.99]"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_18px_40px_-18px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث سريع…"
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none"
              />
              {q && (
                <button onClick={() => setQ("")} type="button" className="text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  {emptyHint ?? "لا توجد نتائج"}
                </p>
              ) : (
                filtered.map((o) => {
                  const active = o === value;
                  return (
                    <button
                      type="button"
                      key={o}
                      onClick={() => { onChange(o); setOpen(false); setQ(""); }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-right text-sm transition ${
                        active ? "bg-primary-soft font-extrabold text-primary" : "hover:bg-foreground/5"
                      }`}
                    >
                      <span>{o}</span>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============ Mini-Map Preview ============ */
const MiniMap = ({ zoneId, district }: { zoneId: ZoneId; district: string }) => {
  const z = getZone(zoneId);
  // Stable pseudo-random pin position derived from district hash
  const pin = useMemo(() => {
    const seed = (district || z.name).split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
    return { x: 30 + (seed * 7) % 40, y: 30 + (seed * 13) % 40 };
  }, [district, z.name]);

  return (
    <div className="relative h-32 overflow-hidden rounded-2xl ring-1 ring-border/40">
      {/* Stylized map background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-background to-accent/15" />
      {/* Grid lines */}
      <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[20, 40, 60, 80].map((p) => (
          <line key={`h${p}`} x1="0" y1={p} x2="100" y2={p} stroke="currentColor" strokeWidth="0.3" />
        ))}
        {[20, 40, 60, 80].map((p) => (
          <line key={`v${p}`} x1={p} y1="0" x2={p} y2="100" stroke="currentColor" strokeWidth="0.3" />
        ))}
        {/* Faux roads */}
        <path d="M0 55 Q 50 40 100 60" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" />
        <path d="M40 0 Q 55 50 50 100" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.4" />
      </svg>
      {/* Pin */}
      <motion.div
        key={`${zoneId}-${district}`}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 220 }}
        className="absolute -translate-x-1/2 -translate-y-full"
        style={{ left: `${pin.x}%`, top: `${pin.y + 30}%` }}
      >
        <div className="relative flex flex-col items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_18px_-6px_hsl(var(--primary)/0.6)] ring-4 ring-background">
            <MapPin className="h-4 w-4" strokeWidth={2.6} />
          </div>
          <div className="-mt-0.5 h-2 w-2 rotate-45 bg-primary" />
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-primary/40" />
        </div>
      </motion.div>
      {/* Zone chip */}
      <div className="absolute right-2 top-2 rounded-full bg-card/85 px-2.5 py-1 text-[10px] font-extrabold ring-1 ring-border/40">
        نطاق {z.id} · {z.shortName}
      </div>
    </div>
  );
};

/* ============ Address Card ============ */
const AddressCard = ({
  a, onSetDefault, onRemove,
}: { a: Addr; onSetDefault: () => void; onRemove: () => void }) => {
  const Icon = labelIcon(a.label);
  const zoneId = detectZoneFromAddress(a.city, a.district);
  const z = getZone(zoneId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`relative overflow-hidden rounded-2xl bg-card p-4 shadow-[0_4px_18px_-10px_rgba(0,0,0,0.15)] ring-1 transition ${
        a.is_default ? "ring-2 ring-primary" : "ring-border/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${a.is_default ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary"}`}>
          <Icon className="h-5 w-5" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-sm font-extrabold">{a.label}</p>
            {a.is_default && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-extrabold text-primary-foreground">
                افتراضي
              </span>
            )}
            <span className="ms-auto rounded-full bg-foreground/5 px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
              نطاق {z.id}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {[a.street, a.building, a.district, a.city].filter(Boolean).join("، ")}
          </p>
          {a.notes && <p className="mt-1 text-[11px] text-muted-foreground">📝 {a.notes}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {!a.is_default && (
              <button
                onClick={onSetDefault}
                className="rounded-full bg-foreground/5 px-3 py-1.5 text-[11px] font-extrabold text-foreground"
              >
                جعله افتراضيًا
              </button>
            )}
            <button
              onClick={onRemove}
              className="flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1.5 text-[11px] font-extrabold text-destructive"
            >
              <Trash2 className="h-3 w-3" /> حذف
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ============ Page ============ */
const Addresses = () => {
  const { user } = useAuth();
  const { setFromAddress } = useLocation();

  const [list, setList] = useState<Addr[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [draft, setDraft] = useState({
    label: "المنزل",
    zoneId: DEFAULT_ZONE_ID as ZoneId,
    city: getZone(DEFAULT_ZONE_ID).name,
    district: "",
    street: "",
    building: "",
    notes: "",
  });

  const districtOptions = useMemo(() => districtsForZone(draft.zoneId), [draft.zoneId]);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    setList((data as Addr[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  // Sync default address → global zone, on each load
  useEffect(() => {
    const def = list.find((a) => a.is_default) ?? list[0];
    if (def) setFromAddress(def.city, def.district);
  }, [list, setFromAddress]);

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    toast.success("تم تعيين العنوان الافتراضي");
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    toast("تم حذف العنوان");
    load();
  };

  const onChangeCity = (zoneId: ZoneId) => {
    setDraft((d) => ({ ...d, zoneId, city: getZone(zoneId).name, district: "" }));
  };

  const save = async () => {
    if (!user) { toast.error("سجّل الدخول أولًا"); return; }
    if (!draft.label || !draft.city || !draft.street) {
      toast.error("أكمل بيانات العنوان");
      return;
    }
    const isFirst = list.length === 0;
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: draft.label,
      city: draft.city,
      district: draft.district || null,
      street: draft.street,
      building: draft.building || null,
      notes: draft.notes || null,
      is_default: isFirst,
    });
    if (error) {
      toast.error("تعذّرت الإضافة");
      return;
    }
    setFromAddress(draft.city, draft.district);
    setDraft({
      label: "المنزل",
      zoneId: DEFAULT_ZONE_ID,
      city: getZone(DEFAULT_ZONE_ID).name,
      district: "",
      street: "",
      building: "",
      notes: "",
    });
    setAdding(false);
    toast.success("تمت إضافة العنوان");
    load();
  };

  const z = getZone(draft.zoneId);

  return (
    <div className="space-y-5 pb-8">
      <BackHeader title="العناوين" subtitle={`${toLatin(list.length)} عناوين محفوظة`} accent="حسابي" />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : list.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {list.map((a) => (
              <AddressCard
                key={a.id}
                a={a}
                onSetDefault={() => setDefault(a.id)}
                onRemove={() => remove(a.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : null}

      {/* ============ Add new address (smart form) ============ */}
      <AnimatePresence initial={false}>
        {adding ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-4 rounded-3xl bg-card p-5 shadow-[0_8px_28px_-14px_rgba(0,0,0,0.18)] ring-1 ring-border/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" strokeWidth={2.6} />
                </div>
                <h2 className="font-display text-base font-extrabold">عنوان جديد</h2>
              </div>
              <button
                onClick={() => setAdding(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Label chips */}
            <div>
              <p className="mb-2 text-[11px] font-extrabold text-muted-foreground">حفظ كـ</p>
              <div className="grid grid-cols-3 gap-2">
                {LABEL_OPTIONS.map((o) => {
                  const active = draft.label === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, label: o.id })}
                      className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-xs font-extrabold transition ${
                        active ? "border-primary bg-primary-soft text-primary" : "border-border/60 bg-background"
                      }`}
                    >
                      <o.Icon className="h-4 w-4" strokeWidth={2.6} />
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City + District */}
            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <p className="mb-1.5 text-[11px] font-extrabold text-muted-foreground">المدينة</p>
                <Combobox
                  value={draft.city}
                  options={ORDERED_CITIES.map((c) => c.name)}
                  onChange={(name) => {
                    const z = ORDERED_CITIES.find((c) => c.name === name);
                    if (z) onChangeCity(z.id);
                  }}
                  placeholder="اختر المدينة"
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-extrabold text-muted-foreground">
                  {draft.zoneId === "E" ? "المحافظة" : "المنطقة"}
                </p>
                <Combobox
                  value={draft.district}
                  options={districtOptions}
                  onChange={(d) => setDraft({ ...draft, district: d })}
                  placeholder={draft.zoneId === "E" ? "اختر المحافظة" : "اختر المنطقة"}
                  emptyHint="لا توجد مناطق متاحة"
                />
              </div>
            </div>

            {/* Mini-map preview */}
            <MiniMap zoneId={draft.zoneId} district={draft.district} />

            {/* Street + Building + Landmark */}
            <div className="space-y-2">
              <Inp v={draft.street} on={(v) => setDraft({ ...draft, street: v })} ph="اسم الشارع" />
              <Inp v={draft.building} on={(v) => setDraft({ ...draft, building: v })} ph="رقم المبنى / الدور (اختياري)" />
              <Inp v={draft.notes} on={(v) => setDraft({ ...draft, notes: v })} ph="علامة مميزة (مثال: بجوار صيدلية النيل)" />
            </div>

            {/* Save */}
            <button
              onClick={save}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground shadow-pill active:scale-[0.99]"
            >
              <Check className="h-4 w-4" /> حفظ العنوان
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="add-cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 py-4 text-sm font-extrabold text-primary"
          >
            <Plus className="h-4 w-4" /> إضافة عنوان جديد
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hint */}
      <div className="flex items-start gap-2 rounded-2xl bg-foreground/[0.03] p-3 text-[11px] text-muted-foreground">
        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p>
          اضغط أي عنوان لجعله افتراضيًا. منطقتك تحدّد رسوم وأوقات التوصيل تلقائيًا في السلة.
        </p>
      </div>
    </div>
  );
};

const Inp = ({ v, on, ph }: { v: string; on: (s: string) => void; ph: string }) => (
  <input
    value={v}
    onChange={(e) => on(e.target.value)}
    placeholder={ph}
    className="w-full rounded-2xl border border-border/60 bg-background/80 px-4 py-3.5 text-sm font-bold outline-none transition focus:border-primary"
  />
);

export default Addresses;