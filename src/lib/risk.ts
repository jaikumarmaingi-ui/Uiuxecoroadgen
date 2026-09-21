import type { RiskLevel } from "./types";

/**
 * `color` is a CSS custom property, for use in styles. `hex` is the same
 * token resolved, for consumers that cannot read CSS — three.js materials in
 * the 3D scenes parse colour strings themselves and silently fall back to
 * white on a `var(...)`, which is how a critical defect marker ends up
 * rendering as a plain white ring.
 */
export const RISK_META: Record<
  RiskLevel,
  { label: string; color: string; hex: string; textClass: string; bgClass: string; dotClass: string; borderClass: string }
> = {
  healthy: {
    label: "Healthy",
    color: "var(--state-healthy)",
    hex: "#3fd67a",
    textClass: "text-healthy",
    bgClass: "bg-healthy/10",
    dotClass: "bg-healthy",
    borderClass: "border-healthy/30",
  },
  good: {
    label: "Good",
    color: "var(--state-good)",
    hex: "#35c7e0",
    textClass: "text-good",
    bgClass: "bg-good/10",
    dotClass: "bg-good",
    borderClass: "border-good/30",
  },
  moderate: {
    label: "Moderate",
    color: "var(--state-moderate)",
    hex: "#f0b93d",
    textClass: "text-moderate",
    bgClass: "bg-moderate/10",
    dotClass: "bg-moderate",
    borderClass: "border-moderate/30",
  },
  "high-risk": {
    label: "High Risk",
    color: "var(--state-high-risk)",
    hex: "#ff9a3d",
    textClass: "text-high-risk",
    bgClass: "bg-high-risk/10",
    dotClass: "bg-high-risk",
    borderClass: "border-high-risk/30",
  },
  critical: {
    label: "Critical",
    color: "var(--state-critical)",
    hex: "#ff4d4d",
    textClass: "text-critical",
    bgClass: "bg-critical/10",
    dotClass: "bg-critical",
    borderClass: "border-critical/30",
  },
};

export function healthToRisk(health: number): RiskLevel {
  if (health >= 80) return "healthy";
  if (health >= 65) return "good";
  if (health >= 50) return "moderate";
  if (health >= 35) return "high-risk";
  return "critical";
}
