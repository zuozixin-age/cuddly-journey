import assert from 'node:assert/strict';
import test from 'node:test';
import { computeCinemaFrame, type CinemaChoreographyInput } from '../visuals/evtol3d/cinemaChoreography';

const BASE_INPUT: CinemaChoreographyInput = {
  chapter: 'act-0',
  act0Progress: 0,
  act1Progress: 0,
  flightPhase: 'climb',
  selectedSubsystem: 'propulsion',
  selectedScenario: 'EX-01',
  activeFaultStepIndex: 2,
  selectedMitigation: 'MIT-01',
  act5DawnProgress: 0.5,
  xrayOverride: 'auto',
  wideDesktop: true,
};

test('Act 0 starts grounded with solid composite shell and studio floor', () => {
  const frame = computeCinemaFrame({ ...BASE_INPUT, chapter: 'act-0', act0Progress: 0 });
  assert.equal(frame.xrayLevel, 0);
  assert.equal(frame.gearDeploy, 1);
  assert.equal(frame.floorOpacity, 1);
  assert.equal(frame.faultMode, 'none');
  assert.equal(frame.defenseRingCount, 0);
  // Desktop framing shifts target slightly left so aircraft frames on open right half
  assert.ok(frame.cameraTarget[0] < 0);
});

test('Act I continuously tilts 6 nacelles from vertical climb through cruise and retracts landing gear', () => {
  const start = computeCinemaFrame({ ...BASE_INPUT, chapter: 'act-1', act1Progress: 0.05 });
  const cruise = computeCinemaFrame({ ...BASE_INPUT, chapter: 'act-1', act1Progress: 0.55 });
  const land = computeCinemaFrame({ ...BASE_INPUT, chapter: 'act-1', act1Progress: 0.96 });

  assert.ok(start.nacelleTiltDeg < 15, `expected low tilt in climb, got ${start.nacelleTiltDeg}`);
  assert.ok(cruise.nacelleTiltDeg >= 80, `expected cruise tilt >= 80, got ${cruise.nacelleTiltDeg}`);
  assert.equal(cruise.gearDeploy, 0);
  assert.ok(cruise.aircraftPos[1] > start.aircraftPos[1]);
  assert.ok(land.nacelleTiltDeg < 15);
  assert.equal(land.gearDeploy, 1);
});

test('Act II activates X-ray cutaway and shifts focus per subsystem', () => {
  const powerFrame = computeCinemaFrame({
    ...BASE_INPUT,
    chapter: 'act-2',
    selectedSubsystem: 'power',
  });
  const structFrame = computeCinemaFrame({
    ...BASE_INPUT,
    chapter: 'act-2',
    selectedSubsystem: 'structures',
  });

  assert.ok(powerFrame.xrayLevel >= 0.8);
  assert.equal(powerFrame.focusSubsystem, 'power');
  assert.equal(structFrame.focusSubsystem, 'structures');
  assert.notDeepEqual(powerFrame.cameraPos, structFrame.cameraPos);
});

test('Act III activates fault isolation and respects X-ray override', () => {
  const ex02 = computeCinemaFrame({
    ...BASE_INPUT,
    chapter: 'act-3',
    selectedScenario: 'EX-02',
    activeFaultStepIndex: 5,
  });
  assert.equal(ex02.faultMode, 'EX-02');
  assert.ok(ex02.faultIntensity > 0.7);
  assert.equal(ex02.focusSubsystem, 'power');

  const forcedOff = computeCinemaFrame({
    ...BASE_INPUT,
    chapter: 'act-2',
    xrayOverride: 'off',
  });
  assert.equal(forcedOff.xrayLevel, 0);
});

test('Act IV illuminates concentric defense rings progressively L01..L07', () => {
  const layer1 = computeCinemaFrame({ ...BASE_INPUT, chapter: 'act-4', selectedMitigation: 'MIT-01' });
  const layer7 = computeCinemaFrame({ ...BASE_INPUT, chapter: 'act-4', selectedMitigation: 'MIT-07' });
  assert.equal(layer1.defenseRingCount, 1);
  assert.equal(layer7.defenseRingCount, 7);
});

test('Act V shifts into brighter golden dawn studio lighting with zero fault artifacts', () => {
  const act0 = computeCinemaFrame({ ...BASE_INPUT, chapter: 'act-0', act0Progress: 0 });
  const act5 = computeCinemaFrame({ ...BASE_INPUT, chapter: 'act-5', act5DawnProgress: 1 });
  assert.ok(act5.mood.keyIntensity > act0.mood.keyIntensity);
  assert.ok(act5.mood.exposure > act0.mood.exposure);
  assert.equal(act5.faultMode, 'none');
  assert.equal(act5.defenseRingCount, 0);
});
