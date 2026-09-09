import { cn } from "@/lib/utils";
import { FlaskConical } from "lucide-react";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/[0.07] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-moderate",
        className,
      )}
      title="Illustrative sample data for prototype purposes only."
    >
      <FlaskConical className="h-3 w-3" />
      Demo Data
    </span>
  );
}
