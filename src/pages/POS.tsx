import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { fmtMoney } from "@/lib/format";
import { ShieldAlert, Search, Plus, Minus, Trash2, Wallet, QrCode, Loader2, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";

type Product = { id: string; name: string; price: number; stock: number; barcode?: string | null };
type Line = { id: string; name: string; price: number; qty: number };

export default function POSPage() {
  const { role, loading } = useUserRole();
  const allowed = role === "cashier" || role === "branch_manager" || role === "admin";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<Line[]>([]);
  const [session, setSession] = useState<{ id: string; opened_at: string } | null>(null);
  const [openingFloat, setOpeningFloat] = useState("0");
  const [walletPhone, setWalletPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // load active session
  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("cashier_sessions")
        .select("id, opened_at")
        .eq("cashier_id", user.id)
        .is("closed_at", null)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setSession({ id: data.id, opened_at: data.opened_at });
    })();
  }, [allowed]);

  // search products (barcode or name)
  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, price, stock")
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,id.ilike.%${query}%`)
        .limit(12);
      setResults((data ?? []) as unknown as Product[]);
      setSearching(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);

  const add = (p: Product) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.id === p.id);
      if (i >= 0) { const next = [...prev]; next[i] = { ...next[i], qty: next[i].qty + 1 }; return next; }
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
    setQuery(""); setResults([]); inputRef.current?.focus();
  };
  const inc = (id: string) => setCart((p) => p.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l));
  const dec = (id: string) => setCart((p) => p.flatMap((l) => l.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l]));
  const remove = (id: string) => setCart((p) => p.filter((l) => l.id !== id));

  const openSession = async () => {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("غير مسجل دخول");
      const { data, error } = await supabase
        .from("cashier_sessions")
        .insert({ cashier_id: user.id, opening_float: Number(openingFloat) || 0 })
        .select("id, opened_at").single();
      if (error) throw error;
      setSession({ id: data.id, opened_at: data.opened_at });
      toast.success("تم فتح الورديّة");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const closeSession = async () => {
    if (!session) return;
    setBusy(true);
    try {
      await supabase.from("cashier_sessions")
        .update({ closed_at: new Date().toISOString() })
        .eq("id", session.id);
      setSession(null);
      toast.success("تم إغلاق الورديّة");
    } finally { setBusy(false); }
  };

  const checkout = async (mode: "cash" | "wallet") => {
    if (cart.length === 0) { toast.error("السلة فارغة"); return; }
    if (!session) { toast.error("افتح الورديّة أولاً"); return; }
    setBusy(true);
    try {
      if (mode === "wallet") {
        if (!walletPhone) { toast.error("أدخل رقم محفظة العميل"); return; }
        const { data, error } = await supabase.rpc("wallet_transfer", {
          _recipient_phone: walletPhone, _amount: -total,
          _note: `بيع POS — ${cart.length} صنف`,
        });
        if (error) throw error;
        if (!data) throw new Error("فشل الخصم من المحفظة");
      }
      // record pseudo-sale on cashier session aggregate
      await supabase.from("cashier_sessions")
        .update({
          total_sales: total + (await getSessionTotal(session.id)),
          total_orders: (await getSessionOrders(session.id)) + 1,
        })
        .eq("id", session.id);
      toast.success(`تم البيع — ${fmtMoney(total)}`);
      setCart([]); setWalletPhone("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!allowed) return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div><ShieldAlert className="mx-auto h-12 w-12 text-destructive" /><p className="mt-3 font-bold">صلاحية الكاشير مطلوبة</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold">نقطة البيع</h1>
        {session ? (
          <button onClick={closeSession} disabled={busy} className="rounded-full bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive">
            <LogOut className="me-1 inline h-4 w-4" /> إغلاق الورديّة
          </button>
        ) : null}
      </header>

      {!session ? (
        <div className="rounded-3xl border border-border bg-card p-5">
          <p className="font-bold">افتح ورديّتك للبدء</p>
          <label className="mt-3 block text-xs text-muted-foreground">رصيد افتتاح الصندوق (ج.م)</label>
          <input value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)}
            inputMode="decimal" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-lg font-bold" />
          <button onClick={openSession} disabled={busy} className="mt-4 w-full rounded-full bg-primary py-3 font-display font-extrabold text-primary-foreground">
            <LogIn className="me-1 inline h-4 w-4" /> فتح الورديّة
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 rounded-2xl bg-primary-soft px-4 py-2 text-xs font-bold">
            ورديّة مفتوحة منذ {new Date(session.opened_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto h-5 w-5 text-muted-foreground" />
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
              autoFocus placeholder="ابحث بالباركود أو الاسم..." dir="auto"
              className="w-full rounded-2xl border-2 border-border bg-card py-4 pe-11 ps-4 text-lg font-bold outline-none focus:border-primary" />
          </div>

          {results.length > 0 && (
            <div className="mt-2 grid gap-2">
              {results.map((p) => (
                <button key={p.id} onClick={() => add(p)}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-right active:scale-[0.99]">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">المخزون: {p.stock}</p>
                  </div>
                  <span className="font-display text-lg font-extrabold text-primary">{fmtMoney(p.price)}</span>
                </button>
              ))}
            </div>
          )}
          {searching && <p className="mt-2 text-center text-xs text-muted-foreground">جاري البحث...</p>}

          {cart.length > 0 && (
            <section className="mt-5 space-y-2">
              <h2 className="font-bold">السلة ({cart.length})</h2>
              {cart.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
                  <div className="flex-1">
                    <p className="font-bold">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{fmtMoney(l.price)} × {l.qty} = {fmtMoney(l.price * l.qty)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => dec(l.id)} className="grid h-9 w-9 place-items-center rounded-full bg-muted"><Minus className="h-4 w-4" /></button>
                    <span className="min-w-8 text-center font-bold">{l.qty}</span>
                    <button onClick={() => inc(l.id)} className="grid h-9 w-9 place-items-center rounded-full bg-muted"><Plus className="h-4 w-4" /></button>
                    <button onClick={() => remove(l.id)} className="grid h-9 w-9 place-items-center rounded-full bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
            <div className="mx-auto max-w-md">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الإجمالي</span>
                <span className="font-display text-2xl font-extrabold text-primary">{fmtMoney(total)}</span>
              </div>
              <div className="mb-2 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <input value={walletPhone} onChange={(e) => setWalletPhone(e.target.value)}
                  placeholder="هاتف محفظة العميل (اختياري)" dir="ltr"
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => checkout("cash")} disabled={busy || cart.length === 0}
                  className="rounded-full bg-primary py-3 font-display font-extrabold text-primary-foreground disabled:opacity-50">نقدي</button>
                <button onClick={() => checkout("wallet")} disabled={busy || cart.length === 0 || !walletPhone}
                  className="rounded-full bg-accent py-3 font-display font-extrabold text-accent-foreground disabled:opacity-50">
                  <Wallet className="me-1 inline h-4 w-4" /> محفظة
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

async function getSessionTotal(id: string): Promise<number> {
  const { data } = await supabase.from("cashier_sessions").select("total_sales").eq("id", id).maybeSingle();
  return Number(data?.total_sales ?? 0);
}
async function getSessionOrders(id: string): Promise<number> {
  const { data } = await supabase.from("cashier_sessions").select("total_orders").eq("id", id).maybeSingle();
  return Number(data?.total_orders ?? 0);
}
