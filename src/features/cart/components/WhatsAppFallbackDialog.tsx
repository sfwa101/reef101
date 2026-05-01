import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Copy, ExternalLink, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { copyTextToClipboard, buildWaUrl, normalizeWaPhone } from "@/lib/whatsapp";

export type WaFallbackPayload = {
  phone: string;
  text: string;
  orderId?: string;
  total?: number;
};

type Props = {
  open: boolean;
  payload: WaFallbackPayload | null;
  onClose: () => void;
};

/**
 * Shown when `window.open` to WhatsApp is blocked by the browser.
 * Lets the user copy the order text and open WhatsApp manually with one tap.
 */
export const WhatsAppFallbackDialog = ({ open, payload, onClose }: Props) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  if (!payload) return null;

  const phone = normalizeWaPhone(payload.phone);
  const url = buildWaUrl(payload);

  const onCopy = async () => {
    const ok = await copyTextToClipboard(payload.text);
    if (ok) {
      setCopied(true);
      toast.success("تم نسخ نص الطلب 📋");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("تعذر النسخ — يمكنك تحديد النص ونسخه يدويًا");
    }
  };

  const onConfirmSent = () => {
    const id = payload.orderId ?? "";
    const total = payload.total ?? 0;
    onClose();
    navigate({ to: "/order-success", search: { id, total } });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 px-3 pb-3 pt-10 sm:items-center sm:pb-10"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="w-full max-w-md rounded-3xl bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[14px] font-extrabold">إرسال الطلب عبر واتساب</div>
                  <div className="text-[11.5px] text-muted-foreground">
                    منع المتصفح فتح واتساب تلقائيًا — تابع يدويًا 👇
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-foreground/5"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {phone && (
              <div className="mb-2 rounded-2xl bg-foreground/5 px-3 py-2 text-[12px]">
                <span className="text-muted-foreground">الرقم: </span>
                <span className="font-bold tracking-wider" dir="ltr">
                  +{phone}
                </span>
              </div>
            )}

            <pre
              className="max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl border border-border/60 bg-background p-3 text-[11.5px] leading-relaxed"
              dir="rtl"
            >
              {payload.text}
            </pre>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={onCopy}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background px-3 py-2.5 text-[12.5px] font-bold transition active:scale-[0.97]"
              >
                <Copy className="h-4 w-4" />
                {copied ? "تم النسخ ✓" : "نسخ نص الطلب"}
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => console.log("[wa] manual fallback link clicked", { url })}
                className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2.5 text-[12.5px] font-extrabold text-primary-foreground transition active:scale-[0.97]"
              >
                <ExternalLink className="h-4 w-4" />
                فتح واتساب
              </a>
            </div>
            <button
              onClick={onConfirmSent}
              className="mt-2 w-full rounded-2xl bg-foreground px-3 py-2.5 text-[12.5px] font-extrabold text-background transition active:scale-[0.97]"
            >
              تم الإرسال، انتقل لصفحة التأكيد
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
