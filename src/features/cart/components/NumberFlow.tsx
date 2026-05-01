import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { toLatin } from "@/lib/format";
import { useProductsVersion } from "@/lib/products";

/**
 * Animated tabular number used for prices/totals across the cart.
 * Subscribes to product version so prices re-animate when the catalog
 * is refreshed without a full re-render.
 */
export const NumberFlow = ({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) => {
  const _pv = useProductsVersion();
  const mv = useMotionValue(value);
  const display = useTransform(mv, (v) => toLatin(Math.round(v)));
  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [value, mv]);
  return <motion.span className={`tabular-nums ${className}`}>{display}</motion.span>;
};
