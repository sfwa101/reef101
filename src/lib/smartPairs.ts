import type { Product } from "./products";
import { products } from "./products";

const PAIRS: Record<string, { partnerId: string; copy: string }> = {
  pasta: { partnerId: "oil", copy: "لا تنسَ زيت الزيتون لمكرونتك!" },
  rice: { partnerId: "oil", copy: "زيت زيتون فاخر يكمّل أرزك" },
  bread: { partnerId: "butter", copy: "زبدة طازجة مع الخبز؟" },
  coffee: { partnerId: "milk", copy: "حليب طازج لقهوتك الصباحية" },
  cereal: { partnerId: "milk", copy: "حليب يكمّل وجبة الإفطار" },
  banana: { partnerId: "yogurt", copy: "زبادي يوناني مع الموز — مزيج صحي" },
  beef: { partnerId: "rice", copy: "أضف الأرز البسمتي للوجبة" },
  "chicken-raw": { partnerId: "rice", copy: "أرز بسمتي يكمّل الدجاج" },
  diapers: { partnerId: "shampoo", copy: "شامبو لطيف للأطفال" },
  shampoo: { partnerId: "diapers", copy: "هل تحتاج حفاضات أيضاً؟" },
};

export type Pairing = { partner: Product; copy: string };

export const pairFor = (productId: string): Pairing | null => {
  const entry = PAIRS[productId];
  if (!entry) return null;
  const partner = products.find((p) => p.id === entry.partnerId);
  if (!partner) return null;
  return { partner, copy: entry.copy };
};
