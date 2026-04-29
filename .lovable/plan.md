
## Goal

Transform `/store/supermarket` from a flat single-bar list into a premium, color-coded **dual-navigation** single-page market with 7 main groups, sub-category rails, ScrollSpy in both directions, and conversion boosters (Buy-it-Again, volume discount badges, smart pairing toast).

## 1. New data taxonomy

Create `src/lib/supermarketTaxonomy.ts` — a single source of truth that maps each main group to its sub-categories and the colored theme (pastel + accent hue used for active chip background and underline).

Tree (7 main groups, exact mapping requested):

```text
1. المواد الغذائية الأساسية   (mint pastel #DDF3E4 / hue 142)
   خضار وفواكه · ألبان وأجبان · بيض · لحوم ودواجن · أسماك ومأكولات بحرية ·
   خبز ومخبوزات · أرز ومكرونة ودقيق · معلبات ومحفوظات · بهارات وصلصات ·
   سناكات وحلويات
2. المشروبات                 (aqua pastel #DCEEF5 / hue 198)
   مياه · عصائر · غازية · شاي · قهوة
3. النظافة الشخصية            (lavender pastel #E8E4F5 / hue 262)
   صابون · شامبو · معجون أسنان · فرشاة أسنان · مزيل عرق · مناديل ورقية · حلاقة
4. التنظيف والمنزل            (sky pastel #DDEAF7 / hue 212)
   جلي · غسيل · أرضيات · أكياس قمامة · إسفنج · مناديل مطبخ · ورق تواليت
5. مستلزمات الأطفال           (rose pastel #FADCE6 / hue 340)
   حفاضات · مناديل مبللة · حليب أطفال · أغذية أطفال
6. الصحة البسيطة              (peach pastel #FCE3D2 / hue 22)
   فيتامينات · مسكنات · لاصقات جروح · مطهرات
7. مستلزمات يومية إضافية      (sand pastel #F2EAD3 / hue 44)
   بطاريات · أكياس حفظ طعام · ألمنيوم · أدوات مطبخ صغيرة
```

Each entry: `{ id, name, color: { tint, hue, fg }, subs: [{ id, name, match: (p)=>boolean }] }`.

Matching uses existing `product.subCategory` first, then keyword fallback on `product.name` (e.g. مياه/water, شامبو, حفاض, بطارية…) so the existing seeded products wire up without DB changes. Products that don't match any sub fall into a per-group `أخرى` bucket (rendered only if non-empty).

## 2. New `DualNavStore` component

Create `src/components/store/DualNavStore.tsx` (a Supermarket-specific replacement for `SinglePageStore`). It owns:

- Main rail (sticky top, height 44, full width) — 7 colored chips. Active chip uses its group `tint` background + `hsl(hue)` text; underline indicator removed here (lives on the sub rail).
- Sub rail (sticky directly under main rail, height 40) — chips for the active group's sub-categories. Active sub chip shows a 3px bottom underline in the group's `hsl(hue)`. Soft `shadow-[0_8px_18px_-12px_rgba(0,0,0,0.18)]` under the second rail to detach it from product grid.
- Margin-top spacer (`pt-3`) below the global TopBar so the sticky header sits with breathing room.
- Scroll-spy: a single `IntersectionObserver` watching every sub-section. The active sub determines both bars (group derived from sub). Clicking a chip uses `scrollTo` with offset = `HEADER_OFFSET + 44 + 40 + 8`.
- Renders a long single page: for each group → group title; for each sub with items → `<h3>` + responsive 2-col `ProductCard` grid.

Layout offsets (constants in component):
```text
HEADER_OFFSET = 56
MAIN_BAR = 44
SUB_BAR  = 40
TOTAL_STICKY = 140 (used for scrollMarginTop & jumpTo)
```

## 3. Conversion rails injected at the top of the page

Above the first group section (rendered by `DualNavStore` via an `intro` slot):

1. **اشتريتها سابقاً** — horizontal carousel using `buyAgainProducts(supermarketPool, 12)` from `src/lib/buyAgain.ts`. Authenticated users additionally fetch the last 30 `order_items` rows for `auth.uid()` and merge product ids before calling `buyAgainProducts` — guests still see the localStorage list. Hidden if empty.
2. **عروض الكمية** — auto-generated from products tagged as bulk-friendly (paper, water, diapers, tissues, bags). New helper `volumeDealFor(product)` returns `{ buy: 3, save: 15 }` when `product.id` matches a small allow-list or when `subCategory ∈ {مياه, مناديل, حفاضات, ورق تواليت}`. Used both as a horizontal "خصم الكميات" carousel and as a small `Badge` overlay on the matching `ProductCard`.

## 4. Smart Pairing toast (cross-sell)

Create `src/lib/smartPairs.ts` exporting a map `{ "pasta": "tomato-sauce", "bread": "butter", "rice": "oil", "coffee": "milk", … }` (8–10 pairs from existing seeded products). Hook into Supermarket page only via a `useEffect` watching `cart.lines` length and the most-recent line id (kept in a ref). When a new line is added and a pair exists and the partner isn't already in cart:

```text
sonner toast: "لا تنسَ صلصة الطماطم!"
action button: "أضف بـ 25 ج.م"  → cart.add(partner)
duration 5000ms
```

No global wiring — only mounted inside the Supermarket page so other stores aren't affected.

## 5. ProductCard — small, additive tweaks

Already morphs `+` into `+ qty −` capsule (good — keep). Two minor additions guarded so no other store regresses:

- Accept optional `volumeBadge?: { buy: number; save: number }` prop. When set, render a small chip at `right-2 bottom-12`: `اشترِ {buy} ووفر {save} ج.م`. `DualNavStore` passes it from `volumeDealFor(p)`.
- No other visual changes; modal/unit emphasis is already handled in `ProductDetail.tsx` and not in scope.

## 6. Page wiring

`src/pages/store/Supermarket.tsx` becomes:

```text
<DualNavStore
  themeKey="supermarket"
  title="السوبرماركت"
  subtitle="كل ما تحتاجه يوميًا"
  taxonomy={supermarketTaxonomy}
  products={products.filter(...supermarket pool)}
  intro={<><BuyItAgainRail/><VolumeDealsRail/></>}
/>
<SmartPairingWatcher />
```

## 7. Files

Create:
- `src/lib/supermarketTaxonomy.ts`
- `src/lib/volumeDeals.ts`
- `src/lib/smartPairs.ts`
- `src/components/store/DualNavStore.tsx`
- `src/components/store/BuyItAgainRail.tsx`
- `src/components/store/VolumeDealsRail.tsx`
- `src/components/store/SmartPairingWatcher.tsx`

Edit:
- `src/pages/store/Supermarket.tsx` — swap to `DualNavStore` + intros + watcher.
- `src/components/ProductCard.tsx` — add optional `volumeBadge` prop (purely additive, default off).

Untouched: `SinglePageStore.tsx` (still used by Dairy/Produce/Meat/etc.), routes, schema, other stores.

## Out of scope (explicit)

- No DB migrations — taxonomy is derived from existing `category`/`subCategory`/keyword fallback so the 100+ seeded products map immediately. We can promote it to a real `categories` table later.
- ProductDetail unit emphasis is already prominent; not retouching here.
- Other store pages keep the current single-bar layout.
