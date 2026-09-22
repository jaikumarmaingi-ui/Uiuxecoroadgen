"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ClipboardList, ArrowUpRight, TriangleAlert, Leaf, Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KPIWidget } from "@/components/shared/kpi-widget";
import { DemoBadge } from "@/components/shared/demo-badge";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import {
  parseSurvey,
  programmeOrder,
  subscribeSurvey,
  surveyServerSnapshot,
  surveySnapshot,
  surveyTotals,
} from "@/lib/inspection-3d/survey";
import { SCALE_LABEL } from "@/lib/inspection-3d/treatments";
import { LAYER_LABEL } from "@/lib/inspection-3d/diagnosis";
import { SEVERITY_LABEL } from "@/lib/inspection-3d/corridor-defects";
import { cn } from "@/lib/utils";

/**
 * The work package a corridor survey produces.
 *
 * Everything here comes from the 3D inspection the user just drove — the
 * failures they stopped at, the cores they cut, the treatments they accepted.
 * Nothing on this page is network mock data.
 */
export default function SurveyReportPage() {
  // sessionStorage is an external store, so it is read through the hook built
  // for one: no state to sync, no cascading render after mount, and a survey
  // saved while this page is open updates it in place.
  const raw = useSyncExternalStore(subscribeSurvey, surveySnapshot, surveyServerSnapshot);
  const survey = useMemo(() => parseSurvey(raw), [raw]);

  const totals = useMemo(() => (survey ? surveyTotals(survey) : null), [survey]);
  const programme = useMemo(() => (survey ? programmeOrder(survey) : []), [survey]);

  const costByTreatment = useMemo(() => {
    if (!survey) return [];
    const acc = new Map<string, number>();
    for (const e of survey.entries) {
      acc.set(e.treatmentLabel, (acc.get(e.treatmentLabel) ?? 0) + e.costLakh);
    }
    return [...acc.entries()]
      .map(([method, lakh]) => ({ method, lakh: Math.round(lakh * 100) / 100 }))
      .sort((a, b) => b.lakh - a.lakh);
  }, [survey]);

  if (!survey || survey.entries.length === 0) {
    return (
      <div className="mx-auto max-w-[760px] space-y-5 p-4 md:p-6">
        <Header />
        <Card className="p-6 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-text-tertiary" />
          <h2 className="mt-3 font-display text-base font-bold text-text-primary">
            No survey handed over yet
          </h2>
          <p className="mx-auto mt-2 max-w-[440px] text-sm leading-relaxed text-text-tertiary">
            This page shows the costed work package produced by a 3D corridor survey. Drive a corridor,
            inspect at least one flagged failure and accept a treatment, and the package appears here.
          </p>
          <Link href="/field-inspection-3d" className="mt-4 inline-block">
            <Button variant="primary">
              Open 3D field inspection <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const t = totals!;
  const coverage = Math.round((t.inspected / Math.max(1, t.flaggedTotal)) * 100);

  return (
    <div className="mx-auto max-w-[1300px] space-y-6 p-4 md:p-6">
      <Header />

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono-tech text-xs font-semibold text-cyan">{survey.routeLabel}</div>
            <div className="font-display text-lg font-bold text-text-primary">
              {survey.corridorLabel} corridor · {survey.chainageLabel}
            </div>
            <div className="mt-0.5 text-xs text-text-tertiary">
              {(survey.corridorLengthM / 1000).toFixed(2)} km surveyed · {t.inspected} of {t.flaggedTotal}{" "}
              flagged failures inspected ({coverage}%)
              {t.inspected < t.flaggedTotal && " — package covers the inspected failures only"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {t.worstSeverity && (
              <Badge tone={t.worstSeverity === "critical" ? "red" : t.worstSeverity === "high" ? "amber" : "cyan"}>
                Worst: {SEVERITY_LABEL[t.worstSeverity]}
              </Badge>
            )}
            <Link href="/field-inspection-3d">
              <Button variant="secondary">
                Back to survey <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {t.visualOnlyCount > 0 && (
        <Card className="border-moderate/30 bg-moderate/[0.05] p-4">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-moderate" />
            <div>
              <div className="font-display text-sm font-bold text-moderate">
                {t.visualOnlyCount} of {t.inspected} jobs classified without a core
              </div>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                Conditions blocked the trial pit, so these defects were classified from the vehicle. The
                originating layer is inferred from the mechanism rather than read off a core, and the
                treatment against it should be treated as provisional until the corridor can be re-surveyed.
              </p>
            </div>
          </div>
        </Card>
      )}

      {t.urgentCount > 0 && (
        <Card className="border-critical/30 bg-critical/[0.05] p-4">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-critical" />
            <div>
              <div className="font-display text-sm font-bold text-critical">
                {t.urgentCount} job{t.urgentCount === 1 ? "" : "s"} with an intervention window of 30 days or
                less
              </div>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                The programme below is ordered by closing window rather than by chainage. Working down the
                corridor in order would let the shortest window lapse — the earliest closes in{" "}
                {t.soonestWindowDays} days.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KPIWidget label="Package Cost" value={t.totalCostLakh} decimals={2} prefix="₹" suffix=" L" tone="cyan" />
        <KPIWidget label="Carriageway Treated" value={t.totalAreaM2} decimals={1} suffix=" m²" tone="blue" />
        <KPIWidget label="Programme Duration" value={t.programmeDays} decimals={1} suffix=" days" tone="neutral" />
        <KPIWidget label="CO₂ Emitted" value={t.totalCo2Tons} decimals={2} suffix=" t" tone="amber" />
        <KPIWidget label="CO₂ Avoided" value={t.totalCo2AvoidedTons} decimals={2} suffix=" t" tone="green" />
        <KPIWidget label="Avg. Recycled Content" value={t.avgRecycledPct} suffix="%" tone="green" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card className="p-0">
          <CardHeader>
            <CardTitle>Work Programme — by closing window</CardTitle>
            <span className="font-mono-tech text-[11px] text-text-tertiary">{programme.length} jobs</span>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {programme.map((e, i) => (
              <div
                key={e.defectId}
                className={cn(
                  "rounded-xl border p-3.5",
                  e.timeToInterventionDays <= 30
                    ? "border-critical/30 bg-critical/[0.04]"
                    : "border-hairline bg-panel/50",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tech text-[10px] font-semibold text-text-tertiary">
                        JOB {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono-tech text-[11px] font-semibold text-cyan">
                        KM {(e.chainageM / 1000).toFixed(3)}
                      </span>
                    </div>
                    <div className="mt-0.5 font-display text-sm font-bold text-text-primary">
                      {e.failureLabel}
                    </div>
                    <div className="text-[11px] text-text-tertiary">
                      {e.areaM2} m² · origin {LAYER_LABEL[e.originLayer]} ·{" "}
                      {e.structural ? "structural" : "surface-bound"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "font-display text-base font-bold",
                        e.timeToInterventionDays <= 30 ? "text-critical" : "text-text-primary",
                      )}
                    >
                      {e.timeToInterventionDays} d
                    </div>
                    <div className="text-[9px] uppercase tracking-wide text-text-tertiary">window</div>
                  </div>
                </div>

                <div className="mt-2.5 rounded-lg border border-hairline bg-white/[0.02] px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">
                        {SCALE_LABEL[e.scale]}
                      </div>
                      <div className="text-xs font-semibold text-text-secondary">{e.treatmentMethod}</div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <Metric label="Cost" value={`₹${e.costLakh.toFixed(2)} L`} />
                      <Metric label="Duration" value={`${e.durationDays} d`} />
                      <Metric label="Life" value={`${e.expectedLifeYears[0]}–${e.expectedLifeYears[1]} yr`} />
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge
                    tone={e.severity === "critical" ? "red" : e.severity === "high" ? "amber" : "cyan"}
                  >
                    {SEVERITY_LABEL[e.severity]}
                  </Badge>
                  {e.co2AvoidedTons > 0 && (
                    <Badge tone="green">−{e.co2AvoidedTons.toFixed(2)} t CO₂e</Badge>
                  )}
                  {e.recycledPct > 0 && <Badge tone="cyan">{e.recycledPct}% recycled</Badge>}
                  <Badge tone="neutral">Confidence {e.confidencePct}%</Badge>
                  {e.conditionLabel !== "Clear" && <Badge tone="neutral">{e.conditionLabel}</Badge>}
                  {!e.coreVerified && <Badge tone="amber">Visual only — no core</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Treatment</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={costByTreatment}
                xKey="method"
                yKey="lakh"
                color="var(--accent-cyan)"
                horizontal
                height={Math.max(160, costByTreatment.length * 46)}
                unit=" L"
              />
            </CardContent>
          </Card>

          <Card className="border-green/20 bg-green/[0.03]">
            <CardHeader>
              <CardTitle className="text-green">Environmental Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <Line
                icon={<Leaf className="h-3.5 w-3.5 text-green" />}
                label="Net carbon against conventional"
                value={`${t.totalCo2AvoidedTons > 0 ? "−" : "+"}${Math.abs(t.totalCo2AvoidedTons).toFixed(2)} t CO₂e`}
              />
              <Line
                icon={<Boxes className="h-3.5 w-3.5 text-cyan" />}
                label="Plastic waste consumed"
                value={`${t.totalPlasticTons.toFixed(2)} t`}
              />
              <Line
                icon={<TriangleAlert className="h-3.5 w-3.5 text-moderate" />}
                label="Structural failures in package"
                value={`${t.structuralCount} of ${t.inspected}`}
              />
              <p className="border-t border-hairline pt-2.5 leading-relaxed text-text-tertiary">
                Avoided carbon is measured against the conventional treatment{" "}
                <em>at the same scale</em> — a reconstruction against a conventional rebuild, a patch
                against a hot-mix patch — so it counts material and method choice, not the size of the job.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <ClipboardList className="h-5 w-5 text-cyan" />
        <h1 className="font-display text-2xl font-bold text-text-primary">Corridor Survey Report</h1>
        <DemoBadge />
      </div>
      <p className="mt-1 text-sm text-text-tertiary">
        The costed, scheduled work package produced by the 3D field inspection.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-text-tertiary">{label}</div>
      <div className="font-mono-tech text-[11px] font-semibold text-text-primary">{value}</div>
    </div>
  );
}

function Line({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-text-tertiary">
        {icon}
        {label}
      </span>
      <span className="font-mono-tech font-semibold text-text-primary">{value}</span>
    </div>
  );
}
