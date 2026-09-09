import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Thermometer, Snowflake, Droplets, Mountain, Truck, Shield } from "lucide-react";
import type { RoadSegment } from "@/lib/types";

function EnvRow({ icon: Icon, label, value }: { icon: typeof Thermometer; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-hairline bg-white/[0.02] px-3.5 py-2.5">
      <Icon className="h-4 w-4 text-cyan" strokeWidth={1.8} />
      <div className="flex-1 text-xs text-text-secondary">{label}</div>
      <div className="font-mono-tech text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}

export function ConditionBreakdown({ segment }: { segment: RoadSegment }) {
  const distressItems = [
    ["Cracking", segment.distress.cracking],
    ["Potholes", segment.distress.potholes],
    ["Rutting", segment.distress.rutting],
    ["Ravelling", segment.distress.ravelling],
    ["Edge Deterioration", segment.distress.edgeDeterioration],
    ["Depression", segment.distress.depression],
  ] as const;
  const structuralItems = [
    ["Pavement Strength (deficit)", segment.structural.pavementStrength],
    ["Deflection", segment.structural.deflection],
    ["Load Response Stress", segment.structural.loadResponse],
    ["Subgrade Condition (deficit)", segment.structural.subgradeCondition],
  ] as const;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Surface Distress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {distressItems.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs text-text-secondary">
                <span>{label}</span>
                <span className="font-mono-tech font-semibold text-text-primary">{value}%</span>
              </div>
              <Progress value={value} tone={value > 60 ? "red" : value > 35 ? "amber" : "cyan"} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Structural Indicators</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {structuralItems.map(([label, value]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs text-text-secondary">
                <span>{label}</span>
                <span className="font-mono-tech font-semibold text-text-primary">{value}%</span>
              </div>
              <Progress value={value} tone={value > 60 ? "red" : value > 35 ? "amber" : "cyan"} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Environmental &amp; Operational Indicators</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <EnvRow icon={Thermometer} label="Temperature" value={`${segment.temperatureC}°C`} />
          <EnvRow icon={Snowflake} label="Freeze-Thaw" value={`${segment.freezeThawCycles}/yr`} />
          <EnvRow icon={Droplets} label="Rainfall" value={`${segment.rainfallMm}mm`} />
          <EnvRow icon={Mountain} label="Altitude" value={`${segment.altitudeM}m`} />
          <EnvRow icon={Truck} label="Traffic Load" value={`${segment.trafficLoad}/100`} />
          <EnvRow icon={Shield} label="Convoy Frequency" value={segment.militaryConvoyFrequency} />
          <EnvRow icon={Droplets} label="Drainage Score" value={`${segment.drainageScore}/100`} />
          <EnvRow icon={Mountain} label="Surface Condition" value={segment.surfaceCondition} />
        </CardContent>
      </Card>
    </div>
  );
}
