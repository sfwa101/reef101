import { Star, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { UniversalAdminGrid } from "@/components/admin/UniversalAdminGrid";
import { fmtNum } from "@/lib/format";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < n ? "fill-warning text-warning" : "text-border"}`} strokeWidth={2} />
      ))}
    </div>
  );
}

export default function ReviewsAdmin() {
  return (
    <UniversalAdminGrid
      title="التقييمات"
      subtitle="ملاحظات العملاء على المنتجات"
      dataSource={{
        table: "reviews",
        select: "id,product_id,rating,body,created_at,user_id",
        orderBy: { column: "created_at", ascending: false },
        limit: 200,
        searchKeys: ["product_id", "body"],
      }}
      metrics={[
        { key: "total", label: "إجمالي التقييمات", icon: MessageSquare, tone: "primary",
          compute: (rows) => fmtNum(rows.length) },
        { key: "avg", label: "متوسط النجوم", icon: Star, tone: "warning",
          compute: (rows) => rows.length
            ? (rows.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / rows.length).toFixed(1)
            : "0.0" },
        { key: "pos", label: "إيجابية (4-5)", icon: ThumbsUp, tone: "success",
          compute: (rows) => fmtNum(rows.filter((r: any) => (r.rating ?? 0) >= 4).length) },
        { key: "neg", label: "سلبية (1-2)", icon: ThumbsDown, tone: "accent",
          compute: (rows) => fmtNum(rows.filter((r: any) => (r.rating ?? 0) <= 2).length),
          urgent: (rows) => rows.some((r: any) => (r.rating ?? 0) <= 2) },
      ]}
      columns={[
        { key: "body", className: "flex-1", render: (r: any) => (
          <>
            <div className="flex items-center gap-2 mb-0.5">
              <Stars n={r.rating ?? 0} />
              <span className="text-[11px] text-foreground-tertiary">{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
            </div>
            <p className="text-[13px] line-clamp-2 leading-relaxed">{r.body || <span className="text-foreground-tertiary">— لا يوجد تعليق —</span>}</p>
            <p className="text-[10.5px] text-foreground-tertiary mt-0.5 font-mono">{r.product_id}</p>
          </>
        ) },
      ]}
      searchPlaceholder="ابحث في النص أو رمز المنتج..."
      empty={{ title: "لا توجد تقييمات بعد", hint: "ستظهر مراجعات العملاء هنا." }}
    />
  );
}
