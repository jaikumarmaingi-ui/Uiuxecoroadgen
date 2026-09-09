"use client";

import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export interface RepairWeights {
  cost: number;
  durability: number;
  sustainability: number;
  coldClimate: number;
  availability: number;
}

export const DEFAULT_WEIGHTS: RepairWeights = {
  cost: 7,
  durability: 9,
  sustainability: 8,
  coldClimate: 10,
  availability: 7,
};

export function WeightSliders({ weights, onChange }: { weights: RepairWeights; onChange: (w: RepairWeights) => void }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Priority Weighting</CardTitle>
      </CardHeader>
      <div className="space-y-4 p-4 pt-2">
        <p className="text-xs text-text-tertiary">
          Adjust engineering priorities — the AI recommendation recalculates instantly.
        </p>
        <Slider label="Cost importance" min={0} max={10} value={weights.cost} onChange={(v) => onChange({ ...weights, cost: v })} />
        <Slider label="Durability importance" min={0} max={10} value={weights.durability} onChange={(v) => onChange({ ...weights, durability: v })} />
        <Slider label="Sustainability importance" min={0} max={10} value={weights.sustainability} onChange={(v) => onChange({ ...weights, sustainability: v })} />
        <Slider label="Cold climate importance" min={0} max={10} value={weights.coldClimate} onChange={(v) => onChange({ ...weights, coldClimate: v })} />
        <Slider label="Strategic availability importance" min={0} max={10} value={weights.availability} onChange={(v) => onChange({ ...weights, availability: v })} />
      </div>
    </Card>
  );
}
