import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp01,
  computeDocumentProgress,
  computeStickyProgress,
  interpolateFlightAircraft,
  resolveActiveChapterFromRects,
  resolveBeatIndexFromProgress,
} from '../app/scrollDirector';

test('clamp01 bounds values safely including NaN and Infinity', () => {
  assert.equal(clamp01(-0.5), 0);
  assert.equal(clamp01(0.42), 0.42);
  assert.equal(clamp01(1.8), 1);
  assert.equal(clamp01(Number.NaN), 0);
});

test('computeStickyProgress maps section scroll span cleanly from 0 to 1', () => {
  // Section height 2400, viewport 900, sticky header 56 -> scrollableSpan = 2400 - 844 = 1556
  assert.equal(computeStickyProgress(56, 2400, 900, 56), 0);
  assert.equal(computeStickyProgress(56 - 778, 2400, 900, 56), 0.5);
  assert.equal(computeStickyProgress(56 - 1556, 2400, 900, 56), 1);
  assert.equal(computeStickyProgress(300, 2400, 900, 56), 0);
});

test('computeDocumentProgress computes overall film reel progress', () => {
  assert.equal(computeDocumentProgress(0, 6000, 900), 0);
  assert.equal(computeDocumentProgress(2550, 6000, 900), 0.5);
  assert.equal(computeDocumentProgress(5100, 6000, 900), 1);
});

test('resolveActiveChapterFromRects picks the chapter crossing the 35% focus line', () => {
  const sections = [
    { id: 'act-0' as const, top: -900, bottom: 100, height: 1000 },
    { id: 'act-1' as const, top: 100, bottom: 1400, height: 1300 },
    { id: 'act-2' as const, top: 1400, bottom: 2800, height: 1400 },
  ];
  // 35% of 900 = 315 -> inside act-1 [100, 1400)
  assert.equal(resolveActiveChapterFromRects(sections, 900), 'act-1');

  // When scrolled near top of page
  const topSections = [
    { id: 'act-0' as const, top: 0, bottom: 1100, height: 1100 },
    { id: 'act-1' as const, top: 1100, bottom: 2400, height: 1300 },
  ];
  assert.equal(resolveActiveChapterFromRects(topSections, 900), 'act-0');
});

test('resolveBeatIndexFromProgress maps 0..1 evenly across story beats', () => {
  assert.equal(resolveBeatIndexFromProgress(0, 5), 0);
  assert.equal(resolveBeatIndexFromProgress(0.25, 5), 1);
  assert.equal(resolveBeatIndexFromProgress(0.5, 5), 2);
  assert.equal(resolveBeatIndexFromProgress(0.79, 5), 3);
  assert.equal(resolveBeatIndexFromProgress(1, 5), 4);
});

test('interpolateFlightAircraft smoothly transitions coordinates and rotor tilt from takeoff to cruise to landing', () => {
  const start = interpolateFlightAircraft(0);
  assert.equal(start.phaseId, 'takeoff');
  assert.equal(start.nacelleDeg, 0);

  const mid = interpolateFlightAircraft(0.5);
  assert.equal(mid.phaseId, 'cruise');
  assert.equal(mid.nacelleDeg, 86);
  assert.equal(mid.x, 520);
  assert.equal(mid.y, 74);

  const climbQuarter = interpolateFlightAircraft(0.125);
  assert.ok(climbQuarter.x > 110 && climbQuarter.x < 285);
  assert.ok(climbQuarter.nacelleDeg > 0 && climbQuarter.nacelleDeg < 42);

  const end = interpolateFlightAircraft(1);
  assert.equal(end.phaseId, 'landing');
  assert.equal(end.nacelleDeg, 0);
});
