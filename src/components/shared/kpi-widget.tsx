"use client";

import { Card } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { Sparkline } from "@/components/shared/sparkline";
import { cn } from "@/lib/utils";
import { Info, TrendingDown, TrendingUp, Minus, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type Tone = "green" | "cyan" | "amber" | "red" | "blue" | "neutral";

const toneColor: Record<Tone, string> = {
  green: "var(--state-healthy)",
  cyan: "var(--accent-cyan)",
  amber: "var(--state-moderate)",
  red: "var(--state-critical)",
  blue: "var(--accent-blue)",
  neutral: "var(--text-secondary)",
};

const toneText: Record<Tone, string> = {
  green: "text-healthy",
  cyan: "text-cyan",
  amber: "text-moderate",
  red: "text-critical",
  blue: "text-blue",
  neutral: "text-text-primary",
};

function useCountUp(target: number, decimals = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value.toFixed(decimals);
}

export function KPIWidget({
  label,
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  trend,
  trendLabel,
  tone = "cyan",
  sparklineData,
  tooltip,
  onClick,
  icon: Icon,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  trend?: number; // positive/negative percent
  trendLabel?: string;
  tone?: Tone;
  sparklineData?: number[];
  tooltip?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}) {
  const display = useCountUp(value, decimals);
  const TrendIcon = trend === undefined ? Minus : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendTone = trend === undefined || trend === 0 ? "text-text-tertiary" : trend > 0 ? "text-healthy" : "text-critical";

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden p-4 transition-all",
        onClick && "cursor-pointer hover:border-hairline-strong hover:bg-panel-alt",
      )}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-35"
        style={{ background: toneColor[tone] }}
      />
      <div className="flex items-start justify-between">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
          {Icon && (
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: `${toneColor[tone]}22`, color: toneColor[tone] }}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          )}
          {label}
        </span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <Info className="h-3.5 w-3.5 text-text-tertiary hover:text-text-secondary" />
          </Tooltip>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div className={cn("font-display text-[28px] font-bold leading-none tabular-nums", toneText[tone])}>
          {prefix}
          {display}
          {suffix}
        </div>
        {sparklineData && <Sparkline data={sparklineData} color={toneColor[tone]} />}
      </div>

      {trend !== undefined && (
        <div className={cn("mt-2 flex items-center gap-1 text-[11px] font-semibold", trendTone)}>
          <TrendIcon className="h-3 w-3" strokeWidth={2.5} />
          <span className="tabular-nums">{Math.abs(trend)}%</span>
          {trendLabel && <span className="font-normal text-text-tertiary">{trendLabel}</span>}
        </div>
      )}
    </Card>
  );
}
