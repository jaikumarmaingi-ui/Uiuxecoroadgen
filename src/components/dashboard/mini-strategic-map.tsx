const PLACES = [
  { key: "leh", label: "LEH", x: 235, y: 35 },
  { key: "kargil", label: "KARGIL", x: 165, y: 95 },
  { key: "srinagar", label: "SRINAGAR", x: 55, y: 175 },
];

export function MiniStrategicMap() {
  return (
    <div className="pointer-events-none w-full max-w-[280px]">
      <div className="text-right font-display text-xs font-bold leading-tight tracking-[0.25em] text-text-secondary">
        STRATEGIC ROADS
        <br />
        <span className="text-green">STRONGER NATION</span>
      </div>
      <svg viewBox="0 0 280 210" className="mt-3 w-full">
        {/* stylized region silhouette */}
        <path
          d="M20 200 L15 150 L45 130 L35 100 L70 90 L60 60 L100 55 L110 25 L160 15 L200 30 L230 15 L260 40 L250 80 L270 110 L245 150 L255 190 L200 195 L170 170 L120 185 L80 165 Z"
          fill="rgba(148,178,200,0.05)"
          stroke="rgba(148,178,200,0.22)"
          strokeWidth="1.2"
        />
        <path d="M50 175 L100 122 L155 95 L215 40" fill="none" stroke="var(--accent-green)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        <path
          d="M50 175 L100 122 L155 95 L215 40"
          fill="none"
          stroke="var(--accent-green)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.18"
        />
        {PLACES.map((p) => (
          <g key={p.key} transform={`translate(${p.x}, ${p.y})`}>
            <circle r="9" fill="var(--accent-cyan)" opacity="0.15" />
            <circle r="4" fill="var(--accent-cyan)" />
            <text x="9" y="4" fontSize="10" fill="rgba(231,238,243,0.9)" fontFamily="var(--font-mono)" letterSpacing="0.5">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
