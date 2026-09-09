import { cn } from "@/lib/utils";

export function RoadThumbnail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={cn("h-full w-full", className)} preserveAspectRatio="xMidYMax slice" aria-hidden>
      <defs>
        <linearGradient id="thumb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#141d26" />
          <stop offset="100%" stopColor="#060a0f" />
        </linearGradient>
        <linearGradient id="thumb-peak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a5164" />
          <stop offset="100%" stopColor="#0a0f16" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#thumb-sky)" />
      <path d="M0 80 L35 45 L65 75 L95 40 L130 82 L170 50 L200 76 L200 120 L0 120 Z" fill="url(#thumb-peak)" />
      <g fill="white" opacity="0.85">
        <path d="M35 45 L43 58 L35 55 L27 61 Z" />
        <path d="M95 40 L104 55 L95 51 L86 58 Z" />
        <path d="M170 50 L178 62 L170 59 L162 65 Z" />
      </g>
      <path
        d="M-10 120 C 30 105, 20 90, 55 82 C 85 75, 75 62, 105 56"
        stroke="#93a5b3"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M-10 120 C 30 105, 20 90, 55 82 C 85 75, 75 62, 105 56"
        stroke="#e7eef3"
        strokeOpacity="0.6"
        strokeWidth="1"
        strokeDasharray="3 4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
