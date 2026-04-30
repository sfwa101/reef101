import { Outlet, Link, useLocation } from "@tanstack/react-router";
import { RoleGuard } from "@/components/admin/RoleGuard";
import { Truck, Wallet, Map } from "lucide-react";

export default function DriverShell() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/driver", icon: Truck, label: "طلباتي" },
    { to: "/driver/map", icon: Map, label: "الخريطة" },
    { to: "/driver/wallet", icon: Wallet, label: "العهدة" },
  ];
  return (
    <RoleGuard roles={["delivery", "admin"]}>
      <div dir="rtl" className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-30 bg-surface border-b border-border/40 px-4 py-3">
          <h1 className="font-display text-[18px]">بوابة المندوب</h1>
        </header>
        <main className="p-4 max-w-2xl mx-auto"><Outlet /></main>
        <nav className="fixed bottom-0 inset-x-0 bg-surface border-t border-border/40 grid grid-cols-3">
          {tabs.map(t => {
            const active = pathname === t.to;
            return (
              <Link key={t.to} to={t.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active ? "text-primary" : "text-foreground-tertiary"}`}>
                <t.icon className="h-5 w-5" />{t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </RoleGuard>
  );
}
