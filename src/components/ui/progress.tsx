import { cn } from "@/lib/utils";

const toneBg: Record<string, string> = {
  cyan: "bg-cyan",
  green: "bg-green",
  amber: "bg-moderate",
  red: "bg-critical",
  blue: "bg-blue",
};

export function Progress({
  value,
  tone = "cyan",
  className,
  trackClassName,
}: {
  value: number;
  tone?: keyof typeof toneBg;
  className?: string;
  trackClassName?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", trackClassName)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", toneBg[tone], className)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
