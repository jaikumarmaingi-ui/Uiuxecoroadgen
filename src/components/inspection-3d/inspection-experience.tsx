"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { getSegment } from "@/lib/mock-data";
import { CORRIDOR_REGIMES, type CorridorTerrain } from "@/lib/inspection-3d/regimes";
import { generateCorridorDefects, type CorridorDefect } from "@/lib/inspection-3d/corridor-defects";
import { diagnoseDefect } from "@/lib/inspection-3d/diagnosis";
import { matchTreatments, type TreatmentQuote } from "@/lib/inspection-3d/treatments";
import { ROAD_LENGTH_M } from "@/lib/inspection-3d/terrain";
import {
  makeEntry,
  saveSurvey,
  surveyFrom,
  type SurveyEntry,
} from "@/lib/inspection-3d/survey";
import { createInitialWorld, START_Z, type FlowState, type WorldRefState } from "./types";
import { InspectionScene } from "./inspection-scene";
import { InspectionHUD } from "./inspection-hud";
import { CorridorSelector } from "./corridor-selector";

const SEGMENT_ID = "nh3-srn-leh-210";
const ANALYSIS_DURATION_MS = 1900;

export function InspectionExperience() {
  const segment = useMemo(() => getSegment(SEGMENT_ID)!, []);
  const [terrain, setTerrain] = useState<CorridorTerrain>("mountain");
  const [flow, setFlow] = useState<FlowState>("intro");
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  /** Index into `defects` of the failure being driven to / inspected. */
  const [activeIndex, setActiveIndex] = useState(0);
  const [inspectedIds, setInspectedIds] = useState<string[]>([]);
  /** Treatment chosen per defect id; absent means the recommendation stands. */
  const [chosen, setChosen] = useState<Record<string, TreatmentQuote>>({});

  const worldRef = useRef<WorldRefState>(createInitialWorld());
  const keys = useRef<Set<string>>(new Set());

  const regime = CORRIDOR_REGIMES[terrain];
  const defects = useMemo(() => generateCorridorDefects(terrain), [terrain]);
  const activeDefect: CorridorDefect | null = defects[activeIndex] ?? null;
  const defectCount = defects.length;
  const remaining = Math.max(0, defects.length - inspectedIds.length);

  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      keys.current.add(e.key.toLowerCase());
    }
    function up(e: KeyboardEvent) {
      keys.current.delete(e.key.toLowerCase());
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const resetWorld = useCallback(() => {
    Object.assign(worldRef.current, createInitialWorld());
    keys.current.clear();
    setSelectedLayer(null);
    setActiveIndex(0);
    setInspectedIds([]);
    setChosen({});
  }, []);

  const selectTerrain = useCallback(
    (next: CorridorTerrain) => {
      if (next === terrain) return;
      setTerrain(next);
      resetWorld();
      setFlow("intro");
    },
    [terrain, resetWorld],
  );

  // A new corridor is a new survey: carrying entries across would produce a
  // work package spanning two unrelated routes.
  useEffect(() => {
    entriesRef.current.clear();
    startedIsoRef.current = new Date().toISOString();
    saveSurvey(
      surveyFrom(CORRIDOR_REGIMES[terrain], ROAD_LENGTH_M, defectCount, startedIsoRef.current, []),
    );
  }, [terrain, defectCount]);

  /**
   * The work package being assembled, kept in a ref because it is an output of
   * the session rather than something the scene renders.
   *
   * A Map keyed by defect id: re-inspecting a failure replaces its job rather
   * than adding a second one at the same chainage, and mutating it by method
   * call keeps it clear of the compiler's ref-immutability rule.
   */
  const entriesRef = useRef<Map<string, SurveyEntry>>(new Map());
  const startedIsoRef = useRef<string>(new Date().toISOString());

  /**
   * Record one inspected failure and its accepted treatment.
   *
   * Called as soon as the analysis resolves rather than when the inspector
   * drives on, so the last failure on a corridor is captured too — it has no
   * "continue" step to hang the commit on. Re-committing the same defect
   * replaces its entry, so changing the treatment updates the package instead
   * of adding a second job at the same chainage.
   */
  const commitInspection = useCallback(
    (defect: CorridorDefect, quote?: TreatmentQuote) => {
      const diagnosis = diagnoseDefect(defect, regime);
      const chosenQuote = quote ?? matchTreatments(defect, diagnosis, regime).recommended;
      entriesRef.current.set(defect.id, makeEntry(defect, diagnosis, chosenQuote));
      saveSurvey(
        surveyFrom(
          regime,
          ROAD_LENGTH_M,
          defectCount,
          startedIsoRef.current,
          entriesRef.current.values(),
        ),
      );
    },
    [regime, defectCount],
  );

  const chooseTreatment = useCallback(
    (quote: TreatmentQuote) => {
      if (!activeDefect) return;
      // Recording the choice is enough: the effect watching `chosen` commits
      // it, so calling commitInspection here as well would write the same
      // entry twice.
      setChosen((prev) => ({ ...prev, [activeDefect.id]: quote }));
    },
    [activeDefect],
  );

  const enterWorld = useCallback(() => setFlow("driving"), []);
  const onApproach = useCallback(() => setFlow((f) => (f === "driving" ? "approaching" : f)), []);
  const stopAndInspect = useCallback(
    () => setFlow((f) => (f === "approaching" || f === "driving" ? "parked" : f)),
    [],
  );
  const getOut = useCallback(() => {
    const world = worldRef.current;
    world.character.x = world.vehicle.x - 1.4;
    world.character.z = world.vehicle.z - 0.6;
    world.character.heading = 0;
    setFlow("onfoot");
  }, []);
  const inspectRoad = useCallback(() => setFlow("inspecting"), []);
  const explodeLayers = useCallback(() => setFlow("exploded"), []);
  const triggerAI = useCallback(() => {
    setSelectedLayer(null);
    setFlow("analyzing");
  }, []);

  /**
   * Back in the vehicle and on to the next flagged failure.
   *
   * The corridor carries several failures, so finishing one is not finishing
   * the survey. The vehicle picks up from where it parked rather than being
   * teleported, and the next defect down-chainage becomes the target.
   */
  const continueToNext = useCallback(() => {
    if (activeDefect) {
      setInspectedIds((prev) => (prev.includes(activeDefect.id) ? prev : [...prev, activeDefect.id]));
    }
    setSelectedLayer(null);
    const world = worldRef.current;
    world.parked = false;
    world.vehicle.speed = 0;
    setActiveIndex((i) => Math.min(defects.length - 1, i + 1));
    setFlow("driving");
  }, [activeDefect, defects.length]);

  const restart = useCallback(() => {
    resetWorld();
    setFlow("intro");
  }, [resetWorld]);

  useEffect(() => {
    if (flow !== "analyzing") return;
    const t = setTimeout(() => setFlow("results"), ANALYSIS_DURATION_MS);
    return () => clearTimeout(t);
  }, [flow]);

  useEffect(() => {
    if (flow !== "results" || !activeDefect) return;
    commitInspection(activeDefect, chosen[activeDefect.id]);
  }, [flow, activeDefect, chosen, commitInspection]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "e") return;
      if (flow === "approaching") stopAndInspect();
      else if (flow === "parked") getOut();
      else if (flow === "onfoot") inspectRoad();
      else if (flow === "exploded") triggerAI();
      else if (flow === "results") continueToNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flow, stopAndInspect, getOut, inspectRoad, triggerAI, continueToNext]);

  const isLast = activeIndex >= defects.length - 1;

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-base">
      <Canvas
        // Plain PCF: this three build has removed PCFSoftShadowMap, and
        // asking for "soft" just logs a warning and falls back to this anyway.
        shadows
        camera={{ position: [0, 8, START_Z + 10], fov: 52, near: 0.1, far: 1600 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false, // SMAA in the effect composer handles this
          // Filmic tone mapping is what stops a bright sun blowing the road
          // surface to white and lets the shadow side keep detail.
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: regime.sky.exposure,
        }}
      >
        <InspectionScene
          key={terrain}
          flow={flow}
          regime={regime}
          segment={segment}
          defects={defects}
          activeDefect={activeDefect}
          world={worldRef}
          keys={keys}
          selectedLayer={selectedLayer}
          onApproach={onApproach}
          onSelectLayer={setSelectedLayer}
        />
      </Canvas>

      <CorridorSelector active={terrain} onSelect={selectTerrain} disabled={flow !== "intro" && flow !== "driving"} />

      <InspectionHUD
        flow={flow}
        segment={segment}
        regime={regime}
        defects={defects}
        activeDefect={activeDefect}
        defectIndex={activeIndex}
        remaining={remaining}
        isLast={isLast}
        world={worldRef}
        selectedLayer={selectedLayer}
        onSelectLayer={setSelectedLayer}
        onEnterWorld={enterWorld}
        onStopAndInspect={stopAndInspect}
        onGetOut={getOut}
        onInspectRoad={inspectRoad}
        onExplodeLayers={explodeLayers}
        onTriggerAI={triggerAI}
        onContinue={continueToNext}
        onRestart={restart}
        onChooseTreatment={chooseTreatment}
      />
    </div>
  );
}
