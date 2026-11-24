import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { computeStickyProgress, interpolateFlightAircraft } from '../app/scrollDirector';
import { FLIGHT_PHASES } from '../safety/data';
import { getRisksForPhase } from '../safety/queries';
import type { FlightPhaseId, ScenarioId, SubsystemId } from '../safety/types';
import { FactTag } from '../components/FactTag';
import { FlightProfileSvg } from '../visuals/FlightProfileSvg';

interface Act1AscentProps {
  activePhase: FlightPhaseId;
  is3dActive: boolean;
  onProgressChange?: (progress: number) => void;
  onSelectPhase: (phase: FlightPhaseId) => void;
  onSyncPhaseFromScroll: (phase: FlightPhaseId) => void;
  onJumpToSubsystem: (subsystem: SubsystemId) => void;
  onJumpToScenario: (scenario: ScenarioId) => void;
  onOpenRisk: (riskId: string) => void;
  onOpenSource: (sourceId: string) => void;
}

export function Act1Ascent({
  activePhase,
  is3dActive,
  onProgressChange,
  onSelectPhase,
  onSyncPhaseFromScroll,
  onJumpToSubsystem,
  onJumpToScenario,
  onOpenRisk,
  onOpenSource,
}: Act1AscentProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const beatRefs = useRef<Partial<Record<FlightPhaseId, HTMLElement | null>>>({});
  const lastScrolledPhaseRef = useRef<FlightPhaseId>(activePhase);
  const lastFlightProgressRef = useRef(0);
  const [flightProgress, setFlightProgress] = useState(0);

  const currentPhase = FLIGHT_PHASES.find((p) => p.id === activePhase) ?? FLIGHT_PHASES[0];
  const livePose = interpolateFlightAircraft(flightProgress);

  // Continuous scroll listener: drives 3D nacelle tilt + smooth aircraft flight curve + auto-selects phase beat
  useEffect(() => {
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const progress = computeStickyProgress(rect.top, rect.height, window.innerHeight, 76);
      if (Math.abs(lastFlightProgressRef.current - progress) > 0.003) {
        lastFlightProgressRef.current = progress;
        setFlightProgress(progress);
        onProgressChange?.(progress);
      }

      const pose = interpolateFlightAircraft(progress);
      if (pose.phaseId !== lastScrolledPhaseRef.current) {
        lastScrolledPhaseRef.current = pose.phaseId;
        onSyncPhaseFromScroll(pose.phaseId);
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
  }, [onSyncPhaseFromScroll, onProgressChange]);

  const handleClickPhase = (phaseId: FlightPhaseId) => {
    lastScrolledPhaseRef.current = phaseId;
    onSelectPhase(phaseId);
    const beatEl = beatRefs.current[phaseId];
    if (beatEl) {
      beatEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section
      id="act-1"
      data-chapter-section="act-1"
      data-active-phase={currentPhase.id}
      aria-labelledby="act1-heading"
      className={`relative z-10 mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16 ${
        is3dActive ? 'pointer-events-none' : ''
      }`}
    >
      {/* Chapter Header */}
      <header
        className={`pointer-events-auto border-b border-[#B8C1C8]/16 pb-6 ${
          is3dActive ? 'bg-[#0A0E13]/88 p-5 lg:max-w-[540px]' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#84909B]">
          <span className="font-mono-tabular text-[#D99A45]">ACT I · THE ASCENT</span>
          <span aria-hidden="true">·</span>
          <span>随滚轮推演五阶段飞行包线与 6 旋翼倾转</span>
          <span aria-hidden="true">·</span>
          <FactTag label="A" />
        </div>
        <h2 id="act1-heading" className="mt-2 text-2xl font-semibold text-[#F2EFE7] sm:text-3xl">
          升空：每一段飞行包线都有独特的约束与代价
        </h2>
        <p className="prose-measure mt-2 text-sm text-[#B8C1C8]">
          继续向下滚动滚轮，右侧 3D 六倾转旋翼 eVTOL 将连续完成离地攀升、45° 倾转过渡、88° 固定翼巡航（自动收起起落架）、反向进近与垂直着陆；左侧实时同步各阶段边界与关联危险源。
        </p>
      </header>

      {/* Dual-Mode Layout:
          - 3D Cinema Mode: Left 5 cols carry compact live telemetry + 5 vertical phase beats; Right 7 cols stay open to 3D eVTOL flight!
          - 2D Lite/Fallback Mode: Sticky Left FlightProfileSvg + Right 5 vertical phase beats. */}
      <div ref={trackRef} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {!is3dActive && (
          <div className="pointer-events-auto space-y-4 lg:sticky lg:top-[76px] lg:col-span-7 lg:self-start">
            <FlightProfileSvg
              activePhase={currentPhase.id}
              scrollProgress={flightProgress}
              onSelectPhase={handleClickPhase}
            />
          </div>
        )}

        <div
          className={`pointer-events-auto space-y-6 lg:space-y-10 ${
            is3dActive ? 'lg:col-span-5' : 'lg:col-span-5'
          }`}
        >
          {/* Compact Live Flight Envelope Telemetry Strip (sticky on desktop in 3D mode) */}
          <div
            className={`border border-[#B8C1C8]/18 bg-[#0D1219]/95 p-4 ${
              is3dActive ? 'lg:sticky lg:top-[68px] lg:z-20' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#B8C1C8]/12 pb-2.5 text-xs">
              <div>
                <span className="font-mono-tabular font-semibold text-[#D99A45]">
                  PHASE 0{currentPhase.order} · {currentPhase.nameZh}
                </span>
              </div>
              <span className="font-mono-tabular text-[11px] text-[#F2EFE7]">
                倾转角 {Math.round(livePose.nacelleDeg)}° · {flightProgress > 0.32 && flightProgress < 0.76 ? '起落架收起' : '起落架放下'}
              </span>
            </div>

            {/* Phase Quick-Jump Mini Timeline */}
            <div className="mt-3 grid grid-cols-5 gap-1">
              {FLIGHT_PHASES.map((p) => {
                const active = p.id === currentPhase.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleClickPhase(p.id)}
                    className={`border px-1.5 py-1.5 text-center font-mono-tabular text-[11px] transition-colors ${
                      active
                        ? 'border-[#D99A45] bg-[#1A212B] font-semibold text-[#F2EFE7]'
                        : 'border-[#B8C1C8]/14 bg-[#11161E] text-[#84909B] hover:text-[#F2EFE7]'
                    }`}
                  >
                    0{p.order}
                  </button>
                );
              })}
            </div>

            {/* 4-Dimension Qualitative Constraint Readout */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              {(
                [
                  { label: '推力裕度敏感', value: currentPhase.envelopeProfile.thrustSensitivity },
                  { label: '气动耦合强度', value: currentPhase.envelopeProfile.modeCoupling },
                  { label: '低空处置紧迫', value: currentPhase.envelopeProfile.timeWindowUrgency },
                  { label: '地面环境暴露', value: currentPhase.envelopeProfile.externalExposure },
                ] as const
              ).map((metric) => (
                <div key={metric.label} className="flex items-center justify-between gap-2">
                  <span className="text-[#84909B]">{metric.label}</span>
                  <span
                    className={`font-mono-tabular font-medium ${
                      metric.value === '高'
                        ? 'text-[#D99A45]'
                        : metric.value === '中'
                          ? 'text-[#638DB0]'
                          : 'text-[#B8C1C8]'
                    }`}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Vertical Flight Phase Story Beats */}
          {FLIGHT_PHASES.map((phase) => {
            const isActive = phase.id === currentPhase.id;
            const phaseRisks = getRisksForPhase(phase.id);
            return (
              <article
                key={phase.id}
                ref={(el) => {
                  beatRefs.current[phase.id] = el;
                }}
                data-flight-beat={phase.id}
                className={`border p-5 transition-colors duration-300 lg:min-h-[44vh] ${
                  isActive
                    ? 'border-[#D99A45]/80 bg-[#131A24]/95'
                    : 'border-[#B8C1C8]/16 bg-[#0D1219]/90 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                  <span className="font-mono-tabular font-semibold text-[#D99A45]">
                    0{phase.order} · {phase.nameEn}
                  </span>
                  <FactTag label={phase.factLabel} />
                </div>

                <h3 className="mt-2 text-lg font-semibold text-[#F2EFE7]">{phase.nameZh}</h3>
                <p className="mt-1.5 text-xs text-[#84909B]">
                  {phase.tiltAngleLabel} · {phase.altitudeBandLabel}
                </p>
                <p className="mt-2.5 text-sm leading-relaxed text-[#C7D0D8]">{phase.operationalSummary}</p>

                {/* Synchronized Hazards for this phase */}
                <div className="mt-4 space-y-2.5 border-t border-[#B8C1C8]/12 pt-4">
                  <p className="font-mono-tabular text-[11px] text-[#84909B]">
                    阶段关联危险源（{phaseRisks.length} 项）
                  </p>
                  {phaseRisks.map((risk) => (
                    <div key={risk.id} className="border border-[#B8C1C8]/14 bg-[#0A0E13]/92 p-3 text-xs">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-mono-tabular font-semibold text-[#D99A45]">{risk.id}</span>
                        <span className="text-[#84909B]">{risk.subsystemLabel}</span>
                      </div>
                      <p className="mt-1 font-medium text-[#F2EFE7]">{risk.hazard}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[#D99A45]">{risk.severity}</span>
                        <button
                          type="button"
                          onClick={() => onOpenRisk(risk.id)}
                          className="inline-flex items-center gap-1 text-[#B8C1C8] hover:text-[#F2EFE7]"
                        >
                          <span>风险链</span>
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#B8C1C8]/12 pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    {phase.sourceIds.map((sid) => (
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
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onJumpToSubsystem(phase.primarySubsystemId)}
                      className="text-[#D99A45] hover:text-[#F2EFE7]"
                    >
                      定位子系统 →
                    </button>
                    <button
                      type="button"
                      onClick={() => onJumpToScenario(phase.linkedScenarioId)}
                      className="text-[#B8C1C8] hover:text-[#F2EFE7]"
                    >
                      追踪 {phase.linkedScenarioId} →
                    </button>
                  </div>
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
