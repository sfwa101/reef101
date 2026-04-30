// Hakim AI - Interactive Chat with Deep Financial + Shariah Context
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { session_id, message, period_from, period_to } = body as {
      session_id?: string;
      message: string;
      period_from?: string;
      period_to?: string;
    };

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "missing_message" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const PUBLISHABLE_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1) Get authoritative deep report (RPC enforces role check as caller)
    const { data: report, error: repErr } = await userClient.rpc("hakim_deep_report", {
      _from: period_from ?? null,
      _to: period_to ?? null,
    });
    if (repErr) {
      return new Response(JSON.stringify({ error: repErr.message }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Get current user
    const { data: userRes } = await userClient.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Ensure session
    let sid = session_id;
    if (!sid) {
      const { data: ses } = await admin.from("hakim_chat_sessions")
        .insert({ user_id: userId, title: message.slice(0, 60) }).select().single();
      sid = ses?.id;
    }

    // 4) Save user message
    await admin.from("hakim_chat_messages").insert({ session_id: sid, role: "user", content: message });

    // 5) Load history
    const { data: hist } = await admin.from("hakim_chat_messages")
      .select("role, content").eq("session_id", sid).order("created_at", { ascending: true }).limit(30);

    const systemPrompt = `أنت "حكيم" — المستشار المالي والشرعي الذكي لشركة "ريف المدينة" المتخصصة في المنتجات الطبيعية.

دورك:
1. تحليل الأداء المالي بعمق (مبيعات، أرباح، خسائر، مصروفات، التزامات).
2. تشخيص نقاط القوة والضعف في كل قسم/فئة.
3. اقتراح خطط نمو واضحة بهدف الوصول إلى مبيعات مليارية.
4. مراجعة شرعية: حساب الزكاة (2.5% عروض التجارة)، ورصد أي شبهة ربا (فوائد بنكية، غرامات تأخير، زيادة سعرية مقابل التأجيل).
5. الإجابة بالعربية، بلهجة احترافية موجزة، مع أرقام دقيقة وتوصيات قابلة للتنفيذ فوراً.

عند تقديم الرؤى:
- استخدم Markdown منظم (## عناوين، - نقاط، **خط عريض** للأرقام).
- ابدأ بـ "ملخص تنفيذي" ثم اقسم: نقاط القوة، نقاط الضعف، الالتزامات، المراجعة الشرعية، خطة النمو.
- لا تخترع أرقاماً — استخدم فقط البيانات المُرسلة.

البيانات الفعلية للفترة المختارة:
${JSON.stringify(report, null, 2)}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(hist || []).map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // 6) Stream from Lovable AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        stream: true,
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited", session_id: sid }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "credits_exhausted", session_id: sid }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok || !aiRes.body) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7) Pipe SSE through, collect content for persistence
    let fullText = "";
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader();
        const decoder = new TextDecoder();
        const enc = new TextEncoder();
        let buf = "";

        // First chunk: send session_id metadata
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ meta: { session_id: sid } })}\n\n`));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let idx;
            while ((idx = buf.indexOf("\n")) !== -1) {
              const line = buf.slice(0, idx).replace(/\r$/, "");
              buf = buf.slice(idx + 1);
              if (!line.startsWith("data: ")) { controller.enqueue(enc.encode(line + "\n")); continue; }
              const json = line.slice(6).trim();
              if (json === "[DONE]") { controller.enqueue(enc.encode("data: [DONE]\n\n")); continue; }
              try {
                const p = JSON.parse(json);
                const c = p.choices?.[0]?.delta?.content;
                if (c) fullText += c;
              } catch {}
              controller.enqueue(enc.encode(line + "\n\n"));
            }
          }
        } finally {
          // Persist assistant message
          if (fullText) {
            await admin.from("hakim_chat_messages")
              .insert({ session_id: sid, role: "assistant", content: fullText });
            await admin.from("hakim_chat_sessions")
              .update({ updated_at: new Date().toISOString() }).eq("id", sid);
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("hakim-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
