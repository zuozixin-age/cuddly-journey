import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appReducer,
  CHAPTER_META,
  createInitialState,
  parseHashToChapter,
} from '../app/store';
import type { ChapterId, FlightPhaseId, ScenarioId } from '../safety/types';

test('initial state respects ?autostart=1 and prefersReducedMotion', () => {
  const s1 = createInitialState({ search: '?autostart=1', prefersReducedMotion: true });
  assert.equal(s1.chapter, 'act-1');
  assert.equal(s1.introSkipped, true);
  assert.equal(s1.motionMode, 'reduced');
  assert.equal(s1.soundEnabled, false);

  const s2 = createInitialState({});
  assert.equal(s2.chapter, 'act-0');
  assert.equal(s2.motionMode, 'full');
  assert.equal(s2.qualityMode, 'standard');
});

test('invalid hash falls back safely to act-1 with clear recovery message', () => {
  const parsed = parseHashToChapter('#nonexistent-act');
  assert.equal(parsed.chapter, null);
  assert.equal(parsed.invalidHash, 'nonexistent-act');

  const state = createInitialState({ hash: '#nonexistent-act' });
  assert.equal(state.chapter, 'act-1');
  assert.ok(state.routeFallbackMessage && state.routeFallbackMessage.includes('nonexistent-act'));

  const dismissed = appReducer(state, { type: 'DISMISS_ROUTE_FALLBACK' });
  assert.equal(dismissed.routeFallbackMessage, null);
});

test('repeated skip intro 10 times is idempotent and clears overlays', () => {
  let state = createInitialState({});
  state = appReducer(state, { type: 'OPEN_PANEL', panel: { type: 'disclaimer' } });

  for (let i = 0; i < 10; i++) {
    state = appReducer(state, { type: 'SKIP_INTRO' });
    assert.equal(state.chapter, 'act-1');
    assert.equal(state.openPanel, null);
    assert.equal(state.introSkipped, true);
  }
});

test('rapid 50-step chapter navigation remains consistent and closes stale panels', () => {
  let state = createInitialState({});
  const ids: ChapterId[] = CHAPTER_META.map((c) => c.id);

  for (let i = 0; i < 50; i++) {
    if (i % 5 === 0) {
      state = appReducer(state, { type: 'OPEN_PANEL', panel: { type: 'evidence', sourceId: 'S5' } });
    }
    const target = ids[i % ids.length];
    state = appReducer(state, { type: 'SET_CHAPTER', chapter: target });
    assert.equal(state.chapter, target);
    assert.equal(state.openPanel, null);
  }
});

test('20-step flight phase switching and 30-step scenario switching preserve valid state', () => {
  let state = createInitialState({ hash: '#act-1' });
  const phases: FlightPhaseId[] = ['takeoff', 'climb', 'cruise', 'approach', 'landing'];
  for (let i = 0; i < 20; i++) {
    const nextPhase = phases[(i * 3) % phases.length];
    state = appReducer(state, { type: 'SET_FLIGHT_PHASE', phase: nextPhase });
    assert.equal(state.flightPhase, nextPhase);
  }

  const scenarios: ScenarioId[] = ['EX-01', 'EX-02', 'EX-03'];
  for (let i = 0; i < 30; i++) {
    const nextScenario = scenarios[i % scenarios.length];
    state = appReducer(state, { type: 'SET_SCENARIO', scenario: nextScenario });
    assert.equal(state.selectedScenario, nextScenario);
    assert.ok(state.activeFaultNode.startsWith(nextScenario.replace('-', '')));
  }
});

test('cross-act handoffs set target chapter and linked entity atomically', () => {
  let state = createInitialState({ hash: '#act-1' });

  state = appReducer(state, { type: 'JUMP_TO_SUBSYSTEM', subsystem: 'power' });
  assert.equal(state.chapter, 'act-2');
  assert.equal(state.selectedSubsystem, 'power');

  state = appReducer(state, { type: 'JUMP_TO_SCENARIO_ANALYSIS', scenario: 'EX-02', tab: 'propagation' });
  assert.equal(state.chapter, 'act-3');
  assert.equal(state.selectedScenario, 'EX-02');
  assert.equal(state.activeMethodTab, 'propagation');

  state = appReducer(state, { type: 'JUMP_TO_MITIGATION', mitigationId: 'MIT-02' });
  assert.equal(state.chapter, 'act-4');
  assert.equal(state.selectedMitigation, 'MIT-02');
});

test('accessibility mode toggles switch deterministically', () => {
  let state = createInitialState({});
  state = appReducer(state, { type: 'TOGGLE_MOTION_MODE' });
  assert.equal(state.motionMode, 'reduced');
  state = appReducer(state, { type: 'TOGGLE_QUALITY_MODE' });
  assert.equal(state.qualityMode, 'lite');
  state = appReducer(state, { type: 'TOGGLE_SOUND' });
  assert.equal(state.soundEnabled, true);
});
