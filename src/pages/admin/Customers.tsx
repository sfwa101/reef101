import { useEffect, useMemo, useState } from "react";
import { Search, User, Phone, ShoppingBag, Wallet as WalletIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

type CustomerStats = {
  ordersCount: number;
  totalSpent: number;
  walletBalance: number;
  walletPoints: number;
};

export default function AdminCustomers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Record<string, CustomerStats>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: profs } = await supabase
        .from("profiles").select("*")
        .order("created_at", { ascending: false }).limit(500);
      const list = (profs ?? []) as Profile[];
      setProfiles(list);

      // fetch orders + wallets in bulk
      const ids = list.map((p) => p.id);
      if (ids.length > 0) {
        const [{ data: orders }, { data: wallets }] = await Promise.all([
          supabase.from("orders").select("user_id,total").in("user_id", ids),
          supabase.from("wallet_balances").select("user_id,balance,points").in("user_id", ids),
        ]);
        const map: Record<string, CustomerStats> = {};
        ids.forEach((id) => {
          map[id] = { ordersCount: 0, totalSpent: 0, walletBalance: 0, walletPoints: 0 };
        });
        (orders ?? []).forEach((o: any) => {
          if (!map[o.user_id]) return;
          map[o.user_id].ordersCount += 1;
          map[o.user_id].totalSpent += Number(o.total ?? 0);
        });
        (wallets ?? []).forEach((w: any) => {
          if (!map[w.user_id]) return;
          map[w.user_id].walletBalance = Number(w.balance ?? 0);
          map[w.user_id].walletPoints = Number(w.points ?? 0);
        });
        setStats(map);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => profiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.full_name ?? "").toLowerCase().includes(q) || (p.phone ?? "").includes(q);
  }), [profiles, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">العملاء</h1>
        <p className="text-sm text-muted-foreground">{profiles.length} عميل مسجَّل</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف…"
            className="w-full rounded-2xl border border-border bg-background py-2 pe-10 ps-3 text-sm outline-none focus:border-primary" />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">جارٍ التحميل…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">لا يوجد عملاء</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">العميل</th>
                  <th className="px-4 py-3 text-start font-medium">الهاتف</th>
                  <th className="px-4 py-3 text-start font-medium">الطلبات</th>
                  <th className="px-4 py-3 text-start font-medium">إجمالي الإنفاق</th>
                  <th className="px-4 py-3 text-start font-medium">المحفظة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const s = stats[p.id] ?? { ordersCount: 0, totalSpent: 0, walletBalance: 0, walletPoints: 0 };
                  return (
                    <tr key={p.id} onClick={() => setSelected(p)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{p.full_name || "—"}</div>
                            <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ar-EG")}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                      <td className="px-4 py-3 font-semibold">{s.ordersCount}</td>
                      <td className="px-4 py-3 font-semibold">{s.totalSpent.toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.walletBalance.toFixed(2)} · {s.walletPoints} نقطة
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <CustomerDrawer profile={selected} stats={stats[selected.id]} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function CustomerDrawer({ profile, stats, onClose }: { profile: Profile; stats?: CustomerStats; onClose: () => void }) {
  const s = stats ?? { ordersCount: 0, totalSpent: 0, walletBalance: 0, walletPoints: 0 };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center lg:p-4">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 shadow-float lg:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">تفاصيل العميل</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="text-base font-bold">{profile.full_name || "—"}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />{profile.phone || "—"}
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat icon={<ShoppingBag className="h-4 w-4" />} label="الطلبات" value={s.ordersCount.toString()} />
          <Stat icon={<WalletIcon className="h-4 w-4" />} label="المحفظة" value={s.walletBalance.toFixed(2)} />
          <Stat icon={<ShoppingBag className="h-4 w-4" />} label="الإنفاق" value={s.totalSpent.toFixed(2)} />
          <Stat icon={<WalletIcon className="h-4 w-4" />} label="النقاط" value={s.walletPoints.toString()} />
        </div>
        <div className="mt-5 text-xs text-muted-foreground">
          ID: <span className="font-mono">{profile.id}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-1 text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}
