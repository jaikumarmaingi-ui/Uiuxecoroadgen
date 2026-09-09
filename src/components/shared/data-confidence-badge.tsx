import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";
import type { DataConfidence } from "@/lib/types";

const META: Record<DataConfidence, { tone: "green" | "amber" | "red"; icon: typeof ShieldCheck; note: string }> = {
  HIGH: { tone: "green", icon: ShieldCheck, note: "Recent inspection, sensor telemetry and imagery all available." },
  MEDIUM: { tone: "amber", icon: ShieldAlert, note: "Some data sources are stale or incomplete. Prediction confidence reduced." },
  LOW: {
    tone: "red",
    icon: ShieldQuestion,
    note: "Prediction confidence reduced due to insufficient recent inspection data.",
  },
};

export function DataConfidenceBadge({ level }: { level: DataConfidence }) {
  const meta = META[level];
  const Icon = meta.icon;
  return (
    <Tooltip content={meta.note}>
      <Badge tone={meta.tone}>
        <Icon className="h-3 w-3" strokeWidth={2.5} />
        Data confidence: {level}
      </Badge>
    </Tooltip>
  );
}
