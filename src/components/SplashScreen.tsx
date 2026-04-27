import reefLogo from "@/assets/reef-logo.png";

const SplashScreen = () => {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden pointer-events-none animate-[splash-out_0.55s_var(--ease-apple)_2.1s_forwards]"
      style={{ background: "var(--gradient-splash)" }}
      aria-hidden="true"
    >
      <div className="absolute top-1/4 right-1/4 h-72 w-72 rounded-full bg-primary-glow/40 blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6 px-8 animate-splash-in">
        <div className="glass-strong flex h-32 w-32 items-center justify-center rounded-[2.25rem] shadow-float">
          <img
            src={reefLogo}
            alt="شعار ريف المدينة"
            width={128}
            height={128}
            className="h-24 w-24 object-contain"
          />
        </div>

        <div className="text-center">
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground">
            ريف المدينة
          </h1>
          <p className="mt-3 text-base font-medium text-primary/80 tracking-wide">
            عبق الريف داخل المدينة
          </p>
        </div>

        <div className="mt-10 flex gap-1.5" aria-label="جارٍ التحميل">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary/60"
              style={{ animation: `shimmer 1.2s ${i * 0.15}s infinite ease-in-out` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;