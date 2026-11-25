import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Eye, Gauge, Volume2, VolumeX } from 'lucide-react';
import {
  computeDocumentProgress,
  resolveActiveChapterFromRects,
  type SectionRectMetric,
} from './app/scrollDirector';
import { playSubtleCue } from './app/sound';
import { appReducer, CHAPTER_META, createInitialState } from './app/store';
import { Act0Awakening } from './chapters/Act0Awakening';
import { Act1Ascent } from './chapters/Act1Ascent';
import { Act2Machine } from './chapters/Act2Machine';
import { Act3Failure } from './chapters/Act3Failure';
import { Act4Trust } from './chapters/Act4Trust';
import { Act5Beyond } from './chapters/Act5Beyond';
import { CinemaChapterRail } from './components/CinemaChapterRail';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { SceneTransitionBridge } from './components/SceneTransitionBridge';
import { TopNav } from './components/TopNav';
import { getRiskByScenario } from './safety/queries';
import type { ChapterId, FlightPhaseId, ScenarioId, SubsystemId } from './safety/types';
import { EvtolCinemaStage } from './visuals/EvtolCinemaStage';

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return createInitialState({
      hash: typeof window !== 'undefined' ? window.location.hash : '',
      search: typeof window !== 'undefined' ? window.location.search : '',
      prefersReducedMotion: prefersReduced,
    });
  });

  const [documentProgress, setDocumentProgress] = useState(0);
  const [act0Progress, setAct0Progress] = useState(0);
  const [act1Progress, setAct1Progress] = useState(0);
  const [act5DawnProgress, setAct5DawnProgress] = useState(0.45);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  const currentChapterRef = useRef<ChapterId>(state.chapter);
  currentChapterRef.current = state.chapter;

  const is3dActive = state.qualityMode === 'standard' && !webglUnavailable;

  // Derive numeric fault step index (1..6) for 3D Act III intensity
  const currentScenarioRec = getRiskByScenario(state.selectedScenario);
  const activeFaultStepIndex =
    currentScenarioRec.propagationNodes.find((n) => n.id === state.activeFaultNode)?.stepIndex ?? 2;

  const scrollToElementById = useCallback(
    (elementId: string, block: ScrollLogicalPosition = 'start') => {
      const target = document.getElementById(elementId);
      if (!target) return;
      const behavior: ScrollBehavior = state.motionMode === 'reduced' ? 'auto' : 'smooth';
      if (block === 'start') {
        const y = target.getBoundingClientRect().top + window.scrollY - 56;
        window.scrollTo({ top: Math.max(0, y), behavior });
      } else {
        target.scrollIntoView({ behavior, block });
      }
    },
    [state.motionMode],
  );

  // Initial deep-link / ?autostart=1 scroll alignment once mounted
  useEffect(() => {
    if (state.chapter !== 'act-0') {
      const target = document.getElementById(state.chapter);
      if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 56;
        window.scrollTo({ top: Math.max(0, y), behavior: 'auto' });
      }
    }
    // Run only once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Continuous native scroll director: syncs overall film progress bar + active chapter in TopNav & URL hash
  useEffect(() => {
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const docEl = document.documentElement;
      const nextProgress = computeDocumentProgress(
        window.scrollY,
        docEl.scrollHeight,
        window.innerHeight,
      );
      setDocumentProgress((prev) => (Math.abs(prev - nextProgress) > 0.002 ? nextProgress : prev));

      const metrics: SectionRectMetric[] = [];
      for (const meta of CHAPTER_META) {
        const el = document.getElementById(meta.id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        metrics.push({
          id: meta.id,
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
        });
      }

      if (metrics.length > 0) {
        const active = resolveActiveChapterFromRects(metrics, window.innerHeight);
        if (active !== currentChapterRef.current) {
          currentChapterRef.current = active;
          dispatch({ type: 'SYNC_CHAPTER_FROM_SCROLL', chapter: active });
          const targetHash = `#${active}`;
          if (window.location.hash !== targetHash) {
            window.history.replaceState({ chapter: active }, '', targetHash);
          }
        }
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
  }, []);

  // Listen to browser back/forward or manual hash edits
  useEffect(() => {
    const onHashChange = () => {
      dispatch({ type: 'SYNC_FROM_HASH', hash: window.location.hash });
      const cleaned = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (cleaned && document.getElementById(cleaned)) {
        scrollToElementById(cleaned, 'start');
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [scrollToElementById]);

  // Global Escape shortcut: skips Act 0 straight down to Act I when no drawer is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !state.openPanel && state.chapter === 'act-0') {
        e.preventDefault();
        dispatch({ type: 'SKIP_INTRO' });
        scrollToElementById('act-1', 'start');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.chapter, state.openPanel, scrollToElementById]);

  const handleSelectChapter = useCallback(
    (chapter: ChapterId) => {
      playSubtleCue(state.soundEnabled, 'nav');
      dispatch({ type: 'SET_CHAPTER', chapter });
      const targetHash = `#${chapter}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState({ chapter }, '', targetHash);
      }
      scrollToElementById(chapter, 'start');
    },
    [state.soundEnabled, scrollToElementById],
  );

  const handleSyncPhaseFromScroll = useCallback((phase: FlightPhaseId) => {
    dispatch({ type: 'SET_FLIGHT_PHASE', phase });
  }, []);

  const handleSyncSubsystemFromScroll = useCallback((subsystem: SubsystemId) => {
    dispatch({ type: 'SET_SUBSYSTEM', subsystem });
  }, []);

  const handleSyncScenarioFromScroll = useCallback((scenario: ScenarioId, nodeId: string) => {
    dispatch({ type: 'SET_SCENARIO', scenario, nodeId });
  }, []);

  const handleSyncMitigationFromScroll = useCallback((mitigationId: string) => {
    dispatch({ type: 'SET_MITIGATION', mitigationId });
  }, []);

  const handleWebglUnavailable = useCallback(() => {
    setWebglUnavailable(true);
  }, []);

  const handleJumpToSubsystem = useCallback(
    (subsystem: SubsystemId) => {
      playSubtleCue(state.soundEnabled, 'nav');
      dispatch({ type: 'JUMP_TO_SUBSYSTEM', subsystem });
      scrollToElementById(`subsystem-${subsystem}`, 'center');
    },
    [state.soundEnabled, scrollToElementById],
  );

  const handleJumpToScenario = useCallback(
    (scenario: ScenarioId) => {
      playSubtleCue(state.soundEnabled, 'nav');
      dispatch({ type: 'JUMP_TO_SCENARIO_ANALYSIS', scenario });
      scrollToElementById(`scenario-${scenario}`, 'center');
    },
    [state.soundEnabled, scrollToElementById],
  );

  const handleJumpToMitigation = useCallback(
    (mitigationId: string) => {
      playSubtleCue(state.soundEnabled, 'nav');
      dispatch({ type: 'JUMP_TO_MITIGATION', mitigationId });
      scrollToElementById(`mitigation-${mitigationId}`, 'center');
    },
    [state.soundEnabled, scrollToElementById],
  );

  return (
    <div
      data-motion={state.motionMode}
      data-quality={state.qualityMode}
      data-chapter={state.chapter}
      data-render-mode={is3dActive ? '3d-webgl' : '2d-svg-fallback'}
      className="min-h-screen bg-[#0A0E13] text-[#F2EFE7]"
    >
      {/* Skip link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-50 focus:bg-[#D99A45] focus:px-3 focus:py-1.5 focus:text-xs focus:font-semibold focus:text-[#0A0E13]"
      >
        跳至主要内容
      </a>

      {/* Strict 3-Zone Top Bar with integrated 2px continuous film scroll progress hairline */}
      <TopNav
        currentChapter={state.chapter}
        scrollProgress={documentProgress}
        onSelectChapter={handleSelectChapter}
        onOpenEvidence={() => {
          playSubtleCue(state.soundEnabled, 'select');
          dispatch({ type: 'OPEN_PANEL', panel: { type: 'evidence' } });
        }}
      />

      {/* Single Persistent Three.js PBR 3D eVTOL Cinema Stage (never unmounts across Acts 0-V) */}
      {is3dActive && (
        <EvtolCinemaStage
          chapter={state.chapter}
          act0Progress={act0Progress}
          act1Progress={act1Progress}
          flightPhase={state.flightPhase}
          selectedSubsystem={state.selectedSubsystem}
          selectedScenario={state.selectedScenario}
          activeFaultStepIndex={activeFaultStepIndex}
          selectedMitigation={state.selectedMitigation}
          act5DawnProgress={act5DawnProgress}
          motionMode={state.motionMode}
          onWebglUnavailable={handleWebglUnavailable}
        />
      )}

      {/* Non-sticky compact accessibility & playback preference strip */}
      <div className="relative z-20 border-b border-[#B8C1C8]/12 bg-[#0D1219]/96">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-[#84909B] sm:px-6 lg:px-8">
          <p className="text-[#9AA6B2]">
            {is3dActive
              ? '3D 连续滚轮放映模式 · 纯静态离线课程研究 · 研究对象：Joby Aviation S4 eVTOL（[D] 概念教学模型，非官方评估）'
              : '2D 轻量连续滚轮模式 · 纯静态离线课程研究 · 研究对象：Joby Aviation S4 eVTOL（非官方评估）'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              aria-pressed={state.motionMode === 'reduced'}
              onClick={() => dispatch({ type: 'TOGGLE_MOTION_MODE' })}
              className={`inline-flex items-center gap-1 whitespace-nowrap transition-colors ${
                state.motionMode === 'reduced' ? 'text-[#D99A45]' : 'text-[#84909B] hover:text-[#F2EFE7]'
              }`}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{state.motionMode === 'reduced' ? '低动效：已开' : '低动效：关'}</span>
            </button>

            <span aria-hidden="true" className="text-[#B8C1C8]/20">|</span>

            <button
              type="button"
              aria-pressed={state.qualityMode === 'lite'}
              onClick={() => dispatch({ type: 'TOGGLE_QUALITY_MODE' })}
              className={`inline-flex items-center gap-1 whitespace-nowrap transition-colors ${
                state.qualityMode === 'lite' ? 'text-[#D99A45]' : 'text-[#84909B] hover:text-[#F2EFE7]'
              }`}
            >
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{state.qualityMode === 'lite' ? '2D 轻量模式：已开' : '3D 实景模式：已开'}</span>
            </button>

            <span aria-hidden="true" className="text-[#B8C1C8]/20">|</span>

            <button
              type="button"
              aria-pressed={state.soundEnabled}
              onClick={() => {
                const next = !state.soundEnabled;
                dispatch({ type: 'TOGGLE_SOUND' });
                if (next) playSubtleCue(true, 'select');
              }}
              className={`inline-flex items-center gap-1 whitespace-nowrap transition-colors ${
                state.soundEnabled ? 'text-[#D99A45]' : 'text-[#84909B] hover:text-[#F2EFE7]'
              }`}
            >
              {state.soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{state.soundEnabled ? '提示音：已开' : '声音：关闭'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invalid route 404 recovery banner */}
      {state.routeFallbackMessage && (
        <div
          role="status"
          className="relative z-20 border-b border-[#D99A45]/35 bg-[#1B1712] px-4 py-2.5 text-xs text-[#F2EFE7] sm:px-6 lg:px-8"
        >
          <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-4">
            <span>{state.routeFallbackMessage}</span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'DISMISS_ROUTE_FALLBACK' })}
              className="shrink-0 text-[#D99A45] underline-offset-4 hover:underline"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {/* Quiet wide-desktop right-edge cinema progress rail */}
      <CinemaChapterRail currentChapter={state.chapter} onSelectChapter={handleSelectChapter} />

      {/* Continuous Uninterrupted 6-Act Cinema Film Timeline */}
      <main id="main-content" className="relative z-10 outline-none">
        <Act0Awakening
          motionMode={state.motionMode}
          qualityMode={state.qualityMode}
          is3dActive={is3dActive}
          onProgressChange={setAct0Progress}
          onEnterAnalysis={() => handleSelectChapter('act-1')}
          onSkipIntro={() => handleSelectChapter('act-1')}
          onOpenDisclaimer={() => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'disclaimer' } });
          }}
        />

        <SceneTransitionBridge
          fromCode="ACT 0"
          toCode="ACT I"
          toTitleEn="THE ASCENT"
          toTitleZh="第一幕 · 升空包线与六旋翼倾转"
          premise="从停机坪垂直离地到固定翼巡航，每一次构型切换都改写着系统的失效后果与处置时间窗口。"
          is3dActive={is3dActive}
        />

        <Act1Ascent
          activePhase={state.flightPhase}
          is3dActive={is3dActive}
          onProgressChange={setAct1Progress}
          onSelectPhase={(phase) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'SET_FLIGHT_PHASE', phase });
          }}
          onSyncPhaseFromScroll={handleSyncPhaseFromScroll}
          onJumpToSubsystem={handleJumpToSubsystem}
          onJumpToScenario={handleJumpToScenario}
          onOpenRisk={(riskId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'risk', riskId } });
          }}
          onOpenSource={(sourceId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'evidence', sourceId } });
          }}
        />

        <SceneTransitionBridge
          fromCode="ACT I"
          toCode="ACT II"
          toTitleEn="INSIDE THE MACHINE"
          toTitleZh="第二幕 · 切入机身 X-Ray 透视解剖"
          premise="飞越表象曲线，逐层剖开分布式推进、高压电池配电、感知飞控与作动执行器之间的能量与控制耦合。"
          is3dActive={is3dActive}
        />

        <Act2Machine
          selectedSubsystem={state.selectedSubsystem}
          qualityMode={state.qualityMode}
          is3dActive={is3dActive}
          onSelectSubsystem={(subsystem) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'SET_SUBSYSTEM', subsystem });
          }}
          onSyncSubsystemFromScroll={handleSyncSubsystemFromScroll}
          onJumpToScenario={handleJumpToScenario}
          onOpenRisk={(riskId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'risk', riskId } });
          }}
          onOpenSource={(sourceId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'evidence', sourceId } });
          }}
        />

        <SceneTransitionBridge
          fromCode="ACT II"
          toCode="ACT III"
          toTitleEn="THE EDGE OF FAILURE"
          toTitleZh="第三幕 · 驶向失效边界"
          premise="单一局部扰动如何在低空与高耦合构型下沿因果链级联放大？滚动检视三大教学故障情境与跨方法分析。"
          is3dActive={is3dActive}
        />

        <Act3Failure
          selectedScenario={state.selectedScenario}
          activeFaultNode={state.activeFaultNode}
          activeMethodTab={state.activeMethodTab}
          qualityMode={state.qualityMode}
          is3dActive={is3dActive}
          onSelectScenario={(scenario) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'SET_SCENARIO', scenario });
          }}
          onSyncScenarioFromScroll={handleSyncScenarioFromScroll}
          onSelectFaultNode={(nodeId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'SET_FAULT_NODE', nodeId });
          }}
          onSelectMethodTab={(tab) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'SET_METHOD_TAB', tab });
          }}
          onJumpToMitigation={handleJumpToMitigation}
          onOpenRisk={(riskId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'risk', riskId } });
          }}
          onOpenSource={(sourceId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'evidence', sourceId } });
          }}
        />

        <SceneTransitionBridge
          fromCode="ACT III"
          toCode="ACT IV"
          toTitleEn="ENGINEERING TRUST"
          toTitleZh="第四幕 · 用七层纵深防护与独立证据建立信任"
          premise="安全不是零风险承诺，而是逐层构筑独立屏障、绑定可复现验证证据并诚实标记剩余不确定性。"
          is3dActive={is3dActive}
        />

        <Act4Trust
          selectedMitigation={state.selectedMitigation}
          is3dActive={is3dActive}
          onSelectMitigation={(mitigationId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'SET_MITIGATION', mitigationId });
          }}
          onSyncMitigationFromScroll={handleSyncMitigationFromScroll}
          onOpenRisk={(riskId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'risk', riskId } });
          }}
          onOpenSource={(sourceId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'evidence', sourceId } });
          }}
        />

        <SceneTransitionBridge
          fromCode="ACT IV"
          toCode="ACT V"
          toTitleEn="BEYOND GRAVITY"
          toTitleZh="第五幕 · 光照下的工程透明与证据闭环"
          premise="在晨光下回望整架飞行器：区分已知事实、教学假设与未验证清单，完成可溯源的课程研究闭环。"
          is3dActive={is3dActive}
        />

        <Act5Beyond
          motionMode={state.motionMode}
          qualityMode={state.qualityMode}
          is3dActive={is3dActive}
          onDawnProgressChange={setAct5DawnProgress}
          onNavigateChapter={handleSelectChapter}
          onOpenRisk={(riskId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'risk', riskId } });
          }}
          onOpenSource={(sourceId) => {
            playSubtleCue(state.soundEnabled, 'select');
            dispatch({ type: 'OPEN_PANEL', panel: { type: 'evidence', sourceId } });
          }}
        />
      </main>

      {/* Quiet Editorial Site Footer */}
      <footer className="relative z-20 border-t border-[#B8C1C8]/14 bg-[#0A0E13] px-4 py-6 text-xs text-[#84909B] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p>
            BEYOND GRAVITY / 《超越重力：天空的代价》 · 系统安全工程课程静态研究网站（非官方安全评估）
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_PANEL', panel: { type: 'disclaimer' } })}
              className="hover:text-[#F2EFE7]"
            >
              免责声明与事实分级
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_PANEL', panel: { type: 'evidence' } })}
              className="hover:text-[#F2EFE7]"
            >
              参考文献索引 [S1–S9]
            </button>
          </div>
        </div>
      </footer>

      {/* Accessible Slide-Over Evidence / Risk Detail Drawer */}
      <EvidenceDrawer
        panel={state.openPanel}
        onClose={() => dispatch({ type: 'CLOSE_PANEL' })}
        onJumpToMitigation={handleJumpToMitigation}
        onJumpToScenario={handleJumpToScenario}
      />
    </div>
  );
}
