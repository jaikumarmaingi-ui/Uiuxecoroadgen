"use client";

import Link from "next/link";
import { useState } from "react";
import { Radar as RadarIcon, Eye, ListOrdered, Wrench, Leaf, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

const NODES = [
  {
    key: "monitor",
    label: "MONITOR",
    icon: Eye,
    href: "/condition-monitoring",
    angle: 0,
    from: "#bfe9ff",
    to: "#3aa0c9",
  },
  {
    key: "predict",
    label: "PREDICT",
    icon: RadarIcon,
    href: "/risk-prediction",
    angle: 72,
    from: "#4f8bff",
    to: "#173a8c",
  },
  {
    key: "prioritize",
    label: "PRIORITIZE",
    icon: ListOrdered,
    href: "/repair-recommendations",
    angle: 144,
    from: "#ffb35e",
    to: "#9a5a12",
  },
  {
    key: "repair",
    label: "REPAIR",
    icon: Wrench,
    href: "/repair-recommendations",
    angle: 216,
    from: "#3f7d52",
    to: "#12291a",
  },
  {
    key: "sustain",
    label: "SUSTAIN",
    icon: Leaf,
    href: "/sustainability",
    angle: 288,
    from: "#6dffa0",
    to: "#1c8f5a",
  },
] as const;

const R = 168; // spike length
const HUB = 108; // hub diameter

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function AIIntelligenceStar() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]" style={{ perspective: 1400 }}>
      <div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d", transform: "rotateX(20deg)" }}
      >
        {/* ambient glow ring */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: R * 2.05,
            height: R * 2.05,
            background: "radial-gradient(circle, rgba(53,224,208,0.10), transparent 68%)",
            transform: "translateZ(-10px)",
          }}
        />

        {NODES.map((n) => {
          const active = hovered === n.key;
          const Icon = n.icon;
          const rad = toRad(n.angle);
          const labelR = R + 34;
          const lx = 50 + (labelR / 4.4) * Math.sin(rad);
          const ly = 50 - (labelR / 4.4) * Math.cos(rad);

          return (
            <div key={n.key} className="contents">
              {/* 3D spike facet */}
              <Link
                href={n.href}
                onMouseEnter={() => setHovered(n.key)}
                onMouseLeave={() => setHovered(null)}
                aria-label={n.label}
                className="absolute left-1/2 top-1/2 block cursor-pointer transition-transform duration-300 ease-out"
                style={{
                  width: 0,
                  height: 0,
                  transformStyle: "preserve-3d",
                  transform: `rotate(${n.angle}deg) translateZ(${active ? 26 : 6}px)`,
                }}
              >
                <div
                  className="absolute transition-[filter,transform] duration-300"
                  style={{
                    width: 128,
                    height: R,
                    left: -64,
                    top: -R,
                    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                    background: `linear-gradient(200deg, ${n.from} 0%, ${n.to} 78%)`,
                    filter: active
                      ? `drop-shadow(0 0 22px ${n.from}99) brightness(1.12)`
                      : `drop-shadow(0 4px 10px rgba(0,0,0,0.5)) brightness(0.92)`,
                    transform: active ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  {/* highlight facet (simulated 3D bevel) */}
                  <div
                    className="h-full w-full opacity-70"
                    style={{
                      clipPath: "polygon(50% 0%, 78% 100%, 22% 100%)",
                      background: `linear-gradient(200deg, rgba(255,255,255,0.55), transparent 60%)`,
                      mixBlendMode: "overlay",
                    }}
                  />
                </div>
              </Link>

              {/* upright icon + label */}
              <Link
                href={n.href}
                onMouseEnter={() => setHovered(n.key)}
                onMouseLeave={() => setHovered(null)}
                style={{ left: `${lx}%`, top: `${ly}%`, transform: "translate3d(-50%, -50%, 60px)", transformStyle: "preserve-3d" }}
                className="group absolute flex flex-col items-center gap-1.5"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur transition-all duration-200",
                    active ? "scale-110 border-white/70 bg-white/10" : "border-white/25 bg-black/30",
                  )}
                  style={{ boxShadow: active ? `0 0 18px ${n.from}aa` : "none" }}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                </div>
                <span className="font-display text-[10px] font-bold tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                  {n.label}
                </span>
              </Link>
            </div>
          );
        })}

        {/* center hub */}
        <div
          className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center rounded-full border border-cyan/50"
          style={{
            width: HUB,
            height: HUB,
            transform: `translate3d(-50%, -50%, 46px)`,
            background: "radial-gradient(circle at 35% 30%, #12242a, #030607 75%)",
            boxShadow: "0 0 0 1px rgba(53,224,208,0.15), 0 0 40px rgba(53,224,208,0.35), inset 0 2px 10px rgba(255,255,255,0.08)",
          }}
        >
          <span className="absolute inset-0 rounded-full animate-pulse-ring border border-cyan/50" />
          <BrainCircuit className="h-7 w-7 text-cyan" strokeWidth={1.5} />
          <span className="mt-1 text-center font-display text-[9px] font-bold leading-tight tracking-wider text-white">
            AI ROAD
            <br />
            <span className="text-cyan">INTELLIGENCE</span>
          </span>
        </div>
      </div>
    </div>
  );
}
