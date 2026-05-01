import { Outlet } from "@tanstack/react-router";
import { DesktopSidebar } from "./DesktopSidebar";
import { DesktopTopbar } from "./DesktopTopbar";
import { BottomTabBar } from "./BottomTabBar";
import { HakimFAB } from "./HakimFAB";

/**
 * AdminShell — Phase 21: premium operating-system layout.
 *
 *  ┌──────────────┬───────────────────────────────────────────────┐
 *  │              │  Sticky Topbar (search · alerts · profile)    │
 *  │  Sidebar     ├───────────────────────────────────────────────┤
 *  │  (lg+)       │                                               │
 *  │              │  <Outlet/>                                    │
 *  │              │                                               │
 *  └──────────────┴───────────────────────────────────────────────┘
 *
 * Mobile: page-owned MobileTopbar + BottomTabBar (unchanged).
 */
export function AdminShell() {
  return (
    <div
      className="min-h-screen flex w-full bg-background"
      dir="rtl"
      style={{ background: "var(--gradient-aurora), hsl(var(--background))" }}
    >
      <DesktopSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <DesktopTopbar />
        <main className="flex-1 min-w-0 pb-tab lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomTabBar />
      <HakimFAB />
    </div>
  );
}
