import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { computeStickyProgress, resolveBeatIndexFromProgress } from '../app/scrollDirector';
import type { QualityMode } from '../app/store';
import { SUBSYSTEMS } from '../safety/data';
import type { ScenarioId, SubsystemId } from '../safety/types';
import { FactTag } from '../components/FactTag';
import {
  MachineAnatomySvg,
  type AnatomyOverlayMode,
} from '../visuals/MachineAnatomySvg';

interface Act2MachineProps {
  selectedSubsystem: SubsystemId;
  qualityMode: QualityMode;
  is3dActive: boolean;
  onSelectSubsystem: (subsystem: SubsystemId) => void;
  onSyncSubsystemFromScroll: (subsystem: SubsystemId) => void;
  onJumpToScenario: (scenario: ScenarioId) => void;
  onOpenRisk: (riskId: string) => void;
  onOpenSource: (sourceId: string) => void;
}

export function Act2Machine({
  selectedSubsystem,
  qualityMode,
  is3dActive,
  onSelectSubsystem,
  onSyncSubsystemFromScroll,
  onJumpToScenario,
  onOpenRisk,
  onOpenSource,
}: Act2MachineProps) {
  const [manualOverlay, setManualOverlay] = useState<AnatomyOverlayMode | null>(null);
  const [show2dCompanion, setShow2dCompanion] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const beatRefs = useRef<Partial<Record<SubsystemId, HTMLElement | null>>>({});
  const lastScrolledSubRef = useRef<SubsystemId>(selectedSubsystem);

  const activeSpec = SUBSYSTEMS.find((s) => s.id === selectedSubsystem) ?? SUBSYSTEMS[0];

  const autoOverlay: AnatomyOverlayMode =
    activeSpec.flowStream === 'energy'
      ? 'energy'
      : activeSpec.flowStream === 'control'
        ? 'control'
        : 'overview';
  const effectiveOverlay = manualOverlay ?? autoOverlay;

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const progress = computeStickyProgress(rect.top, rect.height, window.innerHeight, 76);
      const idx = resolveBeatIndexFromProgress(progress, SUBSYSTEMS.length);
      const nextSub = SUBSYSTEMS[idx]?.id;
      if (nextSub && nextSub !== lastScrolledSubRef.current) {
        lastScrolledSubRef.current = nextSub;
        onSyncSubsystemFromScroll(nextSub);
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
  }, [onSyncSubsystemFromScroll]);

  const handleSelectSubAndScroll = (subId: SubsystemId) => {
    lastScrolledSubRef.current = subId;
    onSelectSubsystem(subId);
    const beatEl = beatRefs.current[subId];
    if (beatEl) {
      beatEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const overlayButtons: Array<{ id: AnatomyOverlayMode | null; label: string }> = [
    { id: null, label: '随滚轮自动聚焦' },
    { id: 'overview', label: '全系统总览' },
    { id: 'energy', label: '能源流' },
    { id: 'control', label: '控制流' },
  ];

  return (
    <section
      id="act-2"
      data-chapter-section="act-2"
      data-active-subsystem={selectedSubsystem}
      aria-labelledby="act2-heading"
      className={`relative z-10 mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16 ${
        is3dActive ? 'pointer-events-none' : ''
      }`}
    >
      <header
        className={`pointer-events-auto border-b border-[#B8C1C8]/16 pb-6 ${
          is3dActive ? 'bg-[#0A0E13]/88 p-5 lg:max-w-[540px]' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#84909B]">
          <span className="font-mono-tabular text-[#D99A45]">ACT II · INSIDE THE MACHINE</span>
          <span aria-hidden="true">·</span>
          <span>3D X-Ray 透视解剖六大子系统与双流线</span>
          <span aria-hidden="true">·</span>
          <FactTag label="D" />
        </div>
        <h2 id="act2-heading" className="mt-2 text-2xl font-semibold text-[#F2EFE7] sm:text-3xl">
          机器内部：能源链与飞控闭环如何撑起安全边界
        </h2>
        <p className="prose-measure mt-2 text-sm text-[#B8C1C8]">
          继续向下滚动，右侧 3D 机身外壳将自动进入 X-Ray 透视模式，依次高亮内部电池包与琥珀色高压能源母线、铜绕组电机核心、钢蓝色飞控信号总线、倾转作动器、碳纤维主翼梁与气动流场（不宣称 Joby S4 官方内部 CAD 剖面）。
        </p>
      </header>

      <div ref={trackRef} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* 2D Fallback Left Stage when in Lite mode or WebGL unavailable */}
        {!is3dActive && (
          <div className="pointer-events-auto space-y-4 lg:sticky lg:top-[76px] lg:col-span-7 lg:self-start">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="技术剖面图层切换">
                <span className="inline-flex items-center gap-1 text-xs text-[#84909B]">
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>流线：</span>
                </span>
                {overlayButtons.map((btn) => {
                  const active = manualOverlay === btn.id;
                  return (
                    <button
                      key={btn.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setManualOverlay(btn.id)}
                      className={`whitespace-nowrap border px-2.5 py-1 text-xs transition-colors ${
                        active
                          ? 'border-[#D99A45] bg-[#171E28] font-medium text-[#F2EFE7]'
                          : 'border-[#B8C1C8]/16 bg-[#11161E] text-[#B8C1C8] hover:border-[#B8C1C8]/35'
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
              <span className="font-mono-tabular text-xs text-[#D99A45]">
                当前聚焦：{activeSpec.code} · {activeSpec.shortLabelZh}
              </span>
            </div>

            {qualityMode === 'standard' ? (
              <MachineAnatomySvg
                selectedSubsystem={selectedSubsystem}
                overlayMode={effectiveOverlay}
                qualityMode={qualityMode}
                onSelectSubsystem={handleSelectSubAndScroll}
              />
            ) : (
              <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-5">
                <p className="font-mono-tabular text-xs text-[#D99A45]">
                  LITE MODE · 2D 结构化子系统拓扑（完整功能回退）
                </p>
                <p className="mt-1 text-xs text-[#84909B]">
                  已关闭 3D 透视渲染与复杂流线，保留全部六大子系统滚动审查与跨幕追踪功能。
                </p>
              </div>
            )}
          </div>
        )}

        {/* Subsystem Dissection Column (Left 5 cols in 3D mode; Right 5 cols in 2D mode) */}
        <div className="pointer-events-auto space-y-6 lg:col-span-5 lg:space-y-10">
          {is3dActive && (
            <div className="border border-[#B8C1C8]/18 bg-[#0D1219]/95 p-4 lg:sticky lg:top-[68px] lg:z-20">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono-tabular font-semibold text-[#D99A45]">
                  3D X-RAY 聚焦：{activeSpec.code} · {activeSpec.shortLabelZh}
                </span>
                <button
                  type="button"
                  onClick={() => setShow2dCompanion((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[11px] text-[#638DB0] hover:text-[#F2EFE7]"
                >
                  <Layers className="h-3 w-3" aria-hidden="true" />
                  <span>{show2dCompanion ? '收起 2D 拓扑图' : '对照 2D 拓扑图'}</span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {SUBSYSTEMS.map((sub) => {
                  const active = sub.id === selectedSubsystem;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubAndScroll(sub.id)}
                      className={`border px-2 py-1.5 text-center font-mono-tabular text-[11px] transition-colors ${
                        active
                          ? 'border-[#D99A45] bg-[#1A212B] font-semibold text-[#F2EFE7]'
                          : 'border-[#B8C1C8]/14 bg-[#11161E] text-[#84909B] hover:text-[#F2EFE7]'
                      }`}
                    >
                      {sub.code}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-[#84909B]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 bg-[#D99A45]" aria-hidden="true" />
                  <span>琥珀色：高压能源母线</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-2 w-4 bg-[#638DB0]" aria-hidden="true" />
                  <span>钢蓝色：感知飞控闭环</span>
                </span>
              </div>

              {show2dCompanion && (
                <div className="mt-3 border-t border-[#B8C1C8]/12 pt-3">
                  <MachineAnatomySvg
                    selectedSubsystem={selectedSubsystem}
                    overlayMode={effectiveOverlay}
                    qualityMode={qualityMode}
                    onSelectSubsystem={handleSelectSubAndScroll}
                  />
                </div>
              )}
            </div>
          )}

          {SUBSYSTEMS.map((sub, idx) => {
            const isActive = sub.id === selectedSubsystem;
            return (
              <article
                key={sub.id}
                ref={(el) => {
                  beatRefs.current[sub.id] = el;
                }}
                id={`subsystem-${sub.id}`}
                data-subsystem-beat={sub.id}
                className={`border p-5 transition-colors duration-300 lg:min-h-[46vh] ${
                  isActive
                    ? 'border-[#D99A45]/80 bg-[#131A24]/95'
                    : 'border-[#B8C1C8]/16 bg-[#0D1219]/90 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                  <span className="font-mono-tabular font-semibold text-[#D99A45]">
                    0{idx + 1} · {sub.code} · {sub.nameEn}
                  </span>
                  <span className="text-[#84909B]">
                    {sub.flowStream === 'energy'
                      ? '能源推进链路'
                      : sub.flowStream === 'control'
                        ? '感知飞控闭环'
                        : '结构与运行边界'}
                  </span>
                </div>

                <h3 className="mt-2 text-lg font-semibold text-[#F2EFE7]">{sub.nameZh}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#C7D0D8]">{sub.functionDesc}</p>

                {/* Public Fact vs Teaching Assumption */}
                <div className="mt-4 space-y-2.5">
                  <div className="border border-[#638DB0]/28 bg-[#0A0E13]/92 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <FactTag label={sub.publicFactBoundary.label} />
                      <div className="flex gap-2">
                        {sub.publicFactBoundary.sourceIds?.map((sid) => (
                          <button
                            key={sid}
                            type="button"
                            onClick={() => onOpenSource(sid)}
                            className="font-mono-tabular text-xs text-[#638DB0] underline-offset-4 hover:underline"
                          >
                            [{sid}]
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#F2EFE7]">
                      {sub.publicFactBoundary.text}
                    </p>
                  </div>

                  {sub.teachingAssumptions.map((assump) => (
                    <div key={assump.id} className="border border-[#D99A45]/28 bg-[#0A0E13]/92 p-3">
                      <FactTag label={assump.label} />
                      <p className="mt-1.5 text-xs leading-relaxed text-[#C7D0D8]">{assump.text}</p>
                    </div>
                  ))}
                </div>

                {/* Failure Modes & Candidate Controls */}
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#B8C1C8]/12 pt-3 text-xs">
                  <div>
                    <p className="font-medium text-[#84909B]">典型潜在失效模式 [A]</p>
                    <ul className="mt-1.5 space-y-1 text-[#F2EFE7]">
                      {sub.potentialFailureModes.map((mode) => (
                        <li key={mode}>— {mode}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-[#84909B]">候选安全措施（非宣称已实装）[A]</p>
                    <ul className="mt-1.5 space-y-1 text-[#B8C1C8]">
                      {sub.candidateControls.map((ctrl) => (
                        <li key={ctrl}>— {ctrl}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Linked risks & jump to Act III */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#B8C1C8]/12 pt-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[#84909B]">关联风险：</span>
                    {sub.linkedRiskIds.map((rid) => (
                      <button
                        key={rid}
                        type="button"
                        onClick={() => onOpenRisk(rid)}
                        className="font-mono-tabular text-[#D99A45] underline-offset-4 hover:underline"
                      >
                        {rid}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => onJumpToScenario(sub.linkedScenarioId)}
                    className="inline-flex items-center gap-1 text-[#F2EFE7] hover:text-[#D99A45]"
                  >
                    <span>追踪 {sub.linkedScenarioId}</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {/* Open transparent right viewport space in 3D mode */}
        {is3dActive && <div aria-hidden="true" className="hidden lg:col-span-7 lg:block" />}
      </div>
    </section>
  );
}
