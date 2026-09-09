"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface PredictionSeries {
  key: string;
  label: string;
  color: string;
}

export function PredictionChart({
  data,
  series,
  height = 260,
}: {
  data: Record<string, number | string>[];
  series: PredictionSeries[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid stroke="rgba(148,178,200,0.08)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={{ stroke: "rgba(148,178,200,0.15)" }} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border-hairline-strong)",
            borderRadius: 10,
            fontSize: 12,
          }}
          labelStyle={{ color: "var(--text-secondary)" }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)" }} />}
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2.25}
            dot={{ r: 3.5, fill: s.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
