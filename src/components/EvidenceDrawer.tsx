import { useEffect, useRef } from 'react';
import { ArrowRight, ExternalLink, X } from 'lucide-react';
import type { OpenPanelState } from '../app/store';
import { getMitigationsForRisk, getRiskById } from '../safety/queries';
import {
  EVIDENCE_SOURCES,
  FACT_LABEL_META,
  SUBJECT_PROVISIONAL_NOTICE,
  TEACHING_DISCLAIMER,
} from '../safety/sources';
import type { FactLabel, ScenarioId } from '../safety/types';
import { FactTag } from './FactTag';

interface EvidenceDrawerProps {
  panel: OpenPanelState;
  onClose: () => void;
  onJumpToMitigation: (mitigationId: string) => void;
  onJumpToScenario: (scenario: ScenarioId) => void;
}

export function EvidenceDrawer({
  panel,
  onClose,
  onJumpToMitigation,
  onJumpToScenario,
}: EvidenceDrawerProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!panel) return;
    closeBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [panel, onClose]);

  if (!panel) return null;

  const risk = panel.type === 'risk' ? getRiskById(panel.riskId) : undefined;
  const linkedMitigations = risk ? getMitigationsForRisk(risk.id) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label={
        panel.type === 'evidence'
          ? '公开证据与参考文献抽屉'
          : panel.type === 'risk'
            ? '风险完整追踪链详情'
            : '教学声明与事实分级协议'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-[#B8C1C8]/20 bg-[#0D1219] text-[#F2EFE7]">
        <div className="flex items-center justify-between border-b border-[#B8C1C8]/14 px-6 py-4">
          <div>
            <p className="font-mono-tabular text-xs tracking-wider text-[#84909B]">
              {panel.type === 'evidence'
                ? 'EVIDENCE REGISTRY · 2026-11-20'
                : panel.type === 'risk'
                  ? `RISK TRACE · ${risk?.id ?? ''}`
                  : 'ACADEMIC INTEGRITY PROTOCOL'}
            </p>
            <h2 className="mt-0.5 text-lg font-semibold text-[#F2EFE7]">
              {panel.type === 'evidence'
                ? '公开资料索引与事实分级协议'
                : panel.type === 'risk'
                  ? risk?.title ?? '风险记录详情'
                  : '教学研究免责声明与证据分级标准'}
            </h2>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="关闭抽屉"
            className="inline-flex h-9 w-9 items-center justify-center border border-[#B8C1C8]/20 text-[#B8C1C8] transition-colors hover:border-[#D99A45] hover:text-[#F2EFE7]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Mandatory Teaching Disclaimer */}
          <section className="mb-6 border border-[#D99A45]/35 bg-[#141A22] p-4">
            <p className="text-xs font-medium tracking-wide text-[#D99A45]">课程教学研究声明</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#F2EFE7]">{TEACHING_DISCLAIMER}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#B8C1C8]">{SUBJECT_PROVISIONAL_NOTICE}</p>
          </section>

          {panel.type === 'risk' && risk && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 border-b border-[#B8C1C8]/12 pb-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[#84909B]">关联阶段与子系统</p>
                  <p className="mt-1 text-sm text-[#F2EFE7]">
                    {risk.phaseLabel} · {risk.subsystemLabel}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#84909B]">证据状态与定性严重性</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <FactTag label={risk.evidenceStatus} />
                    <span className="text-[#84909B]">·</span>
                    <span className="text-[#D99A45]">{risk.severity}</span>
                  </div>
                </div>
              </div>

              <dl className="space-y-4 text-sm">
                <div className="border-b border-[#B8C1C8]/10 pb-3">
                  <dt className="text-xs text-[#84909B]">1. 运行工况</dt>
                  <dd className="mt-1 leading-relaxed text-[#F2EFE7]">{risk.operationalContext}</dd>
                </div>
                <div className="border-b border-[#B8C1C8]/10 pb-3">
                  <dt className="text-xs text-[#84909B]">2. 危险源与失效机制</dt>
                  <dd className="mt-1 leading-relaxed text-[#F2EFE7]">
                    {risk.hazard} — {risk.failureMechanism}
                  </dd>
                </div>
                <div className="border-b border-[#B8C1C8]/10 pb-3">
                  <dt className="text-xs text-[#84909B]">3. 系统后果与可能性说明</dt>
                  <dd className="mt-1 leading-relaxed text-[#F2EFE7]">{risk.consequence}</dd>
                  <dd className="mt-1.5 text-xs text-[#D99A45]">{risk.likelihoodEvidence}</dd>
                </div>
                <div className="border-b border-[#B8C1C8]/10 pb-3">
                  <dt className="text-xs text-[#84909B]">4. 候选安全控制措施（非宣称厂商已实装）</dt>
                  <dd className="mt-1.5">
                    <ul className="space-y-1.5 text-[#B8C1C8]">
                      {risk.proposedControls.map((ctrl) => (
                        <li key={ctrl}>— {ctrl}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="border-b border-[#B8C1C8]/10 pb-3">
                  <dt className="text-xs text-[#84909B]">5. 所需独立验证方法</dt>
                  <dd className="mt-1.5">
                    <ul className="space-y-1.5 text-[#B8C1C8]">
                      {risk.verificationMethods.map((method) => (
                        <li key={method}>— {method}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="border-b border-[#B8C1C8]/10 pb-3">
                  <dt className="text-xs text-[#84909B]">6. 剩余风险与不确定性</dt>
                  <dd className="mt-1 leading-relaxed text-[#B94C44]">{risk.residualRisk}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {risk.scenarioId && (
                  <button
                    type="button"
                    onClick={() => onJumpToScenario(risk.scenarioId!)}
                    className="inline-flex items-center gap-2 border border-[#D99A45] bg-[#D99A45]/12 px-4 py-2 text-xs font-medium text-[#F2EFE7] transition-colors hover:bg-[#D99A45]/22"
                  >
                    <span>打开 {risk.scenarioId} 风险传播图</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
                {linkedMitigations.slice(0, 2).map((mit) => (
                  <button
                    key={mit.id}
                    type="button"
                    onClick={() => onJumpToMitigation(mit.id)}
                    className="inline-flex items-center gap-1.5 border border-[#B8C1C8]/20 px-3.5 py-2 text-xs text-[#B8C1C8] transition-colors hover:border-[#D99A45] hover:text-[#F2EFE7]"
                  >
                    <span>追踪防护层：{mit.nameZh}</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {(panel.type === 'evidence' || panel.type === 'disclaimer') && (
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-semibold text-[#F2EFE7]">事实标签定义（全站统一）</h3>
                <div className="mt-3 divide-y divide-[#B8C1C8]/12 border border-[#B8C1C8]/14 bg-[#11161E]">
                  {(['F', 'A', 'D', 'U'] as FactLabel[]).map((code) => (
                    <div key={code} className="p-3.5">
                      <FactTag label={code} />
                      <p className="mt-1 text-xs leading-relaxed text-[#B8C1C8]">
                        {FACT_LABEL_META[code].description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-[#F2EFE7]">
                  公开资料索引（访问/检索日期：2026-11-20）
                </h3>
                <p className="mt-1 text-xs text-[#84909B]">
                  来源优先级：监管原文 &gt; 厂商正式技术/审定材料 &gt; 同行评议论文 &gt; 可信工程资料。
                </p>

                <div className="mt-4 space-y-3">
                  {EVIDENCE_SOURCES.map((src) => {
                    const isHighlighted = panel.type === 'evidence' && panel.sourceId === src.id;
                    return (
                      <article
                        key={src.id}
                        className={`border p-4 transition-colors ${
                          isHighlighted
                            ? 'border-[#D99A45] bg-[#171E28]'
                            : 'border-[#B8C1C8]/14 bg-[#11161E]'
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2 text-xs">
                            <span className="font-mono-tabular font-semibold text-[#638DB0]">[{src.code}]</span>
                            <span className="text-[#B8C1C8]">{src.publisher}</span>
                            <span aria-hidden="true" className="text-[#84909B]">·</span>
                            <span className="font-mono-tabular text-[#84909B]">访问 {src.accessDate}</span>
                          </div>
                          <FactTag label="F" showText={false} />
                        </div>

                        <h4 className="mt-1.5 text-sm font-medium text-[#F2EFE7]">{src.title}</h4>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#B8C1C8]">{src.summary}</p>
                        <p className="mt-1.5 text-xs text-[#84909B]">适用范围：{src.scope}</p>

                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2.5 inline-flex items-center gap-1.5 break-all font-mono-tabular text-[11px] text-[#638DB0] underline-offset-4 hover:underline"
                        >
                          <span>{src.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                        </a>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
