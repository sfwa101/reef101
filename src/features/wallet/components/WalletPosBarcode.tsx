import { motion } from "framer-motion";
import { QrCode, ShieldCheck, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import { toLatin } from "@/lib/format";

/**
 * WalletPosBarcode — in-store payment / loyalty scan dialog.
 * Renders a one-time QR + CODE128 barcode bound to the user's customer code.
 */
export const WalletPosBarcode = ({
  onClose,
  customerCode,
  name,
  balance,
  points,
}: {
  onClose: () => void;
  customerCode: string;
  name: string;
  balance: number;
  points: number;
}) => {
  const payload = JSON.stringify({ t: "reef-pos", c: customerCode, ts: Date.now() });
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-card p-5 shadow-float ring-1 ring-border/40 sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-lg font-extrabold">الدفع في الفرع</h2>
              <p className="text-[11px] text-muted-foreground">اعرض الكود للكاشير لكسب نقاطك</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border/40">
          <div className="mb-3 flex items-center justify-between text-[11px]">
            <span className="font-bold text-muted-foreground">{name}</span>
            <span className="font-extrabold tabular-nums text-primary">
              {toLatin(Math.round(balance))} ج · {toLatin(points)} pt
            </span>
          </div>
          <div className="flex items-center justify-center rounded-xl bg-white p-3">
            <QRCodeSVG
              value={payload}
              size={200}
              bgColor="#ffffff"
              fgColor="#0f1f17"
              level="M"
              includeMargin={false}
            />
          </div>
          <div className="mt-4 flex flex-col items-center">
            <Barcode
              value={customerCode}
              format="CODE128"
              width={1.6}
              height={60}
              fontSize={12}
              margin={0}
              background="#ffffff"
            />
            <p className="mt-1 font-mono text-[10px] tracking-widest text-muted-foreground">
              {customerCode}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="flex-1 text-[10px] font-bold leading-relaxed text-amber-700 dark:text-amber-300">
            هذا الكود ديناميكي ويُستخدم لمرة واحدة عند الكاشير. لا تشاركه مع أي شخص خارج الفرع.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
