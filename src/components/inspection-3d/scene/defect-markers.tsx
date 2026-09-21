"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { roadSurfaceY } from "@/lib/inspection-3d/terrain";
import { FAILURE_META } from "@/lib/inspection-3d/regimes";
import { SEVERITY_HEX, SEVERITY_LABEL, type CorridorDefect } from "@/lib/inspection-3d/corridor-defects";

/**
 * Markers over every flagged failure on the corridor.
 *
 * Only the one being approached carries a label: eight labels along a
 * kilometre of road is a wall of text, and the point of the marker further up
 * is just to tell you something is coming.
 */
export function DefectMarkers({
  defects,
  activeId,
  labelledId,
  visible,
}: {
  defects: CorridorDefect[];
  /** The defect currently under inspection, drawn larger. */
  activeId: string | null;
  /** The defect to put a label on — normally the one being approached. */
  labelledId: string | null;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <group>
      {defects.map((d) => (
        <DefectMarker
          key={d.id}
          defect={d}
          active={d.id === activeId}
          labelled={d.id === labelledId}
        />
      ))}
    </group>
  );
}

function DefectMarker({
  defect,
  active,
  labelled,
}: {
  defect: CorridorDefect;
  active: boolean;
  labelled: boolean;
}) {
  const ping = useRef<THREE.Mesh>(null);
  const color = SEVERITY_HEX[defect.severity];
  const y = roadSurfaceY(defect.x) + 0.01;
  const radius = Math.max(defect.widthM, defect.lengthM) * 0.5 + 0.9;

  useFrame(({ clock }) => {
    const mesh = ping.current;
    if (!mesh) return;
    const cycle = (clock.elapsedTime % 2.2) / 2.2;
    const s = 1 + cycle * 0.55;
    mesh.scale.set(s, s, s);
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.42 * (1 - cycle);
  });

  return (
    <group position={[defect.x, y, defect.z]}>
      {/* Ring around the failure, not over it: the surface treatment beneath
          is the thing the inspector needs to see. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + (active ? 0.12 : 0.07), 48]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.85 : 0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ping} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.06, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* A vertical stalk so the marker is findable from a distance, where the
          ring on the deck is edge-on and effectively invisible. */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.015, 0.05, 2.2, 6]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.75 : 0.4} />
      </mesh>

      {labelled && (
        <Html position={[0, 2.5, 0]} center distanceFactor={16}>
          <div
            className="pointer-events-none whitespace-nowrap rounded border px-2 py-1 font-mono-tech text-[10px] font-semibold uppercase tracking-wider shadow-lg"
            style={{ borderColor: `${color}66`, color, background: "rgba(8,12,16,0.88)" }}
          >
            {FAILURE_META[defect.kind].label} · {SEVERITY_LABEL[defect.severity]}
          </div>
        </Html>
      )}
    </group>
  );
}
