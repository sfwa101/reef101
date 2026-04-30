import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MobileTopbar } from "@/components/admin/MobileTopbar";
import { IOSList, IOSRow, IOSSection } from "@/components/ios/IOSCard";
import { useAuth } from "@/context/AuthContext";
import { useAdminRoles } from "@/components/admin/RoleGuard";
import {
  ChevronLeft, Warehouse, Store, ShieldCheck, Star, Wallet, Receipt, TrendingUp,
  Sparkles, Image, BellRing, Gift, Truck, MapPin, UserCog, MessagesSquare,
  FileClock, BarChart3, Settings, LogOut, Moon, Printer,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Item = { to?: string; icon: any; label: string; color: string; onClick?: () => void };
type Group = { title: string; items: Item[] };

export default function More() {
  const { user, profile, signOut } = useAuth();
  const { roles } = useAdminRoles();
  const [dark, setDark] = useState(false);

  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(document.documentElement.classList.contains("dark"));
  };

  const display = profile?.full_name ?? user?.email ?? "؟";
  const initials = display.trim().split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const groups: Group[] = [
    { title: "العمليات", items: [
      { to: "/admin/print-jobs", icon: Printer, label: "طلبات الطباعة", color: "from-[hsl(var(--info))] to-[hsl(var(--indigo))]" },
      { to: "/admin/inventory", icon: Warehouse, label: "المخزون", color: "from-[hsl(var(--info))] to-[hsl(var(--indigo))]" },
      { to: "/admin/warehouses", icon: Warehouse, label: "المخازن المتعددة", color: "from-[hsl(var(--teal))] to-[hsl(var(--info))]" },
      { to: "/admin/stores", icon: Store, label: "المتاجر", color: "from-primary to-primary-glow" },
      { to: "/admin/vendors", icon: Truck, label: "التجار والموردون", color: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]" },
      { to: "/admin/vendor-settlements", icon: Receipt, label: "تسويات التجار", color: "from-[hsl(var(--success))] to-[hsl(var(--teal))]" },
      { to: "/admin/kyc", icon: ShieldCheck, label: "التحقق KYC", color: "from-[hsl(var(--teal))] to-[hsl(var(--info))]" },
      { to: "/admin/reviews", icon: Star, label: "التقييمات", color: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]" },
    ]},
    { title: "المالية", items: [
      { to: "/admin/cfo", icon: TrendingUp, label: "الرؤية المالية CFO", color: "from-[hsl(var(--success))] to-[hsl(var(--teal))]" },
      { to: "/admin/executive", icon: BarChart3, label: "اللوحة التنفيذية", color: "from-[hsl(var(--success))] to-[hsl(var(--teal))]" },
      { to: "/admin/topup-approvals", icon: ShieldCheck, label: "موافقات الشحن", color: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]" },
      { to: "/admin/wallets", icon: Wallet, label: "شحن المحافظ (Maker)", color: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]" },
      { to: "/admin/cost-bulk", icon: Receipt, label: "تعبئة التكاليف", color: "from-[hsl(var(--success))] to-[hsl(var(--teal))]" },
      { to: "/admin/affiliate-settings", icon: Gift, label: "عمولات الأفلييت", color: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]" },
      { to: "/admin/low-stock", icon: Warehouse, label: "تنبيهات المخزون", color: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]" },
      { to: "/admin/savings", icon: Receipt, label: "الادخار", color: "from-[hsl(var(--success))] to-[hsl(var(--teal))]" },
      { to: "/admin/finance", icon: TrendingUp, label: "التقارير", color: "from-primary to-primary-glow" },
      { to: "/admin/analytics", icon: BarChart3, label: "التحليلات", color: "from-[hsl(var(--indigo))] to-[hsl(var(--purple))]" },
    ]},
    { title: "التسويق", items: [
      { to: "/admin/marketing/promos", icon: Sparkles, label: "الكوبونات", color: "from-[hsl(var(--pink))] to-[hsl(335_80%_70%)]" },
      { to: "/admin/marketing/banners", icon: Image, label: "البانرات", color: "from-[hsl(var(--accent))] to-[hsl(20_100%_55%)]" },
      { to: "/admin/marketing/notifications", icon: BellRing, label: "الإشعارات", color: "from-[hsl(var(--info))] to-[hsl(var(--indigo))]" },
      { to: "/admin/marketing/referrals", icon: Gift, label: "الإحالات", color: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]" },
    ]},
    { title: "التوصيل", items: [
      { to: "/admin/delivery", icon: Truck, label: "مهام التوصيل", color: "from-primary to-primary-glow" },
      { to: "/admin/delivery/zones", icon: MapPin, label: "المناطق", color: "from-[hsl(var(--teal))] to-[hsl(var(--info))]" },
    ]},
    { title: "الإدارة", items: [
      { to: "/admin/staff", icon: UserCog, label: "الموظفون", color: "from-[hsl(var(--info))] to-[hsl(var(--indigo))]" },
      { to: "/admin/support", icon: MessagesSquare, label: "الدعم الفني", color: "from-[hsl(var(--purple))] to-[hsl(var(--pink))]" },
      { to: "/admin/audit-log", icon: FileClock, label: "سجل العمليات", color: "from-foreground-secondary to-foreground" },
      { to: "/admin/settings", icon: Settings, label: "الإعدادات", color: "from-foreground-tertiary to-foreground-secondary" },
    ]},
  ];

  return (
    <>
      <MobileTopbar title="المزيد" />
      <div className="px-4 lg:px-6 pt-3 pb-6 max-w-3xl mx-auto space-y-6">
        <div className="bg-surface rounded-2xl p-5 shadow-sm border border-border/40 flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-base font-display">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[17px] truncate">{profile?.full_name ?? "حساب إداري"}</p>
            {profile?.phone && <p className="text-[12px] text-foreground-tertiary truncate num" dir="ltr">{profile.phone}</p>}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {roles.map(r => <Badge key={r} variant="secondary" className="text-[10px] h-4 px-1.5 capitalize">{r}</Badge>)}
            </div>
          </div>
        </div>

        {groups.map(g => (
          <IOSSection key={g.title} title={g.title}>
            <IOSList>
              {g.items.map(it => (
                <IOSRow key={it.label}>
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${it.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
                    <it.icon className="h-[16px] w-[16px]" strokeWidth={2.5} />
                  </div>
                  {it.to ? (
                    <Link to={it.to} className="flex-1 text-right text-[15px] font-medium">{it.label}</Link>
                  ) : (
                    <span className="flex-1 text-right text-[15px] font-medium">{it.label}</span>
                  )}
                  <ChevronLeft className="h-4 w-4 text-foreground-tertiary shrink-0" />
                </IOSRow>
              ))}
            </IOSList>
          </IOSSection>
        ))}

        <IOSSection title="التفضيلات">
          <IOSList>
            <IOSRow onClick={toggleDark}>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-foreground-secondary to-foreground flex items-center justify-center text-background shrink-0">
                <Moon className="h-[16px] w-[16px]" strokeWidth={2.5} />
              </div>
              <span className="flex-1 text-right text-[15px] font-medium">الوضع الليلي</span>
              <div className={`h-6 w-10 rounded-full transition-base relative ${dark ? "bg-primary" : "bg-muted"}`}>
                <div className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-spring ${dark ? "right-0.5" : "right-[18px]"}`} />
              </div>
            </IOSRow>
          </IOSList>
        </IOSSection>

        <IOSList>
          <IOSRow onClick={signOut}>
            <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <LogOut className="h-[16px] w-[16px]" strokeWidth={2.5} />
            </div>
            <span className="flex-1 text-right text-[15px] font-medium text-destructive">تسجيل الخروج</span>
          </IOSRow>
        </IOSList>

        <p className="text-center text-[11px] text-foreground-tertiary pt-2">لوحة إدارة ريف المدينة • الإصدار 1.0</p>
      </div>
    </>
  );
}
