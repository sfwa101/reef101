import { Link } from "@tanstack/react-router";
import { Construction, ChevronRight } from "lucide-react";
import { MobileTopbar } from "@/components/admin/MobileTopbar";

export default function Placeholder({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <MobileTopbar title={title} />
      <div className="px-4 lg:px-6 pt-3 pb-6 max-w-3xl mx-auto">
        {description && <p className="text-[13px] text-foreground-secondary mb-4 px-1">{description}</p>}
        <div className="bg-surface rounded-3xl p-10 text-center border border-border/40 shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center mb-4">
            <Construction className="h-7 w-7" />
          </div>
          <h3 className="font-display text-[18px] mb-1.5">قيد التطوير</h3>
          <p className="text-[13px] text-foreground-secondary max-w-sm mx-auto mb-4">
            هذه الصفحة ستُبنى لاحقاً. الهيكل والصلاحيات جاهزة بالفعل.
          </p>
          <Link to="/admin" className="inline-flex items-center gap-1 text-[14px] text-primary font-semibold press">
            العودة للرئيسية
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </div>
    </>
  );
}
