# EcoRoadGen — 3D Immersive Field Inspection (Unreal Engine 5)

## Technical & Experience Design Document

**Companion system to:** `src/app/field-inspection` (2D mobile inspection flow)
**Target engine:** Unreal Engine 5.4+ (Chaos Vehicles, Enhanced Input, World Partition, UMG)
**Purpose:** A first-person / drivable 3D digital-twin experience that lets an engineer virtually drive a strategic road corridor, stop at a flagged defect, get out, inspect the pavement in detail — including an exploded cross-section of the pavement layers — and trigger the same AI risk/repair pipeline that powers the EcoRoadGen web dashboard, surfacing `RoadSegment` and `RepairOption` data in-world.

---

## 1. Experience Flow

```
Enter 3D World
   → Drive Road (Chaos Vehicle, spline-guided corridor)
      → Stop at Defect (trigger volume + AI-flagged distress marker)
         → Get Out (possession swap: vehicle → on-foot character)
            → Walk Around (Enhanced Input locomotion, defect proximity halo)
               → Inspect Road (line-trace interaction, distress decals, HUD readout)
                  → Explode Pavement Layers (cross-section reveal: surface → binder → base → sub-base → subgrade)
                     → Inspect Material (per-layer material inspector: composition, strength, moisture, recycled content)
                        → Trigger AI Analysis (calls EcoRoadGen AI pipeline)
                           → See Predicted Damage / Repair (deterioration curve + ranked RepairOption cards, rendered in-world as holographic UI)
```

Each arrow above is a discrete **Inspection State** in a single finite-state machine (`UInspectionFlowSubsystem`, see §5) so the HUD, input mode, and camera can react consistently no matter how a state is entered (normal flow, teleport-to-state via debug menu, or re-entry after a save).

---

## 2. Project Architecture

```
EcoRoadGenXR/
├── Config/
│   ├── DefaultInput.ini            (Enhanced Input mapping contexts)
│   └── DefaultGame.ini
├── Content/
│   ├── Core/
│   │   ├── GameModes/BP_InspectionGameMode
│   │   ├── Subsystems/ (C++ GameInstanceSubsystem + WorldSubsystem)
│   │   └── Data/DT_RoadSegments, DT_RepairOptions   (DataTables mirroring web types)
│   ├── Characters/
│   │   ├── Vehicle/BP_InspectionVehicle (Chaos Vehicle Pawn)
│   │   └── Engineer/BP_EngineerCharacter (on-foot pawn)
│   ├── Road/
│   │   ├── BP_RoadSplineActor           (spline + procedural mesh road corridor)
│   │   ├── BP_DefectMarker               (spawned along spline from data)
│   │   └── BP_PavementCrossSection       (exploded-layer actor, §7)
│   ├── UI/
│   │   ├── WBP_HUD_Root
│   │   ├── WBP_DriveHUD
│   │   ├── WBP_InspectionPanel
│   │   ├── WBP_MaterialInspector
│   │   └── WBP_AIAnalysisResult
│   ├── Environment/ (landscape, foliage, weather - freeze/thaw, snow per region)
│   └── VFX/ (exploded-layer transition, AI scan beam, hologram shader)
├── Source/EcoRoadGenXR/
│   ├── Subsystems/InspectionFlowSubsystem.{h,cpp}
│   ├── Data/RoadSegmentTypes.h           (USTRUCTs mirroring src/lib/types.ts)
│   ├── Network/EcoRoadGenApiClient.{h,cpp}  (HTTP bridge to Next.js API, §9)
│   ├── Pawns/InspectionVehicle.{h,cpp}
│   ├── Pawns/EngineerCharacter.{h,cpp}
│   └── Actors/PavementCrossSectionActor.{h,cpp}
```

Recommended plugins: **Chaos Vehicles**, **Enhanced Input**, **Water** (for drainage visualization tie-in), **Niagara**, **Common UI**, **HTTP / JSON Blueprint Utilities** (or native `FHttpModule` in C++), **Sequencer** (for scripted enter/explode/exit camera moves).

---

## 3. World & Road Corridor

- Build the drivable corridor as a **spline-driven procedural road mesh** (`BP_RoadSplineActor`) so the same `RoadSegment.path` polyline used by the web map (`src/lib/map-geometry.ts`) can be imported (lat/lng → world-space conversion via a simple equirectangular projection anchored on the segment's origin) and drive both the visual road and the vehicle's drivable spline.
- Populate `landmarks` (`checkpoint`, `bridge`, `culvert`, `tunnel`, `weather-station`, `inspection-point`, `repair-site`) as instanced static meshes placed at their `at` fraction along the spline — reuses the exact landmark taxonomy already in `types.ts`.
- Environmental dressing driven by segment fields already in the data model: `altitudeM` → fog/snowline, `temperatureC` + `freezeThawCycles` → ice/frost decals, `rainfallMm` + `drainageScore` → puddle/erosion decals near culverts.
- **Defect markers** (`BP_DefectMarker`) are spawned from `distress` (`cracking`, `potholes`, `rutting`, `ravelling`, `edgeDeterioration`, `depression`) — each above a severity threshold gets a world-space marker + a `USphereComponent` trigger that arms the "approaching defect" HUD prompt.

---

## 4. Drive → Stop at Defect

- `BP_InspectionVehicle` (Chaos Vehicle Pawn) drives freely but is soft-guided by the spline (a `SplineFollowCameraComponent` keeps a chase cam pinned to the corridor).
- When the vehicle enters a `BP_DefectMarker` trigger volume above the segment's `probabilityOfFailurePct` threshold, `InspectionFlowSubsystem` transitions `Driving → ApproachingDefect`:
  - HUD (`WBP_DriveHUD`) shows a distress callout: defect type, estimated severity, distance.
  - Auto-brake assist gently decelerates the vehicle (matches the "AI flags, human confirms" pattern already used in `field-inspection`'s AI-Detect → Verify steps).
- Player presses **Stop & Inspect** (context prompt) → vehicle parks, state becomes `Parked`.

---

## 5. Inspection Flow Subsystem (state machine)

```cpp
UENUM(BlueprintType)
enum class EInspectionState : uint8 {
    Driving, ApproachingDefect, Parked, ExitingVehicle,
    OnFoot, InspectingSurface, LayersExploded,
    InspectingMaterial, RunningAIAnalysis, ResultsVisible
};

UCLASS()
class UInspectionFlowSubsystem : public UGameInstanceSubsystem {
    GENERATED_BODY()
public:
    UFUNCTION(BlueprintCallable) void RequestTransition(EInspectionState NewState);
    UPROPERTY(BlueprintAssignable) FOnInspectionStateChanged OnStateChanged;
    UPROPERTY(BlueprintReadOnly) FRoadSegmentData ActiveSegment; // mirrors RoadSegment
};
```

Each state broadcast drives: input mapping context swap, camera mode, active UMG widget, and which actors are interactable (e.g. `PavementCrossSectionActor` only accepts trace hits in `InspectingSurface`+).

---

## 6. Exit Vehicle → On-Foot Inspection

- `Parked` → **Get Out** input triggers a Sequencer-driven exit camera cut, un-possesses `BP_InspectionVehicle`, possesses/spawns `BP_EngineerCharacter` at the vehicle door socket.
- On-foot uses **Enhanced Input** locomotion (walk/sprint/crouch) with a **defect proximity halo** — a decal ring around the flagged pavement area, visible via a "distress scan" post-process highlight (parallels the web app's `image-analysis-panel.tsx` bounding-box overlays, translated into 3D as a Niagara outline + decal).
- Interact prompt ("Inspect Pavement") appears once the character is within ~1.5m of the defect and looking at it (line trace + dot-product facing check).

---

## 7. Inspect Road & Explode Pavement Layers

**`BP_PavementCrossSection`** is the centerpiece interaction:

1. On "Inspect Pavement," camera transitions to a fixed inspection angle (Sequencer shot) and `WBP_InspectionPanel` opens showing live distress readouts pulled from `RoadSegment.distress` and `structural` (pavementStrength, deflection, loadResponse, subgradeCondition).
2. Player presses **Explode Layers**. The cross-section actor is a stack of 5 static mesh sections, each an `USceneComponent` child with a per-layer material:

   | Layer | Source field tie-in | Explode offset |
   |---|---|---|
   | Surface Course (asphalt/wearing) | `surfaceCondition`, `distress.cracking/ravelling` | +0 cm (origin) |
   | Binder Course | `structural.loadResponse` | +25 cm |
   | Base Course | `structural.pavementStrength` | +55 cm |
   | Sub-base | `drainageScore` (granular, permeability) | +90 cm |
   | Subgrade | `structural.subgradeCondition` | +130 cm |

3. The explode is driven by a `UTimelineComponent` easing each layer's relative `Z` offset outward (accordion/blow-apart style, like an engine-bay exploded diagram), with thin connector lines (Niagara ribbon) linking each layer to a floating label callout.
4. Layers below a health threshold get a red-tinted decal overlay (cracking propagation into binder course, moisture ingress into sub-base) — this is where the "predicted damage" visual payoff actually lives once AI results come back (§9), by re-coloring the relevant layer.

This directly visualizes what the web dashboard's `condition-breakdown.tsx` and `structural` metrics describe abstractly as numbers — the 3D layer stack *is* the structural score made spatial.

---

## 8. Inspect Material

- Selecting an exploded layer opens `WBP_MaterialInspector`: a rotating material sample view (small turntable mesh, e.g. an asphalt core sample) + property sheet:
  - Composition (aggregate/binder ratio, `recycledMaterialPct` / `plasticWasteUtilizedTons` if the layer maps to a prior `RepairOption`)
  - Measured strength vs. design strength (bar comparison, reusing the same visual language as `repair-comparison-table.tsx`)
  - Moisture/freeze-thaw exposure (`freezeThawCycles`, `rainfallMm` from the parent segment)
- This is a read/inspect-only state — no destructive action — matching the "assessment before recommendation" order already established in the web app's `RepairStage` progression (`Detected → Assessment → Recommended → …`).

---

## 9. Trigger AI Analysis & Backend Bridge

The 3D experience does **not** reimplement AI scoring — it calls the same pipeline the web app already encapsulates in `src/lib/ai-analytics.ts` / `src/lib/risk.ts`, via a thin API layer:

- Add a Next.js API route, e.g. `src/app/api/inspection/analyze/route.ts`, that accepts `{ roadSegmentId, observedDistress, materialReadings }` and returns a `{ predictedDeterioration, probabilityOfFailurePct, featureContributions, recommendedRepairId, aiExplanation }` payload shaped exactly like the existing `RoadSegment` prediction fields — this keeps one source of truth for the AI logic shared by web and 3D clients.
- `UEcoRoadGenApiClient` (C++, `FHttpModule`) POSTs to that route and deserializes the JSON into the mirrored `FRoadSegmentData` / `FRepairOptionData` USTRUCTs (field-for-field match with `types.ts`, so the DataTables in `DT_RoadSegments` / `DT_RepairOptions` can be generated from the same mock/live data source used to seed `mock-data.ts`).
- "Trigger AI Analysis" in-world plays a scan VFX (Niagara beam sweeping the exploded cross-section) while the HTTP call is in flight, mirroring the loading spinner UX in `field-inspection/page.tsx`'s AI-Detect step (`Loader2` + timed reveal), so the interaction language is consistent between the mobile and 3D tools.

---

## 10. See Predicted Damage / Repair

`WBP_AIAnalysisResult` renders, as an in-world holographic panel floating above the cross-section:

- **Deterioration curve** — `predictedDeterioration` (`Now / 30d / 60d / 90d`) as a 3D line graph, same data shape `prediction-chart.tsx` already plots in 2D.
- **Feature contributions** — a radial/bar breakdown of `featureContributions`, matching `feature-importance.tsx`.
- **Ranked repair options** — top `RepairOption`s rendered as selectable holographic cards (method, expected life, cost/km, sustainability stats: `carbonReductionTons`, `recycledMaterialPct`), reusing the comparison logic from `repair-option-card.tsx` / `repair-comparison-table.tsx` but laid out radially around the engineer.
- Selecting a repair option optionally triggers a **preview VFX** on the exploded layers showing the repaired-layer material swapped in (visual echo of `repair-simulation.tsx`'s before/after concept, done volumetrically instead of as a 2D slider).
- A "Sync to Dashboard" action POSTs the confirmed inspection back through the same API route pattern used by the mobile flow's final `Submit Inspection` step, logging an `InspectionRecord` (matches `types.ts`) so field data captured in 3D shows up in Condition Monitoring identically to a mobile-submitted inspection.

---

## 11. Data Model Parity (UE5 ↔ Web)

| Web (`src/lib/types.ts`) | UE5 equivalent |
|---|---|
| `RoadSegment` | `FRoadSegmentData` USTRUCT + `DT_RoadSegments` DataTable |
| `RepairOption` | `FRepairOptionData` USTRUCT + `DT_RepairOptions` DataTable |
| `FeatureContribution` | `FFeatureContribution` (factor, weight) |
| `DeteriorationPoint` | `FDeteriorationPoint` (label, health) — drives the 3D line graph |
| `InspectionRecord` | `FInspectionRecord`, built during the on-foot flow, POSTed back at the end |
| `RiskLevel` / `RISK_META` colors | `UDataAsset` `DA_RiskPalette` mapping enum → `FLinearColor`, so 3D materials/UI use the exact same healthy→critical palette as the dashboard |

Keeping these structs field-identical to `types.ts` is what lets one Next.js API layer serve both clients without divergent business logic.

---

## 12. Milestones

1. **Greybox corridor + drivable vehicle** — spline road, Chaos vehicle, chase cam, single hardcoded defect stop.
2. **Possession swap + on-foot inspection** — exit/enter vehicle, interact prompt, static (non-exploded) pavement inspection panel.
3. **Exploded cross-section** — 5-layer blow-apart actor, material inspector UI, still against mock/local data.
4. **API bridge live** — `EcoRoadGenApiClient` wired to a real `api/inspection/analyze` route backed by `ai-analytics.ts`/`risk.ts`; deterioration curve + repair cards rendered from live response.
5. **Round-trip sync** — 3D-submitted inspections appear in the web Condition Monitoring view; palette/data parity QA pass against `RISK_META` and mock data fixtures.
6. **Polish** — weather/region dressing per segment, VFX pass on scan/explode/repair-preview, audio, accessibility (subtitles for VO prompts, colorblind-safe risk palette reuse).
