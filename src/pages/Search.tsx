import { useSearch, useNavigate, Link } from "@tanstack/react-router";
import { Search as SearchIcon, X, PackageSearch } from "lucide-react";
import { useMemo } from "react";
import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import BackHeader from "@/components/BackHeader";
import { toLatin } from "@/lib/format";

const SearchPage = () => {
  const { q } = useSearch({ from: "/_app/search" });
  const navigate = useNavigate();

  const setQuery = (val: string) => {
    navigate({ to: "/search", search: { q: val }, replace: true });
  };

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as { category: string; items: typeof products }[];
    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.subCategory ?? "").toLowerCase().includes(term) ||
        (p.brand ?? "").toLowerCase().includes(term),
    );
    const map = new Map<string, typeof products>();
    for (const p of matches) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [q]);

  const total = grouped.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="space-y-5">
      <BackHeader title="ابحث" subtitle={q ? `${toLatin(total)} نتيجة` : "اكتب اسم منتج أو قسم"} />

      <div className="glass-strong sticky top-2 z-10 flex items-center gap-2 rounded-2xl px-4 py-3 shadow-soft">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن منتج، علامة، قسم…"
          className="flex-1 bg-transparent text-sm outline-none"
        />
        {q && (
          <button onClick={() => setQuery("")} aria-label="مسح" className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/5">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!q && (
        <div className="space-y-3">
          <p className="px-1 text-xs font-bold text-muted-foreground">اقتراحات شائعة</p>
          <div className="flex flex-wrap gap-2">
            {["دجاج", "حليب", "أرز", "خضار", "زيت زيتون", "عصير", "قهوة"].map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="rounded-full bg-foreground/5 px-4 py-2 text-xs font-bold">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {q && total === 0 && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft">
            <PackageSearch className="h-10 w-10 text-primary" strokeWidth={2} />
          </div>
          <h2 className="font-display text-xl font-extrabold">لا نتائج</h2>
          <p className="text-sm text-muted-foreground">جرّب كلمة بحث أخرى أو تصفّح الأقسام</p>
          <Link to="/sections" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pill">تصفّح الأقسام</Link>
        </div>
      )}

      {grouped.map((g) => (
        <section key={g.category}>
          <h3 className="mb-3 px-1 font-display text-base font-extrabold">{g.category}</h3>
          <div className="grid grid-cols-2 gap-3">
            {g.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SearchPage;