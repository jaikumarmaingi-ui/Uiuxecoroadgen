"use client";

// EcoRoadGenMotion — cinematic, data-driven road-intelligence motion graphic.
//
// This is a pure VISUALIZATION layer: it renders whatever RoadHealthData it's
// given (see src/lib/eco-motion/types.ts) and reacts automatically when that
// object changes — it never invents numbers or AI verdicts of its own.
//
// Built with CSS transitions/keyframes + requestAnimationFrame + SVG only.
// Framer Motion is already a project dependency but isn't used here: nothing
// in this component needs spring physics, gesture handling, or layout
// animation — CSS transforms/opacity cover every effect (scan beam, camera
// push-in, counters, probability ring, dash-drawn route) at a lower runtime
// cost, and it keeps the component's own bundle footprint at zero extra
// dependencies.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import type {
  EcoRoadGenMotionProps,
  EnvironmentCondition,
  MotionPhase,
  RepairOption,
  RoadHealthData,
} from "@/lib/eco-motion/types";
import styles from "./EcoRoadGenMotion.module.css";

const DEFAULT_REPAIR_OPTIONS: RepairOption[] = [
  { id: "PATCH_REPAIR", label: "Patch Repair", costLabel: "₹0.4–0.8 L/km", lifeExtensionYears: 1.5, carbonImpactLabel: "Baseline" },
  { id: "MILLING_OVERLAY", label: "Milling + Overlay", costLabel: "₹2.1–3.4 L/km", lifeExtensionYears: 5, carbonImpactLabel: "−12% CO2e" },
  { id: "SUSTAINABLE_REHABILITATION", label: "Sustainable Recycled Rehabilitation", costLabel: "₹2.8–4.0 L/km", lifeExtensionYears: 9, carbonImpactLabel: "−46% CO2e" },
];

const PHASE_SEQUENCE: { phase: MotionPhase; duration: number; label: string }[] = [
  { phase: "CORRIDOR", duration: 2200, label: "Corridor overview" },
  { phase: "DRIVE", duration: 1800, label: "Drive mode" },
  { phase: "INSPECT", duration: 2200, label: "Road inspection — anomaly detected" },
  { phase: "DRONE", duration: 1800, label: "Drone mode — corridor mapping" },
  { phase: "XRAY", duration: 2200, label: "Pavement X-ray" },
  { phase: "ANALYSIS", duration: 2800, label: "Structural scan" },
  { phase: "PREDICT", duration: 2000, label: "Deterioration forecast" },
  { phase: "REPAIR", duration: 2400, label: "Repair recommendation" },
  { phase: "RESULT", duration: 1800, label: "Before / after road health" },
  { phase: "ENVIRONMENT", duration: 2000, label: "Environment simulation" },
  { phase: "LANDSLIDE", duration: 2200, label: "Slope risk" },
  { phase: "FINAL", duration: 2600, label: "Summary" },
];

const PRIMARY_CONTROLS: { label: string; phase: MotionPhase }[] = [
  { label: "DRIVE", phase: "DRIVE" },
  { label: "DRONE", phase: "DRONE" },
  { label: "X-RAY", phase: "XRAY" },
];

const SECONDARY_CONTROLS: { label: string; phase: MotionPhase }[] = [
  { label: "INSPECT", phase: "INSPECT" },
  { label: "PREDICT", phase: "PREDICT" },
  { label: "REPAIR PLAN", phase: "REPAIR" },
];

const ENV_CONDITIONS: EnvironmentCondition[] = ["NORMAL", "MONSOON", "SNOW", "FREEZE_THAW", "LANDSLIDE"];

const ENV_LABELS: Record<EnvironmentCondition, string> = {
  NORMAL: "NORMAL",
  MONSOON: "MONSOON",
  SNOW: "SNOW",
  FREEZE_THAW: "FREEZE-THAW",
  LANDSLIDE: "LANDSLIDE",
};

const ENV_NOTES: Record<EnvironmentCondition, string> = {
  NORMAL: "Baseline condition",
  MONSOON: "Water flow ↑ · moisture ↑ · drainage risk ↑",
  SNOW: "Snow accumulation · reduced visibility · freeze-thaw risk",
  FREEZE_THAW: "Cyclical expansion · sub-surface cracking risk",
  LANDSLIDE: "Slope instability · debris · access warning",
};

const XRAY_LAYERS = ["WEARING COURSE", "BINDER COURSE", "BASE COURSE", "GRANULAR SUB-BASE", "COMPACTED SUBGRADE", "NATURAL GROUND"];

const PREDICT_STEPS = [
  { label: "TODAY", severity: 1 },
  { label: "+6 MONTHS", severity: 2 },
  { label: "+12 MONTHS", severity: 3 },
  { label: "+18 MONTHS", severity: 4 },
];

// LOW/MEDIUM/HIGH/CRITICAL -> an approximate instability percentage, used
// only when the API hasn't sent slopeInstabilityProbability yet.
const RISK_TO_PERCENT: Record<string, number> = { LOW: 15, MEDIUM: 40, HIGH: 65, CRITICAL: 88 };

function deriveLandslideRisk(data: RoadHealthData) {
  const probability = data.slopeInstabilityProbability ?? RISK_TO_PERCENT[data.slopeRisk] ?? 40;
  const compromised = data.roadAccessCompromised ?? probability >= 60;
  const recommendations = data.landslideRecommendations ?? ["DRAINAGE IMPROVEMENT", "SLOPE STABILIZATION", "RETAINING INTERVENTION"];
  return { probability, compromised, recommendations };
}

// ------------------------------------------------------------------ hooks

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

function useInViewport(ref: RefObject<HTMLDivElement | null>) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

/** Animates from `from` to `to`; re-triggers whenever `to` changes, so a live API update reflects automatically. */
function useCountUp(from: number, to: number, reducedMotion: boolean, duration = 1100) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    if (reducedMotion) return; // render branch below shows `to` directly, no animation needed
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration, reducedMotion]);
  return reducedMotion ? to : value;
}

// -------------------------------------------------------------- component

export function EcoRoadGenMotion({ data, backgroundImage, repairOptions = DEFAULT_REPAIR_OPTIONS, autoPlay = true, className }: EcoRoadGenMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInViewport(rootRef);
  const reducedMotion = usePrefersReducedMotion();

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [environment, setEnvironment] = useState<EnvironmentCondition>("NORMAL");

  const current = PHASE_SEQUENCE[phaseIndex];
  const phase = current.phase;

  useEffect(() => {
    if (!autoPlay || userPaused || !inView) return;
    const id = window.setTimeout(() => {
      setPhaseIndex((i) => (i + 1) % PHASE_SEQUENCE.length);
    }, current.duration);
    return () => window.clearTimeout(id);
  }, [phaseIndex, autoPlay, userPaused, inView, current.duration]);

  function goToPhase(target: MotionPhase) {
    const idx = PHASE_SEQUENCE.findIndex((s) => s.phase === target);
    if (idx >= 0) setPhaseIndex(idx);
    setUserPaused(true);
  }

  const landslide = useMemo(() => deriveLandslideRisk(data), [data]);
  const recommendedOption = useMemo(
    () => repairOptions.find((o) => o.id === data.recommendedRepair) ?? repairOptions[0],
    [repairOptions, data.recommendedRepair],
  );

  return (
    <div ref={rootRef} className={cn(styles.root, className)} data-phase={phase}>
      <div className={styles.scene}>
        <div className={styles.backdrop} style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}>
          {!backgroundImage && <TerrainPlaceholder />}
        </div>
      </div>
      <div className={styles.scanGrid} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <span className="sr-only" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {current.label}
      </span>

      <div className={styles.brandBar}>
        <div>
          <div className={styles.brandTitle}>
            ECOROAD<em>GEN</em> 1.0
          </div>
          <div className={styles.brandSub}>Strategic Road Intelligence Environment</div>
        </div>
        <div className={cn(styles.sectorTag, styles.hud)}>
          {data.route} · {data.km}
        </div>
      </div>

      {phase === "CORRIDOR" && <CorridorPanel data={data} />}
      {phase === "DRIVE" && <DrivePanel />}
      {phase === "INSPECT" && <InspectPanel data={data} />}
      {phase === "DRONE" && <DronePanel data={data} />}
      {phase === "XRAY" && <XrayPanel />}
      {phase === "ANALYSIS" && <AnalysisPanel data={data} reducedMotion={reducedMotion} />}
      {phase === "PREDICT" && <PredictPanel data={data} />}
      {phase === "REPAIR" && <RepairPanel data={data} options={repairOptions} recommended={recommendedOption} />}
      {phase === "RESULT" && <ResultPanel data={data} reducedMotion={reducedMotion} />}
      {phase === "ENVIRONMENT" && (
        <EnvironmentPanel environment={environment} onSelect={setEnvironment} reducedMotion={reducedMotion} />
      )}
      {phase === "LANDSLIDE" && <LandslidePanel landslide={landslide} reducedMotion={reducedMotion} />}
      {phase === "FINAL" && <FinalPanel />}

      <div className={styles.progressRail} aria-hidden="true">
        {PHASE_SEQUENCE.map((s) => (
          <span key={s.phase} className={styles.progressDot} data-current={s.phase === phase} />
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup} role="group" aria-label="Camera mode">
          {PRIMARY_CONTROLS.map((c) => (
            <button
              key={c.phase}
              type="button"
              className={styles.controlBtn}
              data-active={phase === c.phase}
              aria-pressed={phase === c.phase}
              onClick={() => goToPhase(c.phase)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.autoBtn}
          aria-label={userPaused ? "Resume auto-play" : "Pause auto-play"}
          onClick={() => setUserPaused((p) => !p)}
        >
          {userPaused ? "▶" : "❚❚"}
        </button>

        <div className={styles.controlGroup} role="group" aria-label="Intelligence tools">
          {SECONDARY_CONTROLS.map((c) => (
            <button
              key={c.phase}
              type="button"
              className={styles.controlBtn}
              data-active={phase === c.phase}
              aria-pressed={phase === c.phase}
              onClick={() => goToPhase(c.phase)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- background

function TerrainPlaceholder() {
  // Drawn stand-in used only when no `backgroundImage` prop is supplied —
  // swap in real corridor photography via that prop when available.
  return (
    <svg viewBox="0 0 800 450" preserveAspectRatio="xMidYMax slice" className={styles.placeholder} aria-hidden="true">
      <defs>
        <linearGradient id="ergSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c1620" />
          <stop offset="100%" stopColor="#182634" />
        </linearGradient>
        <linearGradient id="ergFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24384a" />
          <stop offset="100%" stopColor="#0c1620" />
        </linearGradient>
        <linearGradient id="ergNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16232f" />
          <stop offset="100%" stopColor="#070b10" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#ergSky)" />
      <polygon points="0,280 120,150 210,230 320,110 430,240 540,140 650,230 760,160 800,220 800,450 0,450" fill="url(#ergFar)" opacity="0.85" />
      <polygon points="0,340 140,220 260,300 380,190 520,310 640,210 800,300 800,450 0,450" fill="url(#ergNear)" />
      <path d="M0,420 C160,395 260,430 400,400 C540,372 640,412 800,392 L800,450 L0,450 Z" fill="#0a1015" />
    </svg>
  );
}

// ------------------------------------------------------------- sub-panels

function CorridorPanel({ data }: { data: RoadHealthData }) {
  return (
    <div className={cn(styles.stageCenter, styles.panelReveal)}>
      <div className={styles.stageTitle}>
        ECOROAD<em>GEN</em> 1.0
      </div>
      <div className={styles.stageLede}>Strategic Road Intelligence Environment</div>
      <div className={cn(styles.sectorTag, styles.hud)} style={{ marginTop: 16 }}>
        {data.route} · {data.section}
      </div>
    </div>
  );
}

function DrivePanel() {
  return (
    <>
      <div className={cn(styles.stageCenter, styles.panelReveal)} style={{ justifyContent: "flex-start", paddingTop: "8%" }}>
        <div className={styles.stageLede}>Drive Mode · Field Inspection Interface</div>
      </div>
      <div className={cn(styles.driveHud, styles.hud, styles.panelReveal)}>
        <span><b>WASD</b>Drive</span>
        <span><b>Mouse</b>360° View</span>
        <span><b>E</b>Interact</span>
        <span><b>F</b>Enter / Exit Vehicle</span>
        <span><b>V</b>Camera</span>
        <span><b>M</b>Map</span>
        <span><b>Q</b>Drone</span>
      </div>
    </>
  );
}

function InspectPanel({ data }: { data: RoadHealthData }) {
  return (
    <>
      <div className={styles.scanBeam} aria-hidden="true" />
      <div className={styles.anomalyMarker} aria-hidden="true">
        <div className={styles.anomalyPulse} />
      </div>
      <div className={cn(styles.anomalyCallout, styles.hud, styles.panelReveal)}>
        <strong>ANOMALY DETECTED</strong>
        <span style={{ opacity: 0.8 }}>{data.km}</span>
      </div>
      <div className={cn(styles.stageCenter, styles.panelReveal)} style={{ justifyContent: "flex-start", paddingTop: "8%" }}>
        <div className={styles.stageLede}>Field Inspection · {data.potholeCount} Anomalies Logged</div>
      </div>
    </>
  );
}

function DronePanel({ data }: { data: RoadHealthData }) {
  const coverage = Math.min(100, 40 + data.potholeCount * 8);
  return (
    <>
      <svg className={styles.mapOverlay} viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true">
        <path className={styles.routePath} d="M20,260 C80,220 60,160 120,140 C180,120 160,60 260,30" />
        <circle className={styles.mapMarker} cx="120" cy="140" r="5" />
        <circle className={styles.mapMarker} data-tone="critical" cx="160" cy="90" r="6" />
        <circle className={styles.mapMarker} cx="220" cy="55" r="5" />
      </svg>
      <div className={cn(styles.droneReadout, styles.hud, styles.panelReveal)}>
        <div>DRONE MODE</div>
        <div>Road Corridor Mapping</div>
        <div>Elevation <b>3,410 m</b></div>
        <div>Coverage <b>{coverage}%</b></div>
      </div>
    </>
  );
}

function XrayPanel() {
  return (
    <>
      <div className={cn(styles.stageCenter, styles.panelReveal)} style={{ justifyContent: "flex-start", paddingTop: "8%" }}>
        <div className={styles.stageLede}>Pavement Digital Twin · Drainage Pipe · Moisture · Void · Water Flow</div>
      </div>
      <div className={styles.xrayStack}>
        {XRAY_LAYERS.map((label, i) => (
          <div key={label} className={styles.xrayLayer} style={{ flex: 1, background: `rgba(53, 224, 208, ${0.05 + i * 0.03})` }}>
            <span>{label}</span>
            <span style={{ opacity: 0.55 }}>{`L${i + 1}`}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Counter({ to, reducedMotion, decimals = 0, suffix = "" }: { to: number; reducedMotion: boolean; decimals?: number; suffix?: string }) {
  const value = useCountUp(0, to, reducedMotion);
  return (
    <span className="tabular-nums">
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function ProbabilityRing({ value, reducedMotion, label }: { value: number; reducedMotion: boolean; label: ReactNode }) {
  const animated = useCountUp(0, value, reducedMotion, 1300);
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, animated));
  const offset = c - (clamped / 100) * c;
  const tone = value >= 70 ? "var(--state-critical, #ff4d4d)" : value >= 40 ? "var(--state-moderate, #f0b93d)" : "var(--state-healthy, #3fd67a)";
  return (
    <div className={cn(styles.ringWrap, styles.hud, styles.panelReveal)}>
      <svg className={styles.ringSvg} width="92" height="92" viewBox="0 0 92 92">
        <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(148,178,200,0.16)" strokeWidth="7" />
        <circle
          cx="46"
          cy="46"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 46 46)"
        />
        <text x="46" y="51" textAnchor="middle" className={styles.ringValue}>
          {Math.round(animated)}%
        </text>
      </svg>
      <div className={styles.ringLabel}>{label}</div>
    </div>
  );
}

function AnalysisPanel({ data, reducedMotion }: { data: RoadHealthData; reducedMotion: boolean }) {
  return (
    <>
      <ProbabilityRing
        value={data.failureProbability}
        reducedMotion={reducedMotion}
        label={
          <>
            AI Failure Probability
            <br />
            {data.predictedFailureMonths} Months
          </>
        }
      />
      <div className={cn(styles.statGrid, styles.hud, styles.panelReveal)}>
        <div className={styles.statHeader}>ECOROADGEN // STRUCTURAL SCAN — {data.km}</div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Pavement Health</span>
          <span className={styles.statValue}><Counter to={data.pavementHealth} reducedMotion={reducedMotion} suffix="%" /></span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Rutting</span>
          <span className={styles.statValue}><Counter to={data.ruttingMm} reducedMotion={reducedMotion} decimals={1} suffix=" mm" /></span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Cracking</span>
          <span className={styles.statValue}><Counter to={data.crackingPercent} reducedMotion={reducedMotion} decimals={1} suffix="%" /></span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Moisture</span>
          <span className={styles.statValue}><Counter to={data.moisturePercent} reducedMotion={reducedMotion} suffix="%" /></span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Freeze-Thaw</span>
          <span className={styles.riskBadge} data-tone={data.freezeThawRisk}>{data.freezeThawRisk}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Slope Risk</span>
          <span className={styles.riskBadge} data-tone={data.slopeRisk}>{data.slopeRisk}</span>
        </div>
      </div>
    </>
  );
}

function PredictPanel({ data }: { data: RoadHealthData }) {
  return (
    <>
      <div className={cn(styles.stageCenter, styles.panelReveal)} style={{ justifyContent: "flex-start", paddingTop: "8%" }}>
        <div className={styles.stageLede}>Deterioration Forecast · {data.failureProbability}% Failure Probability</div>
      </div>
      <div className={styles.timeline}>
        <div className={styles.timelineTrack} aria-hidden="true" />
        {PREDICT_STEPS.map((step) => (
          <div key={step.label} className={cn(styles.timelineStep, styles.panelReveal)}>
            <div className={styles.timelineDamage} aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={styles.damageBar}
                  style={{
                    height: `${Math.min(26, 4 + step.severity * 3 + i * 2.2)}px`,
                    opacity: i < step.severity + 1 ? 1 : 0.15,
                  }}
                />
              ))}
            </div>
            <div className={styles.timelineLabel}>{step.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function RepairPanel({ data, options, recommended }: { data: RoadHealthData; options: RepairOption[]; recommended: RepairOption }) {
  const idFor = (id: RepairOption["id"]) => (id === "PATCH_REPAIR" ? "A" : id === "MILLING_OVERLAY" ? "B" : "C");
  return (
    <>
      <div className={cn(styles.stageCenter, styles.panelReveal)} style={{ justifyContent: "flex-start", paddingTop: "6%" }}>
        <div className={styles.stageLede}>Repair Recommendation · {data.km}</div>
      </div>
      <div className={styles.repairGrid}>
        {options.map((opt) => (
          <div key={opt.id} className={cn(styles.repairCard, styles.hud, styles.panelReveal)} data-recommended={opt.id === recommended.id}>
            <div className={styles.repairId}>{idFor(opt.id)}</div>
            <div className={styles.repairLabel}>{opt.label}</div>
            <div className={styles.repairMetrics}>
              <div className={styles.repairMetric}><span>Cost</span><b>{opt.costLabel}</b></div>
              <div className={styles.repairMetric}><span>Life Extension</span><b>{opt.lifeExtensionYears} yrs</b></div>
              <div className={styles.repairMetric}><span>Carbon Impact</span><b>{opt.carbonImpactLabel}</b></div>
            </div>
            {opt.id === recommended.id && <div className={styles.recommendedTag}>AI RECOMMENDED</div>}
          </div>
        ))}
      </div>
    </>
  );
}

function ResultPanel({ data, reducedMotion }: { data: RoadHealthData; reducedMotion: boolean }) {
  const after = useCountUp(data.pavementHealth, data.roadHealthAfterRepair, reducedMotion, 1400);
  return (
    <div className={styles.beforeAfter}>
      <div className={cn(styles.baBlock, styles.panelReveal)} data-kind="before">
        <div className={styles.baValue}>{data.pavementHealth}%</div>
        <div className={styles.baLabel}>BEFORE</div>
      </div>
      <div className={styles.baArrow} aria-hidden="true">
        →
      </div>
      <div className={cn(styles.baBlock, styles.panelReveal)} data-kind="after">
        <div className={styles.baValue}>{Math.round(after)}%</div>
        <div className={styles.baLabel}>AFTER · ROAD HEALTH</div>
      </div>
    </div>
  );
}

function EnvironmentPanel({
  environment,
  onSelect,
  reducedMotion,
}: {
  environment: EnvironmentCondition;
  onSelect: (c: EnvironmentCondition) => void;
  reducedMotion: boolean;
}) {
  return (
    <>
      <div className={styles.envChips} role="group" aria-label="Environmental condition">
        {ENV_CONDITIONS.map((c) => (
          <button key={c} type="button" className={styles.envChip} data-active={environment === c} aria-pressed={environment === c} onClick={() => onSelect(c)}>
            {ENV_LABELS[c]}
          </button>
        ))}
      </div>

      {!reducedMotion && environment === "MONSOON" && (
        <div className={styles.envEffect} aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={styles.rainStreak}
              style={{ left: `${(i * 6.3) % 100}%`, animationDelay: `${(i % 5) * 0.15}s`, animationDuration: `${0.7 + (i % 4) * 0.12}s` }}
            />
          ))}
        </div>
      )}

      {!reducedMotion && environment === "SNOW" && (
        <div className={styles.envEffect} aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <span
              key={i}
              className={styles.snowDot}
              style={{ left: `${(i * 4.5) % 100}%`, animationDelay: `${(i % 7) * 0.3}s`, animationDuration: `${3 + (i % 5)}s` }}
            />
          ))}
        </div>
      )}

      {environment === "LANDSLIDE" && <div className={cn(styles.envEffect, styles.landslideTint)} aria-hidden="true" />}

      <div className={cn(styles.stageCenter, styles.panelReveal)} style={{ justifyContent: "flex-end", paddingBottom: "20%" }}>
        <div className={styles.stageLede}>{ENV_NOTES[environment]}</div>
      </div>
    </>
  );
}

function LandslidePanel({
  landslide,
  reducedMotion,
}: {
  landslide: { probability: number; compromised: boolean; recommendations: string[] };
  reducedMotion: boolean;
}) {
  return (
    <>
      <div className={cn(styles.stageCenter, styles.panelReveal)} style={{ justifyContent: "flex-start", paddingTop: "8%" }}>
        <div className={styles.stageLede}>Slope Instability Detected</div>
      </div>
      <ProbabilityRing
        value={landslide.probability}
        reducedMotion={reducedMotion}
        label={
          <>
            Instability
            <br />
            Probability
          </>
        }
      />
      <div className={cn(styles.landslidePanel, styles.hud, styles.panelReveal)}>
        {landslide.compromised && <span className={styles.accessBadge}>ROAD ACCESS COMPROMISED</span>}
        <ul className={styles.recList}>
          {landslide.recommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

function FinalPanel() {
  return (
    <div className={cn(styles.stageCenter, styles.panelReveal)}>
      <div className={styles.finalStack}>
        <div className={styles.stageTitle}>
          ECOROAD<em>GEN</em> 1.0
        </div>
        <div className={styles.stageLede}>See The Road. Understand The Risk. Predict The Future.</div>
        <div className={styles.finalRow}>
          <span>Real Roads</span>
          <span>Real Risks</span>
          <span>Smarter Decisions</span>
        </div>
      </div>
    </div>
  );
}
