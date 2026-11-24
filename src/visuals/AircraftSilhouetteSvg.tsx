import type { QualityMode } from '../app/store';

interface AircraftSilhouetteSvgProps {
  variant?: 'awakening' | 'dawn';
  qualityMode: QualityMode;
  scrollProgress?: number;
  reducedMotion?: boolean;
}

/**
 * Bespoke conceptual 6-tilt-rotor eVTOL side-profile silhouette.
 * Lit by a single directional key light with crisp aluminum edge rim and zero bloom clutter.
 * Responds smoothly to scrollProgress for continuous cinema camera drift and lighting sweep.
 * Explicitly marked [D] conceptual teaching silhouette (not a proprietary CAD drawing).
 */
export function AircraftSilhouetteSvg({
  variant = 'awakening',
  qualityMode,
  scrollProgress = 0,
  reducedMotion = false,
}: AircraftSilhouetteSvgProps) {
  const isDawn = variant === 'dawn';
  const p = reducedMotion ? 0 : Math.max(0, Math.min(1, scrollProgress));
  const beamShiftX = isDawn ? (p - 0.5) * 90 : p * 180;
  const craftLiftY = isDawn ? -p * 10 : -p * 26;
  const craftShiftX = isDawn ? 0 : p * 22;
  const dawnOpacity = isDawn ? 0.55 + p * 0.45 : 1;

  return (
    <svg
      viewBox="0 0 1120 420"
      role="img"
      aria-label={
        isDawn
          ? '晨光照明下的电动垂直起降飞行器教学概念剪影'
          : '深色侧逆光揭示的电动垂直起降飞行器教学概念剪影'
      }
      className="h-auto w-full select-none"
    >
      <defs>
        {/* Single directional key light cone */}
        <linearGradient id={`keylight-${variant}`} x1="12%" y1="0%" x2="72%" y2="85%">
          <stop offset="0%" stopColor={isDawn ? '#F2EFE7' : '#D99A45'} stopOpacity={isDawn ? '0.26' : '0.18'} />
          <stop offset="48%" stopColor={isDawn ? '#D99A45' : '#B8C1C8'} stopOpacity={isDawn ? '0.12' : '0.07'} />
          <stop offset="100%" stopColor="#0A0E13" stopOpacity="0" />
        </linearGradient>

        {/* Subtle metallic fuselage shading */}
        <linearGradient id={`hull-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isDawn ? '#2B3542' : '#1E2630'} />
          <stop offset="45%" stopColor="#121821" />
          <stop offset="100%" stopColor="#0A0E13" />
        </linearGradient>

        {/* Rim light edge stroke */}
        <linearGradient id={`rim-${variant}`} x1="15%" y1="0%" x2="88%" y2="100%">
          <stop offset="0%" stopColor="#F2EFE7" stopOpacity="0.94" />
          <stop offset="52%" stopColor={isDawn ? '#D99A45' : '#B8C1C8'} stopOpacity="0.64" />
          <stop offset="100%" stopColor="#B8C1C8" stopOpacity="0.18" />
        </linearGradient>

        {/* Dawn horizon gradient for Act V */}
        <linearGradient id="dawn-horizon" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#D99A45" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#638DB0" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#0A0E13" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Atmospheric backdrop layer */}
      {isDawn && (
        <rect
          x="0"
          y="120"
          width="1120"
          height="300"
          fill="url(#dawn-horizon)"
          opacity={dawnOpacity}
        />
      )}
      {qualityMode === 'standard' && (
        <g transform={`translate(${beamShiftX.toFixed(1)}, 0)`}>
          <polygon points="40,0 560,0 890,420 140,420" fill={`url(#keylight-${variant})`} />
        </g>
      )}

      {/* Subtle calibrated horizon & datum lines */}
      <line x1="60" y1="342" x2="1060" y2="342" stroke="#B8C1C8" strokeOpacity="0.18" strokeWidth="1" />
      <line
        x1="120"
        y1="236"
        x2="980"
        y2="236"
        stroke="#B8C1C8"
        strokeOpacity="0.09"
        strokeWidth="1"
        strokeDasharray="4 6"
      />

      {/* Datum ticks */}
      {[180, 340, 560, 780, 940].map((x) => (
        <g key={x} opacity="0.28">
          <line x1={x} y1="337" x2={x} y2="347" stroke="#B8C1C8" strokeWidth="1" />
        </g>
      ))}

      {/* Aircraft body group lifts smoothly as user scrolls */}
      <g transform={`translate(${craftShiftX.toFixed(1)}, ${craftLiftY.toFixed(1)})`}>
      {/* Far-side rear boom & V-tail */}
      <path
        d="M540 202 L860 198 L935 124 L962 124 L895 208 L540 218 Z"
        fill="#10151D"
        stroke="#B8C1C8"
        strokeOpacity="0.35"
        strokeWidth="1.1"
      />

      {/* Main high-wing chord profile */}
      <path
        d="M368 188 C435 170 572 170 658 188 L645 202 C568 194 438 194 375 202 Z"
        fill={`url(#hull-${variant})`}
        stroke={`url(#rim-${variant})`}
        strokeWidth="1.4"
      />

      {/* Tilt-rotor nacelles & translucent rotor discs (conceptual 6-rotor eVTOL profile) */}
      {/* Forward wing-mounted tilt rotor */}
      <g>
        <rect x="330" y="166" width="54" height="16" rx="7" fill="#171E28" stroke="#B8C1C8" strokeOpacity="0.65" strokeWidth="1.2" />
        <line x1="357" y1="150" x2="357" y2="166" stroke="#B8C1C8" strokeOpacity="0.6" strokeWidth="2" />
        <ellipse cx="357" cy="148" rx="74" ry="5" fill="#F2EFE7" fillOpacity="0.14" stroke="#F2EFE7" strokeOpacity="0.45" strokeWidth="1" />
      </g>

      {/* Mid-wing outboard nacelle */}
      <g>
        <rect x="526" y="162" width="58" height="17" rx="7.5" fill="#171E28" stroke="#B8C1C8" strokeOpacity="0.7" strokeWidth="1.2" />
        <line x1="555" y1="144" x2="555" y2="162" stroke="#B8C1C8" strokeOpacity="0.6" strokeWidth="2" />
        <ellipse cx="555" cy="142" rx="82" ry="5.5" fill="#F2EFE7" fillOpacity="0.14" stroke="#F2EFE7" strokeOpacity="0.5" strokeWidth="1" />
      </g>

      {/* Tail-mounted aft tilt rotor */}
      <g>
        <rect x="888" y="116" width="46" height="14" rx="6" fill="#171E28" stroke="#B8C1C8" strokeOpacity="0.6" strokeWidth="1.2" />
        <line x1="911" y1="102" x2="911" y2="116" stroke="#B8C1C8" strokeOpacity="0.55" strokeWidth="1.8" />
        <ellipse cx="911" cy="100" rx="64" ry="4.5" fill="#F2EFE7" fillOpacity="0.12" stroke="#F2EFE7" strokeOpacity="0.4" strokeWidth="1" />
      </g>

      {/* Primary streamlined fuselage silhouette */}
      <path
        d="M210 258
           C222 222 276 196 365 190
           C462 184 568 188 672 204
           L868 205
           L936 132
           L954 134
           L888 220
           C812 232 712 246 626 266
           C538 286 410 294 300 286
           C238 281 206 271 210 258 Z"
        fill={`url(#hull-${variant})`}
        stroke={`url(#rim-${variant})`}
        strokeWidth="1.7"
      />

      {/* Canopy glazing highlight */}
      <path
        d="M254 242 C276 218 328 205 398 202 L434 234 C370 239 306 243 254 242 Z"
        fill="#0A0E13"
        fillOpacity="0.72"
        stroke="#F2EFE7"
        strokeOpacity="0.45"
        strokeWidth="1.1"
      />
      <path
        d="M446 204 L530 206 L536 232 L448 234 Z"
        fill="#0A0E13"
        fillOpacity="0.62"
        stroke="#B8C1C8"
        strokeOpacity="0.32"
        strokeWidth="1"
      />

      {/* Specular directional highlight edge along upper dorsal line */}
      <path
        d="M266 226 C318 197 416 186 588 192"
        fill="none"
        stroke={isDawn ? '#F2EFE7' : '#D99A45'}
        strokeOpacity="0.68"
        strokeWidth="1.6"
      />

      {/* Conceptual battery bay outline inside lower belly */}
      <rect
        x="398"
        y="248"
        width="168"
        height="24"
        rx="3"
        fill="none"
        stroke="#D99A45"
        strokeOpacity="0.4"
        strokeDasharray="4 4"
        strokeWidth="1"
      />

      {/* Subtle landing gear struts */}
      <g stroke="#B8C1C8" strokeOpacity="0.42" strokeWidth="1.6">
        <line x1="312" y1="286" x2="306" y2="336" />
        <circle cx="306" cy="336" r="6" fill="#11161E" />
        <line x1="566" y1="274" x2="574" y2="336" />
        <circle cx="574" cy="336" r="7" fill="#11161E" />
      </g>
      </g>

      {/* Quiet technical caption embedded inside canvas margin */}
      <text
        x="64"
        y="374"
        fill="#84909B"
        fontSize="11"
        fontFamily="var(--font-mono)"
        letterSpacing="1.2"
      >
        FIG 0.1 · CONCEPTUAL TILT-ROTOR SILHOUETTE [D] — NOT MANUFACTURER CAD
      </text>
      <text
        x="1056"
        y="374"
        textAnchor="end"
        fill="#84909B"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        {isDawn ? 'ACT V · ENGINEERING TRANSPARENCY' : 'ACT 0 · SINGLE KEY-LIGHT STUDY'}
      </text>
    </svg>
  );
}
