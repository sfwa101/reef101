import { Outlet } from "@tanstack/react-router";
import { DesktopSidebar } from "./DesktopSidebar";
import { BottomTabBar } from "./BottomTabBar";

export function AdminShell() {
  return (
    <div className="min-h-screen flex w-full bg-background" dir="rtl">
      <DesktopSidebar />
      <main className="flex-1 min-w-0 pb-tab lg:pb-0">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
