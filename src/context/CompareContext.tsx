import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CompareItem = {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  oldPrice?: number;
  unit: string;
  rating: number;
  reviews: number;
  category: string;
  fulfillment: "instant" | "preorder";
  etaDays?: number;
  warranty?: string;
  badges: string[];
  tagline: string;
};

type CompareCtx = {
  items: CompareItem[];
  ids: string[];
  has: (id: string) => boolean;
  toggle: (item: CompareItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  max: number;
};

const Ctx = createContext<CompareCtx | null>(null);
const KEY = "reef-compare-v1";
const MAX = 4;

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<CompareCtx>(() => {
    const ids = items.map((i) => i.id);
    return {
      items,
      ids,
      max: MAX,
      has: (id: string) => ids.includes(id),
      toggle: (item: CompareItem) => {
        setItems((prev) => {
          const exists = prev.some((p) => p.id === item.id);
          if (exists) return prev.filter((p) => p.id !== item.id);
          if (prev.length >= MAX) return prev;
          return [...prev, item];
        });
      },
      remove: (id: string) =>
        setItems((prev) => prev.filter((p) => p.id !== id)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useCompare = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCompare must be used within CompareProvider");
  return v;
};
