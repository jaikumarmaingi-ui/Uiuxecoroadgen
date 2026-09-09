const PLACES = [
  { key: "leh", label: "LEH", x: 210, y: 30 },
  { key: "kargil", label: "KARGIL", x: 150, y: 78 },
  { key: "srinagar", label: "SRINAGAR", x: 50, y: 140 },
];

export function MiniStrategicMap() {
  return (
    <div className="w-full max-w-[240px]">
      <div className="text-right font-display text-[11px] font-bold leading-tight tracking-[0.2em] text-text-secondary">
        STRATEGIC ROADS
        <br />
        <span className="text-cyan">STRONGER NATION</span>
      </div>
      <svg viewBox="0 0 260 170" className="mt-2 w-full opacity-90">
        <path
          d="M30 155 L60 120 L40 90 L90 70 L70 40 L130 20"
          fill="none"
          stroke="rgba(148,178,200,0.25)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path d="M50 140 L100 92 L150 78 L210 30" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
        {PLACES.map((p) => (
          <g key={p.key} transform={`translate(${p.x}, ${p.y})`}>
            <circle r="4" fill="var(--accent-cyan)" />
            <circle r="8" fill="none" stroke="var(--accent-cyan)" strokeOpacity="0.4" />
            <text x="8" y="4" fontSize="9" fill="rgba(231,238,243,0.85)" fontFamily="var(--font-mono)" letterSpacing="0.5">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
