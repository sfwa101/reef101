/**
 * BundlesRail — horizontal "bundles" carousel section.
 */
import { Package } from "lucide-react";

import { BUNDLES, CATALOG } from "../data";
import { BundleCard } from "./BundleCard";
import { RailHeader } from "./RailHeader";

export const BundlesRail = ({ hue }: { hue: string }) => (
  <section className="mt-5 px-4">
    <RailHeader
      icon={Package}
      title="جهّز بيتك بذكاء"
      sub="حزم مختارة بسعر أوفر عند الشراء معًا"
      hue={hue}
    />
    <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {BUNDLES.map((b) => (
        <BundleCard
          key={b.id}
          bundle={b}
          items={CATALOG.filter((p) => b.itemIds.includes(p.id))}
          hue={hue}
        />
      ))}
    </div>
  </section>
);
