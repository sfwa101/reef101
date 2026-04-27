import type { ReactNode } from "react";

interface BottomCTAProps {
  children: ReactNode;
}

const BottomCTA = ({ children }: BottomCTAProps) => {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 mx-auto"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div
        className="mx-auto max-w-md px-4 pt-3"
        style={{
          background:
            "linear-gradient(180deg, hsl(var(--background) / 0) 0%, hsl(var(--background) / 0.9) 30%, hsl(var(--background)) 60%)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default BottomCTA;