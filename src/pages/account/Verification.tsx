import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Camera, CheckCircle2, CircleAlert, IdCard, Loader2, Save, ShieldCheck, Upload, X } from "lucide-react";
import BackHeader from "@/components/BackHeader";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type KycStatus = "pending" | "verified" | "rejected";
type KycRow = {
  id: string;
  user_id: string;
  national_id: string | null;
  front_image_path: string | null;
  back_image_path: string | null;
  status: KycStatus;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

const BUCKET = "kyc-documents";

const STATUS_META: Record<KycStatus, { label: string; chip: string; icon: typeof CheckCircle2 }> = {
  pending:  { label: "قيد المراجعة", chip: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300", icon: Loader2 },
  verified: { label: "حساب موثّق ✅", chip: "bg-primary-soft text-primary ring-primary/30", icon: BadgeCheck },
  rejected: { label: "مرفوض - يرجى إعادة الرفع", chip: "bg-destructive/10 text-destructive ring-destructive/30", icon: CircleAlert },
};

const Verification = () => {
  const { user } = useAuth();
  const [row, setRow] = useState<KycRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [nationalId, setNationalId] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [signedFront, setSignedFront] = useState<string | null>(null);
  const [signedBack, setSignedBack] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const frontInput = useRef<HTMLInputElement>(null);
  const backInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("kyc_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<KycRow>();
      if (!alive) return;
      if (data) {
        setRow(data);
        setNationalId(data.national_id ?? "");
        if (data.front_image_path) {
          const { data: f } = await supabase.storage.from(BUCKET).createSignedUrl(data.front_image_path, 600);
          if (alive) setSignedFront(f?.signedUrl ?? null);
        }
        if (data.back_image_path) {
          const { data: b } = await supabase.storage.from(BUCKET).createSignedUrl(data.back_image_path, 600);
          if (alive) setSignedBack(b?.signedUrl ?? null);
        }
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  const onPick = (which: "front" | "back", file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("الحد الأقصى 5MB لكل صورة"); return; }
    if (!file.type.startsWith("image/")) { toast.error("يرجى رفع صورة صحيحة"); return; }
    const url = URL.createObjectURL(file);
    if (which === "front") { setFrontFile(file); setFrontPreview(url); }
    else { setBackFile(file); setBackPreview(url); }
  };

  const uploadOne = async (file: File, side: "front" | "back"): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user!.id}/${side}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!user) { toast.error("سجّل الدخول أولاً"); return; }
    const cleanId = nationalId.replace(/\D/g, "");
    if (cleanId.length !== 14) { toast.error("الرقم القومي يجب أن يكون 14 رقمًا"); return; }
    const needFront = !row?.front_image_path && !frontFile;
    const needBack = !row?.back_image_path && !backFile;
    if (needFront || needBack) { toast.error("يرجى رفع صورة الهوية (وجه وظهر)"); return; }

    setSaving(true);
    try {
      let frontPath = row?.front_image_path ?? null;
      let backPath = row?.back_image_path ?? null;
      if (frontFile) frontPath = await uploadOne(frontFile, "front");
      if (backFile) backPath = await uploadOne(backFile, "back");

      const payload = {
        user_id: user.id,
        national_id: cleanId,
        front_image_path: frontPath,
        back_image_path: backPath,
        status: "pending" as KycStatus,
        rejection_reason: null,
        submitted_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("kyc_verifications")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single<KycRow>();
      if (error) throw error;
      setRow(data);
      setFrontFile(null); setBackFile(null);
      toast.success("تم إرسال الطلب — ستصلك نتيجة التوثيق قريبًا");
    } catch (e) {
      console.error("kyc submit error", e);
      toast.error("تعذّر إرسال الطلب، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-5">
        <BackHeader title="توثيق الحساب" subtitle="سجّل الدخول لإكمال التوثيق" accent="حسابي" />
        <div className="rounded-3xl border border-border/60 bg-card p-6 text-center shadow-soft">
          <Link to="/auth" className="inline-block rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-pill">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <BackHeader title="توثيق الحساب" subtitle="جاري تحميل بياناتك" accent="حسابي" />
        <div className="h-40 animate-pulse rounded-[1.6rem] bg-card shadow-soft" />
      </div>
    );
  }

  const status: KycStatus = row?.status ?? "pending";
  const meta = row ? STATUS_META[status] : null;
  const StatusIcon = meta?.icon;
  const editable = !row || row.status !== "verified";

  return (
    <div className="space-y-5 pb-6">
      <BackHeader title="توثيق الحساب" subtitle="حسابك الموثّق يفتح خدمات إضافية" accent="KYC" />

      {/* Status banner */}
      {row && meta && (
        <section className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 ring-1", meta.chip)}>
          {StatusIcon && <StatusIcon className={cn("h-5 w-5", status === "pending" && "animate-spin")} />}
          <div className="flex-1">
            <p className="text-sm font-extrabold">{meta.label}</p>
            {row.rejection_reason && status === "rejected" && (
              <p className="mt-0.5 text-[11px] opacity-90">السبب: {row.rejection_reason}</p>
            )}
          </div>
          {status === "verified" && <BadgeCheck className="h-6 w-6" />}
        </section>
      )}

      {/* Info card */}
      <section className="rounded-[1.6rem] border border-border/60 bg-card p-4 shadow-soft">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-extrabold">لماذا التوثيق؟</h3>
            <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
              التوثيق يحمي حسابك ويتيح خدمات حصرية مثل استعارة كتب مكتبة الطلبة، ورفع حدود الدفع.
              صورك مشفّرة ومتاحة فقط لفريق المراجعة.
            </p>
          </div>
        </div>
      </section>

      {/* National ID */}
      <section className="rounded-[1.6rem] border border-border/60 bg-card p-4 shadow-soft">
        <div className="mb-2 flex items-center gap-2 text-sm font-extrabold">
          <IdCard className="h-4 w-4 text-primary" /> الرقم القومي
        </div>
        <input
          type="text"
          inputMode="numeric"
          maxLength={14}
          value={nationalId}
          disabled={!editable}
          onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 14))}
          placeholder="14 رقمًا"
          dir="ltr"
          className="w-full rounded-[1.1rem] border border-border/60 bg-background px-4 py-3 text-center text-base font-extrabold tabular-nums tracking-widest outline-none focus:border-primary disabled:opacity-60"
        />
        <p className="mt-2 text-[11px] text-muted-foreground">يُستخدم فقط لأغراض التوثيق ولن يُعرض لأي طرف ثالث.</p>
      </section>

      {/* Uploads */}
      <section className="grid grid-cols-2 gap-3">
        <ImageDrop
          label="وجه الهوية"
          preview={frontPreview ?? signedFront}
          disabled={!editable}
          onPick={(f) => onPick("front", f)}
          inputRef={frontInput}
          onClear={() => { setFrontFile(null); setFrontPreview(null); }}
        />
        <ImageDrop
          label="ظهر الهوية"
          preview={backPreview ?? signedBack}
          disabled={!editable}
          onPick={(f) => onPick("back", f)}
          inputRef={backInput}
          onClear={() => { setBackFile(null); setBackPreview(null); }}
        />
      </section>

      {/* Submit */}
      {editable && (
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-extrabold text-primary-foreground shadow-pill disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "جاري الإرسال…" : row?.status === "rejected" ? "إعادة إرسال الطلب" : "إرسال طلب التوثيق"}
        </button>
      )}
    </div>
  );
};

const ImageDrop = ({
  label, preview, disabled, onPick, inputRef, onClear,
}: {
  label: string;
  preview: string | null;
  disabled?: boolean;
  onPick: (f: File | null) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClear: () => void;
}) => {
  return (
    <div className="rounded-[1.4rem] border border-border/60 bg-card p-3 shadow-soft">
      <p className="mb-2 text-[11px] font-extrabold text-muted-foreground">{label}</p>
      {preview ? (
        <div className="relative">
          <img src={preview} alt={label} className="h-32 w-full rounded-xl object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-foreground/70 text-background"
              aria-label="إزالة الصورة"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/80 text-xs font-extrabold text-muted-foreground active:scale-[0.99] disabled:opacity-50"
        >
          <Camera className="h-5 w-5" />
          اضغط للالتقاط
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      {preview && !disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-muted py-2 text-[11px] font-extrabold"
        >
          <Upload className="h-3 w-3" /> تغيير الصورة
        </button>
      )}
    </div>
  );
};

export default Verification;
