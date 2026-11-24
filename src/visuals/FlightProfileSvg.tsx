import { interpolateFlightAircraft } from '../app/scrollDirector';
import { FLIGHT_PHASES } from '../safety/data';
import type { FlightPhaseId } from '../safety/types';

interface FlightProfileSvgProps {
  activePhase: FlightPhaseId;
  scrollProgress?: number;
  onSelectPhase: (phase: FlightPhaseId) => void;
}

const PHASE_COORDS: Record<FlightPhaseId, { x: number; y: number; nacelleDeg: number }> = {
  takeoff: { x: 110, y: 214, nacelleDeg: 0 },
  climb: { x: 285, y: 124, nacelleDeg: 42 },
  cruise: { x: 520, y: 74, nacelleDeg: 86 },
  approach: { x: 755, y: 130, nacelleDeg: 40 },
  landing: { x: 925, y: 214, nacelleDeg: 0 },
};

export function FlightProfileSvg({
  activePhase,
  scrollProgress,
  onSelectPhase,
}: FlightProfileSvgProps) {
  const activeCoord =
    typeof scrollProgress === 'number'
      ? interpolateFlightAircraft(scrollProgress)
      : PHASE_COORDS[activePhase];

  return (
    <div className="relative border border-[#B8C1C8]/14 bg-[#11161E] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#84909B]">
        <span className="font-mono-tabular">FIG 1.1 · 典型任务飞行剖面与倾转姿态示意 [D]</span>
        <span>随滚轮自动推演飞行轨迹，亦可点击节点直接跳转</span>
      </div>

      <svg
        viewBox="0 0 1040 290"
        role="img"
        aria-label="五阶段飞行任务剖面与旋翼倾转姿态概念图"
        className="h-auto w-full select-none"
      >
        {/* Horizon and altitude bands */}
        <line x1="48" y1="246" x2="992" y2="246" stroke="#B8C1C8" strokeOpacity="0.28" strokeWidth="1" />
        <line x1="48" y1="160" x2="992" y2="160" stroke="#B8C1C8" strokeOpacity="0.1" strokeDasharray="4 6" />
        <line x1="48" y1="74" x2="992" y2="74" stroke="#B8C1C8" strokeOpacity="0.1" strokeDasharray="4 6" />

        <text x="54" y="66" fill="#84909B" fontSize="10" fontFamily="var(--font-mono)">
          WINGBORNE CRUISE BAND [D]
        </text>
        <text x="54" y="152" fill="#84909B" fontSize="10" fontFamily="var(--font-mono)">
          TRANSITION COUPLING BAND [D]
        </text>
        <text x="54" y="264" fill="#84909B" fontSize="10" fontFamily="var(--font-mono)">
          VERTIPORT SURFACE / GROUND ENVELOPE
        </text>

        {/* Vertiport pads */}
        <rect x="82" y="242" width="56" height="5" fill="#B8C1C8" fillOpacity="0.5" />
        <rect x="897" y="242" width="56" height="5" fill="#B8C1C8" fillOpacity="0.5" />

        {/* Trajectory curve */}
        <path
          d="M110 242 L110 214 C150 176 218 144 285 124 C365 98 430 74 520 74 C610 74 680 98 755 130 C826 156 892 184 925 214 L925 242"
          fill="none"
          stroke="#B8C1C8"
          strokeOpacity="0.34"
          strokeWidth="2"
        />

        {/* Highlighted transition risk envelope zones */}
        <path
          d="M110 214 C150 176 218 144 285 124"
          fill="none"
          stroke="#D99A45"
          strokeOpacity={activePhase === 'takeoff' || activePhase === 'climb' ? 0.95 : 0.35}
          strokeWidth={activePhase === 'takeoff' || activePhase === 'climb' ? 3 : 2}
        />
        <path
          d="M755 130 C826 156 892 184 925 214"
          fill="none"
          stroke="#D99A45"
          strokeOpacity={activePhase === 'approach' || activePhase === 'landing' ? 0.95 : 0.35}
          strokeWidth={activePhase === 'approach' || activePhase === 'landing' ? 3 : 2}
        />
        <path
          d="M285 124 C365 98 430 74 520 74 C610 74 680 98 755 130"
          fill="none"
          stroke="#638DB0"
          strokeOpacity={activePhase === 'cruise' ? 0.95 : 0.35}
          strokeWidth={activePhase === 'cruise' ? 3 : 2}
        />

        {/* Dynamic drop datum line under flying aircraft */}
        <line
          x1={activeCoord.x}
          y1={activeCoord.y - 24}
          x2={activeCoord.x}
          y2="246"
          stroke="#D99A45"
          strokeOpacity="0.4"
          strokeDasharray="3 4"
        />

        {/* Conceptual aircraft attitude glyph flying continuously along scroll progress */}
        <g transform={`translate(${activeCoord.x.toFixed(1)}, ${(activeCoord.y - 34).toFixed(1)})`}>
          <line x1="-28" y1="0" x2="28" y2="0" stroke="#F2EFE7" strokeWidth="2.6" strokeLinecap="round" />
          <g transform={`translate(-15, -3) rotate(${activeCoord.nacelleDeg.toFixed(1)})`}>
            <line x1="0" y1="0" x2="0" y2="-12" stroke="#D99A45" strokeWidth="2.2" />
            <line x1="-11" y1="-12" x2="11" y2="-12" stroke="#F2EFE7" strokeWidth="1.7" />
          </g>
          <g transform={`translate(15, -3) rotate(${activeCoord.nacelleDeg.toFixed(1)})`}>
            <line x1="0" y1="0" x2="0" y2="-12" stroke="#D99A45" strokeWidth="2.2" />
            <line x1="-11" y1="-12" x2="11" y2="-12" stroke="#F2EFE7" strokeWidth="1.7" />
          </g>
          <text
            x="0"
            y="-22"
            textAnchor="middle"
            fill="#D99A45"
            fontSize="9.5"
            fontFamily="var(--font-mono)"
          >
            TILT {Math.round(activeCoord.nacelleDeg)}°
          </text>
        </g>

        {/* Interactive phase nodes */}
        {FLIGHT_PHASES.map((phase) => {
          const coord = PHASE_COORDS[phase.id];
          const isActive = phase.id === activePhase;
          return (
            <g
              key={phase.id}
              role="button"
              tabIndex={0}
              aria-label={`选择飞行阶段：${phase.nameZh}`}
              onClick={() => onSelectPhase(phase.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPhase(phase.id);
                }
              }}
              className="cursor-pointer"
            >
              <line
                x1={coord.x}
                y1={coord.y}
                x2={coord.x}
                y2="246"
                stroke={isActive ? '#D99A45' : '#B8C1C8'}
                strokeOpacity={isActive ? 0.65 : 0.16}
                strokeDasharray="2 4"
              />
              <circle
                cx={coord.x}
                cy={coord.y}
                r={isActive ? 9 : 6}
                fill={isActive ? '#D99A45' : '#11161E'}
                stroke={isActive ? '#F2EFE7' : '#B8C1C8'}
                strokeWidth="2"
              />
              <text
                x={coord.x}
                y="278"
                textAnchor="middle"
                fill={isActive ? '#F2EFE7' : '#84909B'}
                fontSize="12"
                fontWeight={isActive ? 600 : 400}
              >
                {phase.order}. {phase.nameZh}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
