import DualNavStore from "@/components/store/DualNavStore";
import BuyItAgainRail from "@/components/store/BuyItAgainRail";
import VolumeDealsRail from "@/components/store/VolumeDealsRail";
import SmartPairingWatcher from "@/components/store/SmartPairingWatcher";
import { products } from "@/lib/products";
import { supermarketPool } from "@/lib/supermarketTaxonomy";
import { useMemo } from "react";

const Supermarket = () => {
  const pool = useMemo(() => supermarketPool(products), []);
  return (
    <>
      <DualNavStore
        themeKey="supermarket"
        title="السوبرماركت"
        subtitle="كل ما تحتاجه يوميًا"
        searchPlaceholder="ابحث في السوبرماركت…"
        products={pool}
        intro={
          <>
            <BuyItAgainRail pool={pool} />
            <VolumeDealsRail pool={pool} />
          </>
        }
      />
      <SmartPairingWatcher />
    </>
  );
};

export default Supermarket;
