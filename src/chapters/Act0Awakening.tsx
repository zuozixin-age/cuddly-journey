import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, FastForward, RotateCcw } from 'lucide-react';
import { computeStickyProgress } from '../app/scrollDirector';
import type { MotionMode, QualityMode } from '../app/store';
import { SUBJECT_PROVISIONAL_NOTICE, TEACHING_DISCLAIMER } from '../safety/sources';
import { FactTag } from '../components/FactTag';
import { AircraftSilhouetteSvg } from '../visuals/AircraftSilhouetteSvg';

interface Act0AwakeningProps {
  motionMode: MotionMode;
  qualityMode: QualityMode;
  is3dActive: boolean;
  onProgressChange?: (progress: number) => void;
  onEnterAnalysis: () => void;
  onSkipIntro: () => void;
  onOpenDisclaimer: () => void;
}

export function Act0Awakening({
  motionMode,
  qualityMode,
  is3dActive,
  onProgressChange,
  onEnterAnalysis,
  onSkipIntro,
  onOpenDisclaimer,
}: Act0AwakeningProps) {
  const [replayEpoch, setReplayEpoch] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lastProgressRef = useRef(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const animate = motionMode === 'full';

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = computeStickyProgress(rect.top, rect.height, window.innerHeight, 56);
      if (Math.abs(lastProgressRef.current - next) > 0.004) {
        lastProgressRef.current = next;
        setScrollProgress(next);
        onProgressChange?.(next);
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
  }, [onProgressChange]);

  const titleShiftY = animate ? -scrollProgress * 22 : 0;
  const stageScale = animate ? 1 + scrollProgress * 0.035 : 1;

  return (
    <section
      id="act-0"
      ref={sectionRef}
      data-chapter-section="act-0"
      aria-labelledby="act0-heading"
      className={`relative z-10 lg:min-h-[165vh] ${
        is3dActive ? 'pointer-events-none bg-transparent' : 'bg-[#0A0E13]'
      }`}
    >
      {/* Mobile top clear viewing window so the sculpted 3D eVTOL is unobstructed at scrollY = 0 */}
      {is3dActive && <div aria-hidden="true" className="h-[34vh] lg:hidden" />}

      {/* Sticky full-viewport cinema opening stage on desktop; natural flow on mobile */}
      <div
        className={`flex min-h-[calc(100vh-56px)] flex-col justify-between px-4 py-6 sm:px-6 lg:sticky lg:top-14 lg:px-8 lg:py-8 ${
          is3dActive ? 'bg-[#0A0E13]/92 lg:bg-transparent' : ''
        }`}
      >
        <div className="mx-auto w-full max-w-[1360px]">
          {/* Top restrained cinema slate line */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-4 border-b border-[#B8C1C8]/16 pb-3.5 text-xs text-[#84909B] lg:max-w-[560px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono-tabular text-[#D99A45]">ACT 0 · THE AWAKENING</span>
              <span aria-hidden="true">·</span>
              <span>3D eVTOL 连续影像叙事</span>
              <span aria-hidden="true">·</span>
              <FactTag label="D" />
            </div>

            <div className="flex items-center gap-4">
              {animate && !is3dActive && (
                <button
                  type="button"
                  onClick={() => setReplayEpoch((n) => n + 1)}
                  className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-[#84909B] transition-colors hover:text-[#F2EFE7]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>重播光影</span>
                </button>
              )}
              <button
                type="button"
                onClick={onSkipIntro}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-[#B8C1C8] transition-colors hover:text-[#F2EFE7]"
              >
                <FastForward className="h-3.5 w-3.5" aria-hidden="true" />
                <span>直达 ACT I（Esc）</span>
              </button>
            </div>
          </div>

          {/* Main Hero Composition: Editorial Left Column + Unobstructed 3D Cinema Window Right */}
          <div key={replayEpoch} className="mt-6 grid grid-cols-1 items-center gap-8 lg:mt-10 lg:grid-cols-12">
            <div
              className={`pointer-events-auto lg:col-span-5 ${animate ? 'anim-rise' : ''}`}
              style={{
                transform: `translate3d(0, ${titleShiftY.toFixed(1)}px, 0)`,
              }}
            >
              <p className="font-mono-tabular text-xs tracking-[0.22em] text-[#D99A45]">
                WHAT MAKES FLIGHT SAFE?
              </p>
              <h1
                id="act0-heading"
                className="font-display-track mt-3 text-4xl font-semibold text-[#F2EFE7] sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]"
                style={{ textWrap: 'balance' }}
              >
                BEYOND GRAVITY
              </h1>
              <p className="mt-3 text-xl font-medium tracking-tight text-[#B8C1C8] sm:text-2xl">
                超越重力：天空的代价
              </p>

              <p className="prose-measure mt-5 text-sm text-[#C7D0D8] sm:text-base">
                人类飞起来的每一米，都必须由工程证据偿付。向下滚动鼠标滚轮，伴随六倾转旋翼 3D 飞行器连续穿越升空包线、机身 X-Ray 透视解剖、失效传播链、七层纵深防护与晨光透明闭环。
              </p>

              <div className={`mt-7 flex flex-wrap items-center gap-4 ${animate ? 'anim-rise-delay-1' : ''}`}>
                <button
                  type="button"
                  onClick={onEnterAnalysis}
                  className="inline-flex items-center gap-2.5 whitespace-nowrap bg-[#D99A45] px-6 py-3 text-sm font-semibold text-[#0A0E13] transition-colors duration-200 hover:bg-[#E4AC5D]"
                >
                  <span>开始连续放映</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onOpenDisclaimer}
                  className="inline-flex items-center whitespace-nowrap border border-[#B8C1C8]/28 bg-[#0D1219]/90 px-4 py-3 text-xs font-medium text-[#F2EFE7] transition-colors duration-200 hover:border-[#D99A45] hover:text-[#D99A45]"
                >
                  查阅事实分级与免责声明
                </button>
              </div>

              {/* Quiet scroll cue */}
              <div className="mt-7 flex items-center gap-2 text-xs text-[#9AA6B2]">
                <ArrowDown className="h-3.5 w-3.5 text-[#D99A45]" aria-hidden="true" />
                <span>直接滚动鼠标滚轮即可连续推进镜头与六幕工程推演（右侧可拖拽旋转 3D 模型）</span>
              </div>
            </div>

            {/* Right 7 Columns: Open transparent 3D Cinema Window when WebGL active; 2D SVG fallback in Lite mode */}
            {!is3dActive ? (
              <div className={`pointer-events-auto lg:col-span-7 ${animate ? 'anim-keylight' : ''}`}>
                <div
                  className="overflow-hidden border border-[#B8C1C8]/12 bg-[#0D1219] p-3 sm:p-5"
                  style={{
                    transform: `scale(${stageScale.toFixed(4)})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <AircraftSilhouetteSvg
                    variant="awakening"
                    qualityMode={qualityMode}
                    scrollProgress={scrollProgress}
                    reducedMotion={!animate}
                  />
                </div>
              </div>
            ) : (
              <div aria-hidden="true" className="hidden lg:col-span-7 lg:block lg:min-h-[420px]" />
            )}
          </div>
        </div>

        {/* Bottom Academic Transparency Strip (aligned to left editorial column in 3D mode so right 3D studio & dock stay 100% clear) */}
        <div
          className={`pointer-events-auto mt-8 w-full border-t border-[#B8C1C8]/16 pt-4 ${
            is3dActive
              ? 'bg-[#0A0E13]/88 px-4 pb-4 lg:max-w-[560px]'
              : 'mx-auto max-w-[1360px]'
          } ${animate ? 'anim-rise-delay-2' : ''}`}
        >
          <div
            className={`grid grid-cols-1 gap-3 text-xs text-[#9AA6B2] ${
              is3dActive ? 'md:grid-cols-1 lg:grid-cols-1' : 'md:grid-cols-3'
            }`}
          >
            <div>
              <span className="font-medium text-[#D5DCE3]">对象与范围：</span>
              <span className="leading-relaxed">{SUBJECT_PROVISIONAL_NOTICE}</span>
            </div>
            <div>
              <span className="font-medium text-[#D5DCE3]">免责与分级：</span>
              <span className="leading-relaxed">
                {TEACHING_DISCLAIMER} 全站以 <FactTag label="F" /> · <FactTag label="A" /> ·{' '}
                <FactTag label="D" /> · <FactTag label="U" /> 标注（3D 模型为 [D] 概念教学几何）。
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
