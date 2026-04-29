import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  options: string[];
  intervalMs?: number;
  className?: string;
};

/**
 * Cycles through a list of placeholder strings with a smooth fade.
 * Used inside the home search bar to suggest what users can search for.
 */
const RotatingPlaceholder = ({ options, intervalMs = 2800, className }: Props) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (options.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % options.length), intervalMs);
    return () => clearInterval(t);
  }, [options.length, intervalMs]);

  return (
    <span className={`relative inline-block min-h-[1.2em] overflow-hidden ${className ?? ""}`}>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="block"
        >
          {options[idx]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default RotatingPlaceholder;