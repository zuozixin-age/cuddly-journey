import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import { computeStickyProgress, resolveBeatIndexFromProgress } from '../app/scrollDirector';
import { MITIGATION_LAYERS, VERIFICATION_REQUIREMENTS } from '../safety/data';
import { getMitigationById, getRiskById } from '../safety/queries';
import { FactTag } from '../components/FactTag';
import { DefenseLayersSvg } from '../visuals/DefenseLayersSvg';

interface Act4TrustProps {
  selectedMitigation: string;
  is3dActive: boolean;
  onSelectMitigation: (mitigationId: string) => void;
  onSyncMitigationFromScroll: (mitigationId: string) => void;
  onOpenRisk: (riskId: string) => void;
  onOpenSource: (sourceId: string) => void;
}

export function Act4Trust({
  selectedMitigation,
  is3dActive,
  onSelectMitigation,
  onSyncMitigationFromScroll,
  onOpenRisk,
  onOpenSource,
}: Act4TrustProps) {
  const [show2dLayers, setShow2dLayers] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const beatRefs = useRef<Record<string, HTMLElement | null>>({});
  const lastScrolledMitRef = useRef<string>(selectedMitigation);

  const activeLayer = getMitigationById(selectedMitigation) ?? MITIGATION_LAYERS[0];

  useEffect(() => {
    let rafId = 0;
    const update = () => {
      rafId = 0;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const progress = computeStickyProgress(rect.top, rect.height, window.innerHeight, 76);
      const idx = resolveBeatIndexFromProgress(progress, MITIGATION_LAYERS.length);
      const nextMit = MITIGATION_LAYERS[idx]?.id;
      if (nextMit && nextMit !== lastScrolledMitRef.current) {
        lastScrolledMitRef.current = nextMit;
        onSyncMitigationFromScroll(nextMit);
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
  }, [onSyncMitigationFromScroll]);

  const handleSelectMitAndScroll = (mitId: string) => {
    lastScrolledMitRef.current = mitId;
    onSelectMitigation(mitId);
    const el = beatRefs.current[mitId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section
      id="act-4"
      data-chapter-section="act-4"
      data-active-mitigation={activeLayer.id}
      aria-labelledby="act4-heading"
      className={`relative z-10 ${is3dActive ? 'pointer-events-none' : ''}`}
    >
      {/* Part A: 7 Concentric 3D Defense Rings Cinema Stage */}
      <div className="mx-auto max-w-[1360px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header
          className={`pointer-events-auto border-b border-[#B8C1C8]/16 pb-6 ${
            is3dActive ? 'bg-[#0A0E13]/88 p-5 lg:max-w-[540px]' : ''
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#84909B]">
            <span className="font-mono-tabular text-[#D99A45]">ACT IV · ENGINEERING TRUST</span>
            <span aria-hidden="true">·</span>
            <span>随滚轮逐层点亮 3D 七道纵深防护屏障</span>
            <span aria-hidden="true">·</span>
            <FactTag label="A" />
          </div>
          <h2 id="act4-heading" className="mt-2 text-2xl font-semibold text-[#F2EFE7] sm:text-3xl">
            工程建立信任：风险不会凭空消失，只能由独立证据收敛
          </h2>
          <p className="prose-measure mt-2 text-sm text-[#B8C1C8]">
            继续向下滚动，右侧 3D 飞行器外围将从第 1 层至第 7 层逐道构筑同心防护包络，展示每道防线的工程机制、独立验证方法与未关闭剩余不确定性；所有拟议措施均不等同于 Joby S4 已获认证能力。
          </p>
        </header>

        <div ref={trackRef} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* 2D Fallback Stage Left when Lite mode or WebGL unavailable */}
          {!is3dActive && (
            <div className="pointer-events-auto space-y-4 lg:sticky lg:top-[76px] lg:col-span-5 lg:self-start">
              <DefenseLayersSvg
                selectedMitigation={activeLayer.id}
                onSelectMitigation={handleSelectMitAndScroll}
              />
              <div className="border border-[#B8C1C8]/14 bg-[#11161E] p-4 text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono-tabular text-[#D99A45]">
                    当前聚焦层：L0{activeLayer.layerOrder} · {activeLayer.code}
                  </span>
                  <span className="font-mono-tabular text-[#84909B]">
                    覆盖 {activeLayer.coveredRiskIds.length} 项风险
                  </span>
                </div>
                <p className="mt-1.5 font-medium text-[#F2EFE7]">{activeLayer.nameZh}</p>
                <p className="mt-1 leading-relaxed text-[#84909B]">{activeLayer.categorySummary}</p>
              </div>
            </div>
          )}

          {/* 7-Layer Scroll Stack (Left 5 cols in 3D mode; Right 7 cols in 2D mode) */}
          <div
            className={`pointer-events-auto space-y-6 lg:space-y-8 ${
              is3dActive ? 'lg:col-span-5' : 'lg:col-span-7'
            }`}
          >
            {is3dActive && (
              <div className="border border-[#B8C1C8]/18 bg-[#0D1219]/95 p-4 lg:sticky lg:top-[68px] lg:z-20">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular font-semibold text-[#D99A45]">
                    3D 防护环已点亮：L01 → L0{activeLayer.layerOrder} / 07
                  </span>
                  <button
                    type="button"
                    onClick={() => setShow2dLayers((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#638DB0] hover:text-[#F2EFE7]"
                  >
                    <Layers className="h-3 w-3" aria-hidden="true" />
                    <span>{show2dLayers ? '收起 2D 层次图' : '对照 2D 层次图'}</span>
                  </button>
                </div>

                <div className="mt-2.5 grid grid-cols-7 gap-1">
                  {MITIGATION_LAYERS.map((layer) => {
                    const active = layer.id === activeLayer.id;
                    const illuminated = layer.layerOrder <= activeLayer.layerOrder;
                    return (
                      <button
                        key={layer.id}
                        type="button"
                        onClick={() => handleSelectMitAndScroll(layer.id)}
                        className={`border py-1.5 text-center font-mono-tabular text-[11px] transition-colors ${
                          active
                            ? 'border-[#D99A45] bg-[#1A212B] font-semibold text-[#F2EFE7]'
                            : illuminated
                              ? 'border-[#638DB0]/45 bg-[#121923] text-[#C7D0D8]'
                              : 'border-[#B8C1C8]/14 bg-[#11161E] text-[#84909B] hover:text-[#F2EFE7]'
                        }`}
                      >
                        L0{layer.layerOrder}
                      </button>
                    );
                  })}
                </div>

                {show2dLayers && (
                  <div className="mt-3 border-t border-[#B8C1C8]/12 pt-3">
                    <DefenseLayersSvg
                      selectedMitigation={activeLayer.id}
                      onSelectMitigation={handleSelectMitAndScroll}
                    />
                  </div>
                )}
              </div>
            )}

            {MITIGATION_LAYERS.map((layer) => {
              const isActive = layer.id === activeLayer.id;
              return (
                <article
                  key={layer.id}
                  ref={(el) => {
                    beatRefs.current[layer.id] = el;
                  }}
                  id={`mitigation-${layer.id}`}
                  data-mitigation-beat={layer.id}
                  className={`border p-5 transition-colors duration-300 ${
                    isActive
                      ? 'border-[#D99A45]/80 bg-[#131A24]/95'
                      : 'border-[#B8C1C8]/16 bg-[#0D1219]/90 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                    <span className="font-mono-tabular font-semibold text-[#D99A45]">
                      LAYER 0{layer.layerOrder} · {layer.code} · {layer.nameEn}
                    </span>
                    <FactTag label={layer.label} />
                  </div>

                  <h3 className="mt-2 text-lg font-semibold text-[#F2EFE7]">{layer.nameZh}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#F2EFE7]">{layer.mechanism}</p>

                  {/* Covered Risks */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {layer.coveredRiskIds.map((rid) => {
                      const risk = getRiskById(rid);
                      return (
                        <button
                          key={rid}
                          type="button"
                          onClick={() => onOpenRisk(rid)}
                          className="inline-flex items-center gap-1.5 border border-[#B8C1C8]/18 bg-[#0A0E13] px-3 py-1.5 text-xs text-[#F2EFE7] hover:border-[#D99A45]"
                        >
                          <span className="font-mono-tabular text-[#D99A45]">{rid}</span>
                          <span className="max-w-[180px] truncate text-[#B8C1C8]">{risk?.hazard ?? ''}</span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-[#84909B]" aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Independent Verification Methods */}
                  <div className="mt-4 border-t border-[#B8C1C8]/12 pt-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#638DB0]">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>独立验证方法（无验证不视为有效控制）</span>
                    </p>
                    <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[#F2EFE7]">
                      {layer.verificationMethods.map((method) => (
                        <li key={method}>— {method}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Explicit Residual Uncertainty */}
                  <div className="mt-4 border border-[#B94C44]/35 bg-[#1B1215] p-3.5 text-xs">
                    <p className="font-semibold text-[#E0665E]">剩余不确定性（未关闭边界）</p>
                    <p className="mt-1 leading-relaxed text-[#F2EFE7]">{layer.residualUncertainty}</p>
                    <p className="mt-1.5 text-[#B8C1C8]">{layer.nonClaimNotice}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[#84909B]">监管参考：</span>
                    {layer.sourceIds.map((sid) => (
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
                </article>
              );
            })}
          </div>

          {is3dActive && <div aria-hidden="true" className="hidden lg:col-span-7 lg:block" />}
        </div>
      </div>

      {/* Part B: Full-Width Opaque Editorial Band for REQ-01..08 Traceability Matrix */}
      <div className="pointer-events-auto relative z-10 border-y border-[#B8C1C8]/16 bg-[#0A0E13] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1360px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-[#F2EFE7]">安全需求—验证追溯矩阵（REQ-01 至 REQ-08）</h3>
              <p className="mt-1 text-xs text-[#84909B]">
                高亮行与当前聚焦防护层 {activeLayer.code}（{activeLayer.nameZh}）联动；每条需求均绑定风险编号与验证证据。
              </p>
            </div>
            <FactTag label="A" />
          </div>

          <div className="mt-4 overflow-x-auto border border-[#B8C1C8]/14 bg-[#11161E]">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-[#B8C1C8]/16 bg-[#0D1219] text-[#84909B]">
                  <th className="px-4 py-3 font-medium">需求编号</th>
                  <th className="px-4 py-3 font-medium">安全需求命题</th>
                  <th className="px-4 py-3 font-medium">关联风险</th>
                  <th className="px-4 py-3 font-medium">所需验证证据</th>
                  <th className="px-4 py-3 font-medium">合规边界说明</th>
                  <th className="px-4 py-3 text-right font-medium">来源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B8C1C8]/10">
                {VERIFICATION_REQUIREMENTS.map((req) => {
                  const isMatched = req.linkedMitigationId === activeLayer.id;
                  return (
                    <tr
                      key={req.id}
                      className={isMatched ? 'bg-[#171E28]' : 'hover:bg-[#141B24]'}
                    >
                      <td className="px-4 py-3.5 align-top font-mono-tabular">
                        <span className={isMatched ? 'font-semibold text-[#D99A45]' : 'text-[#B8C1C8]'}>
                          {req.id}
                        </span>
                        <div className="mt-1">
                          <FactTag label={req.label} showText={false} />
                        </div>
                      </td>
                      <td className="max-w-xs px-4 py-3.5 align-top font-medium text-[#F2EFE7]">
                        {req.title}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          {req.linkedRiskIds.map((rid) => (
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
                      </td>
                      <td className="max-w-xs px-4 py-3.5 align-top leading-relaxed text-[#B8C1C8]">
                        {req.verificationArtifact}
                      </td>
                      <td className="max-w-xs px-4 py-3.5 align-top leading-relaxed text-[#84909B]">
                        <div>{req.regulatoryContext}</div>
                        <div className="mt-1 text-[#B8C1C8]">{req.statusNote}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right align-top">
                        <div className="flex justify-end gap-1.5">
                          {req.sourceIds.map((sid) => (
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
