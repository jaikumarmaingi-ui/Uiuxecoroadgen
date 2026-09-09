import Link from "next/link";
import { AlertTriangle, AlertCircle, Info, ArrowRight } from "lucide-react";
import type { AlertItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON = { critical: AlertTriangle, warning: AlertCircle, info: Info } as const;
const TONE = { critical: "text-critical bg-critical/10 border-critical/25", warning: "text-moderate bg-moderate/10 border-moderate/25", info: "text-blue bg-blue/10 border-blue/25" } as const;

export function AlertPanel({ alerts, compact = false }: { alerts: AlertItem[]; compact?: boolean }) {
  return (
    <div className="divide-y divide-hairline">
      {alerts.map((a) => {
        const Icon = ICON[a.severity];
        return (
          <div key={a.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", TONE[a.severity])}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wide", TONE[a.severity].split(" ")[0])}>
                  {a.category}
                </span>
                {!a.read && <span className="h-1.5 w-1.5 rounded-full bg-cyan" />}
              </div>
              <p className="mt-0.5 truncate text-sm font-medium text-text-primary">{a.title}</p>
              {!compact && <p className="mt-0.5 text-xs text-text-tertiary">{a.detail}</p>}
              <p className="mt-1 text-[11px] font-medium text-cyan">→ {a.recommendedAction}</p>
            </div>
            {a.roadSegmentId && (
              <Link href={`/road-network/${a.roadSegmentId}`} className="self-center text-text-tertiary hover:text-cyan">
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
