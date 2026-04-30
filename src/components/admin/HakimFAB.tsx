import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useLocation, Link } from "@tanstack/react-router";
import { Sparkles, X, Send, Loader2, Maximize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

/**
 * Omnipresent floating Hakim chat. Aware of the current admin route,
 * so it can answer "what's on this page?" style questions.
 */
export function HakimFAB() {
  const { hasRole, loading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance") || hasRole("store_manager");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const contextHint = (() => {
    if (pathname === "/admin") return "اللوحة الرئيسية";
    if (pathname.startsWith("/admin/orders")) return "صفحة الطلبات";
    if (pathname.startsWith("/admin/products")) return "صفحة المنتجات";
    if (pathname.startsWith("/admin/customers")) return "صفحة العملاء";
    if (pathname.startsWith("/admin/inventory")) return "صفحة المخزون";
    if (pathname.startsWith("/admin/finance")) return "التقارير المالية";
    if (pathname.startsWith("/admin/cfo")) return "الرؤية المالية CFO";
    return "لوحة الإدارة";
  })();

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || streaming) return;
    setInput("");
    const contextual = `[سياق المستخدم: ${contextHint} — ${pathname}]\n\n${message}`;
    setMessages((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hakim-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ session_id: sessionId, message: contextual }),
      });

      if (resp.status === 429) { toast.error("تم تجاوز الحد، حاول لاحقاً"); throw new Error("429"); }
      if (resp.status === 402) { toast.error("الرصيد منتهٍ"); throw new Error("402"); }
      if (!resp.ok || !resp.body) throw new Error("stream_failed");

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let assistantSoFar = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const p = JSON.parse(json);
            if (p.meta?.session_id) { setSessionId(p.meta.session_id); continue; }
            const c = p.choices?.[0]?.delta?.content;
            if (c) {
              assistantSoFar += c;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistantSoFar };
                return copy;
              });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e: any) {
      if (!["429", "402"].includes(e?.message)) toast.error("فشل الاتصال بحكيم");
      setMessages((m) => m.slice(0, -2));
    } finally {
      setStreaming(false);
    }
  };

  if (loading || !allowed) return null;

  const suggestions = [
    `حلّل ${contextHint} الآن`,
    "ما أعلى 3 أولويات اليوم؟",
    "أين تتسرب الأرباح؟",
  ];

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="افتح حكيم"
        className={cn(
          "fixed z-50 bottom-20 lg:bottom-6 left-4 lg:left-6",
          "h-14 w-14 rounded-full",
          "bg-gradient-to-br from-[hsl(var(--purple))] via-[hsl(var(--indigo))] to-[hsl(var(--info))]",
          "text-white shadow-[0_10px_40px_-8px_hsl(var(--purple)/0.6)]",
          "flex items-center justify-center",
          "hover:scale-105 active:scale-95 transition-transform",
          "ring-4 ring-background"
        )}
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success ring-2 ring-background animate-pulse" />
      </button>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[60]" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 lg:inset-x-auto lg:left-6 lg:bottom-6 lg:w-[420px] lg:max-h-[80vh] h-[85vh] lg:rounded-3xl rounded-t-3xl bg-card border border-border/60 shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-gradient-to-br from-[hsl(var(--purple))] via-[hsl(var(--indigo))] to-[hsl(var(--info))] p-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-[16px] leading-tight">حكيم</p>
                  <p className="text-[10.5px] opacity-80">يرافقك في {contextHint}</p>
                </div>
                <Link to="/admin/hakim-chat" className="h-8 w-8 rounded-lg hover:bg-white/15 flex items-center justify-center" onClick={() => setOpen(false)}>
                  <Maximize2 className="h-4 w-4" />
                </Link>
                <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-lg hover:bg-white/15 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {messages.length === 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[12px] text-foreground-tertiary text-center mb-3">اسألني أي شيء عن الصفحة الحالية</p>
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="w-full text-right p-2.5 rounded-xl bg-surface-muted hover:bg-muted text-[12px] transition press">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[88%] rounded-2xl p-2.5 text-[12.5px] leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-muted"}`}>
                    {m.role === "assistant" && !m.content && streaming ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div className="prose prose-sm max-w-none [&_p]:my-1 [&_h2]:font-display [&_h2]:text-[13px] [&_h2]:mt-2 [&_h2]:mb-1 [&_strong]:text-primary [&_ul]:my-1 [&_li]:my-0.5">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/40 p-2">
              <div className="flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder="اسأل حكيم..."
                  disabled={streaming}
                  className="flex-1 bg-surface-muted rounded-xl h-10 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
                <button onClick={() => send()} disabled={streaming || !input.trim()}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-50 flex items-center">
                  {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
