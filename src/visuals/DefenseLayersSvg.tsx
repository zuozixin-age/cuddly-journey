import { MITIGATION_LAYERS } from '../safety/data';

interface DefenseLayersSvgProps {
  selectedMitigation: string;
  onSelectMitigation: (mitigationId: string) => void;
}

/**
 * Calibrated 7-layer defense-in-depth visual barrier stack [D].
 * Illuminates progressively as the viewer scrolls through Act IV.
 */
export function DefenseLayersSvg({
  selectedMitigation,
  onSelectMitigation,
}: DefenseLayersSvgProps) {
  const activeIdx = Math.max(
    0,
    MITIGATION_LAYERS.findIndex((m) => m.id === selectedMitigation),
  );

  return (
    <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#84909B]">
        <span className="font-mono-tabular">FIG 4.1 · 七层纵深防护屏障模型 [D]</span>
        <span>随滚轮逐层点亮防御边界</span>
      </div>

      <svg
        viewBox="0 0 540 310"
        role="img"
        aria-label="七层纵深防护屏障概念示意图"
        className="h-auto w-full select-none"
      >
        {/* Outer hazard vector arrow */}
        <line x1="18" y1="155" x2="62" y2="155" stroke="#B94C44" strokeWidth="2" />
        <polygon points="58,150 66,155 58,160" fill="#B94C44" />
        <text x="14" y="138" fill="#B94C44" fontSize="9.5" fontFamily="var(--font-mono)">
          HAZARD
        </text>
        <text x="14" y="176" fill="#84909B" fontSize="9.5">
          危险源传播
        </text>

        {/* 7 calibrated vertical defense gates */}
        {MITIGATION_LAYERS.map((layer, idx) => {
          const x = 80 + idx * 54;
          const isCurrent = idx === activeIdx;
          const isEngaged = idx <= activeIdx;
          const stroke = isCurrent ? '#D99A45' : isEngaged ? '#638DB0' : 'rgba(184,193,200,0.22)';
          const fill = isCurrent ? '#1B222D' : isEngaged ? '#121A24' : '#0D1219';

          return (
            <g
              key={layer.id}
              role="button"
              tabIndex={0}
              aria-label={`定位第 ${layer.layerOrder} 层防护：${layer.nameZh}`}
              onClick={() => onSelectMitigation(layer.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMitigation(layer.id);
                }
              }}
              className="cursor-pointer"
            >
              {/* Barrier column */}
              <rect
                x={x}
                y={36}
                width="36"
                height="214"
                fill={fill}
                stroke={stroke}
                strokeWidth={isCurrent ? 2 : 1.1}
              />
              {/* Calibrated top code */}
              <text
                x={x + 18}
                y="24"
                textAnchor="middle"
                fill={isCurrent ? '#D99A45' : '#84909B'}
                fontSize="9.5"
                fontFamily="var(--font-mono)"
                fontWeight={isCurrent ? 600 : 400}
              >
                L0{layer.layerOrder}
              </text>
              {/* Vertical index label */}
              <text
                x={x + 18}
                y="148"
                textAnchor="middle"
                fill={isCurrent ? '#F2EFE7' : isEngaged ? '#B8C1C8' : '#84909B'}
                fontSize="10"
                fontFamily="var(--font-mono)"
                transform={`rotate(-90 ${x + 18} 148)`}
              >
                {layer.code} · {layer.coveredRiskIds.length} RSK
              </text>
              {/* Residual gap notch (honestly shows no single layer eliminates 100% risk) */}
              <rect
                x={x + 11}
                y={224 - idx * 14}
                width="14"
                height="6"
                fill="#0A0E13"
                stroke="#B94C44"
                strokeOpacity={isCurrent ? 0.85 : 0.3}
                strokeWidth="0.9"
              />
            </g>
          );
        })}

        {/* Right residual risk containment endpoint */}
        <rect
          x="466"
          y="78"
          width="60"
          height="130"
          fill="#181215"
          stroke="#B94C44"
          strokeOpacity="0.55"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <text x="496" y="138" textAnchor="middle" fill="#B94C44" fontSize="9.5" fontFamily="var(--font-mono)">
          RESIDUAL
        </text>
        <text x="496" y="156" textAnchor="middle" fill="#B8C1C8" fontSize="10">
          剩余风险
        </text>
        <text x="496" y="172" textAnchor="middle" fill="#84909B" fontSize="9">
          永不为零
        </text>

        {/* Bottom footnote */}
        <text x="80" y="286" fill="#84909B" fontSize="10">
          每层留有示意性缺口：单层防护均存在共因失效与未知边缘工况，必须依靠多层叠加与独立验证收敛。
        </text>
      </svg>
    </div>
  );
}
