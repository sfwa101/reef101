import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import { toast } from "sonner";
import {
  Apple,
  Baby,
  Briefcase,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChefHat,
  CircleAlert,
  Coins,
  Crown,
  Drumstick,
  Flower2,
  GraduationCap,
  Heart,
  HeartCrack,
  Home,
  Image as ImageIcon,
  Leaf,
  Loader2,
  LockKeyhole,
  Phone,
  PiggyBank,
  RefreshCcw,
  Salad,
  Save,
  ShoppingBag,
  Sparkles,
  Stars,
  Trophy,
  User2,
  Users,
  VenusAndMars,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateWheelPicker from "@/components/DateWheelPicker";
import { cn } from "@/lib/utils";

type Gender = "male" | "female" | "unspecified";
type TabKey = "identity" | "lifestyle" | "budget" | "avatar";

type ProfileForm = {
  fullName: string;
  phone: string;
  birthDate: string;
  gender: Gender;
  avatarKey: string;
  occupation: string;
  householdSize: number;
  lifestyleTags: string[];
  likes: string[];
  dislikes: string[];
  budgetRange: string;
};

type DbProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  avatar_key: string | null;
  occupation: string | null;
  household_size: number | null;
  lifestyle_tags: string[] | null;
  likes: string[] | null;
  dislikes: string[] | null;
  budget_range: string | null;
};

const EMPTY_FORM: ProfileForm = {
  fullName: "",
  phone: "",
  birthDate: "",
  gender: "unspecified",
  avatarKey: "",
  occupation: "",
  householdSize: 0,
  lifestyleTags: [],
  likes: [],
  dislikes: [],
  budgetRange: "",
};

const genderOptions: Array<{ value: Exclude<Gender, "unspecified">; label: string }> = [
  { value: "male", label: "ذكر" },
  { value: "female", label: "أنثى" },
];

const occupations: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: "student", label: "طالب / طالبة", icon: GraduationCap },
  { value: "homemaker", label: "ربّة منزل", icon: Home },
  { value: "employee", label: "موظف / موظفة", icon: Briefcase },
  { value: "owner", label: "صاحب عمل", icon: Crown },
  { value: "teacher", label: "كادر تعليمي", icon: ChefHat },
  { value: "other", label: "أخرى", icon: Stars },
];

const lifestyleTags: Array<{ value: string; label: string; icon: LucideIcon }> = [
  { value: "organic", label: "منتجات عضوية", icon: Leaf },
  { value: "quick", label: "وجبات سريعة التحضير", icon: Zap },
  { value: "sweets", label: "محبّ للحلويات", icon: Apple },
  { value: "healthy", label: "نظام غذائي صحي", icon: Salad },
  { value: "meat", label: "محبّ للحوم", icon: Drumstick },
  { value: "kids", label: "منتجات أطفال", icon: Baby },
  { value: "beauty", label: "العناية والجمال", icon: Flower2 },
  { value: "bulk", label: "تسوّق بالجملة", icon: ShoppingBag },
];

const likeOptions: Array<{ value: string; label: string }> = [
  { value: "discounts", label: "العروض والخصومات" },
  { value: "newproducts", label: "المنتجات الجديدة" },
  { value: "bundles", label: "حزم العائلة" },
  { value: "premium", label: "الجودة المميّزة" },
  { value: "local", label: "المنتجات المحلية" },
];

const dislikeOptions: Array<{ value: string; label: string }> = [
  { value: "ads", label: "الإعلانات المتكررة" },
  { value: "outofstock", label: "نفاد المخزون" },
  { value: "slow", label: "بطء التوصيل" },
  { value: "complex", label: "خطوات الشراء الطويلة" },
];

const budgetRanges: Array<{ value: string; label: string; hint: string; icon: LucideIcon }> = [
  { value: "saver", label: "أقتصد قدر الإمكان", hint: "أركّز على العروض والأسعار", icon: PiggyBank },
  { value: "balanced", label: "متوازن", hint: "جودة جيدة بسعر مناسب", icon: Wallet },
  { value: "premium", label: "أهتم بالجودة أولاً", hint: "أفضّل الأفخم ولو أعلى سعرًا", icon: Crown },
  { value: "skip", label: "أفضّل عدم التحديد", hint: "أرني كل شيء", icon: Coins },
];

const AVATAR_GALLERY: Array<{ key: string; icon: LucideIcon; label: string }> = [
  { key: "leaf", icon: Leaf, label: "طبيعة" },
  { key: "chef", icon: ChefHat, label: "شيف" },
  { key: "crown", icon: Crown, label: "ملكي" },
  { key: "stars", icon: Stars, label: "نجوم" },
  { key: "flower", icon: Flower2, label: "زهرة" },
  { key: "trophy", icon: Trophy, label: "بطل" },
  { key: "home", icon: Home, label: "منزل" },
  { key: "apple", icon: Apple, label: "تفاح" },
];

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: "identity", label: "الهوية", icon: User2 },
  { key: "lifestyle", label: "النمط", icon: Heart },
  { key: "budget", label: "الميزانية", icon: Wallet },
  { key: "avatar", label: "الصورة", icon: ImageIcon },
];

const normalizeGender = (value?: string | null): Gender => (
  value === "male" || value === "female" || value === "unspecified" ? value : "unspecified"
);

const extractPhoneFromPseudoEmail = (email?: string | null) => {
  if (!email || !email.endsWith("@reef.local")) return "";
  return email.replace("@reef.local", "");
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatBirthDate = (value: string) => {
  if (!value) return "أضف تاريخ الميلاد";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
};

const buildForm = (user: User, data?: Partial<DbProfile> | null): ProfileForm => {
  const meta = (user.user_metadata ?? {}) as { full_name?: string; phone?: string; gender?: string };
  return {
    fullName: data?.full_name ?? meta.full_name ?? "",
    phone: data?.phone ?? meta.phone ?? extractPhoneFromPseudoEmail(user.email) ?? "",
    birthDate: data?.birth_date ?? "",
    gender: normalizeGender(data?.gender ?? meta.gender),
    avatarKey: data?.avatar_key ?? "",
    occupation: data?.occupation ?? "",
    householdSize: typeof data?.household_size === "number" ? data!.household_size! : 0,
    lifestyleTags: Array.isArray(data?.lifestyle_tags) ? data!.lifestyle_tags! : [],
    likes: Array.isArray(data?.likes) ? data!.likes! : [],
    dislikes: Array.isArray(data?.dislikes) ? data!.dislikes! : [],
    budgetRange: data?.budget_range ?? "",
  };
};

const Profile = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<ProfileForm>(EMPTY_FORM);
  const [pageState, setPageState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [forceReady, setForceReady] = useState(false);
  const [tab, setTab] = useState<TabKey>("identity");

  useEffect(() => {
    if (!loading) { setForceReady(true); return; }
    const timer = window.setTimeout(() => setForceReady(true), 1800);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const syncProfile = async (silent = false) => {
    if (!user) return null;
    if (!silent) setPageState("loading");
    setErrorMessage("");
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, birth_date, gender, avatar_key, occupation, household_size, lifestyle_tags, likes, dislikes, budget_range")
      .eq("id", user.id)
      .maybeSingle<DbProfile>();
    if (error) {
      console.error("profile fetch error", error);
      const fallback = buildForm(user, profile as Partial<DbProfile> | null);
      setForm(fallback);
      setInitialForm(fallback);
      setPageState("error");
      setErrorMessage(error.message);
      return null;
    }
    const next = buildForm(user, data ?? (profile as Partial<DbProfile> | null));
    setForm(next);
    setInitialForm(next);
    setPageState("ready");
    return next;
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { setPageState("idle"); setForm(EMPTY_FORM); setInitialForm(EMPTY_FORM); return; }
    const fallback = buildForm(user, profile as Partial<DbProfile> | null);
    setForm(fallback);
    setInitialForm(fallback);
    setPageState(profile ? "ready" : "loading");
    void syncProfile(Boolean(profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  const initials = useMemo(() => {
    return (form.fullName || user?.user_metadata?.full_name || "ر م")
      .split(" ").filter(Boolean).slice(0, 2).map((p: string) => p[0]).join("");
  }, [form.fullName, user?.user_metadata?.full_name]);

  const completion = useMemo(() => {
    const fields = [
      form.fullName.trim().length > 1,
      form.phone.trim().length > 0,
      form.birthDate.length > 0,
      form.gender !== "unspecified",
      form.occupation.length > 0,
      form.householdSize > 0,
      form.lifestyleTags.length > 0,
      form.likes.length > 0 || form.dislikes.length > 0,
      form.budgetRange.length > 0,
      form.avatarKey.length > 0,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const toggleArrayValue = (key: "lifestyleTags" | "likes" | "dislikes", value: string) => {
    setForm((c) => {
      const current = c[key];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...c, [key]: next };
    });
    setSaveState("idle");
  };

  const save = async () => {
    if (loading && !forceReady) { toast.error("انتظر قليلاً حتى يكتمل تجهيز الحساب."); return; }
    if (!user) { toast.error("يجب تسجيل الدخول أولاً."); return; }
    if (form.fullName.trim().length < 2) { toast.error("أدخل الاسم الكامل بشكل صحيح."); return; }

    setSaveState("saving");
    setErrorMessage("");

    const payload = {
      id: user.id,
      full_name: form.fullName.trim(),
      phone: form.phone || extractPhoneFromPseudoEmail(user.email) || null,
      birth_date: form.birthDate || null,
      gender: form.gender,
      avatar_key: form.avatarKey || null,
      occupation: form.occupation || null,
      household_size: form.householdSize > 0 ? form.householdSize : null,
      lifestyle_tags: form.lifestyleTags,
      likes: form.likes,
      dislikes: form.dislikes,
      budget_range: form.budgetRange || null,
    };

    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("profile save error", error);
      setSaveState("error");
      setErrorMessage(error.message);
      toast.error(`تعذّر الحفظ — ${error.message}`);
      return;
    }
    await refreshProfile();
    const fresh = (await syncProfile(true)) ?? form;
    setInitialForm(fresh);
    setSaveState("saved");
    toast.success("تم حفظ الملف الشخصي بنجاح ✨");
  };

  const resetForm = () => { setForm(initialForm); setSaveState("idle"); setErrorMessage(""); };

  if (loading && !forceReady) {
    return (
      <div className="space-y-4">
        <BackHeader title="ملفي الذكي" subtitle="جاري تجهيز ملفك" accent="حسابي" />
        <div className="h-44 animate-pulse rounded-[2rem] bg-card shadow-soft" />
        <div className="h-72 animate-pulse rounded-[1.6rem] bg-card shadow-soft" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-5">
        <BackHeader title="ملفي الذكي" subtitle="سجّل الدخول لإدارة بياناتك" accent="حسابي" />
        <section className="rounded-[2rem] border border-border/60 bg-card p-6 text-center shadow-tile">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-foreground">الملف الشخصي يحتاج تسجيل دخول</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">حتى لا تضيع بياناتك، الحفظ هنا يعمل فقط بعد الدخول.</p>
          <Link to="/auth" className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-extrabold text-primary-foreground shadow-pill">
            تسجيل الدخول الآن
          </Link>
        </section>
      </div>
    );
  }

  const AvatarIcon = AVATAR_GALLERY.find((a) => a.key === form.avatarKey)?.icon;

  return (
    <div className="space-y-4 pb-6">
      <BackHeader title="ملفي الذكي" subtitle="بياناتك تُخصِّص لك المتجر بأكمله" accent="حسابي" />

      {/* Hero */}
      <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-tile" style={{ backgroundImage: "var(--gradient-aurora)" }}>
        <div className="space-y-4 bg-background/70 p-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-card/85 px-3 py-1 text-[11px] font-extrabold text-primary shadow-soft">
                <Sparkles className="h-3.5 w-3.5" /> ملف ذكي
              </span>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-foreground">{form.fullName || "أكمل ملفك الشخصي"}</h2>
                <p dir="ltr" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> +{form.phone || extractPhoneFromPseudoEmail(user.email) || "—"}
                </p>
              </div>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pill">
              {AvatarIcon ? <AvatarIcon className="h-9 w-9" strokeWidth={2.2} /> : <span className="font-display text-2xl font-extrabold">{initials}</span>}
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-[1.4rem] bg-card/85 p-3 shadow-soft backdrop-blur-sm">
            <div className="flex items-center justify-between text-[11px] font-extrabold">
              <span className="inline-flex items-center gap-1 text-foreground"><Trophy className="h-3.5 w-3.5 text-accent" /> اكتمال الملف</span>
              <span className="text-primary">{completion}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-l from-primary to-primary-glow transition-all" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
              {completion === 100 ? "🎉 ملفك مكتمل! استمتع بأفضل العروض المخصّصة." : "أكمل ملفك واحصل على نقاط ولاء وعروض حصرية."}
            </p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="sticky top-2 z-10 flex gap-1.5 overflow-x-auto rounded-full border border-border/60 bg-card/90 p-1.5 shadow-soft backdrop-blur">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex flex-1 min-w-[80px] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-extrabold transition ease-apple",
                active ? "bg-primary text-primary-foreground shadow-pill" : "text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </nav>

      {(pageState === "error" || errorMessage) && (
        <section className="rounded-[1.6rem] border border-destructive/20 bg-destructive/5 p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive"><CircleAlert className="h-4 w-4" /></div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-foreground">مشكلة في مزامنة البيانات</h3>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">{errorMessage || "تعذّر تحميل آخر نسخة."}</p>
            </div>
            <button type="button" onClick={() => void syncProfile()} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft" aria-label="إعادة المحاولة">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {/* TAB: Identity */}
      {tab === "identity" && (
        <>
          <Section icon={User2} title="الهوية الأساسية">
            <div className="space-y-3">
              <SmartField icon={User2} label="الاسم الكامل" helper="يظهر في حسابك وطلباتك." value={form.fullName} placeholder="مثال: أحمد محمد"
                onChange={(v) => { setForm((c) => ({ ...c, fullName: v })); setSaveState("idle"); }} />
              <ReadonlyField icon={Phone} label="رقم الجوال" helper="مرتبط بالحساب ولا يُغيَّر من هنا." value={form.phone || extractPhoneFromPseudoEmail(user.email) || "غير متوفر"} />

              <div className="rounded-[1.4rem] border border-border/60 bg-background/80 p-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" /> تاريخ الميلاد
                </div>
                <div className="mb-2 text-center text-sm font-extrabold text-foreground">
                  {formatBirthDate(form.birthDate)}
                </div>
                <DateWheelPicker
                  value={form.birthDate}
                  onChange={(iso) => { setForm((c) => ({ ...c, birthDate: iso })); setSaveState("idle"); }}
                />
                <p className="mt-2 text-[11px] leading-6 text-muted-foreground">مرّر للأعلى/الأسفل لاختيار السنة، الشهر، واليوم.</p>
              </div>
            </div>
          </Section>

          <Section icon={VenusAndMars} title="النوع">
            <Select
              value={form.gender === "unspecified" ? undefined : form.gender}
              onValueChange={(v) => { setForm((c) => ({ ...c, gender: v as Gender })); setSaveState("idle"); }}
            >
              <SelectTrigger className="h-12 rounded-[1.1rem] border-border/60 bg-background/80 text-sm font-extrabold">
                <SelectValue placeholder="اختر النوع" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-sm font-extrabold">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Section icon={Briefcase} title="الوضع المهني">
            <div className="grid grid-cols-2 gap-2">
              {occupations.map((o) => {
                const Icon = o.icon;
                const active = form.occupation === o.value;
                return (
                  <button key={o.value} type="button"
                    onClick={() => { setForm((c) => ({ ...c, occupation: o.value })); setSaveState("idle"); }}
                    className={cn("flex flex-col items-center gap-2 rounded-[1.3rem] border px-3 py-4 text-center transition ease-apple",
                      active ? "border-primary bg-primary-soft shadow-soft" : "border-border/60 bg-background/80")}>
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", active ? "bg-primary text-primary-foreground" : "bg-muted text-primary")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[12px] font-extrabold text-foreground">{o.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section icon={Users} title="عدد أفراد الأسرة" helper="يساعدنا في اقتراح أحجام العبوات المناسبة.">
            <div className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-border/60 bg-background/80 p-3">
              <button type="button"
                onClick={() => { setForm((c) => ({ ...c, householdSize: Math.max(0, c.householdSize - 1) })); setSaveState("idle"); }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-extrabold text-foreground">−</button>
              <div className="text-center">
                <div className="font-display text-3xl font-extrabold text-foreground tabular-nums">{form.householdSize || "—"}</div>
                <div className="text-[11px] text-muted-foreground">{form.householdSize > 0 ? "فرد" : "غير محدد"}</div>
              </div>
              <button type="button"
                onClick={() => { setForm((c) => ({ ...c, householdSize: Math.min(20, c.householdSize + 1) })); setSaveState("idle"); }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground shadow-pill">+</button>
            </div>
          </Section>
        </>
      )}

      {/* TAB: Lifestyle */}
      {tab === "lifestyle" && (
        <>
          <Section icon={Heart} title="اهتماماتي" helper="اختر ما يناسب نمط حياتك — يظهر في مقدمة المتجر.">
            <div className="flex flex-wrap gap-2">
              {lifestyleTags.map((t) => {
                const Icon = t.icon;
                const active = form.lifestyleTags.includes(t.value);
                return (
                  <button key={t.value} type="button"
                    onClick={() => toggleArrayValue("lifestyleTags", t.value)}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-extrabold transition ease-apple",
                      active ? "border-primary bg-primary text-primary-foreground shadow-pill" : "border-border/60 bg-background/80 text-foreground")}>
                    <Icon className="h-3.5 w-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section icon={CheckCircle2} title="ما يعجبك في تجربة التسوق">
            <div className="flex flex-wrap gap-2">
              {likeOptions.map((o) => {
                const active = form.likes.includes(o.value);
                return (
                  <button key={o.value} type="button"
                    onClick={() => toggleArrayValue("likes", o.value)}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-extrabold transition",
                      active ? "border-primary bg-primary-soft text-primary shadow-soft" : "border-border/60 bg-background/80 text-foreground")}>
                    <Heart className={cn("h-3.5 w-3.5", active && "fill-primary")} /> {o.label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section icon={HeartCrack} title="ما لا يعجبك">
            <div className="flex flex-wrap gap-2">
              {dislikeOptions.map((o) => {
                const active = form.dislikes.includes(o.value);
                return (
                  <button key={o.value} type="button"
                    onClick={() => toggleArrayValue("dislikes", o.value)}
                    className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-extrabold transition",
                      active ? "border-destructive bg-destructive/10 text-destructive shadow-soft" : "border-border/60 bg-background/80 text-foreground")}>
                    <HeartCrack className="h-3.5 w-3.5" /> {o.label}
                  </button>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {/* TAB: Budget */}
      {tab === "budget" && (
        <Section icon={Wallet} title="ساعدنا لنعرض لك ما يناسب ميزانيتك" helper="هذه البيانات مشفّرة وتُستخدم فقط لتحسين العروض المعروضة لك.">
          <div className="grid grid-cols-1 gap-2">
            {budgetRanges.map((b) => {
              const Icon = b.icon;
              const active = form.budgetRange === b.value;
              return (
                <button key={b.value} type="button"
                  onClick={() => { setForm((c) => ({ ...c, budgetRange: b.value })); setSaveState("idle"); }}
                  className={cn("flex items-center gap-3 rounded-[1.3rem] border px-4 py-3 text-right transition ease-apple",
                    active ? "border-primary bg-primary-soft shadow-soft" : "border-border/60 bg-background/80")}>
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-full", active ? "bg-primary text-primary-foreground" : "bg-muted text-primary")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-extrabold text-foreground">{b.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{b.hint}</div>
                  </div>
                  <div className={cn("h-5 w-5 rounded-full border-2", active ? "border-primary bg-primary" : "border-border bg-card")} />
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {/* TAB: Avatar */}
      {tab === "avatar" && (
        <>
          <Section icon={Camera} title="صورتك الشخصية" helper="ارفع صورة أو اختر أيقونة تعبّر عنك.">
            <button type="button" disabled
              className="flex w-full items-center justify-center gap-2 rounded-[1.3rem] border border-dashed border-border bg-background/80 py-6 text-sm font-extrabold text-muted-foreground">
              <Camera className="h-5 w-5" /> رفع صورة (قريبًا)
            </button>
          </Section>

          <Section icon={ImageIcon} title="معرض الأفاتار" helper="اختر أيقونة راقية تظهر في حسابك.">
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_GALLERY.map((a) => {
                const Icon = a.icon;
                const active = form.avatarKey === a.key;
                return (
                  <button key={a.key} type="button"
                    onClick={() => { setForm((c) => ({ ...c, avatarKey: c.avatarKey === a.key ? "" : a.key })); setSaveState("idle"); }}
                    className={cn("flex flex-col items-center gap-1.5 rounded-[1.2rem] border p-3 transition ease-apple",
                      active ? "border-primary bg-primary-soft shadow-soft" : "border-border/60 bg-background/80")}>
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-full", active ? "bg-primary text-primary-foreground" : "bg-muted text-primary")}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-extrabold text-foreground">{a.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        </>
      )}

      {/* Save bar */}
      <section className="rounded-[1.6rem] border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-muted/60 p-3">
          <div>
            <p className="text-sm font-extrabold text-foreground">
              {saveState === "saving" ? "جاري حفظ التعديلات" : saveState === "saved" ? "كل شيء محفوظ" : isDirty ? "هناك تغييرات غير محفوظة" : "بياناتك متزامنة"}
            </p>
            <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
              {isDirty ? "احفظ الآن لتفعيل التخصيصات في المتجر." : "ستُستخدم بياناتك لترتيب الأقسام والعروض تلقائيًا."}
            </p>
          </div>
          {saveState === "saving" ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
            : saveState === "saved" ? <CheckCircle2 className="h-5 w-5 text-primary" />
            : <CircleAlert className="h-5 w-5 text-accent" />}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={resetForm} disabled={!isDirty || saveState === "saving"}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-border/60 bg-background font-extrabold text-foreground disabled:opacity-50">
            <RefreshCcw className="h-4 w-4" /> تراجع
          </button>
          <button type="button" onClick={save} disabled={saveState === "saving" || !isDirty}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-extrabold text-primary-foreground shadow-pill disabled:opacity-60">
            {saveState === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saveState === "saving" ? "جاري الحفظ…" : "حفظ التعديلات"}
          </button>
        </div>
      </section>
    </div>
  );
};

const Section = ({ icon: Icon, title, helper, children }: { icon: LucideIcon; title: string; helper?: string; children: ReactNode }) => (
  <section className="rounded-[1.6rem] border border-border/60 bg-card p-4 shadow-soft">
    <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
      <Icon className="h-4 w-4 text-primary" /> {title}
    </div>
    {helper && <p className="mb-3 text-[11px] leading-6 text-muted-foreground">{helper}</p>}
    {children}
  </section>
);

const SmartField = ({ icon: Icon, label, helper, value, placeholder, onChange }: {
  icon: LucideIcon; label: string; helper: string; value: string; placeholder: string; onChange: (v: string) => void;
}) => (
  <label className="block rounded-[1.4rem] border border-border/60 bg-background/80 p-3">
    <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </div>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      autoComplete="name" className="w-full bg-transparent text-sm font-extrabold text-foreground outline-none placeholder:text-muted-foreground" />
    <p className="mt-2 text-[11px] leading-6 text-muted-foreground">{helper}</p>
  </label>
);

const ReadonlyField = ({ icon: Icon, label, helper, value }: { icon: LucideIcon; label: string; helper: string; value: string }) => (
  <div className="rounded-[1.4rem] border border-border/60 bg-background/80 p-3">
    <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </div>
    <div dir="ltr" className="text-sm font-extrabold text-foreground">+{value}</div>
    <p className="mt-2 text-[11px] leading-6 text-muted-foreground">{helper}</p>
  </div>
);

export default Profile;
