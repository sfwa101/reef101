/**
 * useLayoutEditor — Phase 1 visual page builder controller.
 *
 * Loads a `ui_layouts` row by `(page_key, status='draft')`. If no draft
 * exists, clones the published row into a working draft so the editor
 * always has something to edit.
 *
 * Provides: reorder, toggle, rename, style overrides (padding/tone/density/
 * sticky/showTimer/title), Save Draft, and Publish (snapshots history via
 * the DB trigger).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  SectionConfig,
  SectionKey,
  UiLayout,
} from "@/features/storefront/home/types/sdui.types";
import {
  DEFAULT_PAGE_ORDER,
  PAGE_LABELS,
  SECTION_REGISTRY,
  sanitizeSectionConfig,
  sectionsForPage,
  type PageKey,
} from "@/features/sdui/registry";

/** Localized section labels — sourced from the registry. */
export const SECTION_LABELS: Record<SectionKey, string> = Object.fromEntries(
  Object.entries(SECTION_REGISTRY).map(([k, v]) => [k, v.label]),
) as Record<SectionKey, string>;

export { PAGE_LABELS };

const PAGE_KEYS: PageKey[] = ["main_hub", "home", "sections", "offers"];
export function isPageKey(s: string): s is PageKey {
  return (PAGE_KEYS as string[]).includes(s);
}

export const useLayoutEditor = (pageKey: string) => {
  const [layout, setLayout] = useState<UiLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    // 1) Try draft
    const draft = await supabase
      .from("ui_layouts")
      .select("id,page_key,section_order,section_config,section_titles,is_active,status,version,title")
      .eq("page_key", pageKey)
      .eq("status", "draft")
      .maybeSingle();

    if (draft.data) {
      setLayout(draft.data as unknown as UiLayout);
      setDirty(false);
      setLoading(false);
      return;
    }

    // 2) Fall back to published as a starting point
    const pub = await supabase
      .from("ui_layouts")
      .select("id,page_key,section_order,section_config,section_titles,is_active,status,version,title")
      .eq("page_key", pageKey)
      .eq("status", "published")
      .maybeSingle();

    if (pub.data) {
      setLayout({ ...(pub.data as unknown as UiLayout), status: "draft", id: "new-draft" });
    } else {
      // 3) Brand new page — seed with registry defaults
      const defaults = isPageKey(pageKey) ? DEFAULT_PAGE_ORDER[pageKey] : [];
      setLayout({
        id: "new-draft",
        page_key: pageKey,
        section_order: defaults,
        section_config: {},
        section_titles: {},
        is_active: true,
        status: "draft",
        version: 1,
      });
    }
    setDirty(false);
    setLoading(false);
  }, [pageKey]);

  useEffect(() => { void reload(); }, [reload]);

  const moveSectionUp = useCallback((index: number) => {
    setLayout((prev) => {
      if (!prev || index <= 0) return prev;
      const order = [...prev.section_order];
      [order[index - 1], order[index]] = [order[index], order[index - 1]];
      return { ...prev, section_order: order };
    });
    setDirty(true);
  }, []);

  const moveSectionDown = useCallback((index: number) => {
    setLayout((prev) => {
      if (!prev || index >= prev.section_order.length - 1) return prev;
      const order = [...prev.section_order];
      [order[index + 1], order[index]] = [order[index], order[index + 1]];
      return { ...prev, section_order: order };
    });
    setDirty(true);
  }, []);

  const toggleSection = useCallback((key: SectionKey) => {
    setLayout((prev) => {
      if (!prev) return prev;
      const cfg = { ...(prev.section_config ?? {}) };
      const cur = cfg[key] ?? {};
      const wasEnabled = cur.enabled !== false;
      cfg[key] = sanitizeSectionConfig(key, { ...cur, enabled: !wasEnabled }) as SectionConfig;
      return { ...prev, section_config: cfg };
    });
    setDirty(true);
  }, []);

  const addSection = useCallback((key: SectionKey) => {
    setLayout((prev) => {
      if (!prev || prev.section_order.includes(key)) return prev;
      return { ...prev, section_order: [...prev.section_order, key] };
    });
    setDirty(true);
  }, []);

  const removeSection = useCallback((key: SectionKey) => {
    setLayout((prev) => {
      if (!prev) return prev;
      return { ...prev, section_order: prev.section_order.filter((s) => s !== key) };
    });
    setDirty(true);
  }, []);

  const updateSectionConfig = useCallback(
    (key: SectionKey, patch: Partial<SectionConfig>) => {
      setLayout((prev) => {
        if (!prev) return prev;
        const cfg = { ...(prev.section_config ?? {}) };
        cfg[key] = sanitizeSectionConfig(key, { ...(cfg[key] ?? {}), ...patch }) as SectionConfig;
        return { ...prev, section_config: cfg };
      });
      setDirty(true);
    },
    [],
  );

  const renameSection = useCallback((key: SectionKey, title: string) => {
    setLayout((prev) => {
      if (!prev) return prev;
      const titles = { ...(prev.section_titles ?? {}) };
      const trimmed = title.trim();
      if (trimmed) titles[key] = trimmed.slice(0, 80);
      else delete titles[key];
      return { ...prev, section_titles: titles };
    });
    setDirty(true);
  }, []);

  const persist = useCallback(
    async (status: "draft" | "published") => {
      if (!layout) return { ok: false, error: "no-layout" };
      const payload = {
        page_key: layout.page_key,
        section_order: layout.section_order,
        section_config: layout.section_config ?? {},
        section_titles: layout.section_titles ?? {},
        is_active: true,
        status,
        version: layout.version ?? 1,
        title: layout.title ?? null,
      };
      const { data, error } = await supabase
        .from("ui_layouts")
        .upsert(payload, { onConflict: "page_key,status" })
        .select("id,page_key,section_order,section_config,section_titles,is_active,status,version,title")
        .maybeSingle();
      if (error) throw error;
      return { ok: true, data };
    },
    [layout],
  );

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const r = await persist("draft");
      if (!r.ok) return r;
      if (r.data) setLayout(r.data as unknown as UiLayout);
      setDirty(false);
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "save-failed" };
    } finally {
      setSaving(false);
    }
  }, [persist]);

  const publish = useCallback(async () => {
    if (!layout) return { ok: false, error: "no-layout" };
    setPublishing(true);
    try {
      // 1) Persist current state as published (bumps version in DB by trigger snapshot).
      const newVersion = (layout.version ?? 1) + 1;
      const payload = {
        page_key: layout.page_key,
        section_order: layout.section_order,
        section_config: layout.section_config ?? {},
        section_titles: layout.section_titles ?? {},
        is_active: true,
        status: "published" as const,
        version: newVersion,
        title: layout.title ?? null,
      };
      const { error } = await supabase
        .from("ui_layouts")
        .upsert(payload, { onConflict: "page_key,status" });
      if (error) throw error;

      // 2) Drop the draft so editor reloads from the freshly published row.
      await supabase.from("ui_layouts")
        .delete()
        .eq("page_key", layout.page_key)
        .eq("status", "draft");

      await reload();
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, error: e instanceof Error ? e.message : "publish-failed" };
    } finally {
      setPublishing(false);
    }
  }, [layout, reload]);

  const isEnabled = (key: SectionKey) =>
    layout?.section_config?.[key]?.enabled !== false;

  const sectionConfig = (key: SectionKey): SectionConfig =>
    layout?.section_config?.[key] ?? {};

  const customTitle = (key: SectionKey): string =>
    layout?.section_titles?.[key] ?? "";

  const availableToAdd: SectionKey[] = (() => {
    if (!layout) return [];
    const allowed = isPageKey(layout.page_key)
      ? sectionsForPage(layout.page_key).map((m) => m.key)
      : Object.keys(SECTION_REGISTRY) as SectionKey[];
    return allowed.filter((s) => !layout.section_order.includes(s));
  })();

  return {
    layout,
    loading,
    saving,
    publishing,
    dirty,
    isEnabled,
    sectionConfig,
    customTitle,
    moveSectionUp,
    moveSectionDown,
    toggleSection,
    addSection,
    removeSection,
    updateSectionConfig,
    renameSection,
    availableToAdd,
    saveDraft,
    publish,
    reload,
  };
};
