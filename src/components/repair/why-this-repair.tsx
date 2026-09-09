import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RepairOption } from "@/lib/types";
import { CheckCircle2, TriangleAlert } from "lucide-react";

export function WhyThisRepair({ option }: { option: RepairOption }) {
  return (
    <Card className="border-cyan/25 bg-cyan/[0.04]">
      <CardHeader>
        <CardTitle className="text-cyan">Why EcoRoadGen Recommends This</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-text-tertiary">Recommended</div>
          <div className="font-display text-lg font-bold text-text-primary">{option.method}</div>
        </div>

        <div className="space-y-1.5">
          {option.reasons.map((r) => (
            <div key={r} className="flex items-start gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" />
              <span>{r}</span>
            </div>
          ))}
        </div>

        {option.riskConsiderations.length > 0 && (
          <div className="rounded-lg border border-moderate/25 bg-moderate/[0.06] p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-moderate">Risk Considerations</div>
            <div className="mt-1.5 space-y-1">
              {option.riskConsiderations.map((r) => (
                <div key={r} className="flex items-start gap-2 text-xs text-text-secondary">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moderate" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-hairline pt-3 text-xs">
          <span className="text-text-tertiary">AI confidence</span>
          <span className="font-display text-base font-bold text-cyan">{option.aiConfidencePct}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
