import { useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';
import { FLIGHT_PHASES, FTA_NODES, SUBSYSTEMS } from '../safety/data';
import {
  filterAndSortFmea,
  filterFhaRecords,
  filterStpaUcas,
  getSubsystemById,
  type FmeaSortField,
  type SortDirection,
} from '../safety/queries';
import type {
  FhaRecord,
  FlightPhaseId,
  StpaUcaType,
  SubsystemId,
} from '../safety/types';
import { FactTag } from './FactTag';

interface WorkbenchActionProps {
  onOpenRisk: (riskId: string) => void;
  onOpenSource: (sourceId: string) => void;
  onJumpToMitigation: (mitigationId: string) => void;
}

/* ========================= 1. FHA VIEW ========================= */
export function FhaPanel({ onOpenRisk, onOpenSource }: Pick<WorkbenchActionProps, 'onOpenRisk' | 'onOpenSource'>) {
  const [phaseFilter, setPhaseFilter] = useState<FlightPhaseId | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<FhaRecord['functionCategory'] | 'all'>('all');

  const records = useMemo(
    () => filterFhaRecords(phaseFilter, categoryFilter),
    [phaseFilter, categoryFilter],
  );

  const categories: Array<FhaRecord['functionCategory'] | 'all'> = [
    'all',
    '推力',
    '姿态',
    '供能',
    '感知',
    '结构',
    '地面保障',
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border border-[#B8C1C8]/14 bg-[#11161E] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#F2EFE7]">功能危害分析（FHA · Functional Hazard Assessment）</h3>
          <p className="mt-1 text-xs text-[#84909B]">
            按飞行阶段与航空器核心功能筛选失效状态、运行影响与严重性论证（教学定性分析，不虚构发生概率）。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-[#84909B]">
            <span className="sr-only">按飞行阶段筛选</span>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value as FlightPhaseId | 'all')}
              className="border border-[#B8C1C8]/20 bg-[#0A0E13] px-3 py-1.5 text-xs text-[#F2EFE7]"
            >
              <option value="all">全部飞行阶段</option>
              {FLIGHT_PHASES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.order}. {p.nameZh}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#84909B]">
            <span className="sr-only">按功能类别筛选</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as FhaRecord['functionCategory'] | 'all')}
              className="border border-[#B8C1C8]/20 bg-[#0A0E13] px-3 py-1.5 text-xs text-[#F2EFE7]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? '全部功能类别' : `功能：${c}`}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-8 text-center">
          <p className="text-sm text-[#B8C1C8]">当前阶段与功能筛选条件下无匹配 FHA 记录。</p>
          <button
            type="button"
            onClick={() => {
              setPhaseFilter('all');
              setCategoryFilter('all');
            }}
            className="mt-3 border border-[#D99A45] px-3.5 py-1.5 text-xs text-[#F2EFE7] hover:bg-[#D99A45]/15"
          >
            重置筛选条件
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {records.map((item) => {
            const phase = FLIGHT_PHASES.find((p) => p.id === item.phase);
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between border border-[#B8C1C8]/14 bg-[#11161E] p-5"
              >
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#84909B]">
                    <span className="font-mono-tabular text-[#D99A45]">
                      {item.id} · {item.functionCategory} · {phase?.nameZh}
                    </span>
                    <FactTag label={item.evidenceStatus} />
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-[#F2EFE7]">{item.functionName}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#B8C1C8]">
                    <span className="text-[#84909B]">失效状态：</span>
                    {item.failureCondition}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#B8C1C8]">
                    <span className="text-[#84909B]">运行影响：</span>
                    {item.operationalEffect}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#D99A45]">
                    <span className="text-[#84909B]">定性严重性论证：</span>
                    {item.severityRationale}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#B8C1C8]/12 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    {item.sourceIds.map((sid) => (
                      <button
                        key={sid}
                        type="button"
                        onClick={() => onOpenSource(sid)}
                        className="font-mono-tabular text-[#638DB0] underline-offset-4 hover:underline"
                      >
                        [{sid}]
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenRisk(item.linkedRiskId)}
                    className="inline-flex items-center gap-1 text-[#F2EFE7] hover:text-[#D99A45]"
                  >
                    <span>追踪风险链 {item.linkedRiskId}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================= 2. FMEA VIEW ========================= */
export function FmeaPanel({ onOpenRisk }: Pick<WorkbenchActionProps, 'onOpenRisk'>) {
  const [subsystem, setSubsystem] = useState<SubsystemId | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<FmeaSortField>('id');
  const [direction, setDirection] = useState<SortDirection>('asc');

  const rows = useMemo(
    () => filterAndSortFmea({ subsystem, query, sortBy, direction }),
    [subsystem, query, sortBy, direction],
  );

  const toggleSort = (field: FmeaSortField) => {
    if (sortBy === field) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setDirection(field === 'severityRank' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border border-[#B8C1C8]/14 bg-[#11161E] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#F2EFE7]">
            失效模式与影响分析（教学用途 FMEA · 非认证级 SSA）
          </h3>
          <p className="mt-1 text-xs text-[#84909B]">
            支持按子系统筛选、关键词检索与列排序；点击任意行打开从工况到剩余风险与证据来源的完整追踪链。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[#84909B]" aria-hidden="true" />
            <span className="sr-only">搜索 FMEA 风险记录</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="检索编号、危险源或机制..."
              className="w-52 border border-[#B8C1C8]/20 bg-[#0A0E13] py-1.5 pl-8 pr-3 text-xs text-[#F2EFE7] placeholder:text-[#84909B]"
            />
          </label>

          <label>
            <span className="sr-only">按子系统筛选</span>
            <select
              value={subsystem}
              onChange={(e) => setSubsystem(e.target.value as SubsystemId | 'all')}
              className="border border-[#B8C1C8]/20 bg-[#0A0E13] px-3 py-1.5 text-xs text-[#F2EFE7]"
            >
              <option value="all">全部子系统（6）</option>
              {SUBSYSTEMS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameZh}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Qualitative Teaching Risk Matrix (PDF E1: never invent quantitative probabilities) */}
      <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
          <div>
            <span className="font-semibold text-[#F2EFE7]">教学定性风险矩阵（严重性 × 发生可能性）</span>
            <span className="mx-2 text-[#84909B]">·</span>
            <span className="text-[#84909B]">
              因公开资料缺乏可靠失效率，全部条目如实落于“可能性未定”列，不给出虚构定量等级
            </span>
          </div>
          <FactTag label="D" />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#B8C1C8]/16 text-[#84909B]">
                <th className="w-40 border-r border-[#B8C1C8]/12 px-3 py-2 font-medium">定性严重性分级</th>
                <th className="border-r border-[#B8C1C8]/10 px-3 py-2 font-medium">极低（需审定统计）</th>
                <th className="border-r border-[#B8C1C8]/10 px-3 py-2 font-medium">低（需机队运行数据）</th>
                <th className="border-r border-[#B8C1C8]/10 px-3 py-2 font-medium">中等（需实测验证）</th>
                <th className="bg-[#171E28] px-3 py-2 font-medium text-[#D99A45]">
                  可能性未定（公开资料边界）
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B8C1C8]/10">
              {(
                [
                  {
                    rank: 3 as const,
                    label: '潜在高严重性',
                    tone: 'text-[#B94C44]',
                    items: rows.filter((r) => r.severityRank === 3),
                  },
                  {
                    rank: 2 as const,
                    label: '中等至高 / 中等严重性',
                    tone: 'text-[#D99A45]',
                    items: rows.filter((r) => r.severityRank === 2),
                  },
                ]
              ).map((band) => (
                <tr key={band.rank}>
                  <td className={`border-r border-[#B8C1C8]/12 px-3 py-3 font-medium ${band.tone}`}>
                    {band.label}
                  </td>
                  <td className="border-r border-[#B8C1C8]/10 px-3 py-3 text-[#84909B]/55">— 无公开数据</td>
                  <td className="border-r border-[#B8C1C8]/10 px-3 py-3 text-[#84909B]/55">— 无公开数据</td>
                  <td className="border-r border-[#B8C1C8]/10 px-3 py-3 text-[#84909B]/55">— 无公开数据</td>
                  <td className="bg-[#151C25] px-3 py-3">
                    {band.items.length === 0 ? (
                      <span className="text-[#84909B]">当前筛选下无该层级条目</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {band.items.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => onOpenRisk(r.id)}
                            className="font-mono-tabular border border-[#D99A45]/45 bg-[#0D1219] px-2.5 py-1 text-[11px] text-[#F2EFE7] transition-colors hover:border-[#D99A45] hover:text-[#D99A45]"
                          >
                            {r.id} · {getSubsystemById(r.subsystem).shortLabelZh}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-8 text-center">
          <p className="text-sm text-[#B8C1C8]">未找到匹配的 FMEA 风险记录。</p>
          <button
            type="button"
            onClick={() => {
              setSubsystem('all');
              setQuery('');
            }}
            className="mt-3 border border-[#D99A45] px-3.5 py-1.5 text-xs text-[#F2EFE7] hover:bg-[#D99A45]/15"
          >
            清空筛选与搜索
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#B8C1C8]/14 bg-[#11161E]">
          <table className="w-full min-w-[760px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#B8C1C8]/16 bg-[#0D1219] text-[#84909B]">
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort('id')}
                    className="inline-flex items-center gap-1 hover:text-[#F2EFE7]"
                  >
                    <span>编号</span>
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort('subsystem')}
                    className="inline-flex items-center gap-1 hover:text-[#F2EFE7]"
                  >
                    <span>子系统与阶段</span>
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">危险源与失效机制</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort('severityRank')}
                    className="inline-flex items-center gap-1 hover:text-[#F2EFE7]"
                  >
                    <span>定性严重性与可能性边界</span>
                    <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-medium">完整追踪</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B8C1C8]/10">
              {rows.map((record) => (
                <tr
                  key={record.id}
                  className="transition-colors hover:bg-[#171E28]"
                >
                  <td className="px-4 py-3.5 align-top">
                    <div className="font-mono-tabular font-semibold text-[#D99A45]">{record.id}</div>
                    <div className="mt-1">
                      <FactTag label={record.evidenceStatus} showText={false} />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="font-medium text-[#F2EFE7]">{record.subsystemLabel}</div>
                    <div className="mt-1 text-[#84909B]">{record.phaseLabel}</div>
                  </td>
                  <td className="max-w-md px-4 py-3.5 align-top leading-relaxed">
                    <div className="font-medium text-[#F2EFE7]">{record.hazard}</div>
                    <div className="mt-1 text-[#B8C1C8]">{record.failureMechanism}</div>
                  </td>
                  <td className="max-w-xs px-4 py-3.5 align-top leading-relaxed">
                    <div className="text-[#D99A45]">{record.severity}</div>
                    <div className="mt-1 text-[#84909B]">{record.likelihoodEvidence}</div>
                  </td>
                  <td className="px-4 py-3.5 text-right align-top">
                    <button
                      type="button"
                      onClick={() => onOpenRisk(record.id)}
                      className="inline-flex items-center gap-1 whitespace-nowrap border border-[#B8C1C8]/22 px-3 py-1.5 text-xs text-[#F2EFE7] transition-colors hover:border-[#D99A45] hover:text-[#D99A45]"
                    >
                      <span>打开风险链</span>
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ========================= 3. FTA VIEW ========================= */
export function FtaPanel({ onOpenRisk }: Pick<WorkbenchActionProps, 'onOpenRisk'>) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'TOP-01': true,
    'INT-01': true,
    'INT-02': true,
    'INT-03': true,
  });

  const toggleNode = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (nodeId: string, depth: number) => {
    const node = FTA_NODES[nodeId];
    if (!node) return null;
    const hasChildren = Boolean(node.childIds && node.childIds.length > 0);
    const isOpen = Boolean(expanded[nodeId]);

    return (
      <div key={node.id} className={depth > 0 ? 'mt-3 ml-4 border-l border-[#B8C1C8]/18 pl-4 sm:ml-7 sm:pl-5' : ''}>
        <div className="border border-[#B8C1C8]/16 bg-[#11161E] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleNode(node.id)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? '折叠' : '展开'}故障树节点 ${node.code}`}
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center border border-[#B8C1C8]/25 text-[#F2EFE7] hover:border-[#D99A45]"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              ) : (
                <span className="mt-1 font-mono-tabular text-[11px] text-[#84909B]">底事件</span>
              )}

              <div>
                <div className="flex flex-wrap items-baseline gap-2 text-xs">
                  <span className="font-mono-tabular font-semibold text-[#D99A45]">{node.code}</span>
                  {node.gateType && (
                    <span className="font-mono-tabular text-[#638DB0]">
                      逻辑门：{node.gateType}（{node.gateType === 'OR' ? '任一满足即传播' : '需同时满足才传播'}）
                    </span>
                  )}
                  <FactTag label={node.label} />
                </div>
                <h4 className="mt-1 text-sm font-semibold text-[#F2EFE7]">{node.title}</h4>
                <p className="mt-1.5 text-xs leading-relaxed text-[#B8C1C8]">{node.explanation}</p>
              </div>
            </div>

            {node.linkedRiskId && (
              <button
                type="button"
                onClick={() => onOpenRisk(node.linkedRiskId!)}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap border border-[#B8C1C8]/20 px-3 py-1.5 text-xs text-[#F2EFE7] hover:border-[#D99A45] hover:text-[#D99A45]"
              >
                <span>对照 {node.linkedRiskId}</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isOpen && (
          <div>{node.childIds!.map((childId) => renderNode(childId, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-[#F2EFE7]">
            故障树分析（FTA · Fault Tree Analysis 教学逻辑分解）
          </h3>
          <span className="font-mono-tabular text-xs text-[#B94C44]">
            不计算虚构顶事件概率（公开资料缺乏独立性与失效率数据）
          </span>
        </div>
        <p className="mt-1 text-xs text-[#84909B]">
          从顶事件 TOP-01 反向分解 OR / AND 逻辑门关系，点击节点左侧箭头可展开或折叠子树，所有分支与 FMEA 编号共用 ID。
        </p>
      </div>

      {renderNode('TOP-01', 0)}
    </div>
  );
}

/* ========================= 4. STPA VIEW ========================= */
export function StpaPanel({
  onOpenRisk,
  onJumpToMitigation,
}: Pick<WorkbenchActionProps, 'onOpenRisk' | 'onJumpToMitigation'>) {
  const [selectedType, setSelectedType] = useState<StpaUcaType | 'all'>('all');

  const ucas = useMemo(() => filterStpaUcas(selectedType), [selectedType]);

  const ucaTabs: Array<{ id: StpaUcaType | 'all'; label: string }> = [
    { id: 'all', label: '全部不安全控制行为（4）' },
    { id: 'not-provided', label: '未提供' },
    { id: 'provided-incorrectly', label: '错误提供' },
    { id: 'wrong-timing', label: '时序错误' },
    { id: 'stopped-too-soon-or-long', label: '持续过久/过早中止' },
  ];

  return (
    <div className="space-y-5">
      {/* STPA Closed-Loop Control Structure SVG */}
      <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#84909B]">
          <span className="font-mono-tabular">FIG 3.2 · STPA 闭环安全控制结构（教学模型）[D]</span>
          <span>不安全控制行为（UCA）源于控制算法、过程模型失真或反馈延迟，不仅限于硬件坏损</span>
        </div>

        <svg
          viewBox="0 0 920 190"
          role="img"
          aria-label="STPA 控制器、执行器、受控过程与传感器反馈闭环示意图"
          className="h-auto w-full select-none"
        >
          {/* Boxes */}
          <rect x="24" y="42" width="190" height="76" fill="#0D1219" stroke="#D99A45" strokeWidth="1.5" />
          <text x="119" y="72" textAnchor="middle" fill="#F2EFE7" fontSize="13" fontWeight="600">
            控制器（飞控 / 飞行员）
          </text>
          <text x="119" y="94" textAnchor="middle" fill="#84909B" fontSize="10.5">
            过程模型 + 模态决策逻辑
          </text>

          <rect x="266" y="42" width="168" height="76" fill="#0D1219" stroke="#B8C1C8" strokeOpacity="0.45" strokeWidth="1.2" />
          <text x="350" y="72" textAnchor="middle" fill="#F2EFE7" fontSize="13" fontWeight="600">
            执行机构
          </text>
          <text x="350" y="94" textAnchor="middle" fill="#84909B" fontSize="10.5">
            逆变器 / 电机 / 倾转伺服
          </text>

          <rect x="486" y="42" width="184" height="76" fill="#0D1219" stroke="#B8C1C8" strokeOpacity="0.45" strokeWidth="1.2" />
          <text x="578" y="72" textAnchor="middle" fill="#F2EFE7" fontSize="13" fontWeight="600">
            受控过程（飞行器）
          </text>
          <text x="578" y="94" textAnchor="middle" fill="#84909B" fontSize="10.5">
            气动姿态 / 电池热状态 / 轨迹
          </text>

          <rect x="722" y="42" width="174" height="76" fill="#0D1219" stroke="#638DB0" strokeWidth="1.4" />
          <text x="809" y="72" textAnchor="middle" fill="#F2EFE7" fontSize="13" fontWeight="600">
            传感器与人机反馈
          </text>
          <text x="809" y="94" textAnchor="middle" fill="#84909B" fontSize="10.5">
            IMU / 空速 / BMS / 告警界面
          </text>

          {/* Forward arrows */}
          <line x1="214" y1="80" x2="262" y2="80" stroke="#D99A45" strokeWidth="1.8" />
          <polygon points="258,75 266,80 258,85" fill="#D99A45" />
          <line x1="434" y1="80" x2="482" y2="80" stroke="#B8C1C8" strokeWidth="1.6" />
          <polygon points="478,75 486,80 478,85" fill="#B8C1C8" />
          <line x1="670" y1="80" x2="718" y2="80" stroke="#638DB0" strokeWidth="1.6" />
          <polygon points="714,75 722,80 714,85" fill="#638DB0" />

          {/* Feedback return path */}
          <path
            d="M809 118 L809 164 L119 164 L119 122"
            fill="none"
            stroke="#638DB0"
            strokeWidth="1.6"
            strokeDasharray="5 4"
          />
          <polygon points="114,126 119,118 124,126" fill="#638DB0" />
          <text x="464" y="156" textAnchor="middle" fill="#638DB0" fontSize="11">
            状态反馈回路（偏置、延迟或告警失真将导致控制器过程模型失配）
          </text>
        </svg>
      </div>

      {/* Interactive UCA type selector */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="不安全控制行为类型筛选">
        {ucaTabs.map((tab) => {
          const active = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedType(tab.id)}
              className={`whitespace-nowrap border px-3.5 py-2 text-xs transition-colors ${
                active
                  ? 'border-[#D99A45] bg-[#171E28] font-medium text-[#F2EFE7]'
                  : 'border-[#B8C1C8]/16 bg-[#11161E] text-[#B8C1C8] hover:border-[#B8C1C8]/35'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ucas.map((item) => (
          <article key={item.id} className="flex flex-col justify-between border border-[#B8C1C8]/14 bg-[#11161E] p-5">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                <span className="font-mono-tabular font-semibold text-[#D99A45]">
                  {item.id} · {item.typeLabelZh}
                </span>
                <FactTag label={item.label} />
              </div>
              <h4 className="mt-2 text-sm font-semibold text-[#F2EFE7]">{item.controlAction}</h4>
              <dl className="mt-3 space-y-2 text-xs leading-relaxed">
                <div>
                  <dt className="inline text-[#84909B]">控制主体：</dt>
                  <dd className="inline text-[#B8C1C8]">{item.controller}</dd>
                </div>
                <div>
                  <dt className="inline text-[#84909B]">触发上下文：</dt>
                  <dd className="inline text-[#B8C1C8]">{item.context}</dd>
                </div>
                <div>
                  <dt className="inline text-[#84909B]">危害后果：</dt>
                  <dd className="inline text-[#B94C44]">{item.hazardousOutcome}</dd>
                </div>
                <div>
                  <dt className="inline text-[#84909B]">致因情景：</dt>
                  <dd className="inline text-[#B8C1C8]">{item.causalScenario}</dd>
                </div>
                <div>
                  <dt className="inline text-[#84909B]">候选安全约束：</dt>
                  <dd className="inline text-[#F2EFE7]">{item.safetyConstraint}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#B8C1C8]/12 pt-3 text-xs">
              <button
                type="button"
                onClick={() => onOpenRisk(item.linkedRiskId)}
                className="text-[#B8C1C8] underline-offset-4 hover:text-[#F2EFE7] hover:underline"
              >
                关联风险 {item.linkedRiskId}
              </button>
              <button
                type="button"
                onClick={() => onJumpToMitigation(item.linkedMitigationId)}
                className="inline-flex items-center gap-1 text-[#D99A45] hover:text-[#F2EFE7]"
              >
                <span>查看 ACT IV 控制层 {item.linkedMitigationId}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
