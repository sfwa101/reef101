import { useEffect, useState } from "react";
import BackHeader from "@/components/BackHeader";
import { toast } from "sonner";
import { User, Phone, Calendar, UserCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "unspecified">("unspecified");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setBirth(profile.birth_date ?? "");
      setGender((profile.gender as any) ?? "unspecified");
    }
  }, [profile]);

  const initials = (name || "ر م")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: name.trim() || null,
          phone: phone || user.phone || null,
          birth_date: birth || null,
          gender,
        },
        { onConflict: "id" }
      );
    setBusy(false);
    if (error) {
      console.error("profile save error", error);
      toast.error(`تعذّر الحفظ — ${error.message}`);
      return;
    }
    await refreshProfile();
    toast.success("تم حفظ التعديلات بنجاح");
  };

  return (
    <div className="space-y-5">
      <BackHeader title="البيانات الشخصية" subtitle="حدّث بياناتك في أي وقت" accent="حسابي" />
      <div className="flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-display text-3xl font-extrabold text-primary-foreground shadow-pill">
          {initials}
        </div>
      </div>
      <Field icon={User} label="الاسم الكامل" value={name} onChange={setName} />
      <Field icon={Phone} label="رقم الجوال" value={phone} onChange={() => {}} disabled />
      <Field icon={Calendar} label="تاريخ الميلاد" value={birth} onChange={setBirth} type="date" />

      <div className="glass-strong rounded-2xl p-3 shadow-soft">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
          <UserCircle2 className="h-3.5 w-3.5 text-primary" /> النوع
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["male", "female", "unspecified"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-xl py-2 text-xs font-bold transition ease-apple ${
                gender === g ? "bg-primary text-primary-foreground shadow-pill" : "bg-foreground/5 text-foreground"
              }`}
            >
              {g === "male" ? "ذكر" : g === "female" ? "أنثى" : "تفضّل عدم الإفصاح"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="w-full rounded-2xl bg-primary py-4 font-bold text-primary-foreground shadow-pill disabled:opacity-60"
      >
        {busy ? "جاري الحفظ…" : "حفظ التعديلات"}
      </button>
    </div>
  );
};

const Field = ({
  icon: Icon, label, value, onChange, type = "text", disabled,
}: { icon: any; label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) => (
  <label className="glass-strong block rounded-2xl p-3 shadow-soft">
    <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" /> {label}
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      dir={type === "date" ? "ltr" : undefined}
      className="w-full bg-transparent text-sm font-bold outline-none disabled:text-muted-foreground"
    />
  </label>
);

export default Profile;
