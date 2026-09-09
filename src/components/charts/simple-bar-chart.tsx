"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";

export function SimpleBarChart({
  data,
  xKey,
  yKey,
  color = "var(--accent-cyan)",
  height = 240,
  horizontal = false,
  unit = "",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 16, left: horizontal ? 8 : -12, bottom: 0 }}>
        <CartesianGrid stroke="rgba(148,178,200,0.08)" horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis dataKey={xKey} type="category" width={110} tick={{ fill: "var(--text-secondary)", fontSize: 11 }} axisLine={false} tickLine={false} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={{ stroke: "rgba(148,178,200,0.15)" }} tickLine={false} />
            <YAxis tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          </>
        )}
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
          formatter={(value) => [`${value}${unit}`, ""]}
          contentStyle={{ background: "var(--bg-panel)", border: "1px solid var(--border-hairline-strong)", borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: "var(--text-secondary)" }}
        />
        <Bar dataKey={yKey} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
