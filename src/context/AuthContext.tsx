import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isRetryableBackendError, retryBackendCall } from "@/lib/backendRetry";

export type Profile = {
  id: string;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  email: string | null;
};

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUpWithPhone: (phone: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return "20" + digits.slice(1);
  return "20" + digits;
};
const phoneToEmail = (phone: string) => `${normalizePhone(phone)}@reef.local`;

const ensureUserRecords = async (authUser: User) => {
  const fullName = typeof authUser.user_metadata?.full_name === "string" ? authUser.user_metadata.full_name : null;
  const phone = typeof authUser.user_metadata?.phone === "string" ? authUser.user_metadata.phone : authUser.phone ?? null;

  await retryBackendCall(
    async () => await supabase
      .from("profiles")
      .upsert({
        id: authUser.id,
        full_name: fullName,
        phone,
      }, { onConflict: "id" }),
    6,
    700,
  );

  await retryBackendCall(
    async () => await supabase
      .from("wallet_balances")
      .upsert({ user_id: authUser.id }, { onConflict: "user_id" }),
    6,
    700,
  ).catch(() => undefined);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;
      const { data, error } = await retryBackendCall<any>(
        () => client.from("profiles").select("*").eq("id", uid).maybeSingle(),
        7,
        500,
      );

      if (error) return;
      setProfile((data as Profile) ?? null);
    } catch {
      // keep the last known profile if the backend is temporarily unavailable
    }
  };

  useEffect(() => {
    // Order: subscribe first, then read existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => {
          void ensureUserRecords(s.user);
          void fetchProfile(s.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void ensureUserRecords(s.user);
        void fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUpWithPhone: AuthCtx["signUpWithPhone"] = async (phone, password, fullName) => {
    const email = phoneToEmail(phone);
    const normalized = normalizePhone(phone);
    const normalizedPassword = password.trim();
    const { error } = await retryBackendCall(
      () => supabase.auth.signUp({
        email,
        password: normalizedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { phone: normalized, full_name: fullName },
        },
      }),
      4,
      500,
    );
    if (error) return { error: humanize(error.message) };

    const signInResult = await retryBackendCall(
      () => supabase.auth.signInWithPassword({ email, password: normalizedPassword }),
      6,
      700,
    );

    if (signInResult.error && !isRetryableBackendError(signInResult.error)) {
      return { error: humanize(signInResult.error.message ?? "تعذّر تسجيل الدخول بعد إنشاء الحساب") };
    }

    const { data: currentUser } = await supabase.auth.getUser();
    if (currentUser.user) {
      await ensureUserRecords(currentUser.user);
    }

    return {};
  };

  const signInWithPhone: AuthCtx["signInWithPhone"] = async (phone, password) => {
    const email = phoneToEmail(phone);
    const normalizedPassword = password.trim();
    const { error } = await retryBackendCall(
      () => supabase.auth.signInWithPassword({ email, password: normalizedPassword }),
      6,
      700,
    );
    if (error) return { error: humanize(error.message) };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <Ctx.Provider value={{ session, user, profile, loading, signUpWithPhone, signInWithPhone, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
};

const humanize = (msg: string): string => {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "رقم الهاتف أو كلمة السر غير صحيحة";
  if (m.includes("already registered") || m.includes("already in use") || m.includes("user already")) return "هذا الرقم مسجّل بالفعل، سجّل الدخول";
  if (m.includes("password") || m.includes("weak_password")) return "كلمة السر يجب ألا تقل عن 6 خانات ويمكن أن تكون أرقامًا فقط";
  if (m.includes("database error querying schema") || m.includes("schema cache") || m.includes("unexpected eof") || m.includes("no connection to the server") || m.includes("database client error")) {
    return "الخدمة كانت مشغولة للحظات، حاولنا تلقائياً ويمكنك المتابعة الآن";
  }
  return msg;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};