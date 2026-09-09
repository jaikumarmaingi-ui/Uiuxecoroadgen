import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "cyan" | "green" | "amber" | "red" | "blue";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-white/5 text-text-secondary border-hairline-strong",
  cyan: "bg-cyan/10 text-cyan border-cyan/30",
  green: "bg-green/10 text-green border-green/30",
  amber: "bg-moderate/10 text-moderate border-moderate/30",
  red: "bg-critical/10 text-critical border-critical/30",
  blue: "bg-blue/10 text-blue border-blue/30",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
