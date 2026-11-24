import type { PropagationNode } from '../safety/types';

interface PropagationGraphSvgProps {
  nodes: PropagationNode[];
  activeNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

const NODE_POSITIONS = [
  { x: 20, y: 34 },
  { x: 185, y: 34 },
  { x: 350, y: 34 },
  { x: 515, y: 34 },
  { x: 680, y: 34 },
  { x: 845, y: 34 },
];

function toneStroke(tone: PropagationNode['severityTone'], active: boolean, upstream: boolean): string {
  if (active) {
    if (tone === 'crimson') return '#B94C44';
    if (tone === 'blue') return '#638DB0';
    return '#D99A45';
  }
  if (upstream) {
    return tone === 'crimson' ? '#B94C44' : '#D99A45';
  }
  return 'rgba(184,193,200,0.22)';
}

function splitTitleCleanly(title: string): [string, string?] {
  if (title.length <= 9) return [title];
  // Prefer splitting on natural delimiters (+, /, 、, 与, 及) near center
  const delimiters = [' + ', ' / ', '、', '与', '及', '/'];
  const mid = Math.floor(title.length / 2);
  let bestIdx = -1;
  let bestDist = Infinity;
  for (const d of delimiters) {
    const idx = title.indexOf(d);
    if (idx > 2 && idx < title.length - 2) {
      const dist = Math.abs(idx - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx + (d === '、' || d === '/' ? d.length : 0);
      }
    }
  }
  if (bestIdx !== -1) {
    const first = title.slice(0, bestIdx).trim();
    const second = title.slice(bestIdx).trim();
    if (first.length <= 10 && second.length <= 10) {
      return [first, second];
    }
  }
  const splitAt = Math.ceil(title.length / 2);
  return [title.slice(0, splitAt), title.slice(splitAt)];
}

/**
 * Data-driven SVG risk propagation diagram for Act III.
 * Clicking any node illuminates the causal propagation chain from step 1 up to the active node.
 */
export function PropagationGraphSvg({
  nodes,
  activeNodeId,
  onSelectNode,
}: PropagationGraphSvgProps) {
  const activeIdx = Math.max(
    0,
    nodes.findIndex((n) => n.id === activeNodeId),
  );

  return (
    <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#84909B]">
        <span className="font-mono-tabular">
          FIG 3.1 · 数据驱动风险传播链（点击任意节点检视因果机制与防御接口）[D]
        </span>
        <span>工况 → 危险源 → 传播 → 后果 → 控制验证 → 剩余风险</span>
      </div>

      {/* Horizontal scroll guard only on very narrow screens; crisp SVG on desktop */}
      <div className="overflow-x-auto pb-1">
        <svg
          viewBox="0 0 1005 164"
          role="img"
          aria-label="六步风险传播因果链交互图"
          className="h-auto min-w-[760px] w-full select-none"
        >
          {/* Directed edges between sequential nodes */}
          {nodes.slice(0, -1).map((node, idx) => {
            const from = NODE_POSITIONS[idx];
            const to = NODE_POSITIONS[idx + 1];
            const lit = idx < activeIdx;
            const targetNode = nodes[idx + 1];
            const edgeColor = lit
              ? targetNode.severityTone === 'crimson'
                ? '#B94C44'
                : targetNode.severityTone === 'blue'
                  ? '#638DB0'
                  : '#D99A45'
              : 'rgba(184,193,200,0.24)';
            return (
              <g key={`edge-${node.id}`}>
                <line
                  x1={from.x + 140}
                  y1={from.y + 48}
                  x2={to.x - 4}
                  y2={to.y + 48}
                  stroke={edgeColor}
                  strokeWidth={lit ? 2.4 : 1.3}
                />
                <polygon
                  points={`${to.x - 8},${to.y + 43} ${to.x},${to.y + 48} ${to.x - 8},${to.y + 53}`}
                  fill={edgeColor}
                />
              </g>
            );
          })}

          {/* Clickable propagation nodes */}
          {nodes.map((node, idx) => {
            const pos = NODE_POSITIONS[idx] ?? { x: 20 + idx * 165, y: 34 };
            const isActive = node.id === activeNodeId;
            const isUpstream = idx <= activeIdx;
            const stroke = toneStroke(node.severityTone, isActive, isUpstream);
            const [line1, line2] = splitTitleCleanly(node.title);

            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`节点 ${node.stepIndex} ${node.stageZh}：${node.title}`}
                onClick={() => onSelectNode(node.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNode(node.id);
                  }
                }}
                className="cursor-pointer"
              >
                <rect
                  x={pos.x}
                  y={pos.y}
                  width="140"
                  height="96"
                  fill={isActive ? '#1A222D' : '#0D1219'}
                  stroke={stroke}
                  strokeWidth={isActive ? 2 : 1.2}
                />

                {/* Top index + label */}
                <text
                  x={pos.x + 10}
                  y={pos.y + 20}
                  fill={isActive ? '#D99A45' : '#84909B'}
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                >
                  0{node.stepIndex} · [{node.label}]
                </text>

                <text
                  x={pos.x + 10}
                  y={pos.y + 40}
                  fill="#B8C1C8"
                  fontSize="10.5"
                >
                  {node.stageZh}
                </text>

                {/* Semantic two-line title wrapping */}
                <text
                  x={pos.x + 10}
                  y={pos.y + 62}
                  fill="#F2EFE7"
                  fontSize="11.5"
                  fontWeight={isActive ? 600 : 500}
                >
                  {line1}
                </text>
                {line2 && (
                  <text
                    x={pos.x + 10}
                    y={pos.y + 79}
                    fill="#F2EFE7"
                    fontSize="11.5"
                    fontWeight={isActive ? 600 : 500}
                  >
                    {line2}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
