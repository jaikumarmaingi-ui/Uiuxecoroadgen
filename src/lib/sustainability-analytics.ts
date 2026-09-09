import { ROAD_SEGMENTS, repairOptionsFor } from "./mock-data";

export function recommendedRepairFor(segmentId: string) {
  const seg = ROAD_SEGMENTS.find((s) => s.id === segmentId)!;
  return repairOptionsFor(segmentId).find((r) => r.id === seg.recommendedRepairId)!;
}

export function co2ByRegion() {
  const map = new Map<string, number>();
  for (const seg of ROAD_SEGMENTS) {
    const repair = recommendedRepairFor(seg.id);
    map.set(seg.region, (map.get(seg.region) ?? 0) + Math.max(0, repair.carbonReductionTons));
  }
  return Array.from(map.entries())
    .map(([region, tons]) => ({ region, tons: Math.round(tons) }))
    .sort((a, b) => b.tons - a.tons);
}

export function co2ByRepairType() {
  const map = new Map<string, { tons: number; count: number }>();
  for (const seg of ROAD_SEGMENTS) {
    const repair = recommendedRepairFor(seg.id);
    const existing = map.get(repair.shortLabel) ?? { tons: 0, count: 0 };
    map.set(repair.shortLabel, { tons: existing.tons + Math.max(0, repair.carbonReductionTons), count: existing.count + 1 });
  }
  return Array.from(map.entries())
    .map(([method, v]) => ({ method, tons: Math.round(v.tons), segments: v.count }))
    .sort((a, b) => b.tons - a.tons);
}

export function materialReuseByType() {
  const map = new Map<string, { reuse: number; waste: number; count: number }>();
  for (const seg of ROAD_SEGMENTS) {
    const repair = recommendedRepairFor(seg.id);
    const existing = map.get(repair.shortLabel) ?? { reuse: 0, waste: 0, count: 0 };
    map.set(repair.shortLabel, {
      reuse: existing.reuse + repair.recycledMaterialPct,
      waste: existing.waste + repair.plasticWasteUtilizedTons,
      count: existing.count + 1,
    });
  }
  return Array.from(map.entries()).map(([method, v]) => ({
    method,
    avgReusePct: Math.round(v.reuse / v.count),
    totalWasteTons: Math.round(v.waste * 10) / 10,
  }));
}

export function costVsSustainability() {
  return co2ByRepairType().map((c) => {
    const opt = ROAD_SEGMENTS.map((s) => recommendedRepairFor(s.id)).find((r) => r.shortLabel === c.method)!;
    return { method: c.method, costLakh: opt.estimatedCostLakhPerKm, suitability: opt.suitabilityScore };
  });
}

export function networkTotals() {
  let co2 = 0;
  let waste = 0;
  let reuseSum = 0;
  let costSavingCr = 0;
  for (const seg of ROAD_SEGMENTS) {
    const repair = recommendedRepairFor(seg.id);
    const conventional = repairOptionsFor(seg.id).find((r) => r.id === "hot-mix")!;
    co2 += Math.max(0, repair.carbonReductionTons);
    waste += repair.plasticWasteUtilizedTons;
    reuseSum += repair.recycledMaterialPct;
    costSavingCr += ((conventional.estimatedCostLakhPerKm - repair.estimatedCostLakhPerKm) * seg.lengthKm) / 100;
  }
  const conventionalBaselineTons = ROAD_SEGMENTS.length * 34;
  const emissionsPctOfBaseline = Math.max(15, Math.round(100 - (co2 / conventionalBaselineTons) * 100));

  return {
    totalCo2AvoidedTons: Math.round(co2),
    totalPlasticWasteTons: Math.round(waste * 10) / 10,
    avgMaterialReusePct: Math.round(reuseSum / ROAD_SEGMENTS.length),
    totalCostSavingCr: Math.round(costSavingCr * 10) / 10,
    fuelSavedKl: Math.round(co2 * 0.42 * 10) / 10,
    lifecycleExtensionYears: 2.4,
    emissionsPctOfBaseline,
  };
}
