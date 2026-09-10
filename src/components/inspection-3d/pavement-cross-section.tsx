"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { RoadSegment } from "@/lib/types";
import { LAYER_EXPLODE_GAP, LAYER_FOOTPRINT, LAYER_THICKNESS, PAVEMENT_LAYERS, layerInspectionFor } from "./pavement-layers";

export function PavementCrossSection({
  segment,
  position,
  exploded,
  interactive,
  selectedLayer,
  onSelectLayer,
}: {
  segment: RoadSegment;
  position: [number, number, number];
  exploded: boolean;
  interactive: boolean;
  selectedLayer: number | null;
  onSelectLayer: (index: number) => void;
}) {
  const layerRefs = useRef<(THREE.Mesh | null)[]>([]);
  const growth = useRef(0);
  const groupScaleRef = useRef<THREE.Group>(null);

  const layers = useMemo(
    () =>
      PAVEMENT_LAYERS.map((def, i) => {
        const inspection = layerInspectionFor(i, segment);
        const distressAmount = THREE.MathUtils.clamp(1 - inspection.integrityPct / 100, 0, 1);
        const color = new THREE.Color(def.baseColor).lerp(new THREE.Color(def.distressColor), distressAmount * 0.75);
        return { ...def, color, distressAmount, inspection };
      }),
    [segment],
  );

  useFrame((_, delta) => {
    growth.current = THREE.MathUtils.damp(growth.current, 1, 5, delta);
    if (groupScaleRef.current) {
      const s = THREE.MathUtils.clamp(growth.current, 0.001, 1);
      groupScaleRef.current.scale.setScalar(s);
    }
    layers.forEach((_, i) => {
      const mesh = layerRefs.current[i];
      if (!mesh) return;
      const collapsedY = -i * LAYER_THICKNESS;
      const explodedY = -i * (LAYER_THICKNESS + LAYER_EXPLODE_GAP);
      const targetY = exploded ? explodedY : collapsedY;
      mesh.position.y = THREE.MathUtils.damp(mesh.position.y, targetY, 4.5, delta);
    });
  });

  return (
    <group position={position}>
      {/* inspection pit frame */}
      <mesh position={[0, -1.7, 0]} receiveShadow>
        <cylinderGeometry args={[LAYER_FOOTPRINT * 0.85, LAYER_FOOTPRINT * 0.95, 0.15, 24]} />
        <meshStandardMaterial color="#11151b" roughness={0.9} />
      </mesh>
      <mesh position={[0, -1.63, 0]}>
        <cylinderGeometry args={[LAYER_FOOTPRINT * 0.86, LAYER_FOOTPRINT * 0.86, 0.02, 24]} />
        <meshStandardMaterial color="#35e0d0" emissive="#35e0d0" emissiveIntensity={0.35} transparent opacity={0.18} />
      </mesh>

      <group ref={groupScaleRef}>
        {layers.map((layer, i) => (
            <mesh
              key={layer.key}
              ref={(m) => {
                layerRefs.current[i] = m;
              }}
              position={[0, -i * LAYER_THICKNESS, 0]}
              castShadow
              receiveShadow
              onClick={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onSelectLayer(i);
              }}
              onPointerOver={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <boxGeometry args={[LAYER_FOOTPRINT, LAYER_THICKNESS, LAYER_FOOTPRINT]} />
              <meshStandardMaterial
                color={layer.color}
                roughness={0.85}
                emissive={selectedLayer === i ? "#35e0d0" : "#000000"}
                emissiveIntensity={selectedLayer === i ? 0.25 : 0}
              />
              {exploded && (
                <Html position={[LAYER_FOOTPRINT / 2 + 0.15, 0, 0]} center={false} distanceFactor={9} occlude={false}>
                  <div className="pointer-events-none whitespace-nowrap rounded-md border border-hairline-strong bg-panel/90 px-2 py-1 text-[10px] font-semibold text-text-primary shadow-lg">
                    {layer.label}
                    <span className="ml-1.5 font-mono-tech text-cyan">{layer.inspection.integrityPct}%</span>
                  </div>
                </Html>
              )}
            </mesh>
        ))}
      </group>
    </group>
  );
}
