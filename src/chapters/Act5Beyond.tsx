import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ArrowUpRight, Check, Copy, Download, ExternalLink } from 'lucide-react';
import { clamp01 } from '../app/scrollDirector';
import type { MotionMode, QualityMode } from '../app/store';
import {
  ACCEPTANCE_CHECKLIST_36,
  type ChecklistTier,
} from '../safety/checklist';
import { CONCLUSIONS } from '../safety/data';
import { buildOfflineCitationText } from '../safety/queries';
import { EVIDENCE_SOURCES, SUBJECT_PROVISIONAL_NOTICE, TEACHING_DISCLAIMER } from '../safety/sources';
import type { ChapterId } from '../safety/types';
import { FactTag } from '../components/FactTag';
import { AircraftSilhouetteSvg } from '../visuals/AircraftSilhouetteSvg';

interface Act5BeyondProps {
  motionMode: MotionMode;
  qualityMode: QualityMode;
  is3dActive: boolean;
  onDawnProgressChange?: (progress: number) => void;
  onNavigateChapter: (chapter: ChapterId) => void;
  onOpenRisk: (riskId: string) => void;
  onOpenSource: (sourceId: string) => void;
}

export function Act5Beyond({
  motionMode,
  qualityMode,
  is3dActive,
  onDawnProgressChange,
  onNavigateChapter,
  onOpenRisk,
  onOpenSource,
}: Act5BeyondProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<ChecklistTier | 'all'>('all');
  const [dawnProgress, setDawnProgress] = useState(0.45);
  const lastDawnProgressRef = useRef(0.45);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const el = headerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const next = clamp01(1 - rect.top / Math.max(1, window.innerHeight));
      if (Math.abs(lastDawnProgressRef.current - next) > 0.01) {
        lastDawnProgressRef.current = next;
        setDawnProgress(next);
        onDawnProgressChange?.(next);
      }
    };
    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [onDawnProgressChange]);

  const filteredChecklist = useMemo(
    () =>
      tierFilter === 'all'
        ? ACCEPTANCE_CHECKLIST_36
        : ACCEPTANCE_CHECKLIST_36.filter((item) => item.tier === tierFilter),
    [tierFilter],
  );
  const verifiedCount = ACCEPTANCE_CHECKLIST_36.filter((i) => i.status === 'verified-local').length;
  const pendingCount = ACCEPTANCE_CHECKLIST_36.length - verifiedCount;

  const factsCols = CONCLUSIONS.filter((c) => c.column === 'facts');
  const assumptionsCols = CONCLUSIONS.filter((c) => c.column === 'assumptions');
  const unverifiedCols = CONCLUSIONS.filter((c) => c.column === 'unverified');

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(key);
      window.setTimeout(() => setCopiedId((curr) => (curr === key ? null : curr)), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopiedId(key);
        window.setTimeout(() => setCopiedId((curr) => (curr === key ? null : curr)), 2000);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const handleDownloadMarkdown = () => {
    const content = buildOfflineCitationText();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'beyond-gravity-safety-summary.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="act-5"
      data-chapter-section="act-5"
      aria-labelledby="act5-heading"
      className={`relative z-10 ${is3dActive ? 'pointer-events-none' : ''}`}
    >
      {/* Part A: Transparent Dawn-Lit Cinema Closure Hero over Golden-Lit 3D eVTOL */}
      <header
        ref={headerRef}
        className="mx-auto flex min-h-[72vh] max-w-[1360px] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div
            className={`pointer-events-auto lg:col-span-5 ${
              is3dActive ? 'border border-[#D99A45]/28 bg-[#0D1219]/92 p-6' : ''
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#84909B]">
              <span className="font-mono-tabular text-[#D99A45]">ACT V · BEYOND GRAVITY</span>
              <span aria-hidden="true">·</span>
              <span>晨光下的工程透明与证据闭环</span>
            </div>

            <h2 id="act5-heading" className="mt-3 text-2xl font-semibold text-[#F2EFE7] sm:text-3xl">
              超越重力：保留希望，但不粉饰任何未关闭的风险
            </h2>
            <p className="prose-measure mt-3 text-sm leading-relaxed text-[#C7D0D8]">
              低空电动飞行代表着真实的工程想象力，但它赢得公众信任的唯一途径，是把每一项假设、每一次失效传播、每一份台架试验与每一处剩余不确定性诚实地摊开在晨光之下。下方所有结论均可一键回溯至具体分析节点与公开资料条目。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void handleCopy('all', buildOfflineCitationText())}
                className="inline-flex items-center gap-1.5 whitespace-nowrap border border-[#B8C1C8]/24 bg-[#11161E] px-3.5 py-2 text-xs text-[#F2EFE7] transition-colors hover:border-[#D99A45]"
              >
                {copiedId === 'all' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#D99A45]" aria-hidden="true" />
                    <span>已复制完整引用摘要</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>复制离线引用摘要</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="inline-flex items-center gap-1.5 whitespace-nowrap border border-[#D99A45] bg-[#D99A45]/14 px-3.5 py-2 text-xs font-medium text-[#F2EFE7] transition-colors hover:bg-[#D99A45]/24"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>导出摘要 (.md)</span>
              </button>
            </div>
          </div>

          {!is3dActive ? (
            <div className="pointer-events-auto border border-[#B8C1C8]/14 bg-[#0D1219] p-3 lg:col-span-7">
              <AircraftSilhouetteSvg
                variant="dawn"
                qualityMode={qualityMode}
                scrollProgress={dawnProgress}
                reducedMotion={motionMode === 'reduced'}
              />
            </div>
          ) : (
            <div aria-hidden="true" className="hidden lg:col-span-7 lg:block lg:min-h-[380px]" />
          )}
        </div>
      </header>

      {/* Part B: Full-Width Opaque Editorial Band for Conclusions, Disclaimer, 36-Item Acceptance Card & References */}
      <div className="pointer-events-auto relative z-10 border-t border-[#B8C1C8]/16 bg-[#0A0E13] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1360px]">
          {/* Three-Column Academic Synthesis: Facts / Assumptions / Unverified */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <div className="border-b border-[#638DB0]/40 pb-2">
                <FactTag label="F" />
                <h3 className="mt-1 text-base font-semibold text-[#F2EFE7]">已知公开事实（监管与合规边界）</h3>
              </div>
              {factsCols.map((item) => (
                <article key={item.id} className="border border-[#B8C1C8]/14 bg-[#11161E] p-5">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-mono-tabular text-[#638DB0]">{item.id}</span>
                    <FactTag label={item.label} showText={false} />
                  </div>
                  <h4 className="mt-1.5 text-sm font-semibold text-[#F2EFE7]">{item.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#B8C1C8]">{item.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-[#B8C1C8]/10 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => onNavigateChapter(item.targetChapter)}
                      className="inline-flex items-center gap-1 text-[#F2EFE7] hover:text-[#D99A45]"
                    >
                      <span>回滚至对应章节</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {item.targetSourceId && (
                      <button
                        type="button"
                        onClick={() => onOpenSource(item.targetSourceId!)}
                        className="font-mono-tabular text-[#638DB0] underline-offset-4 hover:underline"
                      >
                        查看来源 [{item.targetSourceId}]
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="space-y-4">
              <div className="border-b border-[#D99A45]/40 pb-2">
                <FactTag label="A" />
                <h3 className="mt-1 text-base font-semibold text-[#F2EFE7]">有边界的教学假设与系统结论</h3>
              </div>
              {assumptionsCols.map((item) => (
                <article key={item.id} className="border border-[#B8C1C8]/14 bg-[#11161E] p-5">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-mono-tabular text-[#D99A45]">{item.id}</span>
                    <FactTag label={item.label} showText={false} />
                  </div>
                  <h4 className="mt-1.5 text-sm font-semibold text-[#F2EFE7]">{item.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#B8C1C8]">{item.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-[#B8C1C8]/10 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => onNavigateChapter(item.targetChapter)}
                      className="inline-flex items-center gap-1 text-[#F2EFE7] hover:text-[#D99A45]"
                    >
                      <span>回滚至分析视图</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {item.targetRiskId && (
                      <button
                        type="button"
                        onClick={() => onOpenRisk(item.targetRiskId!)}
                        className="font-mono-tabular text-[#D99A45] underline-offset-4 hover:underline"
                      >
                        检视 {item.targetRiskId}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="space-y-4">
              <div className="border-b border-[#B94C44]/40 pb-2">
                <FactTag label="U" />
                <h3 className="mt-1 text-base font-semibold text-[#F2EFE7]">未验证清单与正式提交前待核实项</h3>
              </div>
              {unverifiedCols.map((item) => (
                <article key={item.id} className="border border-[#B94C44]/24 bg-[#141216] p-5">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-mono-tabular text-[#B94C44]">{item.id}</span>
                    <FactTag label={item.label} showText={false} />
                  </div>
                  <h4 className="mt-1.5 text-sm font-semibold text-[#F2EFE7]">{item.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-[#B8C1C8]">{item.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-[#B8C1C8]/10 pt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => onNavigateChapter(item.targetChapter)}
                      className="inline-flex items-center gap-1 text-[#F2EFE7] hover:text-[#D99A45]"
                    >
                      <span>定位对应章节</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {item.targetRiskId && (
                      <button
                        type="button"
                        onClick={() => onOpenRisk(item.targetRiskId!)}
                        className="font-mono-tabular text-[#D99A45] underline-offset-4 hover:underline"
                      >
                        关联 {item.targetRiskId}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Standalone Formal Disclaimer */}
          <div
            aria-label="正式教学免责声明"
            className="mt-10 border border-[#D99A45]/35 bg-[#141A22] p-6"
          >
            <h3 className="text-sm font-semibold text-[#D99A45]">独立免责声明与研究边界</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#F2EFE7]">{TEACHING_DISCLAIMER}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#B8C1C8]">{SUBJECT_PROVISIONAL_NOTICE}</p>
          </div>

          {/* Final 36-Item Coursework Delivery Acceptance Card */}
          <div aria-label="最终 36 项课程交付验收卡" className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#F2EFE7]">最终 36 项交付验收卡（P0–P3 透明自检）</h3>
                <p className="mt-1 text-xs text-[#84909B]">
                  总计 36 项：本地已实测通过{' '}
                  <span className="font-mono-tabular text-[#638DB0]">{verifiedCount}</span> 项 · 待用户公网/真机复核{' '}
                  <span className="font-mono-tabular text-[#D99A45]">{pendingCount}</span> 项（未执行项绝不伪报通过）
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="验收卡分级筛选">
                {(
                  [
                    { id: 'all', label: '全部（36）' },
                    { id: 'P0', label: 'P0 合规（8）' },
                    { id: 'P1', label: 'P1 稳定（10）' },
                    { id: 'P2', label: 'P2 学术（10）' },
                    { id: 'P3', label: 'P3 电影交互（8）' },
                  ] as const
                ).map((tab) => {
                  const active = tierFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTierFilter(tab.id)}
                      className={`whitespace-nowrap border px-3 py-1.5 text-xs transition-colors ${
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

            <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {filteredChecklist.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between border border-[#B8C1C8]/12 bg-[#11161E] p-4 text-xs"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono-tabular text-[#84909B]">
                      {item.id} · {item.tierLabel}
                    </span>
                    <span
                      className={`font-mono-tabular font-medium ${
                        item.status === 'verified-local' ? 'text-[#638DB0]' : 'text-[#D99A45]'
                      }`}
                    >
                      {item.status === 'verified-local' ? '● 本地已实测通过' : '▲ 待用户公网/原件复核'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-[#F2EFE7]">{item.title}</p>
                  <p className="mt-1 leading-relaxed text-[#84909B]">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Reference Index */}
          <div className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold text-[#F2EFE7]">参考文献与公开资料索引</h3>
              <span className="font-mono-tabular text-xs text-[#84909B]">访问/检索日期：2026-11-20</span>
            </div>

            <div className="mt-4 divide-y divide-[#B8C1C8]/12 border border-[#B8C1C8]/14 bg-[#11161E]">
              {EVIDENCE_SOURCES.map((src) => (
                <div key={src.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 text-xs">
                      <span className="font-mono-tabular font-semibold text-[#638DB0]">[{src.code}]</span>
                      <span className="text-[#F2EFE7]">{src.publisher}</span>
                      <span aria-hidden="true" className="text-[#84909B]">·</span>
                      <span className="text-[#B8C1C8]">{src.title}</span>
                    </div>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 break-all font-mono-tabular text-[11px] text-[#84909B] hover:text-[#638DB0]"
                    >
                      <span>{src.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleCopy(src.id, buildOfflineCitationText(src.id))}
                    className="inline-flex shrink-0 items-center gap-1.5 self-start whitespace-nowrap border border-[#B8C1C8]/20 px-3 py-1.5 text-xs text-[#B8C1C8] hover:border-[#D99A45] hover:text-[#F2EFE7] sm:self-center"
                  >
                    {copiedId === src.id ? (
                      <>
                        <Check className="h-3 w-3 text-[#D99A45]" aria-hidden="true" />
                        <span>已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" aria-hidden="true" />
                        <span>复制引用</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Subtle return to top of film */}
          <div className="mt-10 flex justify-end border-t border-[#B8C1C8]/14 pt-6">
            <button
              type="button"
              onClick={() => onNavigateChapter('act-0')}
              className="inline-flex items-center gap-2 border border-[#B8C1C8]/24 px-4 py-2 text-xs text-[#F2EFE7] hover:border-[#D99A45]"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>回到片头 ACT 0 重览全片</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
