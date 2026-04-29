import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Phone, Users, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSCard } from "@/components/ios/IOSCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fmtNum } from "@/lib/format";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  budget_range: string | null;
  created_at: string;
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("profiles")
      .select("id,full_name,phone,birth_date,gender,budget_range,created_at")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }: { data: Customer[] | null }) => setCustomers(data ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (!customers) return null;
    if (!q.trim()) return customers;
    const t = q.trim().toLowerCase();
    return customers.filter(c =>
      (c.full_name ?? "").toLowerCase().includes(t) || (c.phone ?? "").includes(t)
    );
  }, [customers, q]);

  const stats = useMemo(() => ({
    total: customers?.length ?? 0,
    new7: customers?.filter(c => Date.now() - new Date(c.created_at).getTime() < 7 * 86400 * 1000).length ?? 0,
    withPhone: customers?.filter(c => c.phone).length ?? 0,
  }), [customers]);

  return (
    <>
      <MobileTopbar title="العملاء" />
      <div className="px-4 lg:px-6 pt-2 pb-6 max-w-4xl mx-auto">
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو الجوال"
            className="w-full bg-surface-muted rounded-2xl h-11 pr-10 pl-4 text-[14px] placeholder:text-foreground-tertiary border-0 focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l: "الإجمالي", v: stats.total, t: "text-foreground" },
            { l: "جدد 7 أيام", v: stats.new7, t: "text-info" },
            { l: "بأرقام جوال", v: stats.withPhone, t: "text-success" },
          ].map(s => (
            <div key={s.l} className="bg-surface rounded-2xl border border-border/40 p-3 text-center">
              <p className={cn("font-display text-[22px] leading-none num", s.t)}>{fmtNum(s.v)}</p>
              <p className="text-[11px] text-foreground-tertiary mt-1">{s.l}</p>
            </div>
          ))}
        </div>

        {filtered === null ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-surface-muted animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-3xl p-10 text-center border border-border/40">
            <Users className="h-10 w-10 mx-auto text-foreground-tertiary mb-3" />
            <p className="font-display text-[16px] mb-1">لا يوجد عملاء</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(c => {
              const initials = (c.full_name ?? "؟").trim().split(" ").map(w => w[0]).slice(0, 2).join("");
              return (
                <Link key={c.id} to="/admin/customers/$customerId" params={{ customerId: c.id }}>
                  <IOSCard className="active:bg-surface-muted" padded={false}>
                    <div className="flex items-center gap-3 p-3">
                      <Avatar className="h-11 w-11 border border-border/40">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[12px] font-display">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-[14.5px] font-semibold truncate">{c.full_name ?? "بدون اسم"}</p>
                        {c.phone && (
                          <p className="text-[12px] text-foreground-tertiary num inline-flex items-center gap-1 mt-0.5" dir="ltr">
                            <Phone className="h-3 w-3" />{c.phone}
                          </p>
                        )}
                      </div>
                      <ChevronLeft className="h-4 w-4 text-foreground-tertiary" />
                    </div>
                  </IOSCard>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
