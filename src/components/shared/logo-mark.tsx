export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-back-peak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2530" />
          <stop offset="100%" stopColor="#0a0f16" />
        </linearGradient>
        <linearGradient id="logo-front-peak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5fe08a" />
          <stop offset="100%" stopColor="#1c8f5a" />
        </linearGradient>
        <linearGradient id="logo-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7eef3" />
          <stop offset="100%" stopColor="#93a5b3" />
        </linearGradient>
      </defs>
      {/* back peak */}
      <path d="M30 8 L44 40 H16 Z" fill="url(#logo-back-peak)" stroke="#35e0d0" strokeOpacity="0.25" strokeWidth="0.5" />
      {/* front peak */}
      <path d="M18 14 L34 40 H2 Z" fill="url(#logo-front-peak)" />
      {/* snow cap */}
      <path d="M18 14 L22.5 21 L18.5 19.5 L15 24 L23 24 L18 14 Z" fill="white" fillOpacity="0.9" />
      {/* winding road */}
      <path
        d="M18 40 C 16 35, 21 33, 19 29 C 17.5 26, 21.5 25, 20 22"
        stroke="url(#logo-road)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* small flag */}
      <line x1="38" y1="14" x2="38" y2="24" stroke="#ff4d4d" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M38 14 L44 16.5 L38 19 Z" fill="#ff4d4d" />
    </svg>
  );
}
