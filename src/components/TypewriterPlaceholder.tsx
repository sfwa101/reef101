import { useEffect, useState } from "react";

type Props = {
  options: string[];
  className?: string;
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
};

/**
 * Typewriter placeholder — types each option, pauses, then deletes
 * and types the next. Used inside the floating search bar.
 */
const TypewriterPlaceholder = ({
  options,
  className,
  typeSpeed = 55,
  deleteSpeed = 28,
  pauseMs = 1400,
}: Props) => {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"type" | "hold" | "del">("type");

  useEffect(() => {
    const current = options[idx % options.length] ?? "";
    let t: ReturnType<typeof setTimeout>;
    if (phase === "type") {
      if (text.length < current.length) {
        t = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeed);
      } else {
        t = setTimeout(() => setPhase("del"), pauseMs);
      }
    } else if (phase === "del") {
      if (text.length > 0) {
        t = setTimeout(() => setText(current.slice(0, text.length - 1)), deleteSpeed);
      } else {
        setIdx((i) => (i + 1) % options.length);
        setPhase("type");
      }
    }
    return () => clearTimeout(t);
  }, [text, phase, idx, options, typeSpeed, deleteSpeed, pauseMs]);

  return (
    <span className={className}>
      {text}
      <span className="animate-caret ms-0.5 inline-block w-[1px] bg-current align-middle" style={{ height: "0.9em" }} />
    </span>
  );
};

export default TypewriterPlaceholder;