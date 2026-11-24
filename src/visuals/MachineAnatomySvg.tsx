import type { QualityMode } from '../app/store';
import { SUBSYSTEMS } from '../safety/data';
import type { SubsystemId } from '../safety/types';

export type AnatomyOverlayMode = 'overview' | 'energy' | 'control';

interface MachineAnatomySvgProps {
  selectedSubsystem: SubsystemId;
  overlayMode: AnatomyOverlayMode;
  qualityMode: QualityMode;
  onSelectSubsystem: (subsystem: SubsystemId) => void;
}

/**
 * High-precision layered 2D conceptual technical dissection of a 6-tilt-rotor eVTOL [D].
 * Clearly displays the two engineering flow streams required in Act II:
 * 1) Energy Stream: Battery -> Power Distribution -> Distributed Propulsion
 * 2) Control Loop: Sensors -> Flight Control Computer -> Tilt/Surface Actuators
 * All 6 subsystem hotspots are spaced with non-overlapping numbered callouts.
 */
export function MachineAnatomySvg({
  selectedSubsystem,
  overlayMode,
  qualityMode,
  onSelectSubsystem,
}: MachineAnatomySvgProps) {
  const showEnergy = overlayMode === 'overview' || overlayMode === 'energy';
  const showControl = overlayMode === 'overview' || overlayMode === 'control';

  return (
    <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#84909B]">
        <span className="font-mono-tabular">
          FIG 2.1 · 分布式电推进航空器分层教学概念解剖图 [D]
        </span>
        <span>非 Joby S4 官方内部图纸 · 点击编号热点或左侧列表切换审查子系统</span>
      </div>

      <svg
        viewBox="0 0 860 410"
        role="img"
        aria-label="六大子系统分层技术解剖概念图：包含能源链路与飞控闭环"
        className="h-auto w-full select-none"
      >
        {/* Subtle technical reference grid */}
        {qualityMode === 'standard' && (
          <g stroke="#B8C1C8" strokeOpacity="0.06" strokeWidth="1">
            {[100, 200, 300, 400, 500, 600, 700, 800].map((x) => (
              <line key={`vx-${x}`} x1={x} y1="20" x2={x} y2="390" />
            ))}
            {[80, 160, 240, 320].map((y) => (
              <line key={`hy-${y}`} x1="30" y1={y} x2="830" y2={y} />
            ))}
          </g>
        )}

        {/* Airframe conceptual top-3/4 schematic */}
        {/* Main high wing */}
        <path
          d="M170 176 L360 156 L510 156 L690 176 L684 204 L515 198 L355 198 L176 204 Z"
          fill="#151C26"
          stroke={selectedSubsystem === 'structures' ? '#D99A45' : '#B8C1C8'}
          strokeOpacity={selectedSubsystem === 'structures' ? 0.95 : 0.4}
          strokeWidth={selectedSubsystem === 'structures' ? 2 : 1.2}
        />

        {/* Fuselage central pod */}
        <path
          d="M272 204 C298 176 362 164 435 164 C512 164 576 180 612 204 C572 232 508 246 435 246 C362 246 298 232 272 204 Z"
          fill="#121821"
          stroke={selectedSubsystem === 'structures' ? '#D99A45' : '#B8C1C8'}
          strokeOpacity={selectedSubsystem === 'structures' ? 0.9 : 0.45}
          strokeWidth="1.5"
        />

        {/* Tail booms & V-tail */}
        <path
          d="M575 196 L724 188 L754 140 L768 144 L736 198 L575 212 Z"
          fill="#121821"
          stroke={selectedSubsystem === 'actuators' ? '#D99A45' : '#B8C1C8'}
          strokeOpacity={selectedSubsystem === 'actuators' ? 0.9 : 0.35}
          strokeWidth="1.3"
        />
        <path
          d="M575 212 L724 222 L754 270 L768 266 L736 212 Z"
          fill="#121821"
          stroke={selectedSubsystem === 'actuators' ? '#D99A45' : '#B8C1C8'}
          strokeOpacity={selectedSubsystem === 'actuators' ? 0.9 : 0.35}
          strokeWidth="1.3"
        />

        {/* Six conceptual tilt-rotor nacelles */}
        {[
          { x: 205, y: 158 },
          { x: 275, y: 146 },
          { x: 585, y: 146 },
          { x: 655, y: 158 },
          { x: 752, y: 140 },
          { x: 752, y: 268 },
        ].map((nacelle, idx) => (
          <g key={`nac-${idx}`}>
            <rect
              x={nacelle.x - 16}
              y={nacelle.y - 7}
              width="32"
              height="14"
              rx="4"
              fill="#1A222D"
              stroke={selectedSubsystem === 'propulsion' ? '#D99A45' : '#B8C1C8'}
              strokeOpacity={selectedSubsystem === 'propulsion' ? 0.95 : 0.55}
              strokeWidth="1.2"
            />
            <circle
              cx={nacelle.x}
              cy={nacelle.y}
              r="22"
              fill="none"
              stroke="#B8C1C8"
              strokeOpacity="0.2"
              strokeDasharray="3 4"
            />
          </g>
        ))}

        {/* Conceptual internal battery packs */}
        <g>
          <rect
            x="390"
            y="196"
            width="92"
            height="34"
            rx="3"
            fill={selectedSubsystem === 'power' ? '#D99A45' : '#1E2733'}
            fillOpacity={selectedSubsystem === 'power' ? 0.24 : 0.9}
            stroke={selectedSubsystem === 'power' ? '#D99A45' : '#B8C1C8'}
            strokeOpacity={selectedSubsystem === 'power' ? 0.95 : 0.5}
            strokeWidth="1.4"
          />
          <line x1="421" y1="196" x2="421" y2="230" stroke="#B8C1C8" strokeOpacity="0.3" />
          <line x1="452" y1="196" x2="452" y2="230" stroke="#B8C1C8" strokeOpacity="0.3" />
          <text x="436" y="217" textAnchor="middle" fill="#F2EFE7" fontSize="9.5" fontFamily="var(--font-mono)">
            HV BATT [D]
          </text>
        </g>

        {/* Conceptual Flight Control & Sensor Core */}
        <g>
          <rect
            x="326"
            y="174"
            width="52"
            height="26"
            rx="2"
            fill={selectedSubsystem === 'flight-control' ? '#638DB0' : '#1A232E'}
            fillOpacity={selectedSubsystem === 'flight-control' ? 0.34 : 0.95}
            stroke={selectedSubsystem === 'flight-control' ? '#F2EFE7' : '#638DB0'}
            strokeWidth="1.4"
          />
          <text x="352" y="191" textAnchor="middle" fill="#F2EFE7" fontSize="9" fontFamily="var(--font-mono)">
            FCC/IMU
          </text>
        </g>

        {/* Energy Stream Overlay: Battery -> Power Bus -> Propulsion */}
        {showEnergy && (
          <g stroke="#D99A45" strokeWidth="2" fill="none" strokeOpacity={overlayMode === 'energy' ? 0.95 : 0.55}>
            <path d="M416 196 L416 168 L275 168 L275 153" />
            <path d="M275 168 L205 168 L205 165" />
            <path d="M456 196 L456 168 L585 168 L585 153" />
            <path d="M585 168 L655 168 L655 165" />
            <path d="M482 213 L710 213 L752 148" strokeDasharray="5 4" />
            <path d="M710 213 L752 262" strokeDasharray="5 4" />
          </g>
        )}

        {/* Control Loop Overlay: Sensors -> Flight Control -> Actuators */}
        {showControl && (
          <g stroke="#638DB0" strokeWidth="1.8" fill="none" strokeOpacity={overlayMode === 'control' ? 0.95 : 0.55}>
            <path d="M286 204 L326 188" strokeDasharray="3 3" />
            <path d="M378 184 L645 184 L645 165" strokeDasharray="4 3" />
            <path d="M645 184 L735 190 L750 152" strokeDasharray="4 3" />
            <path d="M735 190 L750 258" strokeDasharray="4 3" />
          </g>
        )}

        {/* Environment / External envelope boundary arc */}
        <path
          d="M112 290 C138 258 186 244 236 254"
          fill="none"
          stroke={selectedSubsystem === 'environment' ? '#D99A45' : '#84909B'}
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Interactive Non-Overlapping Subsystem Hotspots with Leader Lines */}
        {SUBSYSTEMS.map((sub, idx) => {
          const isSelected = sub.id === selectedSubsystem;
          return (
            <g
              key={sub.id}
              role="button"
              tabIndex={0}
              aria-label={`选择子系统 ${idx + 1}：${sub.nameZh}`}
              onClick={() => onSelectSubsystem(sub.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSubsystem(sub.id);
                }
              }}
              className="cursor-pointer"
            >
              {/* Leader line from anatomy coordinate to quiet external callout */}
              <line
                x1={sub.hotspot.x}
                y1={sub.hotspot.y}
                x2={sub.hotspot.labelX}
                y2={sub.hotspot.labelY}
                stroke={isSelected ? '#D99A45' : '#B8C1C8'}
                strokeOpacity={isSelected ? 0.95 : 0.32}
                strokeWidth={isSelected ? 1.6 : 1}
              />

              {/* Anchor circle on aircraft */}
              <circle
                cx={sub.hotspot.x}
                cy={sub.hotspot.y}
                r={isSelected ? 11 : 8}
                fill={isSelected ? '#D99A45' : '#0A0E13'}
                stroke={isSelected ? '#F2EFE7' : '#B8C1C8'}
                strokeWidth="1.8"
              />
              <text
                x={sub.hotspot.x}
                y={sub.hotspot.y + 3.5}
                textAnchor="middle"
                fill={isSelected ? '#0A0E13' : '#F2EFE7'}
                fontSize="10"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {idx + 1}
              </text>

              {/* Callout label block placed in negative space */}
              <g transform={`translate(${sub.hotspot.labelX}, ${sub.hotspot.labelY})`}>
                <rect
                  x="-76"
                  y="-16"
                  width="152"
                  height="30"
                  fill={isSelected ? '#1B232F' : '#0D1219'}
                  stroke={isSelected ? '#D99A45' : '#B8C1C8'}
                  strokeOpacity={isSelected ? 1 : 0.25}
                  strokeWidth={isSelected ? 1.4 : 1}
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill={isSelected ? '#F2EFE7' : '#B8C1C8'}
                  fontSize="11"
                  fontWeight={isSelected ? 600 : 400}
                >
                  {idx + 1}. {sub.shortLabelZh}
                </text>
              </g>
            </g>
          );
        })}

        {/* Stream Legend at bottom right */}
        <g transform="translate(470, 392)" fontSize="10.5" fontFamily="var(--font-mono)">
          <line x1="0" y1="-4" x2="22" y2="-4" stroke="#D99A45" strokeWidth="2" />
          <text x="28" y="0" fill="#B8C1C8">能源流：电池→配电→推进</text>
          <line x1="196" y1="-4" x2="218" y2="-4" stroke="#638DB0" strokeWidth="2" strokeDasharray="4 3" />
          <text x="224" y="0" fill="#B8C1C8">控制流：感知→飞控→执行</text>
        </g>
      </svg>
    </div>
  );
}
