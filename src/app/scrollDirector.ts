import type { ChapterId, FlightPhaseId } from '../safety/types';

export interface SectionRectMetric {
  id: ChapterId;
  top: number;
  bottom: number;
  height: number;
}

export interface FlightInterpolatedPose {
  x: number;
  y: number;
  nacelleDeg: number;
  phaseId: FlightPhaseId;
  phaseIndex: number;
}

export const FLIGHT_WAYPOINTS: ReadonlyArray<{
  phaseId: FlightPhaseId;
  x: number;
  y: number;
  nacelleDeg: number;
}> = [
  { phaseId: 'takeoff', x: 110, y: 214, nacelleDeg: 0 },
  { phaseId: 'climb', x: 285, y: 124, nacelleDeg: 42 },
  { phaseId: 'cruise', x: 520, y: 74, nacelleDeg: 86 },
  { phaseId: 'approach', x: 755, y: 130, nacelleDeg: 40 },
  { phaseId: 'landing', x: 925, y: 214, nacelleDeg: 0 },
];

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/**
 * Computes normalized sticky-stage scroll progress in [0, 1].
 * - 0 when the section top reaches the top anchor (stickyTopPx)
 * - 1 when the section bottom reaches the bottom of the viewport
 */
export function computeStickyProgress(
  rectTop: number,
  rectHeight: number,
  viewportHeight: number,
  stickyTopPx = 56,
): number {
  const scrollableSpan = Math.max(1, rectHeight - (viewportHeight - stickyTopPx));
  const traveled = stickyTopPx - rectTop;
  return clamp01(traveled / scrollableSpan);
}

/**
 * Computes document-wide normalized scroll progress in [0, 1].
 */
export function computeDocumentProgress(
  scrollY: number,
  scrollHeight: number,
  viewportHeight: number,
): number {
  const maxScroll = Math.max(1, scrollHeight - viewportHeight);
  return clamp01(scrollY / maxScroll);
}

/**
 * Determines which chapter owns the cinema focus line (35% down from top of viewport).
 */
export function resolveActiveChapterFromRects(
  sections: ReadonlyArray<SectionRectMetric>,
  viewportHeight: number,
): ChapterId {
  if (sections.length === 0) return 'act-0';
  const focusLine = viewportHeight * 0.35;

  for (const sec of sections) {
    if (sec.top <= focusLine && sec.bottom > focusLine) {
      return sec.id;
    }
  }

  // Fallback: closest section top above focusLine, else first section
  let best = sections[0];
  for (const sec of sections) {
    if (sec.top <= focusLine) {
      best = sec;
    }
  }
  return best.id;
}

/**
 * Maps continuous progress [0, 1] cleanly into discrete beat index [0, count - 1].
 */
export function resolveBeatIndexFromProgress(progress: number, count: number): number {
  if (count <= 1) return 0;
  const p = clamp01(progress);
  const idx = Math.floor(p * count);
  return Math.min(count - 1, Math.max(0, idx));
}

/**
 * Smoothly interpolates aircraft trajectory position & tilt-rotor nacelle angle
 * across the 5 flight phases directly from scroll progress [0, 1].
 */
export function interpolateFlightAircraft(progress: number): FlightInterpolatedPose {
  const p = clamp01(progress);
  const segments = FLIGHT_WAYPOINTS.length - 1;
  const scaled = p * segments;
  const segIndex = Math.min(segments - 1, Math.floor(scaled));
  const localT = clamp01(scaled - segIndex);

  // Smoothstep easing inside each flight transition segment
  const easedT = localT * localT * (3 - 2 * localT);
  const from = FLIGHT_WAYPOINTS[segIndex];
  const to = FLIGHT_WAYPOINTS[segIndex + 1];

  const x = from.x + (to.x - from.x) * easedT;
  const y = from.y + (to.y - from.y) * easedT;
  const nacelleDeg = from.nacelleDeg + (to.nacelleDeg - from.nacelleDeg) * easedT;

  const nearestIdx = Math.min(
    FLIGHT_WAYPOINTS.length - 1,
    Math.max(0, Math.round(scaled)),
  );

  return {
    x,
    y,
    nacelleDeg,
    phaseId: FLIGHT_WAYPOINTS[nearestIdx].phaseId,
    phaseIndex: nearestIdx,
  };
}
