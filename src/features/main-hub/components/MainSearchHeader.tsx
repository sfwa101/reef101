/**
 * MainSearchHeader — Phase 26 stem cell.
 * Glass-morphic search bar + personalized greeting for the Main Hub.
 *
 * Pure presentation: consumes auth & UIContext directly so the
 * LayoutFactory can mount it with zero plumbing.
 */
import { Search, MapPin, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { useLocation } from "@/context/LocationContext";
import { getSmartGreeting, getWelcomeLine, SEARCH_PLACEHOLDERS } from "@/lib/personalize";
import TypewriterPlaceholder from "@/components/TypewriterPlaceholder";
import { useEffect, useState } from "react";

export const MainSearchHeader = () => {
  const { profile } = useAuth();
  const { viewMode } = useUI();
  const { zone } = useLocation();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const firstName = profile?.full_name?.split(" ")[0];
  const greeting = mounted ? getSmartGreeting() : "أهلاً بك";
  const welcome = mounted ? getWelcomeLine() : "تسوّق ما يناسب يومك";

  const fontScale = viewMode === "simplified" ? 1.15 : 1;

  return (
    <section className="space-y-3 animate-float-up">
      {/* Zone bar */}
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" strokeWidth={2.4} />
        <span>التوصيل إلى</span>
        <span className="font-bold text-foreground">{zone.shortName}</span>
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.4} />
      </div>

      {/* Greeting */}
      <h1
        className="font-display font-extrabold leading-tight tracking-tight text-balance"
        style={{ fontSize: `${1.875 * fontScale}rem` }}
      >
        {greeting}
        {firstName ? <span className="text-primary"> {firstName}</span> : null}،
        <br />
        <span
          className="text-muted-foreground font-bold"
          style={{ fontSize: `${1.4 * fontScale}rem` }}
        >
          {welcome}
        </span>
      </h1>

      {/* Premium glass search bar */}
      <Link
        to="/search"
        search={{ q: "" }}
        className="glass-strong flex w-full items-center gap-3 rounded-3xl px-5 py-4 text-right shadow-float ring-1 ring-border/60 transition active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm">
          <Search className="h-4 w-4" strokeWidth={2.6} />
        </span>
        <TypewriterPlaceholder
          options={SEARCH_PLACEHOLDERS}
          className="text-[13.5px] font-medium text-muted-foreground"
        />
      </Link>
    </section>
  );
};

export default MainSearchHeader;
