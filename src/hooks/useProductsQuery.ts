// TanStack Query layer over the products catalog.
// ----------------------------------------------------
// The legacy in-memory cache in `src/lib/products.ts` already handles
// realtime updates and synchronous reads for ~50 existing call sites.
// This hook adds Stale-While-Revalidate semantics + Suspense-friendly
// usage for new callers (loaders, route components) without disturbing
// the existing cache plumbing.
//
// Both layers share the same `fetchAllProducts` -> Supabase pipeline,
// so there is no double-fetch.

import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  ensureProductsLoaded,
  type Product,
  type ProductSource,
} from "@/lib/products";

const STALE_MS = 60_000; // 1 min — realtime channel handles live invalidation
const GC_MS = 5 * 60_000; // 5 min — keep cache for back-nav

export const productsQueryOptions = () =>
  queryOptions({
    queryKey: ["catalog", "products"] as const,
    queryFn: (): Promise<Product[]> => ensureProductsLoaded(),
    staleTime: STALE_MS,
    gcTime: GC_MS,
  });

/** SWR-cached full catalog. Falls back to static seed on network failure
 *  via the underlying `ensureProductsLoaded`. */
export function useProductsQuery() {
  return useQuery(productsQueryOptions());
}

/** SWR-cached subset filtered by storefront source. */
export function useProductsBySourceQuery(source: ProductSource) {
  return useQuery({
    ...productsQueryOptions(),
    select: (all) => all.filter((p) => p.source === source),
  });
}

/** SWR-cached single product lookup by id. */
export function useProductQuery(id: string | undefined) {
  return useQuery({
    ...productsQueryOptions(),
    enabled: Boolean(id),
    select: (all) => (id ? all.find((p) => p.id === id) : undefined),
  });
}
