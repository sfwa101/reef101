import BackHeader from "@/components/BackHeader";
import { useTheme, type ColorTheme, type Mode } from "@/context/ThemeContext";
import { Sun, Moon, Monitor, Globe, Bell, Check } from "lucide-react";

const modes: { id: Mode; icon: any; label: string }[] = [
  { id: "light", icon: Sun, label: "فاتح" },
  { id: "dark", icon: Moon, label: "داكن" },
  { id: "system", icon: Monitor, label: "النظام" },
];

const palette: { id: ColorTheme; label: string; color: string }[] = [
  { id: "sage", label: "ريفي", color: "142 35% 38%" },
  { id: "ocean", label: "محيطي", color: "200 65% 42%" },
  { id: "amber", label: "كهرماني", color: "28 80% 48%" },
  { id: "rose", label: "وردي", color: "340 70% 52%" },
  { id: "violet", label: "بنفسجي", color: "265 60% 55%" },
];

const Settings = () => {
  const { mode, setMode, colorTheme, setColorTheme } = useTheme();

  return (
    <div className="space-y-6">
      <BackHeader title="الإعدادات" subtitle="المظهر، اللغة، والإشعارات" accent="حسابي" />

      <section>
        <h3 className="mb-2 px-1 text-xs font-bold text-muted-foreground">الوضع</h3>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-col items-center gap-2 rounded-2xl py-4 transition ease-apple ${
                  active ? "bg-primary text-primary-foreground shadow-pill" : "glass-strong"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.4} />
                <span className="text-xs font-bold">{m.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 px-1 text-xs font-bold text-muted-foreground">لون التطبيق</h3>
        <div className="grid grid-cols-5 gap-2">
          {palette.map((p) => {
            const active = colorTheme === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setColorTheme(p.id)}
                className="flex flex-col items-center gap-1.5"
                aria-label={p.label}
              >
                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition ease-apple ${active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
                  style={{ background: `hsl(${p.color})` }}
                >
                  {active && <Check className="h-5 w-5 text-white" strokeWidth={3} />}
                </div>
                <span className="text-[10px] font-bold">{p.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-strong divide-y divide-border rounded-2xl shadow-soft">
        <Row icon={Globe} label="لغة التطبيق" value="العربية" />
        <Row icon={Bell} label="التنبيهات" value="مفعّلة" />
      </section>
    </div>
  );
};

const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-4">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
      <Icon className="h-4 w-4 text-primary" strokeWidth={2.4} />
    </div>
    <div className="flex-1">
      <p className="text-sm font-bold">{label}</p>
      <p className="text-[10px] text-muted-foreground">{value}</p>
    </div>
  </div>
);

export default Settings;
