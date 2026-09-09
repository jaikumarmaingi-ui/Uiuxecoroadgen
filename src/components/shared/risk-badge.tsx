import { Badge } from "@/components/ui/badge";
import { RISK_META } from "@/lib/risk";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const meta = RISK_META[level];
  return (
    <Badge className={cn(meta.bgClass, meta.textClass, meta.borderClass, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
    </Badge>
  );
}
