import { Wallet as WalletIcon, Plus, ArrowDownRight, ArrowUpRight, Gift, CreditCard } from "lucide-react";

const transactions = [
  { id: 1, label: "طلب مطبخ ريف", amount: -145, date: "اليوم · 14:20", icon: ArrowUpRight, neg: true },
  { id: 2, label: "كاش باك من العضوية", amount: 25, date: "أمس", icon: ArrowDownRight, neg: false },
  { id: 3, label: "طلب السوبرماركت", amount: -312, date: "أمس", icon: ArrowUpRight, neg: true },
  { id: 4, label: "شحن المحفظة", amount: 500, date: "قبل ٣ أيام", icon: ArrowDownRight, neg: false },
  { id: 5, label: "خصم وصفات الشيف", amount: 45, date: "هذا الأسبوع", icon: Gift, neg: false },
];

const Wallet = () => (
  <div className="space-y-6">
    <section>
      <h1 className="font-display text-3xl font-extrabold">المحفظة</h1>
      <p className="mt-1 text-xs text-muted-foreground">رصيد، عمليات، ومكافآت</p>
    </section>
    <section className="relative overflow-hidden rounded-[1.75rem] p-6 shadow-tile" style={{ background: "linear-gradient(135deg, hsl(150 40% 22%), hsl(140 30% 35%) 60%, hsl(45 70% 55%))" }}>
      <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-accent/40 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WalletIcon className="h-4 w-4 text-white" />
            <span className="text-xs font-bold text-white/85">الرصيد المتاح</span>
          </div>
          <CreditCard className="h-5 w-5 text-white/70" />
        </div>
        <p className="mt-3 font-display text-4xl font-extrabold text-white">٧٢٥ <span className="text-base font-medium text-white/70">ج.م</span></p>
        <p className="mt-1 text-[11px] text-white/80">يضاف ١٢ ج.م كاش باك من طلبك الأخير</p>
        <div className="mt-5 flex gap-2">
          <button className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-xs font-bold text-foreground"><Plus className="h-3.5 w-3.5" /> شحن</button>
          <button className="flex-1 rounded-full bg-white/15 py-2.5 text-xs font-bold text-white backdrop-blur">تحويل</button>
        </div>
      </div>
    </section>
    <section className="grid grid-cols-3 gap-3">
      {[{ label: "نقاط ريف", value: "٢٤٨" }, { label: "كوبوناتي", value: "٣" }, { label: "كاش باك", value: "٤٢ ج" }].map((p) => (
        <div key={p.label} className="glass-strong rounded-2xl p-3 text-center shadow-soft">
          <p className="font-display text-xl font-extrabold text-primary">{p.value}</p>
          <p className="text-[10px] text-muted-foreground">{p.label}</p>
        </div>
      ))}
    </section>
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-xl font-extrabold">آخر العمليات</h2>
        <button className="text-xs font-bold text-primary">عرض الكل</button>
      </div>
      <div className="glass-strong divide-y divide-border rounded-2xl shadow-soft">
        {transactions.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.neg ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                <Icon className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.date}</p>
              </div>
              <span className={`font-display font-extrabold ${t.neg ? "text-destructive" : "text-primary"}`}>{t.neg ? "" : "+"}{t.amount} ج.م</span>
            </div>
          );
        })}
      </div>
    </section>
  </div>
);
export default Wallet;
