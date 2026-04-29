import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import BackHeader from "@/components/BackHeader";
import {
  loadSubs,
  saveSubs,
  findFrequency,
  hoursToDelivery,
  isLocked,
  LOCK_WINDOW_HOURS,
  type SubscriptionRecord,
} from "@/lib/baskets";
import { toLatin } from "@/lib/format";
import { toast } from "sonner";
import { Pause, Play, Trash2, Clock, Lock, CalendarClock, Wallet, Sparkles, ShoppingBasket } from "lucide-react";

const BasketsSubs = () => {
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);
  useEffect(() => { setSubs(loadSubs()); }, []);

  const update = (next: SubscriptionRecord[]) => { setSubs(next); saveSubs(next); };

  const togglePause = (id: string) => {
    update(subs.map((s) => s.id === id ? { ...s, paused: !s.paused } : s));
    toast.success("تم تحديث الاشتراك");
  };
  const remove = (id: string) => {
    update(subs.filter((s) => s.id !== id));
    toast.success("تم إلغاء الاشتراك");
  };
  const skipNext = (id: string) => {
    update(subs.map((s) => {
      if (s.id !== id) return s;
      const f = findFrequency(s.frequency);
      const nd = new Date(new Date(s.nextDelivery).getTime() + f.cadenceDays * 86400000).toISOString();
      return { ...s, nextDelivery: nd };
    }));
    toast.success("تم تأجيل التوصيلة القادمة");
  };

  const totalCashback = subs.reduce((acc, s) => {
    const f = findFrequency(s.frequency);
    return acc + Math.round(s.basketPrice * (f.cashbackPct / 100));
  }, 0);

  return (
    <div className="space-y-5 pb-10">
      <BackHeader title="اشتراكاتي" subtitle="تحكم كامل في توصيلات السلال" accent="متجر" themeKey="baskets" />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 p-5 text-white shadow-tile">
        <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold backdrop-blur">
              <Sparkles className="h-3 w-3" /> مرونة كاملة
            </span>
            <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight">
              {toLatin(subs.length)} اشتراك نشط
            </h2>
            <p className="text-[11px] opacity-90">أوقف، أجّل، أو ألغِ في أي وقت</p>
          </div>
          {totalCashback > 0 && (
            <div className="rounded-2xl bg-white/15 px-3 py-2 text-center backdrop-blur">
              <Wallet className="mx-auto h-4 w-4" />
              <p className="mt-1 text-[9px] font-bold opacity-90">كاشباك التوصيلة</p>
              <p className="font-display text-sm font-extrabold tabular-nums">+{toLatin(totalCashback)} ج</p>
            </div>
          )}
        </div>
      </section>

      {subs.length === 0 ? (
        <section className="space-y-3 rounded-[1.5rem] bg-card p-6 text-center ring-1 ring-border/60 shadow-soft">
          <ShoppingBasket className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="font-display text-base font-extrabold">لا توجد اشتراكات بعد</p>
          <p className="text-[11px] text-muted-foreground">
            ابدأ اشتراك سلتك المفضلة ووفّر حتى ١٥٪ على كل توصيلة + كاشباك على المحفظة
          </p>
          <Link
            to="/store/baskets"
            className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-pill"
          >
            تصفّح السلال
          </Link>
        </section>
      ) : (
        <section className="space-y-3">
          {subs.map((s) => {
            const f = findFrequency(s.frequency);
            const hrs = hoursToDelivery(s.nextDelivery);
            const days = Math.max(0, Math.ceil(hrs / 24));
            const locked = isLocked(s.nextDelivery);
            const cashback = Math.round(s.basketPrice * (f.cashbackPct / 100));
            return (
              <article
                key={s.id}
                className={`overflow-hidden rounded-[1.5rem] bg-card ring-1 transition ${
                  locked ? "ring-amber-500/60 shadow-[0_0_0_2px_rgba(245,158,11,0.15)]" : "ring-border/60 shadow-soft"
                } ${s.paused ? "opacity-70" : ""}`}
              >
                <div className="flex gap-3 p-3">
                  <img src={s.basketImage} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 font-display text-sm font-extrabold">{s.basketName}</h3>
                      {s.paused && (
                        <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-800 dark:text-amber-200">موقوف</span>
                      )}
                    </div>
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-muted-foreground">
                      <CalendarClock className="h-3 w-3" /> {f.label}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                      <span className="rounded-full bg-foreground/5 px-2 py-0.5 tabular-nums">
                        {toLatin(s.basketPrice)} ج/توصيلة
                      </span>
                      {cashback > 0 && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-700 dark:text-emerald-300 tabular-nums">
                          +{toLatin(cashback)} ج كاشباك
                        </span>
                      )}
                      {Object.keys(s.swaps ?? {}).length > 0 && (
                        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-700 dark:text-violet-300">
                          مخصصة
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Next delivery banner */}
                <div className={`flex items-center justify-between gap-2 border-t border-border/50 px-3 py-2 text-[11px] ${
                  locked ? "bg-amber-500/10 text-amber-900 dark:text-amber-200" : "bg-foreground/5 text-foreground/80"
                }`}>
                  <span className="inline-flex items-center gap-1.5 font-extrabold">
                    {locked ? <Lock className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                    {locked
                      ? `مغلق للتعديل · باقي ${toLatin(Math.max(0, hrs))} ساعة`
                      : `التوصيلة بعد ${toLatin(days)} يوم`}
                  </span>
                  <span className="opacity-80">نافذة التعديل: {toLatin(LOCK_WINDOW_HOURS)} ساعة قبل التوصيل</span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-1.5 border-t border-border/50 p-2">
                  <button
                    onClick={() => togglePause(s.id)}
                    disabled={locked}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-foreground/5 py-2 text-[11px] font-extrabold disabled:opacity-40"
                  >
                    {s.paused ? <><Play className="h-3.5 w-3.5" /> استئناف</> : <><Pause className="h-3.5 w-3.5" /> إيقاف</>}
                  </button>
                  <button
                    onClick={() => skipNext(s.id)}
                    disabled={locked}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-foreground/5 py-2 text-[11px] font-extrabold disabled:opacity-40"
                  >
                    <CalendarClock className="h-3.5 w-3.5" /> تأجيل
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 py-2 text-[11px] font-extrabold text-rose-700 dark:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> إلغاء
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default BasketsSubs;
