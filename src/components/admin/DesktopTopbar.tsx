import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Command, Search, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * DesktopTopbar — sticky top bar for the admin shell on lg+ screens.
 *
 * Houses global search, notifications, quick-create action and the user chip.
 * Mobile uses MobileTopbar inside each page (unchanged) so we don't disturb
 * existing screens.
 *
 * The search input is `command-palette-ready`: the same handler will later open
 * a CMDK panel. For now, Enter routes to /admin/orders?q= which already works.
 */
export function DesktopTopbar() {
  const { profile, user } = useAuth();
  const display = profile?.full_name ?? user?.email ?? "؟";
  const initials = display.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const [unread, setUnread] = useState(0);
  const [shrunk, setShrunk] = useState(false);

  /* Best-effort unread count — falls back to 0 if RLS blocks. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { count } = await (supabase as any)
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("read", false);
        if (!cancelled && typeof count === "number") setUnread(count);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onScroll = () => setShrunk(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-shrunk={shrunk}
      className={cn(
        "hidden lg:flex sticky top-0 z-30 items-center gap-3 px-6 h-14",
        "bg-card/65 backdrop-blur-xl border-b border-border/0 transition-[background,border-color,box-shadow] duration-300 ease-apple",
        "data-[shrunk=true]:bg-card/90 data-[shrunk=true]:border-border/60 data-[shrunk=true]:shadow-soft",
      )}
    >
      {/* Search — command-palette-ready */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const q = String(fd.get("q") ?? "").trim();
          if (q) window.location.assign(`/admin/orders?q=${encodeURIComponent(q)}`);
        }}
        className="flex-1 max-w-xl"
      >
        <label className="group flex items-center gap-2 h-10 rounded-2xl bg-surface-muted/70 hover:bg-surface-muted border border-border/40 px-3 transition focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-card">
          <Search className="h-4 w-4 text-foreground-tertiary shrink-0" />
          <input
            name="q"
            placeholder="ابحث في الطلبات، العملاء، المنتجات…"
            className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-foreground-tertiary"
          />
          <span className="hidden xl:inline-flex items-center gap-1 text-[10.5px] text-foreground-tertiary border border-border/50 rounded-md px-1.5 py-0.5">
            <Command className="h-3 w-3" /> K
          </span>
        </label>
      </form>

      <div className="flex items-center gap-1.5">
        <Link
          to="/admin/products"
          className="hidden md:inline-flex items-center gap-1.5 h-10 px-3 rounded-2xl bg-foreground text-background text-[12.5px] font-semibold press shadow-soft hover:opacity-90"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} /> منتج جديد
        </Link>
        <Link
          to="/admin/marketing/notifications"
          className="relative h-10 w-10 rounded-2xl hover:bg-surface-muted flex items-center justify-center press"
          aria-label="الإشعارات"
        >
          <Bell className="h-[18px] w-[18px] text-foreground-secondary" />
          {unread > 0 && (
            <span className="absolute top-1.5 left-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9.5px] font-semibold flex items-center justify-center ring-2 ring-card">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>
        <Link
          to="/admin/settings"
          className="flex items-center gap-2 h-10 pr-1 pl-3 rounded-2xl hover:bg-surface-muted press"
          aria-label="الملف الشخصي"
        >
          <div className="text-right hidden xl:block">
            <p className="text-[12px] leading-tight font-semibold truncate max-w-[140px]">{display}</p>
            <p className="text-[10px] leading-tight text-foreground-tertiary">مدير النظام</p>
          </div>
          <Avatar className="h-8 w-8 border border-border/40">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-[11px] font-display">
              {initials || "؟"}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
