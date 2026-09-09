import { ROAD_SEGMENTS, REPORT_TYPES } from "./mock-data";

export interface SearchResult {
  id: string;
  type: "Road Segment" | "Report";
  title: string;
  subtitle: string;
  href: string;
}

export function runGlobalSearch(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const segmentResults: SearchResult[] = ROAD_SEGMENTS.filter((s) => {
    const haystack = `${s.roadName} ${s.routeNumber} ${s.segmentLabel} ${s.region} KM${s.startKm} ${s.startKm} ${s.endKm}`.toLowerCase();
    return q.split(/\s+/).every((token) => haystack.includes(token));
  }).map((s) => ({
    id: s.id,
    type: "Road Segment" as const,
    title: `${s.routeNumber} · ${s.roadName}`,
    subtitle: `${s.segmentLabel} · Health ${s.healthScore}/100 · ${s.riskLevel.replace("-", " ")}`,
    href: `/road-network/${s.id}`,
  }));

  const reportResults: SearchResult[] = REPORT_TYPES.filter((r) =>
    `${r.name} ${r.description}`.toLowerCase().includes(q),
  ).map((r) => ({
    id: r.id,
    type: "Report" as const,
    title: r.name,
    subtitle: r.audience,
    href: `/reports`,
  }));

  return [...segmentResults, ...reportResults].slice(0, 10);
}
