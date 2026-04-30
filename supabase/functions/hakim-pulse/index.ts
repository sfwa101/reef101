// Hakim's Pulse — fast one-shot business health insight from current finance metrics.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { metrics, page } = await req.json().catch(() => ({}));
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "missing_key" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = `أنت "حكيم" — المستشار المالي الذكي لمتجر "ريف المدينة".
مهمتك: قراءة الأرقام المُرسلة وكتابة "نبضة" قصيرة جداً (سطرين فقط، 200 حرف كحد أقصى) باللهجة العربية الاحترافية،
تلخّص حالة البيزنس اليوم وتُلفت نظر المدير لأهم نقطة (إيجابية أو تحذيرية).
لا تستخدم Markdown. ابدأ مباشرة بالملاحظة. مثال:
"المبيعات اليوم قوية (+18% عن أمس) لكن ديون الموردين تجاوزت 120 ألف ج.م — يُنصح بسداد دفعة هذا الأسبوع."`;

    const user = `الصفحة الحالية: ${page ?? "finance"}
الأرقام الحية:
${JSON.stringify(metrics ?? {}, null, 2)}

اكتب "نبضة حكيم" الآن.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "credits_exhausted" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "ai_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await aiRes.json();
    const pulse = data?.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ pulse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
