import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Loader2,
  LockKeyhole,
  Phone,
  RefreshCcw,
  Save,
  Sparkles,
  User2,
  VenusAndMars,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Gender = "male" | "female" | "unspecified";

type ProfileForm = {
  fullName: string;
  phone: string;
  birthDate: string;
  gender: Gender;
};

type DbProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
};

const EMPTY_FORM: ProfileForm = {
  fullName: "",
  phone: "",
  birthDate: "",
  gender: "unspecified",
};

const genderOptions: Array<{ value: Gender; label: string; note: string }> = [
  { value: "male", label: "ذكر", note: "تخصيصات مناسبة" },
  { value: "female", label: "أنثى", note: "واجهة ألطف وعروض مناسبة" },
  { value: "unspecified", label: "أفضّل عدم الإفصاح", note: "إعداد محايد" },
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
  };
};

const Profile = () => {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<ProfileForm>(EMPTY_FORM);
  const [pageState, setPageState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const syncProfile = async (silent = false) => {
    if (!user) return null;

    if (!silent) setPageState("loading");
    setErrorMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, birth_date, gender")
      .eq("id", user.id)
      .maybeSingle<DbProfile>();

    if (error) {
      console.error("profile fetch error", error);
      const fallback = buildForm(user, profile);
      setForm(fallback);
      setInitialForm(fallback);
      setPageState("error");
      setErrorMessage(error.message);
      return null;
    }

    const next = buildForm(user, data ?? profile);
    setForm(next);
    setInitialForm(next);
    setPageState("ready");
    return next;
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setPageState("idle");
      setForm(EMPTY_FORM);
      setInitialForm(EMPTY_FORM);
      return;
    }

    const fallback = buildForm(user, profile);
    setForm(fallback);
    setInitialForm(fallback);
    setPageState(profile ? "ready" : "loading");
    void syncProfile(Boolean(profile));
  }, [loading, user?.id]);

  const initials = useMemo(() => {
    return (form.fullName || user?.user_metadata?.full_name || "ر م")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0])
      .join("");
  }, [form.fullName, user?.user_metadata?.full_name]);

  const completion = useMemo(() => {
    const fields = [
      form.fullName.trim().length > 1,
      form.phone.trim().length > 0,
      form.birthDate.length > 0,
      form.gender !== "unspecified",
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const smartTips = useMemo(() => {
    const tips: string[] = [];
    if (form.fullName.trim().length < 2) tips.push("أضف اسمك الكامل ليظهر بوضوح في الحساب والطلبات.");
    if (!form.birthDate) tips.push("أضف تاريخ الميلاد لتخصيص العروض والمناسبات.");
    if (form.gender === "unspecified") tips.push("حدد النوع لتفعيل الثيمات والعروض الأنسب لك.");
    return tips;
  }, [form]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const save = async () => {
    if (loading) {
      toast.error("انتظر قليلاً حتى يكتمل تجهيز الحساب.");
      return;
    }

    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً لحفظ البيانات.");
      return;
    }

    if (form.fullName.trim().length < 2) {
      toast.error("أدخل الاسم الكامل بشكل صحيح.");
      return;
    }

    setSaveState("saving");
    setErrorMessage("");

    const payload = {
      id: user.id,
      full_name: form.fullName.trim(),
      phone: form.phone || extractPhoneFromPseudoEmail(user.email) || null,
      birth_date: form.birthDate || null,
      gender: form.gender,
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
    const fresh = (await syncProfile(true)) ?? { ...form, fullName: form.fullName.trim() };
    setInitialForm(fresh);
    setSaveState("saved");
    toast.success("تم حفظ البيانات الشخصية بنجاح");
  };

  const resetForm = () => {
    setForm(initialForm);
    setSaveState("idle");
    setErrorMessage("");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <BackHeader title="البيانات الشخصية" subtitle="جاري تجهيز ملفك الشخصي" accent="حسابي" />
        <div className="h-44 animate-pulse rounded-[2rem] bg-card shadow-soft" />
        <div className="h-24 animate-pulse rounded-[1.6rem] bg-card shadow-soft" />
        <div className="h-72 animate-pulse rounded-[1.6rem] bg-card shadow-soft" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-5">
        <BackHeader title="البيانات الشخصية" subtitle="سجّل الدخول أولاً لإدارة بياناتك" accent="حسابي" />
        <section className="rounded-[2rem] border border-border/60 bg-card p-6 text-center shadow-tile">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-extrabold text-foreground">الملف الشخصي يحتاج تسجيل دخول</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            حتى لا تضيع بياناتك، الحفظ هنا يعمل فقط بعد الدخول إلى الحساب.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-extrabold text-primary-foreground shadow-pill"
          >
            تسجيل الدخول الآن
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <BackHeader title="البيانات الشخصية" subtitle="أعدت بناء الصفحة لتكون أوضح وأذكى وأسهل في الحفظ" accent="حسابي" />

      <section
        className="overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-tile"
        style={{ backgroundImage: "var(--gradient-aurora)" }}
      >
        <div className="space-y-4 bg-background/70 p-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-card/85 px-3 py-1 text-[11px] font-extrabold text-primary shadow-soft">
                <Sparkles className="h-3.5 w-3.5" /> ملف ذكي
              </span>
              <div>
                <h2 className="font-display text-2xl font-extrabold text-foreground">
                  {form.fullName || "أكمل بياناتك الشخصية"}
                </h2>
                <p dir="ltr" className="mt-1 text-sm font-medium text-muted-foreground">
                  +{form.phone || extractPhoneFromPseudoEmail(user.email) || "—"}
                </p>
              </div>
            </div>

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-display font-extrabold text-primary-foreground shadow-pill">
              {initials}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatTile label="الاكتمال" value={`${completion}%`} hint={completion === 100 ? "مكتمل" : "قابل للتحسين"} />
            <StatTile label="الميلاد" value={form.birthDate ? "مضاف" : "ناقص"} hint={form.birthDate ? formatBirthDate(form.birthDate) : "غير مضاف"} />
            <StatTile label="الحفظ" value={saveState === "saved" ? "تم" : isDirty ? "معلّق" : "جاهز"} hint={saveState === "saving" ? "جاري الإرسال" : "آخر حالة"} />
          </div>
        </div>
      </section>

      {(pageState === "error" || errorMessage) && (
        <section className="rounded-[1.6rem] border border-destructive/20 bg-destructive/5 p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-destructive/10 p-2 text-destructive">
              <CircleAlert className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-foreground">هناك مشكلة في مزامنة البيانات</h3>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">{errorMessage || "تعذّر تحميل آخر نسخة من بياناتك."}</p>
            </div>
            <button
              type="button"
              onClick={() => void syncProfile()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground shadow-soft"
              aria-label="إعادة المحاولة"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      {smartTips.length > 0 && (
        <section className="rounded-[1.6rem] border border-border/60 bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> اقتراحات ذكية لتحسين ملفك
          </div>
          <div className="space-y-2">
            {smartTips.map((tip) => (
              <div key={tip} className="flex items-start gap-2 rounded-2xl bg-muted/70 px-3 py-2 text-xs leading-6 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[1.6rem] border border-border/60 bg-card p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
          <User2 className="h-4 w-4 text-primary" /> الهوية الأساسية
        </div>

        <div className="space-y-3">
          <SmartField
            icon={User2}
            label="الاسم الكامل"
            helper="الاسم يظهر في حسابك وطلباتك وفاتورتك."
            value={form.fullName}
            placeholder="مثال: أحمد محمد"
            onChange={(value) => {
              setForm((current) => ({ ...current, fullName: value }));
              setSaveState("idle");
            }}
          />

          <ReadonlyField
            icon={Phone}
            label="رقم الجوال"
            helper="رقم الجوال مرتبط بالحساب ويُستخدم لتسجيل الدخول، لذلك لا يتم تغييره من هنا."
            value={form.phone || extractPhoneFromPseudoEmail(user.email) || "غير متوفر"}
          />

          <div className="rounded-[1.4rem] border border-border/60 bg-background/80 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> تاريخ الميلاد
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-13 w-full justify-between rounded-[1.1rem] border-border/60 bg-card px-4 text-right font-bold text-foreground",
                    !form.birthDate && "text-muted-foreground"
                  )}
                >
                  <span>{formatBirthDate(form.birthDate)}</span>
                  <CalendarDays className="h-4 w-4 text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.birthDate ? new Date(`${form.birthDate}T00:00:00`) : undefined}
                  onSelect={(date) => {
                    setForm((current) => ({ ...current, birthDate: date ? toIsoDate(date) : "" }));
                    setSaveState("idle");
                  }}
                  disabled={(date) => date > new Date() || date < new Date("1950-01-01")}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="mt-2 text-[11px] leading-6 text-muted-foreground">نستخدمه لتجربة أكثر دقة ولعروض المناسبات.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-border/60 bg-card p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
          <VenusAndMars className="h-4 w-4 text-primary" /> التخصيص الذكي
        </div>
        <div className="grid grid-cols-1 gap-2">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setForm((current) => ({ ...current, gender: option.value }));
                setSaveState("idle");
              }}
              className={cn(
                "flex items-center justify-between rounded-[1.3rem] border px-4 py-3 text-right transition ease-apple",
                form.gender === option.value
                  ? "border-primary bg-primary-soft text-foreground shadow-soft"
                  : "border-border/60 bg-background/80 text-foreground"
              )}
            >
              <div>
                <div className="text-sm font-extrabold">{option.label}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{option.note}</div>
              </div>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition",
                  form.gender === option.value ? "border-primary bg-primary" : "border-border bg-card"
                )}
              />
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[1.6rem] border border-border/60 bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-foreground">
          <LockKeyhole className="h-4 w-4 text-primary" /> حالة الحفظ
        </div>
        <div className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-muted/60 p-3">
          <div>
            <p className="text-sm font-extrabold text-foreground">
              {saveState === "saving"
                ? "جاري حفظ التعديلات"
                : saveState === "saved"
                  ? "كل شيء محفوظ"
                  : isDirty
                    ? "هناك تغييرات غير محفوظة"
                    : "بياناتك متزامنة"}
            </p>
            <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
              {saveState === "error"
                ? "تعرض الحفظ لمشكلة، راجع الرسالة بالأعلى ثم أعد المحاولة."
                : isDirty
                  ? "احفظ الآن حتى تظهر بياناتك بشكل صحيح في حسابك."
                  : "لن تحتاج لإعادة تعبئة الحقول طالما بقيت الجلسة فعّالة."}
            </p>
          </div>
          {saveState === "saving" ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : saveState === "saved" ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : (
            <CircleAlert className="h-5 w-5 text-accent" />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={resetForm}
            disabled={!isDirty || saveState === "saving"}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-border/60 bg-background font-extrabold text-foreground disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" /> تراجع
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saveState === "saving" || !isDirty}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary font-extrabold text-primary-foreground shadow-pill disabled:opacity-60"
          >
            {saveState === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saveState === "saving" ? "جاري الحفظ…" : "حفظ التعديلات"}
          </button>
        </div>
      </section>
    </div>
  );
};

const StatTile = ({ label, value, hint }: { label: string; value: string; hint: string }) => (
  <div className="rounded-[1.2rem] bg-card/85 p-3 shadow-soft backdrop-blur-sm">
    <div className="text-[11px] font-bold text-muted-foreground">{label}</div>
    <div className="mt-1 text-base font-extrabold text-foreground">{value}</div>
    <div className="mt-1 truncate text-[10px] text-muted-foreground">{hint}</div>
  </div>
);

const SmartField = ({
  icon: Icon,
  label,
  helper,
  value,
  placeholder,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  helper: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) => (
  <label className="block rounded-[1.4rem] border border-border/60 bg-background/80 p-3">
    <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </div>
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete="name"
      className="w-full bg-transparent text-sm font-extrabold text-foreground outline-none placeholder:text-muted-foreground"
    />
    <p className="mt-2 text-[11px] leading-6 text-muted-foreground">{helper}</p>
  </label>
);

const ReadonlyField = ({
  icon: Icon,
  label,
  helper,
  value,
}: {
  icon: LucideIcon;
  label: string;
  helper: string;
  value: string;
}) => (
  <div className="rounded-[1.4rem] border border-border/60 bg-background/80 p-3">
    <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </div>
    <div dir="ltr" className="text-sm font-extrabold text-foreground">+{value}</div>
    <p className="mt-2 text-[11px] leading-6 text-muted-foreground">{helper}</p>
  </div>
);

export default Profile;
