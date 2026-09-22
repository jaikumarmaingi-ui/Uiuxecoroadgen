"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Sky } from "@react-three/drei";
import * as THREE from "three";
import type { CorridorRegime } from "@/lib/inspection-3d/regimes";
import { CONDITIONS, type CorridorCondition } from "@/lib/inspection-3d/conditions";
import { Precipitation } from "./precipitation";

/**
 * Sky, sun and haze for a corridor.
 *
 * Every light derives from the regime's one sun vector, so the sky, the
 * shadows, the reflection probe and the fill stay physically consistent with
 * each other. The sun sits behind the direction of travel in every regime:
 * the corridor ahead is lit rather than silhouetted, the cut face takes the
 * light square-on, and the camera never stares into the glare.
 *
 * The sun rides with the action. A shadow frustum tight enough to resolve
 * kerbs and cones covers about 120 units; the drivable corridor is more than
 * a kilometre. Widening the frustum to fit would throw away all its texel
 * density, so instead the whole light rig translates along Z to stay over
 * wherever the inspector is.
 */
export function Atmosphere({
  regime,
  condition = "clear",
  focusZRef,
}: {
  regime: CorridorRegime;
  /** Survey conditions, which shift the regime's own sky rather than replace it. */
  condition?: CorridorCondition;
  /** World Z the shadow frustum should stay centred on. */
  focusZRef?: React.RefObject<number>;
}) {
  const spec = CONDITIONS[condition];

  /**
   * The condition modulates the regime's sky rather than supplying its own.
   *
   * Rain over the Thar and rain over Assam should not look the same — the
   * light, the haze colour and the sun angle still belong to the corridor.
   * Multiplying keeps each regime's identity underneath the weather.
   */
  const s = useMemo(() => {
    const e = spec.env;
    const base = regime.sky;
    return {
      ...base,
      turbidity: base.turbidity + e.turbidityAdd,
      sunIntensity: base.sunIntensity * e.sunIntensityMul,
      sunColor: e.sunColor ?? base.sunColor,
      fogColor: e.fogColor ?? base.fogColor,
      fogNear: base.fogNear * e.fogNearMul,
      fogFar: base.fogFar * e.fogFarMul,
      hemiIntensity: base.hemiIntensity * e.hemiIntensityMul,
    };
  }, [regime.sky, spec.env]);
  const sun = useMemo(() => new THREE.Vector3(...s.sunPosition), [s.sunPosition]);

  const rigRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  // Aim the light at a target inside its own rig, so translating the rig moves
  // the shadow frustum without changing the light's direction.
  useEffect(() => {
    const light = lightRef.current;
    const target = targetRef.current;
    if (light && target) light.target = target;
  }, []);

  useFrame((_, rawDelta) => {
    const rig = rigRef.current;
    if (!rig || !focusZRef) return;
    const delta = Math.min(rawDelta, 0.1);
    // Damped, so the shadow map is not re-rendered against a jittering frustum.
    rig.position.setZ(THREE.MathUtils.damp(rig.position.z, focusZRef.current, 6, delta));
  });

  return (
    <>
      {/* Reflection probe. Glass, chrome and wet asphalt need something to
          reflect; without it every smooth material renders as a black void.
          Rendering the sky into a small cubemap once (frames={1}) is enough,
          and costs nothing per frame. */}
      <Environment
        key={`${regime.id}-${condition}-probe`}
        frames={1}
        resolution={128}
        background={false}
        environmentIntensity={0.32}
      >
        <Sky distance={4500} sunPosition={sun} turbidity={s.turbidity} rayleigh={s.rayleigh * 0.95} />
        {/* Ground half of the probe: bounce off the local ground, not black. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -14, 0]}>
          <circleGeometry args={[220, 24]} />
          <meshBasicMaterial color={s.hemiGround} />
        </mesh>
      </Environment>

      <Sky
        distance={4500}
        sunPosition={sun}
        turbidity={s.turbidity}
        rayleigh={s.rayleigh}
        mieCoefficient={0.004}
        mieDirectionalG={0.78}
      />
      <fog attach="fog" args={[s.fogColor, s.fogNear, s.fogFar]} />

      <group ref={rigRef}>
        <directionalLight
          ref={lightRef}
          position={sun}
          intensity={s.sunIntensity}
          color={s.sunColor}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.025}
        >
          <orthographicCamera attach="shadow-camera" args={[-62, 62, 62, -62, 1, 420]} />
        </directionalLight>
        <object3D ref={targetRef} />
      </group>

      {/* Sky fill: cool light from above, bounce off the ground below. */}
      <hemisphereLight args={[s.hemiSky, s.hemiGround, s.hemiIntensity]} />

      {/* A dim counter-light so shadow sides keep some shape instead of
          crushing to black once tone mapping is applied. */}
      <directionalLight position={[-sun.x, 26, -sun.z]} intensity={0.16} color="#9ec0e4" />
      <ambientLight intensity={0.04} />

      <Precipitation spec={spec} />
    </>
  );
}
