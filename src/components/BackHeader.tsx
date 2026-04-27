import { useRouter } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  fallbackTo?: "/" | "/sections" | "/account";
  right?: ReactNode;
  accent?: string;
  themeKey?: string;
}

const BackHeader = ({ title, subtitle, fallbackTo = "/", right, accent }: BackHeaderProps) => {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
    else router.navigate({ to: fallbackTo });
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-3 pt-2">
      <button
        type="button"
        onClick={goBack}
        aria-label="رجوع"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft transition hover:bg-muted ease-apple"
      >
        <ChevronRight className="h-5 w-5 text-foreground" strokeWidth={2.4} />
      </button>
      <div className="flex-1 text-center">
        {accent && (
          <span className="mb-0.5 inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
            {accent}
          </span>
        )}
        <h1 className="font-display text-lg font-bold text-foreground leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[11px] font-medium text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="h-10 w-10 flex items-center justify-center">{right}</div>
    </div>
  );
};

export default BackHeader;