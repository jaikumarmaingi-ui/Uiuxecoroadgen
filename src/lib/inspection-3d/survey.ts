import type { CorridorDefect, FailureSeverity } from "./corridor-defects";
import { FAILURE_META, type CorridorRegime, type CorridorTerrain, type RoadFailureKind } from "./regimes";
import type { DefectDiagnosis, LayerKey } from "./diagnosis";
import type { TreatmentQuote, TreatmentScale } from "./treatments";

/**
 * What a corridor survey adds up to.
 *
 * The 3D survey ends with the inspector having looked at a run of failures
 * and chosen a treatment for each. That is a work package — a costed,
 * scheduled, carbon-accounted list of jobs at known chainages — and until now
 * it evaporated the moment you drove away, with "Sync to Dashboard" merely
 * navigating to a page that knew nothing about it.
 */

export interface SurveyEntry {
  defectId: string;
  kind: RoadFailureKind;
  failureLabel: string;
  severity: FailureSeverity;
  chainageM: number;
  areaM2: number;
  originLayer: LayerKey;
  structural: boolean;
  healthNow: number;
  timeToInterventionDays: number;
  confidencePct: number;
  /** The treatment the inspector accepted. */
  treatmentId: string;
  treatmentLabel: string;
  treatmentMethod: string;
  scale: TreatmentScale;
  costLakh: number;
  co2Tons: number;
  co2AvoidedTons: number;
  plasticWasteTons: number;
  durationDays: number;
  recycledPct: number;
  suitabilityScore: number;
  expectedLifeYears: [number, number];
  inspectedIso: string;
}

export interface CorridorSurvey {
  version: 1;
  terrain: CorridorTerrain;
  corridorLabel: string;
  routeLabel: string;
  chainageLabel: string;
  corridorLengthM: number;
  /** How many failures the corridor flagged in total. */
  flaggedTotal: number;
  startedIso: string;
  entries: SurveyEntry[];
}

export function makeEntry(
  defect: CorridorDefect,
  diagnosis: DefectDiagnosis,
  quote: TreatmentQuote,
): SurveyEntry {
  return {
    defectId: defect.id,
    kind: defect.kind,
    failureLabel: FAILURE_META[defect.kind].label,
    severity: defect.severity,
    chainageM: Math.round(defect.chainageM),
    areaM2: diagnosis.areaM2,
    originLayer: diagnosis.originLayer,
    structural: diagnosis.structural,
    healthNow: diagnosis.healthNow,
    timeToInterventionDays: diagnosis.timeToInterventionDays,
    confidencePct: diagnosis.confidencePct,
    treatmentId: quote.def.id,
    treatmentLabel: quote.def.shortLabel,
    treatmentMethod: quote.def.method,
    scale: quote.def.scale,
    costLakh: quote.costLakh,
    co2Tons: quote.co2Tons,
    co2AvoidedTons: quote.co2AvoidedTons,
    plasticWasteTons: quote.plasticWasteTons,
    durationDays: quote.durationDays,
    recycledPct: quote.def.recycledPct,
    suitabilityScore: quote.suitabilityScore,
    expectedLifeYears: quote.def.expectedLifeYears,
    inspectedIso: new Date().toISOString(),
  };
}

export function emptySurvey(
  regime: CorridorRegime,
  corridorLengthM: number,
  flaggedTotal: number,
): CorridorSurvey {
  return {
    version: 1,
    terrain: regime.id,
    corridorLabel: regime.label,
    routeLabel: regime.routeLabel,
    chainageLabel: regime.chainageLabel,
    corridorLengthM,
    flaggedTotal,
    startedIso: new Date().toISOString(),
    entries: [],
  };
}

/** Assemble a survey from the entries collected so far, ordered by chainage. */
export function surveyFrom(
  regime: CorridorRegime,
  corridorLengthM: number,
  flaggedTotal: number,
  startedIso: string,
  entries: Iterable<SurveyEntry>,
): CorridorSurvey {
  return {
    ...emptySurvey(regime, corridorLengthM, flaggedTotal),
    startedIso,
    entries: [...entries].sort((a, b) => a.chainageM - b.chainageM),
  };
}

export interface SurveyTotals {
  inspected: number;
  flaggedTotal: number;
  totalAreaM2: number;
  totalCostLakh: number;
  totalCo2Tons: number;
  totalCo2AvoidedTons: number;
  totalPlasticTons: number;
  /**
   * Programme duration in working days.
   *
   * Not the sum of the job durations: a maintenance unit works one site at a
   * time on a single carriageway, but mobilisation overlaps between adjacent
   * jobs of the same type, so the programme is shorter than the naive sum.
   */
  programmeDays: number;
  avgRecycledPct: number;
  structuralCount: number;
  /** Jobs whose intervention window closes within 30 days. */
  urgentCount: number;
  /** Shortest window across the package — when the programme has to start. */
  soonestWindowDays: number | null;
  worstSeverity: FailureSeverity | null;
}

export function surveyTotals(survey: CorridorSurvey): SurveyTotals {
  const e = survey.entries;
  const sum = (f: (x: SurveyEntry) => number) => e.reduce((s, x) => s + f(x), 0);

  // Adjacent jobs sharing a treatment share a mobilisation, so the programme
  // runs shorter than the sum of the individual durations.
  const naiveDays = sum((x) => x.durationDays);
  const distinctTreatments = new Set(e.map((x) => x.treatmentId)).size;
  const overlap = e.length > distinctTreatments ? (e.length - distinctTreatments) * 0.25 : 0;
  const programmeDays = Math.max(0, Math.round((naiveDays - overlap) * 2) / 2);

  const severityRank: Record<FailureSeverity, number> = { moderate: 0, high: 1, critical: 2 };
  const worstSeverity =
    e.length === 0
      ? null
      : e.reduce<FailureSeverity>(
          (w, x) => (severityRank[x.severity] > severityRank[w] ? x.severity : w),
          "moderate",
        );

  return {
    inspected: e.length,
    flaggedTotal: survey.flaggedTotal,
    totalAreaM2: Math.round(sum((x) => x.areaM2) * 10) / 10,
    totalCostLakh: Math.round(sum((x) => x.costLakh) * 100) / 100,
    totalCo2Tons: Math.round(sum((x) => x.co2Tons) * 1000) / 1000,
    totalCo2AvoidedTons: Math.round(sum((x) => x.co2AvoidedTons) * 1000) / 1000,
    totalPlasticTons: Math.round(sum((x) => x.plasticWasteTons) * 1000) / 1000,
    programmeDays,
    avgRecycledPct: e.length ? Math.round(sum((x) => x.recycledPct) / e.length) : 0,
    structuralCount: e.filter((x) => x.structural).length,
    urgentCount: e.filter((x) => x.timeToInterventionDays <= 30).length,
    soonestWindowDays: e.length ? Math.min(...e.map((x) => x.timeToInterventionDays)) : null,
    worstSeverity,
  };
}

/**
 * Order the package by when each window closes, not by chainage.
 *
 * A programme driven by chainage would do the convenient job first and let a
 * seven-day window lapse while the unit works its way down the corridor.
 */
export function programmeOrder(survey: CorridorSurvey): SurveyEntry[] {
  return [...survey.entries].sort(
    (a, b) => a.timeToInterventionDays - b.timeToInterventionDays || a.chainageM - b.chainageM,
  );
}

const STORAGE_KEY = "ecoroadgen.survey.v1";
const SURVEY_EVENT = "ecoroadgen:survey-changed";

/**
 * Hand-off storage between the 3D survey and the rest of the product.
 *
 * sessionStorage rather than a store: the survey has to survive a full page
 * navigation out of the WebGL canvas, and it is deliberately scoped to the
 * tab — a work package is the output of one survey session, not a permanent
 * record, and there is no backend here to make it one.
 */
export function saveSurvey(survey: CorridorSurvey): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(survey));
    window.dispatchEvent(new Event(SURVEY_EVENT));
  } catch {
    // Private-mode or quota failure: the survey stays in memory for this view
    // and the report page will simply report that nothing was handed over.
  }
}

export function parseSurvey(raw: string | null): CorridorSurvey | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CorridorSurvey;
    return parsed?.version === 1 && Array.isArray(parsed.entries) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadSurvey(): CorridorSurvey | null {
  return parseSurvey(surveySnapshot());
}

/**
 * Raw snapshot for `useSyncExternalStore`.
 *
 * Returns the stored string rather than a parsed object on purpose: the
 * snapshot has to be referentially stable between reads or React re-renders
 * without end, and a fresh object from `JSON.parse` never is. Callers parse
 * the string themselves, memoised on its identity.
 */
export function surveySnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Server render has no session storage, so there is never a survey there. */
export function surveyServerSnapshot(): string | null {
  return null;
}

/**
 * The `storage` event only fires in *other* tabs, so a survey saved by the 3D
 * view in this tab is picked up by the listener the saver notifies directly.
 */
export function subscribeSurvey(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  window.addEventListener(SURVEY_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SURVEY_EVENT, onChange);
  };
}

export function clearSurvey(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(SURVEY_EVENT));
  } catch {
    // Nothing to do — an unreadable store is already an empty one.
  }
}
