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
import { DroneHud } from "@/components/road-sense/ui/drone-hud";
import type { CameraCommands, ViewProjection, ViewStyle } from "@/components/road-sense/terrain-canvas";
import { TERRAIN_CONFIGS, generateRoadPath } from "@/lib/road-sense/terrain-config";
import { generateDefects } from "@/lib/road-sense/defects-data";
import { DEFAULT_LAYERS, type LayerKey } from "@/lib/road-sense/layers";
import type { RoadDefect, TerrainType } from "@/lib/road-sense/types";

const TerrainCanvas = dynamic(() => import("@/components/road-sense/terrain-canvas").then((m) => m.TerrainCanvas), {
  ssr: false,
});

export default function RoadSensePage() {
  const [terrainType, setTerrainType] = useState<TerrainType>("mountain");
  const [aiOverlay, setAiOverlay] = useState(false);
  const [droneActive, setDroneActive] = useState(false);
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  const [viewProjection, setViewProjection] = useState<ViewProjection>("3d");
  const [viewStyle, setViewStyle] = useState<ViewStyle>("terrain");
  const [dragMode, setDragMode] = useState<"rotate" | "pan">("rotate");
  const [selectedDefect, setSelectedDefect] = useState<RoadDefect | null>(null);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [droneT, setDroneT] = useState(0.15);

  const cameraApiRef = useRef<CameraCommands | null>(null);
  const droneProgressRef = useRef(0.15);

  const config = TERRAIN_CONFIGS[terrainType];
  const path = useMemo(() => generateRoadPath(config), [config]);
  const defects = useMemo(() => generateDefects(config.id, config.seed), [config]);

  useEffect(() => {
    const id = setInterval(() => setDroneT(droneProgressRef.current), 250);
    return () => clearInterval(id);
  }, []);

  function selectTerrain(t: TerrainType) {
    setTerrainType(t);
    setSelectedDefect(null);
    setSegmentOpen(false);
    droneProgressRef.current = 0.15;
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
            droneActive={droneActive}
            layers={layers}
            viewProjection={viewProjection}
            viewStyle={viewStyle}
            cameraApiRef={cameraApiRef}
            selectedDefectId={selectedDefect?.id ?? null}
            onSelectDefect={(d) => {
              setSelectedDefect(d);
              setSegmentOpen(false);
            }}
            onRoadClick={() => {
              setSegmentOpen(true);
              setSelectedDefect(null);
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
            </div>

            <div className="pointer-events-none flex flex-col items-center gap-3">
              <Toolbar config={config} aiOverlay={aiOverlay} setAiOverlay={setAiOverlay} droneActive={droneActive} setDroneActive={setDroneActive} />
              {droneActive && <DroneHud onClose={() => setDroneActive(false)} />}
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
          <Toolbar config={config} aiOverlay={aiOverlay} setAiOverlay={setAiOverlay} droneActive={droneActive} setDroneActive={setDroneActive} />
          {droneActive && <DroneHud onClose={() => setDroneActive(false)} />}
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
                <MiniMap path={path} defects={defects} droneT={droneT} onNavigate={navigateMap} />
              </div>
            </div>
          </div>
        )}

        {selectedDefect && <DefectPanel defect={selectedDefect} onClose={() => setSelectedDefect(null)} />}
        {segmentOpen && !selectedDefect && <SegmentPanel config={config} onClose={() => setSegmentOpen(false)} />}
      </div>
    </div>
  );
}
