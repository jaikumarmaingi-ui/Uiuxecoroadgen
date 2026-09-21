"use client";

import { RotateCw, Move, ZoomIn, ZoomOut, RefreshCcw, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewProjection, ViewStyle, CameraCommands } from "../terrain-canvas";

function IconBtn({ icon: Icon, active, onClick, title }: { icon: typeof RotateCw; active?: boolean; onClick?: () => void; title: string }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
        active ? "border-cyan/50 bg-cyan/15 text-cyan" : "border-white/10 bg-white/[0.03] text-text-tertiary hover:text-text-secondary",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );
}

export function ViewControls({
  cameraApiRef,
  dragMode,
  setDragMode,
  projection,
  setProjection,
  style,
  setStyle,
}: {
  cameraApiRef: React.MutableRefObject<CameraCommands | null>;
  dragMode: "rotate" | "pan";
  setDragMode: (m: "rotate" | "pan") => void;
  projection: ViewProjection;
  setProjection: (p: ViewProjection) => void;
  style: ViewStyle;
  setStyle: (s: ViewStyle) => void;
}) {
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2.5">
      <div className="glass-panel flex items-center gap-1 rounded-xl border border-white/10 p-1">
        {(["3d", "2d"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProjection(p)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
              projection === p ? "bg-cyan/15 text-cyan" : "text-text-tertiary hover:text-text-secondary",
            )}
          >
            {p}
          </button>
        ))}
        <div className="mx-0.5 h-4 w-px bg-white/10" />
        {(["satellite", "terrain"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            className={cn(
              "rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
              style === s ? "bg-cyan/15 text-cyan" : "text-text-tertiary hover:text-text-secondary",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="glass-panel flex items-center gap-1.5 rounded-xl border border-white/10 p-1.5">
        <IconBtn icon={RotateCw} title="Rotate (drag)" active={dragMode === "rotate"} onClick={() => setDragMode("rotate")} />
        <IconBtn icon={Move} title="Pan (drag)" active={dragMode === "pan"} onClick={() => setDragMode("pan")} />
        <IconBtn icon={ArrowUpDown} title="Tilt — drag with rotate mode active" />
        <div className="mx-0.5 h-5 w-px bg-white/10" />
        <IconBtn icon={ZoomIn} title="Zoom in" onClick={() => cameraApiRef.current?.zoomIn()} />
        <IconBtn icon={ZoomOut} title="Zoom out" onClick={() => cameraApiRef.current?.zoomOut()} />
        <IconBtn icon={RefreshCcw} title="Reset view" onClick={() => cameraApiRef.current?.reset()} />
      </div>
    </div>
  );
}
