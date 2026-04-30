// Hakim AI - Financial Advisor
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { kind = "on_demand", days = 7, question } = await req.json().catch(() => ({}));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Authorize: must be admin/finance/store_manager (RPC enforces it)
    const { data: snapshot, error: snapErr } = await userClient.rpc("financial_snapshot", { _days: days });
    if (snapErr) {
      return new Response(JSON.stringify({ error: snapErr.message }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const systemPrompt = `أنت "حكيم" — المستشار المالي الذكي لشركة "ريف المدينة". تحلل البيانات المالية وتقدم رؤى استباقية وتحذيرات مبكرة وتوصيات عملية. كن مختصراً، عربياً، وعملياً. ركز على: السيولة، الديون المستحقة، هوامش الربح المتآكلة، المنتجات الراكدة، فرص التحسين.`;

    const userPrompt = question
      ? `سؤال المدير: ${question}\n\nالبيانات المالية:\n${JSON.stringify(snapshot, null, 2)}`
      : `حلل هذا الملخص المالي للفترة (${days} أيام) وأعطني رؤى مالية استباقية وتحذيرات وتوصيات:\n\n${JSON.stringify(snapshot, null, 2)}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_insight",
              description: "Return a structured financial insight",
              parameters: {
                type: "object",
                properties: {
                  severity: { type: "string", enum: ["info", "warning", "critical", "success"] },
                  title: { type: "string" },
                  summary: { type: "string", description: "تحليل مختصر بالعربية (3-6 جمل)" },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        action: { type: "string" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                      },
                      required: ["action", "priority"],
                    },
                  },
                },
                required: ["severity", "title", "summary", "recommendations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_insight" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: any = {};
    if (toolCall?.function?.arguments) {
      try { parsed = JSON.parse(toolCall.function.arguments); } catch (e) { console.error("parse error", e); }
    }

    const insight = {
      kind,
      severity: parsed.severity || "info",
      title: parsed.title || "تقرير حكيم",
      summary: parsed.summary || aiData.choices?.[0]?.message?.content || "لا توجد رؤى متاحة",
      recommendations: parsed.recommendations || [],
      raw_snapshot: snapshot,
      generated_for_date: new Date().toISOString().split("T")[0],
    };

    // Persist (admin client to bypass RLS for cron flows)
    const { data: saved, error: insErr } = await admin
      .from("hakim_insights")
      .insert(insight)
      .select()
      .single();
    if (insErr) console.error("insert insight error:", insErr);

    return new Response(JSON.stringify({ ok: true, insight: saved || insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("hakim error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
