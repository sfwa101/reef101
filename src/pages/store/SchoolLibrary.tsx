import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ShoppingBag, Library, Printer, Lock, Upload, FileText, Minus, Plus,
  CheckCircle2, BookOpen, Calculator, Sparkles, ShieldCheck, Clock,
} from "lucide-react";
import BackHeader from "@/components/BackHeader";
import ProductCard from "@/components/ProductCard";
import { products as allProducts, type Product } from "@/lib/products";
import { useCartActions } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney, toLatin } from "@/lib/format";
import {
  BORROW_DURATIONS, calcBorrowPrice, calcPrintTotal, PRINT_PRICES,
  LIBRARY_BUNDLES, PRINT_PREP_HOURS, type BorrowDuration, type BindingKey, type PrintConfig,
} from "@/lib/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type TabKey = "store" | "borrow" | "print";

// Royal blue palette specific to this hub
const PALETTE = {
  primary: "#1B5E8C",
  primarySoft: "#E6F1FA",
  ink: "#0F3A5C",
  accent: "#2EA8E6",
};

const libraryProducts = () => allProducts.filter((p) => p.source === "library");

/* -------------------- Borrowing UI -------------------- */
const BorrowCard = ({ product, onBorrow }: { product: Product; onBorrow: (p: Product) => void }) => (
  <button
    onClick={() => onBorrow(product)}
    className="group flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-right shadow-soft ring-1 ring-border/50 transition hover:-translate-y-0.5 active:scale-[0.98]"
  >
    <img src={product.image} alt={product.name} loading="lazy" className="h-20 w-16 rounded-xl object-cover ring-1 ring-border/50" />
    <div className="flex-1">
      <p className="font-display text-sm font-extrabold leading-tight">{product.name}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{product.unit}</p>
      <div className="mt-2 flex items-center gap-1 text-[11px] font-bold" style={{ color: PALETTE.primary }}>
        <BookOpen className="h-3.5 w-3.5" />
        <span>استعارة من {fmtMoney(Math.round(product.price * 0.15))}</span>
      </div>
    </div>
    <span className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white" style={{ background: PALETTE.primary }}>استعِر</span>
  </button>
);

/* -------------------- KYC Gate dialog -------------------- */
const KYCGateDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: PALETTE.primarySoft }}>
            <ShieldCheck className="h-7 w-7" style={{ color: PALETTE.primary }} />
          </div>
          <DialogTitle className="text-center font-display text-lg">ميزة حصرية للموثقين</DialogTitle>
          <DialogDescription className="text-center text-sm">
            هذه الميزة الحصرية تتطلب توثيق هويتك بالرقم القومي لحماية الكتب وضمان إعادتها بأمان.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl bg-foreground/5 py-3 text-sm font-bold text-foreground"
          >
            لاحقاً
          </button>
          <button
            onClick={() => { onOpenChange(false); navigate({ to: "/account/verification" }); }}
            className="flex-1 rounded-2xl py-3 text-sm font-extrabold text-white"
            style={{ background: PALETTE.primary }}
          >
            وثّق الآن
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------- Borrow sheet -------------------- */
const BorrowSheet = ({
  product, open, onOpenChange,
}: { product: Product | null; open: boolean; onOpenChange: (v: boolean) => void }) => {
  const [duration, setDuration] = useState<BorrowDuration>("7d");
  const { add } = useCartActions();

  if (!product) return null;
  const { rental, deposit, total } = calcBorrowPrice(product.price, duration);
  const days = BORROW_DURATIONS.find((d) => d.id === duration)!.days;

  const confirm = () => {
    add(product, 1, {
      kind: "borrow",
      borrowDuration: duration,
      borrowDays: days,
      borrowDeposit: deposit,
      unitPrice: total,
    });
    toast.success(`تمت إضافة "${product.name}" للاستعارة (${days} أيام)`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-right font-display">{product.name}</DialogTitle>
          <DialogDescription className="text-right">اختر مدة الاستعارة المناسبة</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2">
          {BORROW_DURATIONS.map((d) => {
            const active = d.id === duration;
            const p = calcBorrowPrice(product.price, d.id).rental;
            return (
              <button
                key={d.id}
                onClick={() => setDuration(d.id)}
                className={`rounded-2xl p-3 text-center text-xs font-extrabold transition ${active ? "text-white" : "bg-foreground/5 text-foreground"}`}
                style={active ? { background: PALETTE.primary } : undefined}
              >
                <p>{d.label}</p>
                <p className={`mt-1 text-[11px] ${active ? "opacity-90" : "text-muted-foreground"}`}>{toLatin(p)} ج.م</p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 space-y-2 rounded-2xl p-3" style={{ background: PALETTE.primarySoft }}>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">سعر الاستعارة</span><span className="font-bold">{fmtMoney(rental)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">تأمين مسترد</span><span className="font-bold">{fmtMoney(deposit)}</span></div>
          <div className="border-t pt-2 flex justify-between"><span className="font-extrabold">الإجمالي</span><span className="font-display text-lg font-extrabold" style={{ color: PALETTE.primary }}>{fmtMoney(total)}</span></div>
        </div>

        <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900">
          ⚠️ يُسترد التأمين كاملاً للمحفظة عند إرجاع الكتاب بحالة جيدة. غرامة التأخير: <strong>5 ج.م/يوم</strong> تُخصم من التأمين.
        </div>

        <button onClick={confirm} className="mt-2 w-full rounded-2xl py-3.5 text-sm font-extrabold text-white" style={{ background: PALETTE.primary }}>
          أضف للسلة — {fmtMoney(total)}
        </button>
      </DialogContent>
    </Dialog>
  );
};

/* -------------------- Print Wizard -------------------- */
const PrintWizard = () => {
  const { user } = useAuth();
  const { add } = useCartActions();
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [pages, setPages] = useState(10);
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState<"bw" | "color">("bw");
  const [sided, setSided] = useState<"single" | "double">("single");
  const [binding, setBinding] = useState<BindingKey>("none");
  const inputRef = useRef<HTMLInputElement>(null);

  const cfg: PrintConfig = { pages, copies, colorMode, sided, binding };
  const total = calcPrintTotal(cfg);

  const onPick = async (f: File | null) => {
    if (!f) return;
    if (!user) { toast.error("سجل الدخول لرفع الملف"); return; }
    setFile(f);
    setUploading(true);
    try {
      const path = `${user.id}/${Date.now()}-${f.name}`;
      const { error } = await supabase.storage.from("print-files").upload(path, f, { upsert: false });
      if (error) throw error;
      setFilePath(path);
      toast.success("تم رفع الملف بنجاح");
    } catch (e: any) {
      toast.error("فشل رفع الملف");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!user) { toast.error("سجل الدخول أولاً"); return; }
    try {
      const { error } = await supabase.from("print_jobs").insert({
        user_id: user.id, file_path: filePath, file_name: file?.name,
        pages, copies, color_mode: colorMode, sided, binding, total,
      });
      if (error) throw error;
      // Add a virtual cart line representing this print job
      const printProduct: Product = {
        id: `print-${Date.now()}`,
        name: `طلب طباعة: ${file?.name ?? "ملف"}`,
        unit: `${toLatin(pages)} صفحة · ${toLatin(copies)} نسخة`,
        price: total,
        image: "",
        category: "طباعة سحابية",
        source: "library",
      };
      add(printProduct, 1, {
        kind: "print",
        unitPrice: total,
        prepHours: PRINT_PREP_HOURS,
        printConfig: { pages, copies, colorMode, sided, binding, fileName: file?.name, filePath: filePath ?? undefined },
      });
      toast.success("تمت إضافة طلب الطباعة للسلة");
      setStep(1); setFile(null); setFilePath(null); setPages(10); setCopies(1);
      setColorMode("bw"); setSided("single"); setBinding("none");
    } catch (e: any) {
      toast.error("فشل إنشاء الطلب");
    }
  };

  const StepDot = ({ n }: { n: number }) => (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold ${step >= n ? "text-white" : "bg-foreground/10 text-muted-foreground"}`}
         style={step >= n ? { background: PALETTE.primary } : undefined}>{toLatin(n)}</div>
  );

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-card p-3 shadow-soft">
        {[1, 2, 3, 4].map((n, i) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <StepDot n={n} />
            {i < 3 && <div className={`h-0.5 flex-1 ${step > n ? "" : "bg-foreground/10"}`} style={step > n ? { background: PALETTE.primary } : undefined} />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="font-display text-base font-extrabold">1. ارفع ملفك</h3>
          <p className="mt-1 text-xs text-muted-foreground">PDF أو Word — حتى 20 ميجا</p>
          <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-8 text-sm font-bold disabled:opacity-50"
            style={{ borderColor: PALETTE.primary, color: PALETTE.primary }}
          >
            {uploading ? <><Upload className="h-5 w-5 animate-pulse" /> جارٍ الرفع…</> :
              file ? <><CheckCircle2 className="h-5 w-5" /> {file.name}</> :
              <><Upload className="h-5 w-5" /> اختر ملفاً</>}
          </button>
          <button
            disabled={!file || uploading}
            onClick={() => setStep(2)}
            className="mt-3 w-full rounded-2xl py-3 text-sm font-extrabold text-white disabled:opacity-40"
            style={{ background: PALETTE.primary }}
          >التالي</button>
        </div>
      )}

      {/* Step 2: Options */}
      {step === 2 && (
        <div className="space-y-3 rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="font-display text-base font-extrabold">2. خيارات الطباعة</h3>

          <div>
            <p className="mb-2 text-xs font-bold text-muted-foreground">الألوان</p>
            <div className="grid grid-cols-2 gap-2">
              {([["bw", "أبيض وأسود", "1 ج.م/صفحة"], ["color", "ألوان", "3 ج.م/صفحة"]] as const).map(([id, label, sub]) => {
                const active = colorMode === id;
                return (
                  <button key={id} onClick={() => setColorMode(id)}
                    className={`rounded-2xl p-3 text-center text-xs font-bold ${active ? "text-white" : "bg-foreground/5"}`}
                    style={active ? { background: PALETTE.primary } : undefined}>
                    <p className="font-extrabold">{label}</p>
                    <p className={`mt-0.5 text-[10px] ${active ? "opacity-90" : "text-muted-foreground"}`}>{sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-muted-foreground">عدد الأوجه</p>
            <div className="grid grid-cols-2 gap-2">
              {([["single", "وجه واحد", ""], ["double", "وجهين", "خصم 20%"]] as const).map(([id, label, sub]) => {
                const active = sided === id;
                return (
                  <button key={id} onClick={() => setSided(id)}
                    className={`rounded-2xl p-3 text-center text-xs font-bold ${active ? "text-white" : "bg-foreground/5"}`}
                    style={active ? { background: PALETTE.primary } : undefined}>
                    <p className="font-extrabold">{label}</p>
                    {sub && <p className={`mt-0.5 text-[10px] ${active ? "opacity-90" : "text-emerald-600"}`}>{sub}</p>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="flex-1 rounded-2xl bg-foreground/5 py-3 text-sm font-bold">رجوع</button>
            <button onClick={() => setStep(3)} className="flex-1 rounded-2xl py-3 text-sm font-extrabold text-white" style={{ background: PALETTE.primary }}>التالي</button>
          </div>
        </div>
      )}

      {/* Step 3: Binding */}
      {step === 3 && (
        <div className="space-y-3 rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="font-display text-base font-extrabold">3. التغليف</h3>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(PRINT_PRICES.binding) as [BindingKey, number][]).map(([id, price]) => {
              const active = binding === id;
              const labels: Record<BindingKey, string> = { none: "بدون", spiral: "كعب حلزوني سلك", plastic: "كعب بلاستيك", thermal: "تغليف حراري" };
              return (
                <button key={id} onClick={() => setBinding(id)}
                  className={`rounded-2xl p-3 text-center text-xs font-bold ${active ? "text-white" : "bg-foreground/5"}`}
                  style={active ? { background: PALETTE.primary } : undefined}>
                  <p className="font-extrabold">{labels[id]}</p>
                  <p className={`mt-0.5 text-[10px] ${active ? "opacity-90" : "text-muted-foreground"}`}>+{toLatin(price)} ج.م</p>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="flex-1 rounded-2xl bg-foreground/5 py-3 text-sm font-bold">رجوع</button>
            <button onClick={() => setStep(4)} className="flex-1 rounded-2xl py-3 text-sm font-extrabold text-white" style={{ background: PALETTE.primary }}>التالي</button>
          </div>
        </div>
      )}

      {/* Step 4: Live calculator + confirm */}
      {step === 4 && (
        <div className="space-y-3 rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="flex items-center gap-2 font-display text-base font-extrabold">
            <Calculator className="h-5 w-5" style={{ color: PALETTE.primary }} /> 4. الحاسبة الحية
          </h3>

          <div>
            <p className="mb-2 text-xs font-bold text-muted-foreground">عدد الصفحات</p>
            <div className="flex items-center gap-3 rounded-2xl bg-foreground/5 p-2">
              <button onClick={() => setPages((p) => Math.max(1, p - 5))} className="flex h-9 w-9 items-center justify-center rounded-xl bg-card"><Minus className="h-4 w-4" /></button>
              <input type="number" value={pages} onChange={(e) => setPages(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-transparent text-center font-display text-lg font-extrabold outline-none" />
              <button onClick={() => setPages((p) => p + 5)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-card"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-muted-foreground">عدد النسخ</p>
            <div className="flex items-center gap-3 rounded-2xl bg-foreground/5 p-2">
              <button onClick={() => setCopies((c) => Math.max(1, c - 1))} className="flex h-9 w-9 items-center justify-center rounded-xl bg-card"><Minus className="h-4 w-4" /></button>
              <span className="flex-1 text-center font-display text-lg font-extrabold">{toLatin(copies)}</span>
              <button onClick={() => setCopies((c) => c + 1)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-card"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="space-y-1.5 rounded-2xl p-3 text-xs" style={{ background: PALETTE.primarySoft }}>
            <div className="flex justify-between"><span className="text-muted-foreground">{toLatin(pages)} صفحة × {colorMode === "color" ? "3" : "1"} ج.م</span><span className="font-bold">{fmtMoney(pages * (colorMode === "color" ? 3 : 1))}</span></div>
            {sided === "double" && <div className="flex justify-between text-emerald-700"><span>خصم وجهين 20%</span><span>-</span></div>}
            {binding !== "none" && <div className="flex justify-between"><span className="text-muted-foreground">تغليف</span><span className="font-bold">+{fmtMoney(PRINT_PRICES.binding[binding])}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">× {toLatin(copies)} نسخة</span><span /></div>
            <div className="border-t pt-1.5 flex justify-between"><span className="font-extrabold">الإجمالي</span><span className="font-display text-xl font-extrabold" style={{ color: PALETTE.primary }}>{fmtMoney(total)}</span></div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-900">
            <Clock className="h-4 w-4" />
            <span>وقت التجهيز: خلال {toLatin(PRINT_PREP_HOURS)} ساعات من التأكيد.</span>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="flex-1 rounded-2xl bg-foreground/5 py-3 text-sm font-bold">رجوع</button>
            <button onClick={submit} className="flex-[2] rounded-2xl py-3.5 text-sm font-extrabold text-white" style={{ background: PALETTE.primary }}>
              أضف للسلة — {fmtMoney(total)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------- Bundles -------------------- */
const BundlesGrid = () => {
  const { add } = useCartActions();
  const handleAdd = (bundle: typeof LIBRARY_BUNDLES[number]) => {
    const virtual: Product = {
      id: bundle.id, name: bundle.name, unit: bundle.subtitle,
      price: bundle.price, oldPrice: bundle.oldPrice,
      image: "", category: "حزم طلابية", source: "library", badge: "best",
    };
    add(virtual, 1, { kind: "buy" });
    toast.success(`تمت إضافة "${bundle.name}" للسلة`);
  };
  return (
    <div className="space-y-2.5">
      {LIBRARY_BUNDLES.map((b) => (
        <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft ring-1 ring-border/50">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl" style={{ background: PALETTE.primarySoft }}>
            {b.emoji}
          </div>
          <div className="flex-1">
            <p className="font-display text-sm font-extrabold leading-tight">{b.name}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{b.subtitle}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-base font-extrabold" style={{ color: PALETTE.primary }}>{fmtMoney(b.price)}</span>
              {b.oldPrice && <span className="text-[11px] text-muted-foreground line-through">{fmtMoney(b.oldPrice)}</span>}
            </div>
          </div>
          <button onClick={() => handleAdd(b)} className="rounded-full px-3 py-2 text-xs font-extrabold text-white" style={{ background: PALETTE.primary }}>
            أضف
          </button>
        </div>
      ))}
    </div>
  );
};

/* ==================== Page ==================== */
const SchoolLibrary = () => {
  const [tab, setTab] = useState<TabKey>("store");
  const [kycOpen, setKycOpen] = useState(false);
  const [borrowProduct, setBorrowProduct] = useState<Product | null>(null);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setIsVerified(false); return; }
    supabase.from("kyc_verifications").select("status").eq("user_id", user.id).eq("status", "approved").maybeSingle()
      .then(({ data }) => { if (!cancelled) setIsVerified(!!data); });
    return () => { cancelled = true; };
  }, [user?.id]);

  const products = useMemo(libraryProducts, []);

  const onBorrowClick = (p: Product) => {
    if (!user) { toast.error("سجل الدخول أولاً"); return; }
    if (!isVerified) { setKycOpen(true); return; }
    setBorrowProduct(p);
    setBorrowOpen(true);
  };

  return (
    <div>
      <BackHeader title="مركز الخدمات الطلابية" subtitle="مكتبة ذكية · استعارة · طباعة سحابية" accent="🎓 Student Hub" />

      {/* Hero */}
      <section className="rounded-[1.75rem] p-5 shadow-tile" style={{ background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.accent})` }}>
        <span className="text-[10px] font-bold text-white/90">جامعتك · مدرستك · مكتبك</span>
        <h2 className="mt-1 font-display text-2xl font-extrabold text-white text-balance">
          كل ما يحتاجه طالبك<br />في مكان واحد
        </h2>
        <p className="mt-1 text-xs text-white/80">قرطاسية · كتب · استعارة · طباعة · حزم متخصصة</p>
      </section>

      {/* Tri-Navigation Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mt-4">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl p-1.5" style={{ background: PALETTE.primarySoft }}>
          <TabsTrigger value="store" className="flex flex-col gap-1 rounded-xl py-2.5 text-[11px] font-extrabold data-[state=active]:shadow-soft" style={{ color: tab === "store" ? PALETTE.primary : PALETTE.ink }}>
            <ShoppingBag className="h-4 w-4" /><span>🛍️ المتجر</span>
          </TabsTrigger>
          <TabsTrigger value="borrow" className="flex flex-col gap-1 rounded-xl py-2.5 text-[11px] font-extrabold data-[state=active]:shadow-soft" style={{ color: tab === "borrow" ? PALETTE.primary : PALETTE.ink }}>
            <Library className="h-4 w-4" /><span>📚 الاستعارة</span>
          </TabsTrigger>
          <TabsTrigger value="print" className="flex flex-col gap-1 rounded-xl py-2.5 text-[11px] font-extrabold data-[state=active]:shadow-soft" style={{ color: tab === "print" ? PALETTE.primary : PALETTE.ink }}>
            <Printer className="h-4 w-4" /><span>🖨️ الطباعة</span>
          </TabsTrigger>
        </TabsList>

        {/* ---------- STORE TAB ---------- */}
        <TabsContent value="store" className="mt-4 space-y-5">
          {/* Bundles section */}
          <section>
            <div className="mb-2 flex items-center gap-2 px-1">
              <Sparkles className="h-4 w-4" style={{ color: PALETTE.primary }} />
              <h3 className="font-display text-base font-extrabold">حزم طلابية ذكية</h3>
            </div>
            <BundlesGrid />
          </section>

          {/* Products */}
          <section>
            <h3 className="mb-2 px-1 font-display text-base font-extrabold">قرطاسية وكتب</h3>
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        </TabsContent>

        {/* ---------- BORROW TAB ---------- */}
        <TabsContent value="borrow" className="mt-4 space-y-4">
          {/* KYC status banner */}
          <div className="flex items-center gap-3 rounded-2xl p-3 shadow-soft" style={{ background: isVerified ? "#E8F8EF" : PALETTE.primarySoft }}>
            {isVerified ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Lock className="h-5 w-5" style={{ color: PALETTE.primary }} />}
            <div className="flex-1">
              <p className="font-display text-sm font-extrabold">{isVerified ? "حسابك موثق ✓" : "تحتاج إلى توثيق الهوية"}</p>
              <p className="text-[11px] text-muted-foreground">{isVerified ? "يمكنك استعارة أي كتاب الآن" : "وثّق هويتك مرة واحدة لتفعيل الاستعارة"}</p>
            </div>
            {!isVerified && (
              <button onClick={() => setKycOpen(true)} className="rounded-full px-3 py-1.5 text-xs font-extrabold text-white" style={{ background: PALETTE.primary }}>وثّق</button>
            )}
          </div>

          <div className="rounded-2xl bg-card p-3 text-[11px] leading-relaxed text-muted-foreground shadow-soft">
            <p className="mb-1 font-extrabold text-foreground">كيف يعمل النظام؟</p>
            <ul className="space-y-1">
              <li>• اختر مدة الاستعارة (3 أيام / أسبوع / أسبوعين).</li>
              <li>• ادفع سعر الاستعارة + تأمين مسترد بقيمة الكتاب.</li>
              <li>• أرجع الكتاب بحالة جيدة → يُسترد التأمين كاملاً للمحفظة.</li>
              <li>• غرامة التأخير: 5 ج.م/يوم تُخصم من التأمين.</li>
            </ul>
          </div>

          <div className="space-y-2">
            {products.filter((p) => p.category === "قصص" || p.subCategory === "كشاكيل").map((p) => (
              <BorrowCard key={p.id} product={p} onBorrow={onBorrowClick} />
            ))}
          </div>
        </TabsContent>

        {/* ---------- PRINT TAB ---------- */}
        <TabsContent value="print" className="mt-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl p-3 shadow-soft" style={{ background: PALETTE.primarySoft }}>
            <FileText className="h-5 w-5" style={{ color: PALETTE.primary }} />
            <div className="flex-1">
              <p className="font-display text-sm font-extrabold">مركز الطباعة السحابية</p>
              <p className="text-[11px] text-muted-foreground">ارفع · اختر · ادفع · استلم</p>
            </div>
          </div>
          <PrintWizard />
        </TabsContent>
      </Tabs>

      <KYCGateDialog open={kycOpen} onOpenChange={setKycOpen} />
      <BorrowSheet product={borrowProduct} open={borrowOpen} onOpenChange={setBorrowOpen} />

      <div className="h-24" />
    </div>
  );
};

export default SchoolLibrary;
