import { FACT_LABEL_META } from '../safety/sources';
import type { FactLabel } from '../safety/types';

interface FactTagProps {
  label: FactLabel;
  showText?: boolean;
  className?: string;
}

const TONE_MAP: Record<FactLabel, string> = {
  F: 'text-[#638DB0]',
  A: 'text-[#D99A45]',
  D: 'text-[#B8C1C8]',
  U: 'text-[#B94C44]',
};

/**
 * Quiet, unboxed typographic fact indicator (zero-pill discipline).
 * Always pairs semantic tone with explicit code + Chinese label text.
 */
export function FactTag({ label, showText = true, className = '' }: FactTagProps) {
  const meta = FACT_LABEL_META[label];
  return (
    <span
      title={meta.description}
      aria-label={meta.fullZh}
      className={`inline-flex items-baseline gap-1 font-mono-tabular text-xs font-medium tracking-wide ${TONE_MAP[label]} ${className}`}
    >
      <span>[{meta.code}]</span>
      {showText && <span className="font-sans tracking-normal opacity-90">{meta.shortZh}</span>}
    </span>
  );
}
