import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIStatusIndicator } from "@/components/shared/ai-status-indicator";
import type { FeatureContribution } from "@/lib/types";
import { daysAgo } from "@/lib/utils";

const BAR_COLORS = ["var(--accent-cyan)", "var(--accent-blue)", "var(--state-moderate)", "var(--state-good)", "var(--accent-green)", "var(--text-tertiary)"];

export function FeatureImportance({
  contributions,
  explanation,
  confidencePct,
  lastUpdatedIso,
}: {
  contributions: FeatureContribution[];
  explanation: string;
  confidencePct: number;
  lastUpdatedIso?: string;
}) {
  const max = Math.max(...contributions.map((c) => c.weight));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Why is this segment high risk?</CardTitle>
        <AIStatusIndicator state={confidencePct >= 80 ? "confident" : "low-confidence"} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2.5">
          {contributions.map((c, i) => (
            <div key={c.factor}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-text-secondary">{c.factor}</span>
                <span className="font-mono-tech font-semibold text-text-primary">{c.weight}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${(c.weight / max) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-cyan/20 bg-cyan/[0.05] p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-cyan">AI Explanation</div>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">&ldquo;{explanation}&rdquo;</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-text-tertiary">
          <span>
            Model confidence <span className="font-mono-tech font-semibold text-text-primary">{confidencePct}%</span>
          </span>
          {lastUpdatedIso && (
            <span>
              Data freshness <span className="font-mono-tech font-semibold text-text-primary">{daysAgo(lastUpdatedIso) === 0 ? "updated today" : `${daysAgo(lastUpdatedIso)}d ago`}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
