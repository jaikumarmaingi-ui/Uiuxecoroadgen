import { cn } from "@/lib/utils";
import { BrainCircuit, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, HelpCircle } from "lucide-react";

export type AIState =
  | "analyzing"
  | "confident"
  | "low-confidence"
  | "anomaly"
  | "updated"
  | "generated";

const META: Record<AIState, { label: string; icon: typeof BrainCircuit; tone: string }> = {
  analyzing: { label: "AI ANALYZING", icon: RefreshCw, tone: "text-cyan" },
  confident: { label: "AI CONFIDENT", icon: CheckCircle2, tone: "text-green" },
  "low-confidence": { label: "LOW DATA CONFIDENCE", icon: HelpCircle, tone: "text-moderate" },
  anomaly: { label: "ANOMALY DETECTED", icon: AlertTriangle, tone: "text-critical" },
  updated: { label: "PREDICTION UPDATED", icon: Sparkles, tone: "text-blue" },
  generated: { label: "RECOMMENDATION GENERATED", icon: BrainCircuit, tone: "text-cyan" },
};

export function AIStatusIndicator({ state, className }: { state: AIState; className?: string }) {
  const meta = META[state];
  const Icon = meta.icon;
  return (
    <div className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase", meta.tone, className)}>
      <Icon className={cn("h-3.5 w-3.5", state === "analyzing" && "animate-spin")} strokeWidth={2.5} />
      {meta.label}
    </div>
  );
}
