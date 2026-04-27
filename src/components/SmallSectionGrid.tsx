import { Link } from "@tanstack/react-router";
import { Sparkles, Tag, Wallet, Heart, Bell, HelpCircle } from "lucide-react";

const items = [
  { to: "/offers", label: "العروض", icon: Tag },
  { to: "/wallet", label: "محفظتي", icon: Wallet },
  { to: "/account/favorites", label: "المفضلة", icon: Heart },
  { to: "/account/notifications", label: "التنبيهات", icon: Bell },
  { to: "/account/help", label: "المساعدة", icon: HelpCircle },
  { to: "/sections", label: "المزيد", icon: Sparkles },
] as const;

const SmallSectionGrid = () => {
  return (
    <section className="animate-float-up" style={{ animationDelay: "120ms" }}>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-xl font-extrabold text-foreground">روابط سريعة</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50 transition hover:bg-accent/50"
          >
            <Icon className="h-6 w-6 text-primary" strokeWidth={2} />
            <span className="text-xs font-bold text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SmallSectionGrid;