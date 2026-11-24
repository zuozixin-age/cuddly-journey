interface SceneTransitionBridgeProps {
  fromCode: string;
  toCode: string;
  toTitleZh: string;
  toTitleEn: string;
  premise: string;
  is3dActive?: boolean;
}

/**
 * Atmospheric cinema scene-transition slate between consecutive Acts.
 * Keeps vertical rhythm cinematic while letting the persistent 3D eVTOL camera glide through continuously.
 */
export function SceneTransitionBridge({
  fromCode,
  toCode,
  toTitleZh,
  toTitleEn,
  premise,
  is3dActive = false,
}: SceneTransitionBridgeProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative z-10 overflow-hidden border-y border-[#B8C1C8]/12 px-4 py-10 sm:px-6 lg:px-8 lg:py-14 ${
        is3dActive ? 'pointer-events-none bg-[#0A0E13]/72 lg:bg-transparent' : 'bg-[#080B10]'
      }`}
    >
      <div className="mx-auto max-w-[1360px]">
        <div
          className={
            is3dActive
              ? 'max-w-[540px] border-l border-[#D99A45]/60 bg-[#0A0E13]/88 px-5 py-4'
              : 'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end'
          }
        >
          <div>
            <p className="font-mono-tabular text-[11px] tracking-[0.22em] text-[#D99A45]">
              {fromCode} → {toCode} · {toTitleEn}
            </p>
            <p className="mt-1.5 text-lg font-medium tracking-tight text-[#F2EFE7] sm:text-xl">
              {toTitleZh}
            </p>
          </div>
          <p
            className={
              is3dActive
                ? 'mt-2 text-xs leading-relaxed text-[#B8C1C8]'
                : 'max-w-md text-xs leading-relaxed text-[#84909B] sm:text-right'
            }
          >
            {premise}
          </p>
        </div>
      </div>
    </div>
  );
}
