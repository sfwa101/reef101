import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  email?: string | null;
  occupation?: string | null;
  household_size?: number | null;
  lifestyle_tags?: string[] | null;
  likes?: string[] | null;
  dislikes?: string[] | null;
  budget_range?: string | null;
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

const arabicIndicDigits: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

const normalizePhone = (raw: string): string => {
  const latin = raw.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => arabicIndicDigits[d] ?? d);
  const digits = latin.replace(/\D/g, "");
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return "20" + digits.slice(1);
  return "20" + digits;
};
const phoneToEmail = (phone: string) => `${normalizePhone(phone)}@reef.local`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = supabase as any;
      const { data } = await client.from("profiles").select("*").eq("id", uid).maybeSingle();
      setProfile((data as Profile) ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  const ensureProfile = useCallback(async (currentUser: User, fullName?: string | null) => {
    const metadata = currentUser.user_metadata as { phone?: string; full_name?: string };
    const phone = metadata.phone ? normalizePhone(metadata.phone) : null;
    const name = fullName?.trim() || metadata.full_name || null;
    const payload: { id: string; phone?: string; full_name?: string } = { id: currentUser.id };
    if (phone) payload.phone = phone;
    if (name) payload.full_name = name;

    try {
      const { data } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("*")
        .maybeSingle();
      setProfile((data as Profile) ?? null);

      await supabase
        .from("wallet_balances")
        .upsert({ user_id: currentUser.id }, { onConflict: "user_id" });
    } catch {
      await fetchProfile(currentUser.id);
    }
  }, [fetchProfile]);

  useEffect(() => {
    let active = true;

    // Order: subscribe first, then read existing session.
    // Silent recovery: only clear local state on explicit SIGNED_OUT.
    // Token refreshes / tab focus events should NOT log the user out.
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // For SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION:
      // keep whatever session Supabase hands us (it pulled from localStorage).
      if (s) {
        setSession(s);
        setUser(s.user ?? null);
        setTimeout(() => fetchProfile(s.user.id), 0);
      }
      setLoading(false);
    });

    const failSafe = window.setTimeout(() => {
      if (active) setLoading(false);
    }, 2500);

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        if (!active) return;
        if (s) {
          setSession(s);
          setUser(s.user ?? null);
          fetchProfile(s.user.id);
        }
        // If no session, leave state as-is (null) — onAuthStateChange will
        // also fire INITIAL_SESSION and keep things consistent.
      })
      .catch(() => {
        // Network blip on cold start — DO NOT wipe local session.
        // The persisted token in localStorage will recover on next call.
      })
      .finally(() => {
        if (active) setLoading(false);
        window.clearTimeout(failSafe);
      });

    return () => {
      active = false;
      window.clearTimeout(failSafe);
      sub.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUpWithPhone: AuthCtx["signUpWithPhone"] = async (phone, password, fullName) => {
    const email = phoneToEmail(phone);
    const normalized = normalizePhone(phone);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { phone: normalized, full_name: fullName },
      },
    });
    if (error) return { error: humanize(error.message) };
    if (data.session?.user) await ensureProfile(data.session.user, fullName);
    return {};
  };

  const signInWithPhone: AuthCtx["signInWithPhone"] = async (phone, password) => {
    const email = phoneToEmail(phone);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: humanize(error.message) };
    if (data.user) await ensureProfile(data.user);
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
  if (m.includes("password")) return "كلمة السر يجب ألا تقل عن 6 أحرف";
  return msg;
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
};