"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { PanelsTopLeft, X } from "lucide-react";
import { RoadSenseTopNav } from "@/components/road-sense/ui/top-nav";
import { TerrainSelector } from "@/components/road-sense/ui/terrain-selector";
import { Toolbar } from "@/components/road-sense/ui/toolbar";
import { RightPanels } from "@/components/road-sense/ui/right-panels";
import { LayersPanel } from "@/components/road-sense/ui/layers-panel";
import { MiniMap } from "@/components/road-sense/ui/mini-map";
import { ViewControls } from "@/components/road-sense/ui/view-controls";
import { DefectPanel } from "@/components/road-sense/ui/defect-panel";
import { SegmentPanel } from "@/components/road-sense/ui/segment-panel";
import { InspectionPanel } from "@/components/road-sense/ui/inspection-panel";
import { WeatherSelector } from "@/components/road-sense/ui/weather-selector";
import { DroneHud } from "@/components/road-sense/ui/drone-hud";
import { DriveHud } from "@/components/road-sense/ui/drive-hud";
import { WalkHud } from "@/components/road-sense/ui/walk-hud";
import type { CameraCommands, ViewProjection, ViewStyle } from "@/components/road-sense/terrain-canvas";
import { TERRAIN_CONFIGS, generateRoadPath } from "@/lib/road-sense/terrain-config";
import { generateDefects } from "@/lib/road-sense/defects-data";
import { DEFAULT_LAYERS, type LayerKey } from "@/lib/road-sense/layers";
import { usePrefersReducedMotion } from "@/lib/road-sense/use-reduced-motion";
import {
  chainageMetresBetween,
  createWalkState,
  nearestDefectTo,
  nearestOnPath,
  stanceFor,
  type NearestDefect,
} from "@/lib/road-sense/walk";
import type { InspectionMode, RoadDefect, TerrainType, WeatherCondition } from "@/lib/road-sense/types";

const TerrainCanvas = dynamic(() => import("@/components/road-sense/terrain-canvas").then((m) => m.TerrainCanvas), {
  ssr: false,
});

export default function RoadSensePage() {
  const [terrainType, setTerrainType] = useState<TerrainType>("mountain");
  const [aiOverlay, setAiOverlay] = useState(false);
  const [droneActive, setDroneActive] = useState(false);
  const [driveActive, setDriveActive] = useState(false);
  const [walkActive, setWalkActive] = useState(false);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [viewProjection, setViewProjection] = useState<ViewProjection>("3d");
  const [viewStyle, setViewStyle] = useState<ViewStyle>("terrain");
  const [dragMode, setDragMode] = useState<"rotate" | "pan">("rotate");
  const [selectedDefect, setSelectedDefect] = useState<RoadDefect | null>(null);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [inspectionMode, setInspectionMode] = useState<InspectionMode | null>(null);
  const [weather, setWeather] = useState<WeatherCondition>("normal");
  const [mobileSheet, setMobileSheet] = useState(false);
  const [droneT, setDroneT] = useState(0.15);
  const [driveT, setDriveT] = useState(0.1);
  // Polled from the walk rig's ref rather than driven by it: the rig runs at
  // frame rate, and the HUD only needs to be current, not per-frame exact.
  const [walkPos, setWalkPos] = useState({ x: 0, z: 0 });

  const cameraApiRef = useRef<CameraCommands | null>(null);
  const droneProgressRef = useRef(0.15);
  const driveProgressRef = useRef(0.1);
  const walkStateRef = useRef(createWalkState());
  const reducedMotion = usePrefersReducedMotion();

  const config = TERRAIN_CONFIGS[terrainType];
  const path = useMemo(() => generateRoadPath(config), [config]);
  const defects = useMemo(() => generateDefects(config.id, config.seed), [config]);
  const xray = inspectionMode === "xray";

  // Walk telemetry, derived from the polled position against the same path and
  // defect set the scene draws from.
  const walkNear = useMemo(() => nearestOnPath(path, walkPos.x, walkPos.z), [path, walkPos]);
  const walkNearestDefect = useMemo(
    () => nearestDefectTo(defects, path, config.roadWidth, walkPos.x, walkPos.z),
    [defects, path, config.roadWidth, walkPos],
  );
  // Reported as distance along the corridor, which the scene's stylised world
  // units cannot honestly express — see chainageMetresBetween.
  const walkNearestDistM = walkNearestDefect
    ? chainageMetresBetween(walkNear.t, walkNearestDefect.defect.t, config.roadLengthKm)
    : 0;

  useEffect(() => {
    const id = setInterval(() => {
      setDroneT(droneProgressRef.current);
      setDriveT(driveProgressRef.current);
      setWalkPos({ x: walkStateRef.current.x, z: walkStateRef.current.z });
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Drive, Walk and Drone each take over the camera, so entering one leaves
  // the others.
  function toggleDrive(active: boolean) {
    setDriveActive(active);
    if (active) {
      setDroneActive(false);
      setWalkActive(false);
      closePanels();
    }
  }

  function toggleWalk(active: boolean) {
    setWalkActive(active);
    if (active) {
      setDroneActive(false);
      setDriveActive(false);
      closePanels();
    }
  }

  /**
   * Open the defect panel for whatever the inspector is standing next to.
   * Leaves Walk mode running: the point is to read the detail while still in
   * front of the defect, not to be yanked back to the orbit camera.
   */
  function inspectNearestDefect(nearest: NearestDefect) {
    setSelectedDefect(nearest.defect);
    setSegmentOpen(false);
    setInspectionMode(null);
  }

  function toggleDrone(active: boolean) {
    setDroneActive(active);
    if (active) {
      setDriveActive(false);
      setWalkActive(false);
    }
  }

  function closePanels() {
    setSelectedDefect(null);
    setSegmentOpen(false);
    setInspectionMode(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "Escape") {
        if (inspectionMode) setInspectionMode(null);
        else closePanels();
      } else if (e.key.toLowerCase() === "r") {
        cameraApiRef.current?.reset();
      } else if (e.key.toLowerCase() === "i") {
        setInspectionMode("scan");
        setSegmentOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [inspectionMode]);

  function selectTerrain(t: TerrainType) {
    setTerrainType(t);
    closePanels();
    droneProgressRef.current = 0.15;
    driveProgressRef.current = 0.1;
    setDriveActive(false);
    setWalkActive(false);
    cameraApiRef.current?.reset();
  }

  function toggleLayer(key: LayerKey) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function navigateMap(x: number, z: number) {
    cameraApiRef.current?.panTo(x, z);
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#05080a] text-text-primary">
      <RoadSenseTopNav />

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0">
          <TerrainCanvas
            terrainType={terrainType}
            aiOverlay={aiOverlay}
            xray={xray}
            weather={weather}
            droneActive={droneActive}
            driveActive={driveActive}
            driveProgressRef={driveProgressRef}
            walkActive={walkActive}
            walkStateRef={walkStateRef}
            layers={layers}
            viewProjection={viewProjection}
            viewStyle={viewStyle}
            cameraApiRef={cameraApiRef}
            selectedDefectId={selectedDefect?.id ?? null}
            onSelectDefect={(d) => {
              setSelectedDefect(d);
              setSegmentOpen(false);
              setInspectionMode(null);
            }}
            onRoadClick={() => {
              setSegmentOpen(true);
              setSelectedDefect(null);
              setInspectionMode(null);
            }}
            droneProgressRef={droneProgressRef}
            dragMode={dragMode}
          />
        </div>

        {/* desktop overlay chrome */}
        <div className="pointer-events-none absolute inset-0 hidden flex-col gap-4 p-4 lg:flex">
          <div className="flex flex-1 items-start justify-between gap-4">
            <div className="pointer-events-none flex w-44 shrink-0 flex-col gap-3">
              <TerrainSelector active={terrainType} onSelect={selectTerrain} />
              <LayersPanel layers={layers} onToggle={toggleLayer} />
              <WeatherSelector weather={weather} onSelect={setWeather} />
            </div>

            <div className="pointer-events-none flex flex-col items-center gap-3">
              <Toolbar
                config={config}
                aiOverlay={aiOverlay}
                setAiOverlay={setAiOverlay}
                droneActive={droneActive}
                setDroneActive={toggleDrone}
                driveActive={driveActive}
                setDriveActive={toggleDrive}
                walkActive={walkActive}
                setWalkActive={toggleWalk}
              />
              {droneActive && <DroneHud onClose={() => setDroneActive(false)} />}
              {driveActive && <DriveHud config={config} weather={weather} driveT={driveT} onClose={() => setDriveActive(false)} />}
              {walkActive && (
                <WalkHud
                  config={config}
                  walkKm={walkNear.t * config.roadLengthKm}
                  stance={stanceFor(walkNear.dist, config.roadWidth)}
                  nearest={walkNearestDefect}
                  nearestDistM={walkNearestDistM}
                  onClose={() => setWalkActive(false)}
                  onInspectNearest={inspectNearestDefect}
                />
              )}
            </div>

            <RightPanels config={config} />
          </div>

          <div className="flex items-end justify-between gap-4">
            <MiniMap path={path} defects={defects} droneT={droneT} onNavigate={navigateMap} />
            <ViewControls
              cameraApiRef={cameraApiRef}
              dragMode={dragMode}
              setDragMode={setDragMode}
              projection={viewProjection}
              setProjection={setViewProjection}
              style={viewStyle}
              setStyle={setViewStyle}
            />
          </div>
        </div>

        {/* mobile overlay chrome */}
        <div className="pointer-events-none absolute inset-0 flex flex-col gap-2.5 p-3 lg:hidden">
          <TerrainSelector active={terrainType} onSelect={selectTerrain} className="overflow-x-auto" />
          <Toolbar
            config={config}
            aiOverlay={aiOverlay}
            setAiOverlay={setAiOverlay}
            droneActive={droneActive}
            setDroneActive={toggleDrone}
            driveActive={driveActive}
            setDriveActive={toggleDrive}
            walkActive={walkActive}
            setWalkActive={toggleWalk}
          />
          {droneActive && <DroneHud onClose={() => setDroneActive(false)} />}
          {driveActive && <DriveHud config={config} weather={weather} driveT={driveT} onClose={() => setDriveActive(false)} />}
          {walkActive && (
            <WalkHud
              config={config}
              walkKm={walkNear.t * config.roadLengthKm}
              stance={stanceFor(walkNear.dist, config.roadWidth)}
              nearest={walkNearestDefect}
              nearestDistM={walkNearestDistM}
              onClose={() => setWalkActive(false)}
              onInspectNearest={inspectNearestDefect}
            />
          )}
          <div className="flex-1" />
          <div className="flex items-end justify-between gap-2.5">
            <button
              onClick={() => setMobileSheet(true)}
              className="glass-panel pointer-events-auto flex items-center gap-2 rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-text-secondary"
            >
              <PanelsTopLeft className="h-4 w-4 text-cyan" />
              Health {config.health}/100
            </button>
            <ViewControls
              cameraApiRef={cameraApiRef}
              dragMode={dragMode}
              setDragMode={setDragMode}
              projection={viewProjection}
              setProjection={setViewProjection}
              style={viewStyle}
              setStyle={setViewStyle}
            />
          </div>
        </div>

        {mobileSheet && (
          <div className="pointer-events-auto absolute inset-0 z-40 flex flex-col justify-end bg-black/60 lg:hidden" onClick={() => setMobileSheet(false)}>
            <div
              className="max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0a0d10] p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-mono-tech text-xs font-bold uppercase tracking-widest text-text-tertiary">Terrain &amp; Road Intelligence</span>
                <button onClick={() => setMobileSheet(false)} className="text-text-tertiary">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <RightPanels config={config} />
                <LayersPanel layers={layers} onToggle={toggleLayer} />
                <WeatherSelector weather={weather} onSelect={setWeather} />
                <MiniMap path={path} defects={defects} droneT={droneT} onNavigate={navigateMap} />
              </div>
            </div>
          </div>
        )}

        {inspectionMode && (
          <InspectionPanel
            config={config}
            mode={inspectionMode}
            onModeChange={setInspectionMode}
            onClose={() => setInspectionMode(null)}
            reducedMotion={reducedMotion}
          />
        )}
        {!inspectionMode && selectedDefect && (
          <DefectPanel defect={selectedDefect} onClose={() => setSelectedDefect(null)} onInspect={() => setInspectionMode("scan")} />
        )}
        {!inspectionMode && segmentOpen && !selectedDefect && (
          <SegmentPanel config={config} onClose={() => setSegmentOpen(false)} onInspect={() => setInspectionMode("scan")} />
        )}
      </div>
    </div>
  );
}
