import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Phone, Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import reefLogo from "@/assets/reef-logo.webp";
import { useAuth } from "@/context/AuthContext";
import { toLatin } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { pathForRole, type AppRole } from "@/hooks/useUserRole";

const ROLE_PRIORITY: Record<string, number> = {
  admin: 1, finance: 2, branch_manager: 3, store_manager: 4,
  inventory_clerk: 5, cashier: 6, delivery: 7, staff: 8, collector: 9, vendor: 10,
};

async function resolveRedirectPath(userId: string): Promise<string> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("is_active", true);
    if (!data || data.length === 0) return "/";
    const sorted = [...data].sort(
      (a, b) => (ROLE_PRIORITY[a.role] ?? 99) - (ROLE_PRIORITY[b.role] ?? 99),
    );
    return pathForRole(sorted[0].role as AppRole);
  } catch { return "/"; }
}

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const { user, loading, signInWithPhone, signUpWithPhone } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [loading, navigate, user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (toLatin(phone).replace(/\D/g, "").length < 10) { toast.error("أدخل رقم هاتف صحيح"); return; }
    if (password.length < 6) { toast.error("كلمة السر يجب أن تكون 6 أحرف على الأقل"); return; }
    if (mode === "signup" && fullName.trim().length < 2) { toast.error("أدخل اسمك الكامل"); return; }
    setBusy(true);
    try {
      const res = mode === "signin" ? await signInWithPhone(phone, password) : await signUpWithPhone(phone, password, fullName.trim());
      if (res.error) toast.error(res.error);
      else { toast.success(mode === "signin" ? "أهلاً بعودتك" : "تم إنشاء حسابك بنجاح"); navigate({ to: "/", replace: true }); }
    } finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-10">
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft shadow-tile">
            <img src={reefLogo} alt="" className="h-10 w-10 object-contain" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">{mode === "signin" ? "أهلاً بعودتك" : "أنشئ حسابك"}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{mode === "signin" ? "سجّل بالهاتف لتتابع طلباتك ومحفظتك" : "حساب واحد لكل تطبيقات ريف المدينة"}</p>
        </header>
        <form onSubmit={submit} className="glass-strong space-y-3 rounded-3xl p-5 shadow-tile">
          {mode === "signup" && (
            <div className="relative">
              <User className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="الاسم الكامل" type="text" autoComplete="name" className="w-full rounded-2xl border border-border/60 bg-background/80 py-3 pe-9 ps-4 text-sm font-medium outline-none focus:border-primary" />
            </div>
          )}
          <div className="relative">
            <Phone className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الهاتف" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className="w-full rounded-2xl border border-border/60 bg-background/80 py-3 pe-9 ps-4 text-sm font-medium outline-none focus:border-primary" />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="كلمة السر" type={showPwd ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} className="w-full rounded-2xl border border-border/60 bg-background/80 py-3 pe-9 ps-10 text-sm font-medium outline-none focus:border-primary" />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute inset-y-0 left-3 flex items-center text-muted-foreground" aria-label="إظهار كلمة السر">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit" disabled={busy} className="mt-2 w-full rounded-full bg-primary py-3.5 font-display text-sm font-extrabold text-primary-foreground shadow-pill transition active:scale-[0.98] disabled:opacity-60">
            {busy ? "جاري المعالجة…" : mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
          </button>
        </form>
        <button type="button" onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))} className="mx-auto mt-6 text-xs font-bold text-primary">
          {mode === "signin" ? "ليس لديك حساب؟ أنشئ حساباً جديداً" : "لديك حساب بالفعل؟ سجّل الدخول"}
        </button>
        <div className="mt-auto pt-8 text-center">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" /> بياناتك مشفّرة وآمنة
          </p>
        </div>
      </main>
    </div>
  );
};
export default Auth;
