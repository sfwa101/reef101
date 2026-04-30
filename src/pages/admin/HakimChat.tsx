import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, Sparkles, Send, Calendar, Plus, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; id?: string };
type Session = { id: string; title: string | null; updated_at: string };

export default function HakimChat() {
  const { hasRole, loading: rolesLoading } = useAdminRoles();
  const allowed = hasRole("admin") || hasRole("finance") || hasRole("store_manager");

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    const { data } = await (supabase as any).from("hakim_chat_sessions")
      .select("id,title,updated_at").order("updated_at", { ascending: false }).limit(20);
    setSessions((data || []) as Session[]);
  };

  const loadMessages = async (sid: string) => {
    const { data } = await (supabase as any).from("hakim_chat_messages")
      .select("id,role,content").eq("session_id", sid).order("created_at");
    setMessages((data || []) as Msg[]);
    setSessionId(sid);
  };

  useEffect(() => { if (allowed) loadSessions(); }, [allowed]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || streaming) return;
    setInput("");
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
        body: JSON.stringify({
          session_id: sessionId,
          message,
          period_from: from || null,
          period_to: to || null,
        }),
      });

      if (resp.status === 429) { toast.error("تم تجاوز الحد، حاول لاحقاً"); throw new Error("429"); }
      if (resp.status === 402) { toast.error("الرصيد منتهٍ، أضف مدفوعات"); throw new Error("402"); }
      if (!resp.ok || !resp.body) throw new Error("stream_failed");

      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let assistantSoFar = "";
      let newSid: string | null = null;

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
            if (p.meta?.session_id) { newSid = p.meta.session_id; continue; }
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

      if (newSid && newSid !== sessionId) { setSessionId(newSid); loadSessions(); }
    } catch (e: any) {
      if (!["429", "402"].includes(e?.message)) toast.error("فشل الاتصال بحكيم");
      setMessages((m) => m.slice(0, -2));
    } finally {
      setStreaming(false);
    }
  };

  const newSession = () => { setSessionId(null); setMessages([]); };

  if (rolesLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!allowed) return (<><MobileTopbar title="حكيم" /><div className="p-8 text-center" dir="rtl"><ShieldAlert className="h-12 w-12 mx-auto text-foreground-tertiary mb-3" /><p>غير متاح</p></div></>);

  const suggestions = [
    "أعطني تقريراً شاملاً عن أداء المتجر اليوم",
    "حلّل أداء كل قسم وأين الضعف وأين القوة",
    "ما خطتك لمضاعفة المبيعات هذا الشهر؟",
    "راجع المعاملات وحدد أي شبهة ربا، واحسب الزكاة المستحقة",
  ];

  return (
    <>
      <MobileTopbar title="المستشار حكيم" />
      <div className="flex h-[calc(100vh-56px)] lg:h-[calc(100vh-64px)]" dir="rtl">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-surface-muted/40 border-l border-border/40 p-3">
          <button onClick={newSession} className="bg-primary text-primary-foreground rounded-lg h-9 text-[13px] flex items-center justify-center gap-1 mb-3">
            <Plus className="h-4 w-4" /> محادثة جديدة
          </button>
          <p className="text-[10px] text-foreground-tertiary mb-1.5">السجل</p>
          <div className="flex-1 overflow-y-auto space-y-1">
            {sessions.map((s) => (
              <button key={s.id} onClick={() => loadMessages(s.id)}
                className={`w-full text-right p-2 rounded-lg text-[12px] truncate ${sessionId === s.id ? "bg-primary/15 text-primary" : "hover:bg-surface-muted"}`}>
                <MessageCircle className="h-3 w-3 inline ml-1" />
                {s.title || "بدون عنوان"}
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2 flex-wrap">
            <Calendar className="h-4 w-4 text-foreground-tertiary" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="bg-surface-muted rounded-lg h-8 px-2 text-[11px]" />
            <span className="text-[11px] text-foreground-tertiary">إلى</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="bg-surface-muted rounded-lg h-8 px-2 text-[11px]" />
            <button onClick={newSession} className="lg:hidden ml-auto text-[11px] text-primary flex items-center gap-1">
              <Plus className="h-3 w-3" /> جديد
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="max-w-md mx-auto text-center py-8">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow mx-auto flex items-center justify-center text-primary-foreground mb-3">
                  <Sparkles className="h-7 w-7" />
                </div>
                <p className="font-display text-[16px] mb-1">مرحباً، أنا حكيم</p>
                <p className="text-[12px] text-foreground-tertiary mb-4">مستشارك المالي والشرعي. اسألني عن الأداء، الأرباح، الزكاة، أو أي شبهة.</p>
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => send(s)}
                      className="w-full text-right p-2.5 rounded-xl bg-surface-muted hover:bg-surface-muted/80 text-[12px]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] lg:max-w-[75%] rounded-2xl p-3 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-muted"}`}>
                  {m.role === "assistant" && !m.content && streaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <div className="prose prose-sm max-w-none text-[13px] leading-relaxed [&_h2]:font-display [&_h2]:text-[14px] [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:font-display [&_h3]:text-[13px] [&_ul]:my-1 [&_li]:my-0.5 [&_strong]:text-primary [&_p]:my-1">
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
                className="flex-1 bg-surface-muted rounded-xl h-11 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
              <button onClick={() => send()} disabled={streaming || !input.trim()}
                className="h-11 px-4 rounded-xl bg-primary text-primary-foreground flex items-center gap-1 disabled:opacity-50">
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
