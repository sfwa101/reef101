import BackHeader from "@/components/BackHeader";
import { useTheme, type ColorTheme, type Mode } from "@/context/ThemeContext";
import { Sun, Moon, Monitor, Globe, Bell, Check } from "lucide-react";

const modes: { id: Mode; icon: any; label: string }[] = [
  { id: "light", icon: Sun, label: "فاتح" },
  { id: "dark", icon: Moon, label: "داكن" },
  { id: "system", icon: Monitor, label: "النظام" },
];

type PaletteItem = {
  id: ColorTheme;
  label: string;
  // gradient swatch — shows real personality of the theme
  swatch: string;
};

const naturalPalette: PaletteItem[] = [
  { id: "sage", label: "ريفي", swatch: "linear-gradient(135deg, hsl(142 35% 45%), hsl(138 55% 70%))" },
  { id: "ocean", label: "محيطي", swatch: "linear-gradient(135deg, hsl(200 70% 42%), hsl(195 75% 70%))" },
  { id: "amber", label: "كهرماني", swatch: "linear-gradient(135deg, hsl(28 82% 48%), hsl(40 90% 70%))" },
  { id: "midnight", label: "ليلي", swatch: "linear-gradient(135deg, hsl(232 60% 32%), hsl(235 70% 60%))" },
];

const cutePalette: PaletteItem[] = [
  { id: "blush", label: "وردي ناعم", swatch: "linear-gradient(135deg, hsl(340 75% 70%), hsl(335 90% 85%))" },
  { id: "lavender", label: "لافندر", swatch: "linear-gradient(135deg, hsl(268 60% 65%), hsl(290 75% 82%))" },
  { id: "mint", label: "نعناعي", swatch: "linear-gradient(135deg, hsl(168 60% 50%), hsl(160 75% 78%))" },
  { id: "peach", label: "خوخي", swatch: "linear-gradient(135deg, hsl(14 85% 65%), hsl(25 95% 82%))" },
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

      <PaletteSection
        title="ثيمات طبيعية"
        items={naturalPalette}
        active={colorTheme}
        onPick={setColorTheme}
      />
      <PaletteSection
        title="ثيمات لطيفة ✿"
        items={cutePalette}
        active={colorTheme}
        onPick={setColorTheme}
      />

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

const PaletteSection = ({
  title,
  items,
  active,
  onPick,
}: {
  title: string;
  items: PaletteItem[];
  active: ColorTheme;
  onPick: (c: ColorTheme) => void;
}) => (
  <section>
    <h3 className="mb-2 px-1 text-xs font-bold text-muted-foreground">{title}</h3>
    <div className="grid grid-cols-4 gap-3">
      {items.map((p) => {
        const isActive = active === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            className="flex flex-col items-center gap-1.5"
            aria-label={p.label}
          >
            <div
              className={`relative flex h-16 w-full items-center justify-center overflow-hidden rounded-2xl shadow-soft transition ease-apple ${
                isActive ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-[0.97]" : "hover:-translate-y-0.5"
              }`}
              style={{ background: p.swatch }}
            >
              {isActive && (
                <div className="rounded-full bg-white/90 p-1 shadow">
                  <Check className="h-3.5 w-3.5 text-foreground" strokeWidth={3} />
                </div>
              )}
            </div>
            <span className="text-[11px] font-bold">{p.label}</span>
          </button>
        );
      })}
    </div>
  </section>
);
