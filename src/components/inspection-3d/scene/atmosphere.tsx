"use client";

import { Environment, Sky } from "@react-three/drei";
import * as THREE from "three";

/**
 * Mid-afternoon sun, behind and to the right of the driver. Keeping it behind
 * the direction of travel is deliberate: the corridor ahead is lit rather than
 * silhouetted, the cut face on the left takes the light square-on, and the
 * camera never stares into the glare. Every light here derives from this one
 * vector, so the sky, the shadows and the fill stay physically consistent.
 */
export const SUN_POSITION = new THREE.Vector3(132, 74, 104);

/** Haze colour, matched to the sky near the horizon for aerial perspective. */
export const FOG_COLOR = "#7d94ab";
export const FOG_NEAR = 60;
export const FOG_FAR = 450;

export function Atmosphere() {
  return (
    <>
      {/* Reflection probe. Glass, chrome and wet asphalt need something to
          reflect; without it every smooth material renders as a black void.
          Rendering the same sky into a small cubemap once (frames={1}) is
          enough, and costs nothing per frame. */}
      <Environment frames={1} resolution={128} background={false} environmentIntensity={0.32}>
        <Sky distance={4500} sunPosition={SUN_POSITION} turbidity={4} rayleigh={0.9} />
        {/* Ground half of the probe: warm bounce off rock, not black. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -14, 0]}>
          <circleGeometry args={[220, 24]} />
          <meshBasicMaterial color="#4a4238" />
        </mesh>
      </Environment>

      <Sky
        distance={4500}
        sunPosition={SUN_POSITION}
        // Thin, high-altitude air: modest turbidity and Rayleigh keep the
        // zenith deep and the horizon haze pale without blowing out.
        turbidity={4}
        rayleigh={0.95}
        mieCoefficient={0.004}
        mieDirectionalG={0.78}
      />
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />

      {/* Key: the sun itself. */}
      <directionalLight
        position={SUN_POSITION}
        intensity={2.35}
        color="#fff0dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={3}
      >
        <orthographicCamera attach="shadow-camera" args={[-60, 60, 60, -60, 1, 380]} />
      </directionalLight>

      {/* Sky fill: cool light from above, warm bounce off the rock below. */}
      <hemisphereLight args={["#aecbe8", "#6b5a44", 0.26]} />

      {/* A dim counter-light so shadow sides keep some shape instead of
          crushing to black once tone mapping is applied. */}
      <directionalLight position={[-120, 26, -90]} intensity={0.16} color="#9ec0e4" />
      <ambientLight intensity={0.04} />
    </>
  );
}
