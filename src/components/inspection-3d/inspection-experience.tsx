"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { getSegment } from "@/lib/mock-data";
import { createInitialWorld, type FlowState, type WorldRefState } from "./types";
import { InspectionScene } from "./inspection-scene";
import { InspectionHUD } from "./inspection-hud";

const SEGMENT_ID = "nh3-srn-leh-210";
const ANALYSIS_DURATION_MS = 1900;

export function InspectionExperience() {
  const segment = useMemo(() => getSegment(SEGMENT_ID)!, []);
  const [flow, setFlow] = useState<FlowState>("intro");
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const worldRef = useRef<WorldRefState>(createInitialWorld());
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    function down(e: KeyboardEvent) {
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

  const enterWorld = useCallback(() => setFlow("driving"), []);
  const onApproach = useCallback(() => setFlow((f) => (f === "driving" ? "approaching" : f)), []);
  const stopAndInspect = useCallback(() => setFlow((f) => (f === "approaching" || f === "driving" ? "parked" : f)), []);
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
  const restart = useCallback(() => {
    Object.assign(worldRef.current, createInitialWorld());
    setSelectedLayer(null);
    setFlow("intro");
  }, []);

  useEffect(() => {
    if (flow !== "analyzing") return;
    const t = setTimeout(() => setFlow("results"), ANALYSIS_DURATION_MS);
    return () => clearTimeout(t);
  }, [flow]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "e") return;
      if (flow === "approaching") stopAndInspect();
      else if (flow === "parked") getOut();
      else if (flow === "onfoot") inspectRoad();
      else if (flow === "exploded") triggerAI();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flow, stopAndInspect, getOut, inspectRoad, triggerAI]);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-base">
      <Canvas shadows camera={{ position: [0, 8, START_CAMERA_Z], fov: 52, near: 0.1, far: 400 }} dpr={[1, 1.6]}>
        <InspectionScene
          flow={flow}
          world={worldRef}
          keys={keys}
          segment={segment}
          selectedLayer={selectedLayer}
          onApproach={onApproach}
          onSelectLayer={setSelectedLayer}
        />
      </Canvas>
      <InspectionHUD
        flow={flow}
        segment={segment}
        selectedLayer={selectedLayer}
        onSelectLayer={setSelectedLayer}
        onEnterWorld={enterWorld}
        onStopAndInspect={stopAndInspect}
        onGetOut={getOut}
        onInspectRoad={inspectRoad}
        onExplodeLayers={explodeLayers}
        onTriggerAI={triggerAI}
        onRestart={restart}
      />
    </div>
  );
}

const START_CAMERA_Z = 44;
