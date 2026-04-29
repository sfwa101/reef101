import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

export function MobileTopbar({ title = "ريف المدينة", large = true }: { title?: string; large?: boolean }) {
  const { profile, user } = useAuth();
  const display = profile?.full_name ?? user?.email ?? "؟";
  const initials = display.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="lg:hidden glass-strong sticky top-0 z-30 border-b border-border/40"
            style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="px-4 h-12 flex items-center justify-between">
        <Avatar className="h-8 w-8 border border-border/40">
          <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[11px] font-display">
            {initials || "؟"}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-1">
          <button className="h-9 w-9 rounded-full hover:bg-surface-muted press flex items-center justify-center">
            <Search className="h-[18px] w-[18px] text-foreground-secondary" />
          </button>
          <button className="h-9 w-9 rounded-full hover:bg-surface-muted press flex items-center justify-center relative">
            <Bell className="h-[18px] w-[18px] text-foreground-secondary" />
            <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-surface" />
          </button>
        </div>
      </div>
      {large && (
        <div className="px-4 pt-1 pb-3">
          <h1 className="font-display text-[34px] leading-tight tracking-tight">{title}</h1>
        </div>
      )}
    </header>
  );
}
