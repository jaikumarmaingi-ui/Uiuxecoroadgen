export function MountainHeroBackground() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 520"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#05080c" />
          <stop offset="60%" stopColor="#070c12" />
          <stop offset="100%" stopColor="#0a0f16" />
        </linearGradient>
        <linearGradient id="peakFar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2a36" />
          <stop offset="100%" stopColor="#0a0f16" />
        </linearGradient>
        <linearGradient id="peakMid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#233544" />
          <stop offset="100%" stopColor="#080c11" />
        </linearGradient>
        <linearGradient id="peakNear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c4152" />
          <stop offset="100%" stopColor="#05080c" />
        </linearGradient>
        <linearGradient id="roadGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#35e0d0" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#35e0d0" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      <rect width="1200" height="520" fill="url(#sky)" />

      {/* stars */}
      {Array.from({ length: 40 }).map((_, i) => {
        const x = (i * 137) % 1200;
        const y = (i * 53) % 160;
        return <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 1.4 : 0.7} fill="white" opacity={0.25 + (i % 4) * 0.1} />;
      })}

      {/* far peaks */}
      <path
        d="M0 300 L90 210 L160 270 L230 190 L300 260 L380 200 L460 280 L540 220 L620 290 L700 210 L800 270 L900 200 L1000 260 L1080 220 L1200 280 L1200 520 L0 520 Z"
        fill="url(#peakFar)"
      />
      {/* mid peaks */}
      <path
        d="M0 360 L120 260 L210 330 L300 240 L400 320 L520 250 L620 340 L740 260 L850 330 L960 270 L1080 340 L1200 290 L1200 520 L0 520 Z"
        fill="url(#peakMid)"
      />
      {/* near peaks with snow caps */}
      <path
        d="M0 430 L150 300 L260 400 L360 290 L480 410 L620 300 L760 420 L900 310 L1040 410 L1200 340 L1200 520 L0 520 Z"
        fill="url(#peakNear)"
      />
      <g fill="white" opacity="0.3">
        <path d="M150 300 L180 340 L150 332 L120 350 Z" />
        <path d="M360 290 L392 332 L360 322 L330 342 Z" />
      </g>

      {/* winding glowing road */}
      <path
        d="M -20 520 C 120 470, 90 430, 220 400 C 330 375, 300 340, 400 320 C 500 300, 470 260, 560 250"
        stroke="url(#roadGlow)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M -20 520 C 120 470, 90 430, 220 400 C 330 375, 300 340, 400 320 C 500 300, 470 260, 560 250"
        stroke="#e7eef3"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        strokeDasharray="6 8"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
