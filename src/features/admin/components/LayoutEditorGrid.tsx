/**
 * LayoutEditorGrid — Phase 1 visual page builder UI.
 *
 * Features:
 *  - Page tabs (main_hub / home / sections / offers)
 *  - Section list with reorder (▲▼), visibility toggle, rename, remove
 *  - Per-section settings drawer (padding, tone, density, sticky, showTimer, custom title)
 *  - Save Draft / Publish / Preview Draft (opens customer page with ?preview=draft)
 *  - Inline status footer
 */
import { useMemo, useState } from "react";
import {
  ChevronUp, ChevronDown, Eye, EyeOff, Trash2, Plus, Settings2, ExternalLink, X,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  SECTION_LABELS,
  PAGE_LABELS,
  useLayoutEditor,
} from "@/features/admin/hooks/useLayoutEditor";
import { SECTION_REGISTRY, type PageKey } from "@/features/sdui/registry";
import type {
  SectionConfig, SectionKey,
} from "@/features/storefront/home/types/sdui.types";

const PAGE_TABS: { key: PageKey; label: string; previewPath: string }[] = [
  { key: "main_hub", label: "الرئيسية (Hero)", previewPath: "/" },
  { key: "home",     label: "الرئيسية الكاملة", previewPath: "/" },
  { key: "sections", label: "الأقسام",          previewPath: "/sections" },
  { key: "offers",   label: "العروض",           previewPath: "/offers" },
];

export function LayoutEditorGrid({ pageKey: defaultPageKey = "main_hub" }: { pageKey?: string }) {
  const initial = (PAGE_TABS.find(t => t.key === defaultPageKey)?.key ?? "main_hub") as PageKey;
  const [activePage, setActivePage] = useState<PageKey>(initial);
  const [editingKey, setEditingKey] = useState<SectionKey | null>(null);

  const ed = useLayoutEditor(activePage);

  const previewPath = useMemo(
    () => PAGE_TABS.find(t => t.key === activePage)?.previewPath ?? "/",
    [activePage],
  );

  const onSave = async () => {
    const r = await ed.saveDraft();
    if (r.ok) toast.success("تم حفظ المسودة");
    else toast.error("فشل الحفظ: " + (("error" in r && r.error) || ""));
  };
  const onPublish = async () => {
    if (!confirm("نشر المخطط الحالي للعملاء؟ سيتم حفظ نسخة في السجل.")) return;
    const r = await ed.publish();
    if (r.ok) toast.success("تم النشر للعملاء ✓");
    else toast.error("فشل النشر: " + (("error" in r && r.error) || ""));
  };
  const onPreview = () => {
    const url = `${previewPath}?preview=draft`;
    window.open(url, "_blank", "noopener");
  };

  const editingMeta = editingKey ? SECTION_REGISTRY[editingKey] : null;
  const editingCfg = editingKey ? ed.sectionConfig(editingKey) : ({} as SectionConfig);
  const editingTitle = editingKey ? ed.customTitle(editingKey) : "";

  return (
    <div className="space-y-3" dir="rtl">
      {/* Page tabs */}
      <div className="overflow-x-auto -mx-1 px-1 no-scrollbar">
        <div className="inline-flex gap-1.5 bg-surface-muted rounded-full p-1">
          {PAGE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setActivePage(t.key); setEditingKey(null); }}
              className={cn(
                "px-4 h-9 rounded-full text-[12.5px] font-semibold whitespace-nowrap transition press",
                activePage === t.key ? "bg-surface text-foreground shadow-sm" : "text-foreground-secondary",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-foreground-tertiary px-1">
        {PAGE_LABELS[activePage]} • {ed.layout?.section_order.length ?? 0} قسم
      </div>

      {ed.loading || !ed.layout ? (
        <div className="glass-strong rounded-2xl p-8 text-center text-foreground-tertiary">
          جاري تحميل المخطط…
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {ed.layout.section_order.map((key, i) => {
              const enabled = ed.isEnabled(key);
              const meta = SECTION_REGISTRY[key];
              const customTitle = ed.customTitle(key);
              return (
                <li
                  key={key}
                  className={cn(
                    "glass-strong shadow-soft rounded-2xl p-3.5 flex items-center gap-3 transition",
                    !enabled && "opacity-60",
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => ed.moveSectionUp(i)} disabled={i === 0}
                      className="h-7 w-7 rounded-lg bg-card hover:bg-accent/15 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center press"
                      aria-label="نقل للأعلى">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => ed.moveSectionDown(i)} disabled={i === ed.layout!.section_order.length - 1}
                      className="h-7 w-7 rounded-lg bg-card hover:bg-accent/15 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center press"
                      aria-label="نقل للأسفل">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-foreground-tertiary tabular-nums">
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="font-display text-sm truncate">
                        {customTitle || (meta?.label ?? SECTION_LABELS[key] ?? key)}
                      </p>
                      {customTitle && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-info/10 text-info">عنوان مخصص</span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground-tertiary mt-0.5 truncate">
                      {meta?.description ?? key}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {enabled ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-foreground-tertiary" />}
                    <Switch checked={enabled} onCheckedChange={() => ed.toggleSection(key)} aria-label="تفعيل القسم" />
                    <button type="button" onClick={() => setEditingKey(key)}
                      className="h-8 w-8 rounded-lg bg-card hover:bg-accent/15 flex items-center justify-center press"
                      aria-label="إعدادات القسم" title="إعدادات">
                      <Settings2 className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => ed.removeSection(key)}
                      className="h-8 w-8 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center press"
                      aria-label="إزالة القسم">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {ed.availableToAdd.length > 0 && (
            <div className="glass rounded-2xl p-3.5">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-foreground-tertiary mb-2">
                أقسام متاحة للإضافة
              </p>
              <div className="flex flex-wrap gap-2">
                {ed.availableToAdd.map((k: SectionKey) => (
                  <button key={k} type="button" onClick={() => ed.addSection(k)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-3 py-1.5 press">
                    <Plus className="h-3.5 w-3.5" />
                    {SECTION_REGISTRY[k]?.label ?? k}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 glass-strong shadow-float rounded-2xl p-3 mt-4">
            <div className="text-xs text-foreground-secondary">
              {ed.dirty
                ? <span className="text-warning font-medium">● تغييرات غير محفوظة</span>
                : <span className="text-success">✓ مزامن</span>}
              <span className="text-foreground-tertiary mx-2">•</span>
              <span className="text-foreground-tertiary">v{ed.layout.version ?? 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onPreview}
                className="inline-flex items-center gap-1 rounded-xl bg-card hover:bg-accent/15 px-3 py-2 text-xs font-semibold press border border-border/40">
                <ExternalLink className="h-3.5 w-3.5" />
                معاينة
              </button>
              <button type="button" onClick={onSave} disabled={!ed.dirty || ed.saving}
                className={cn(
                  "rounded-xl px-4 py-2 text-xs font-semibold press border border-border/40 bg-card hover:bg-accent/15",
                  (!ed.dirty || ed.saving) && "opacity-50 cursor-not-allowed",
                )}>
                {ed.saving ? "جاري الحفظ…" : "حفظ مسودة"}
              </button>
              <button type="button" onClick={onPublish} disabled={ed.publishing}
                className={cn(
                  "rounded-xl px-5 py-2 text-sm font-semibold press shadow-soft bg-gradient-primary text-primary-foreground",
                  ed.publishing && "opacity-50 cursor-not-allowed",
                )}>
                {ed.publishing ? "جاري النشر…" : "نشر للعملاء"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Settings drawer */}
      {editingKey && editingMeta && (
        <div className="fixed inset-0 z-50 flex" dir="rtl">
          <button className="flex-1 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditingKey(null)} aria-label="إغلاق" />
          <div className="w-full max-w-md bg-surface shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-surface border-b border-border/40 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base">{editingMeta.label}</h3>
                <p className="text-[11px] text-foreground-tertiary">{editingMeta.description}</p>
              </div>
              <button onClick={() => setEditingKey(null)} className="h-9 w-9 rounded-xl bg-card hover:bg-accent/15 flex items-center justify-center press">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {editingMeta.allowedOverrides.includes("title") && (
                <Field label="عنوان مخصص (اتركه فارغاً للاسم الافتراضي)">
                  <input
                    type="text" value={editingTitle} maxLength={80}
                    onChange={(e) => ed.renameSection(editingKey, e.target.value)}
                    placeholder={editingMeta.label}
                    className="w-full bg-surface-muted rounded-xl h-10 px-3 text-[13px] border-0 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </Field>
              )}

              {editingMeta.allowedOverrides.includes("padding") && (
                <Field label="المسافة العمودية">
                  <SegBtns
                    value={editingCfg.padding ?? "md"}
                    options={[{ v: "sm", l: "ضيق" }, { v: "md", l: "متوسط" }, { v: "lg", l: "واسع" }]}
                    onChange={(v) => ed.updateSectionConfig(editingKey, { padding: v as SectionConfig["padding"] })}
                  />
                </Field>
              )}

              {editingMeta.allowedOverrides.includes("tone") && (
                <Field label="لون الخلفية">
                  <SegBtns
                    value={editingCfg.tone ?? ""}
                    options={[
                      { v: "", l: "—" },
                      { v: "primary", l: "أساسي" }, { v: "accent", l: "مميّز" },
                      { v: "info", l: "معلومات" }, { v: "success", l: "نجاح" },
                      { v: "warning", l: "تنبيه" }, { v: "teal", l: "أزرق" },
                    ]}
                    onChange={(v) => ed.updateSectionConfig(editingKey, { tone: (v || undefined) as SectionConfig["tone"] })}
                  />
                </Field>
              )}

              {editingMeta.allowedOverrides.includes("density") && (
                <Field label="الكثافة">
                  <SegBtns
                    value={editingCfg.density ?? "comfortable"}
                    options={[
                      { v: "compact", l: "مدمج" },
                      { v: "comfortable", l: "مريح" },
                      { v: "spacious", l: "واسع" },
                    ]}
                    onChange={(v) => ed.updateSectionConfig(editingKey, { density: v as SectionConfig["density"] })}
                  />
                </Field>
              )}

              {editingMeta.allowedOverrides.includes("sticky") && (
                <Toggle label="تثبيت في الأعلى عند التمرير"
                  checked={!!editingCfg.sticky}
                  onChange={(v) => ed.updateSectionConfig(editingKey, { sticky: v })} />
              )}

              {editingMeta.allowedOverrides.includes("showTimer") && (
                <Toggle label="إظهار العدّاد"
                  checked={!!editingCfg.showTimer}
                  onChange={(v) => ed.updateSectionConfig(editingKey, { showTimer: v })} />
              )}

              <div className="text-[11px] text-foreground-tertiary border-t border-border/40 pt-3">
                المفتاح التقني: <span className="font-mono">{editingKey}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11.5px] font-semibold text-foreground-secondary mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-muted">
      <span className="text-[12.5px] font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SegBtns<T extends string>({ value, options, onChange }: {
  value: T | "";
  options: { v: T | ""; l: string }[];
  onChange: (v: T | "") => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 bg-surface-muted rounded-xl p-1">
      {options.map((o) => (
        <button key={o.v || "_"} type="button" onClick={() => onChange(o.v)}
          className={cn(
            "px-3 h-8 rounded-lg text-[12px] font-semibold transition press",
            value === o.v ? "bg-surface text-foreground shadow-sm" : "text-foreground-secondary",
          )}>
          {o.l}
        </button>
      ))}
    </div>
  );
}
