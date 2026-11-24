import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { computeStickyProgress, resolveBeatIndexFromProgress } from '../app/scrollDirector';
import type { QualityMode } from '../app/store';
import { getMitigationsForRisk, getRiskByScenario } from '../safety/queries';
import type { SafetyMethodTab, ScenarioId } from '../safety/types';
import { FactTag } from '../components/FactTag';
import { FhaPanel, FmeaPanel, FtaPanel, StpaPanel } from '../components/SafetyWorkbench';
import { PropagationGraphSvg } from '../visuals/PropagationGraphSvg';

interface Act3FailureProps {
  selectedScenario: ScenarioId;
  activeFaultNode: string;
  activeMethodTab: SafetyMethodTab;
  qualityMode: QualityMode;
  is3dActive: boolean;
  onSelectScenario: (scenario: ScenarioId) => void;
  onSyncScenarioFromScroll: (scenario: ScenarioId, nodeId: string) => void;
  onSelectFaultNode: (nodeId: string) => void;
  onSelectMethodTab: (tab: SafetyMethodTab) => void;
  onJumpToMitigation: (mitigationId: string) => void;
  onOpenRisk: (riskId: string) => void;
  onOpenSource: (sourceId: string) => void;
}

const SCENARIO_LIST: Array<{ id: ScenarioId; title: string; subtitle: string }> = [
  { id: 'EX-01', title: 'EX-01 · 推进链异常', subtitle: '悬停或过渡阶段推力不足 / 分配失衡 [A]' },
  { id: 'EX-02', title: 'EX-02 · 电池热异常', subtitle: '充电 / 待命 / 飞行热失控与热蔓延 [A]' },
  { id: 'EX-03', title: 'EX-03 · 传感器 / 飞控错误', subtitle: '过渡 / 进近传感偏置与不安全指令 [A]' },
];

const WORKBENCH_TABS: Array<{ id: Exclude<SafetyMethodTab, 'propagation'>; label: string }> = [
  { id: 'fha', label: '01. FHA 功能危害分析' },
  { id: 'fmea', label: '02. FMEA 教学失效表与定性矩阵' },
  { id: 'fta', label: '03. FTA 故障树分解' },
  { id: 'stpa', label: '04. STPA 闭环控制分析' },
];

export function Act3Failure({
  selectedScenario,
  activeFaultNode,
  activeMethodTab,
  qualityMode,
  is3dActive,
  onSelectScenario,
  onSyncScenarioFromScroll,
  onSelectFaultNode,
  onSelectMethodTab,
  onJumpToMitigation,
  onOpenRisk,
  onOpenSource,
}: Act3FailureProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const beatRefs = useRef<Partial<Record<ScenarioId, HTMLElement | null>>>({});
  const lastScrolledKeyRef = useRef<string>(`${selectedScenario}:${activeFaultNode}`);

  const scenarioRecord = getRiskByScenario(selectedScenario);
  const activeNode =
    scenarioRecord.propagationNodes.find((n) => n.id === activeFaultNode) ??
    scenarioRecord.propagationNodes[0];

  const workbenchTab: Exclude<SafetyMethodTab, 'propagation'> =
    activeMethodTab === 'propagation' ? 'fmea' : activeMethodTab;

  // Scroll-driven fault progression across EX-01 -> EX-02 -> EX-03 and their propagation steps
  useEffect(() => {
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const progress = computeStickyProgress(rect.top, rect.height, window.innerHeight, 76);
      const totalScenarios = SCENARIO_LIST.length;
      const scenarioIdx = resolveBeatIndexFromProgress(progress, totalScenarios);
      const scenarioId = SCENARIO_LIST[scenarioIdx].id;
      const localProgress = Math.max(0, Math.min(1, progress * totalScenarios - scenarioIdx));
      const rec = getRiskByScenario(scenarioId);
      const nodeIdx = resolveBeatIndexFromProgress(localProgress, rec.propagationNodes.length);
      const nodeId = rec.propagationNodes[nodeIdx]?.id ?? rec.propagationNodes[0]?.id ?? '';

      const key = `${scenarioId}:${nodeId}`;
      if (key !== lastScrolledKeyRef.current) {
        lastScrolledKeyRef.current = key;
        onSyncScenarioFromScroll(scenarioId, nodeId);
      }
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [onSyncScenarioFromScroll]);

  const handleClickScenario = (scenarioId: ScenarioId) => {
    onSelectScenario(scenarioId);
    const el = beatRefs.current[scenarioId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section
      id="act-3"
      data-chapter-section="act-3"
      data-active-scenario={selectedScenario}
      aria-labelledby="act3-heading"
      className={`relative z-10 ${is3dActive ? 'pointer-events-none' : ''}`}
    >
      {/* Part A: Transparent Cinema Fault Stage (Left 5 cols scroll beats; Right 7 cols live 3D fault isolation) */}
      <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header
          className={`pointer-events-auto border-b border-[#B8C1C8]/16 pb-6 ${
            is3dActive ? 'bg-[#0A0E13]/88 p-5 lg:max-w-[540px]' : ''
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#84909B]">
            <span className="font-mono-tabular text-[#D9564A]">ACT III · THE EDGE OF FAILURE</span>
            <span aria-hidden="true">·</span>
            <span>随滚轮逐级推演三大失效传播链与 3D 故障隔离</span>
            <span aria-hidden="true">·</span>
            <FactTag label="A" />
          </div>
          <h2 id="act3-heading" className="mt-2 text-2xl font-semibold text-[#F2EFE7] sm:text-3xl">
            失效边界：追踪风险如何沿因果链级联放大
          </h2>
          <p className="prose-measure mt-2 text-sm text-[#B8C1C8]">
            所有故障情境均为有边界的教学假设，不代表真实事故。继续向下滚动，右侧 3D 飞行器将依次隔离聚焦 EX-01 左外侧旋翼推力异常、EX-02 腹舱电池热蔓延与 EX-03 机头传感/飞控偏置；下方提供完整 FHA / FMEA / FTA / STPA 工程分析工作台。
          </p>
        </header>

        <div
          ref={trackRef}
          className={`mt-8 ${is3dActive ? 'grid grid-cols-1 gap-8 lg:grid-cols-12' : 'space-y-8'}`}
        >
          {/* In 2D Fallback mode, keep sticky full-width PropagationGraphSvg above beats */}
          {!is3dActive && (
            <div className="pointer-events-auto space-y-4 bg-[#0A0E13]/95 pb-2 lg:sticky lg:top-[58px] lg:z-20 lg:pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {SCENARIO_LIST.map((item) => {
                    const active = item.id === selectedScenario;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleClickScenario(item.id)}
                        className={`whitespace-nowrap border px-3 py-1.5 text-xs transition-colors ${
                          active
                            ? 'border-[#B94C44] bg-[#211518] font-medium text-[#F2EFE7]'
                            : 'border-[#B8C1C8]/16 bg-[#11161E] text-[#84909B] hover:text-[#F2EFE7]'
                        }`}
                      >
                        {item.title}
                      </button>
                    );
                  })}
                </div>
                {activeNode && (
                  <span className="font-mono-tabular text-xs text-[#D99A45]">
                    当前推演：{scenarioRecord.id} / 节点 0{activeNode.stepIndex} · {activeNode.stageZh}
                  </span>
                )}
              </div>

              {qualityMode === 'standard' ? (
                <PropagationGraphSvg
                  nodes={scenarioRecord.propagationNodes}
                  activeNodeId={activeNode?.id ?? ''}
                  onSelectNode={(nodeId) => {
                    lastScrolledKeyRef.current = `${selectedScenario}:${nodeId}`;
                    onSelectFaultNode(nodeId);
                  }}
                />
              ) : (
                <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-4">
                  <p className="font-mono-tabular text-xs text-[#D99A45]">
                    LITE MODE · 链式文字传播视图（保留完整节点选择与因果解释）
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Fault Scenario Beats Column (Left 5 cols in 3D mode; full width in 2D mode) */}
          <div className={`pointer-events-auto space-y-8 ${is3dActive ? 'lg:col-span-5' : ''}`}>
            {is3dActive && (
              <div className="border border-[#B94C44]/40 bg-[#140F13]/96 p-4 lg:sticky lg:top-[68px] lg:z-20">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular font-semibold text-[#E0665E]">
                    3D 故障定位：{scenarioRecord.id}
                  </span>
                  {activeNode && (
                    <span className="font-mono-tabular text-[11px] text-[#D99A45]">
                      节点 0{activeNode.stepIndex}/06 · {activeNode.stageZh}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {SCENARIO_LIST.map((item) => {
                    const active = item.id === selectedScenario;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleClickScenario(item.id)}
                        className={`border px-2 py-1.5 text-center font-mono-tabular text-[11px] transition-colors ${
                          active
                            ? 'border-[#D9564A] bg-[#241518] font-semibold text-[#F2EFE7]'
                            : 'border-[#B8C1C8]/16 bg-[#11161E] text-[#84909B] hover:text-[#F2EFE7]'
                        }`}
                      >
                        {item.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {SCENARIO_LIST.map((item) => {
              const rec = getRiskByScenario(item.id);
              const isCurrentScenario = selectedScenario === item.id;
              const mitigations = getMitigationsForRisk(rec.id);
              const currentNodeForScenario = isCurrentScenario
                ? activeNode
                : rec.propagationNodes[1] ?? rec.propagationNodes[0];

              return (
                <article
                  key={item.id}
                  ref={(el) => {
                    beatRefs.current[item.id] = el;
                  }}
                  id={`scenario-${item.id}`}
                  data-scenario-beat={item.id}
                  className={`border p-5 transition-colors duration-300 lg:min-h-[56vh] ${
                    isCurrentScenario
                      ? 'border-[#D9564A]/75 bg-[#151116]/96'
                      : 'border-[#B8C1C8]/16 bg-[#0D1219]/92 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                    <span className="font-mono-tabular font-semibold text-[#D99A45]">
                      {item.title} · {rec.id}
                    </span>
                    <FactTag label={rec.evidenceStatus} />
                  </div>

                  <h3 className="mt-2 text-lg font-semibold text-[#F2EFE7]">{rec.hazard}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#C7D0D8]">{rec.failureMechanism}</p>

                  {/* Clickable 6-step propagation timeline */}
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {rec.propagationNodes.map((node) => {
                      const isNodeActive = isCurrentScenario && node.id === activeNode?.id;
                      return (
                        <button
                          key={node.id}
                          type="button"
                          aria-pressed={isNodeActive}
                          onClick={() => {
                            if (!isCurrentScenario) onSelectScenario(item.id);
                            lastScrolledKeyRef.current = `${item.id}:${node.id}`;
                            onSelectFaultNode(node.id);
                          }}
                          className={`border px-2.5 py-2 text-left text-xs transition-colors ${
                            isNodeActive
                              ? node.severityTone === 'crimson'
                                ? 'border-[#E0665E] bg-[#261619] text-[#F2EFE7]'
                                : 'border-[#D99A45] bg-[#1B222D] text-[#F2EFE7]'
                              : 'border-[#B8C1C8]/14 bg-[#0A0E13]/92 text-[#B8C1C8] hover:border-[#B8C1C8]/35'
                          }`}
                        >
                          <div className="font-mono-tabular text-[10px] text-[#84909B]">
                            0{node.stepIndex} · {node.stageZh}
                          </div>
                          <div className="mt-0.5 truncate font-medium">{node.title}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Node Detail */}
                  {currentNodeForScenario && (
                    <div className="mt-4 border-t border-[#B8C1C8]/12 pt-4">
                      <div className="flex flex-wrap items-baseline gap-2 text-xs">
                        <span className="font-mono-tabular text-[#D99A45]">
                          节点 0{currentNodeForScenario.stepIndex} · {currentNodeForScenario.stageZh}
                        </span>
                        <FactTag label={currentNodeForScenario.label} />
                      </div>
                      <h4 className="mt-1.5 text-sm font-semibold text-[#F2EFE7]">
                        {currentNodeForScenario.title}
                      </h4>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#C7D0D8]">
                        {currentNodeForScenario.detail}
                      </p>
                    </div>
                  )}

                  {/* Residual Risk & Mitigation Handoff */}
                  <div className="mt-4 space-y-2.5 border-t border-[#B8C1C8]/12 pt-4 text-xs">
                    <div className="border border-[#B8C1C8]/12 bg-[#0A0E13]/92 p-3">
                      <span className="text-[#84909B]">定性严重性与概率边界：</span>
                      <span className="font-medium text-[#D99A45]">{rec.severity}</span>
                      <p className="mt-1 text-[#B8C1C8]">{rec.likelihoodEvidence}</p>
                    </div>
                    <div className="border border-[#B94C44]/35 bg-[#1B1215] p-3">
                      <p className="text-[#84909B]">剩余风险（不可视觉消除）</p>
                      <p className="mt-1 leading-relaxed text-[#E0665E]">{rec.residualRisk}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap gap-2">
                        {mitigations.map((mit) => (
                          <button
                            key={mit.id}
                            type="button"
                            onClick={() => onJumpToMitigation(mit.id)}
                            className="inline-flex items-center gap-1 border border-[#B8C1C8]/18 bg-[#0A0E13] px-2.5 py-1 text-[#F2EFE7] hover:border-[#D99A45]"
                          >
                            <span className="font-mono-tabular text-[#D99A45]">{mit.code}</span>
                            <span>{mit.nameZh}</span>
                            <ArrowRight className="h-3 w-3 text-[#84909B]" aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenRisk(rec.id)}
                          className="text-[#F2EFE7] underline-offset-4 hover:text-[#D99A45] hover:underline"
                        >
                          查看 {rec.id} →
                        </button>
                        {rec.sources.map((sid) => (
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
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {is3dActive && <div aria-hidden="true" className="hidden lg:col-span-7 lg:block" />}
        </div>
      </div>

      {/* Part B: Full-Width Opaque Editorial Band for Propagation Graph + FHA / FMEA / FTA / STPA Workbench */}
      <div className="pointer-events-auto relative z-10 border-y border-[#B8C1C8]/16 bg-[#0A0E13] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1360px]">
          {is3dActive && (
            <div className="mb-10">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-mono-tabular text-xs text-[#D99A45]">FAULT PROPAGATION DIAGRAM</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#F2EFE7]">
                    {scenarioRecord.id} 因果传播链交互图谱（点击任意节点同步 3D 故障强度）
                  </h3>
                </div>
                <FactTag label="A" />
              </div>
              <PropagationGraphSvg
                nodes={scenarioRecord.propagationNodes}
                activeNodeId={activeNode?.id ?? ''}
                onSelectNode={(nodeId) => {
                  lastScrolledKeyRef.current = `${selectedScenario}:${nodeId}`;
                  onSelectFaultNode(nodeId);
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono-tabular text-xs text-[#D99A45]">SAFETY ENGINEERING WORKBENCH</p>
              <h3 className="mt-1 text-xl font-semibold text-[#F2EFE7]">
                跨方法系统安全分析工作台（FHA · FMEA · FTA · STPA）
              </h3>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="系统安全分析方法切换">
              {WORKBENCH_TABS.map((tab) => {
                const active = workbenchTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onSelectMethodTab(tab.id)}
                    className={`whitespace-nowrap border px-3.5 py-2 text-xs transition-colors duration-200 ${
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
          </div>

          <div className="mt-6">
            {workbenchTab === 'fha' && <FhaPanel onOpenRisk={onOpenRisk} onOpenSource={onOpenSource} />}
            {workbenchTab === 'fmea' && <FmeaPanel onOpenRisk={onOpenRisk} />}
            {workbenchTab === 'fta' && <FtaPanel onOpenRisk={onOpenRisk} />}
            {workbenchTab === 'stpa' && (
              <StpaPanel onOpenRisk={onOpenRisk} onJumpToMitigation={onJumpToMitigation} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
