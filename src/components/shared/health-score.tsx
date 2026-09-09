import { healthToRisk, RISK_META } from "@/lib/risk";
import { cn } from "@/lib/utils";

export function HealthScore({
  value,
  size = "md",
  showLabel = true,
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
}) {
  const meta = RISK_META[healthToRisk(value)];
  const dims = { sm: 40, md: 56, lg: 84, xl: 120 }[size];
  const stroke = { sm: 4, md: 5, lg: 7, xl: 9 }[size];
  const r = (dims - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const fontSize = { sm: "text-[11px]", md: "text-sm", lg: "text-2xl", xl: "text-4xl" }[size];

  return (
    <div className={cn("inline-flex flex-col items-center gap-1.5", className)}>
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90">
          <circle cx={dims / 2} cy={dims / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke={meta.color}
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2,0.6,0.4,1)", filter: `drop-shadow(0 0 4px ${meta.color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-display font-bold tabular-nums", fontSize)} style={{ color: meta.color }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      {showLabel && <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Health / 100</span>}
    </div>
  );
}
