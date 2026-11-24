import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONCLUSIONS,
  FHA_RECORDS,
  FLIGHT_PHASES,
  FTA_NODES,
  MITIGATION_LAYERS,
  RISK_RECORDS,
  STPA_UCAS,
  SUBSYSTEMS,
  VERIFICATION_REQUIREMENTS,
} from '../safety/data';
import {
  buildOfflineCitationText,
  filterAndSortFmea,
  filterFhaRecords,
  filterStpaUcas,
  getFtaChildren,
  getRiskById,
} from '../safety/queries';
import { ACCEPTANCE_CHECKLIST_36 } from '../safety/checklist';
import { EVIDENCE_SOURCES, SOURCE_MAP, TEACHING_DISCLAIMER } from '../safety/sources';

test('every evidence source has valid URL and accessDate 2026-11-20', () => {
  assert.ok(EVIDENCE_SOURCES.length >= 6);
  for (const src of EVIDENCE_SOURCES) {
    assert.ok(src.url.startsWith('https://'), `Source ${src.id} missing https URL`);
    assert.equal(src.accessDate, '2026-11-20');
    assert.ok(src.title.length > 4);
  }
});

test('all risk records have valid source IDs, non-fabricated likelihood boundaries, and linked mitigations', () => {
  assert.equal(RISK_RECORDS.length, 6);
  const mitigationIds = new Set(MITIGATION_LAYERS.map((m) => m.id));

  for (const risk of RISK_RECORDS) {
    assert.ok(risk.sources.length > 0, `${risk.id} must cite at least one source`);
    for (const sid of risk.sources) {
      assert.ok(SOURCE_MAP[sid], `${risk.id} references missing source ${sid}`);
    }
    for (const mid of risk.linkedMitigationIds) {
      assert.ok(mitigationIds.has(mid), `${risk.id} references missing mitigation ${mid}`);
    }
    assert.ok(
      risk.likelihoodEvidence.includes('可能性未定'),
      `${risk.id} must state bounded qualitative likelihood without invented rates`,
    );
    assert.ok(risk.verificationMethods.length > 0);
    assert.ok(risk.residualRisk.length > 0);
  }
});

test('three core teaching scenarios EX-01, EX-02, EX-03 have 6-stage propagation chains', () => {
  for (const code of ['EX-01', 'EX-02', 'EX-03'] as const) {
    const rec = RISK_RECORDS.find((r) => r.scenarioId === code);
    assert.ok(rec, `Missing scenario ${code}`);
    assert.equal(rec.propagationNodes.length, 6);
  }
});

test('FTA tree resolves all children cleanly with zero cycles and links to valid risks', () => {
  const visited = new Set<string>();
  const walk = (id: string) => {
    assert.ok(!visited.has(id), `Cycle detected at FTA node ${id}`);
    visited.add(id);
    const node = FTA_NODES[id];
    assert.ok(node, `Missing FTA node ${id}`);
    if (node.linkedRiskId) {
      assert.ok(getRiskById(node.linkedRiskId), `FTA ${id} references unknown risk ${node.linkedRiskId}`);
    }
    for (const child of getFtaChildren(id)) {
      walk(child.id);
    }
  };
  walk('TOP-01');
  assert.equal(visited.size, Object.keys(FTA_NODES).length);
});

test('FHA, FMEA, and STPA filters and sorting behave deterministically including empty state', () => {
  const fhaTakeoff = filterFhaRecords('takeoff', 'all');
  assert.ok(fhaTakeoff.length >= 1);
  const fhaEmpty = filterFhaRecords('takeoff', '供能');
  assert.equal(fhaEmpty.length, 0);

  const fmeaDesc = filterAndSortFmea({
    subsystem: 'all',
    query: '',
    sortBy: 'id',
    direction: 'desc',
  });
  assert.equal(fmeaDesc[0].id, 'RSK-06');
  assert.equal(fmeaDesc[fmeaDesc.length - 1].id, 'RSK-01');

  const fmeaSearch = filterAndSortFmea({
    subsystem: 'power',
    query: '热失控',
    sortBy: 'severityRank',
    direction: 'desc',
  });
  assert.equal(fmeaSearch.length, 1);
  assert.equal(fmeaSearch[0].id, 'RSK-02');

  const fmeaEmpty = filterAndSortFmea({
    subsystem: 'all',
    query: '不存在的关键字xyz',
    sortBy: 'id',
    direction: 'asc',
  });
  assert.equal(fmeaEmpty.length, 0);

  assert.equal(filterStpaUcas('all').length, STPA_UCAS.length);
  assert.equal(filterStpaUcas('wrong-timing').length, 1);
});

test('all 5 flight phases, 6 subsystems, 8 verification requirements, and conclusions link cleanly', () => {
  assert.equal(FLIGHT_PHASES.length, 5);
  assert.equal(SUBSYSTEMS.length, 6);
  assert.equal(FHA_RECORDS.length, 6);
  assert.equal(VERIFICATION_REQUIREMENTS.length, 8);
  assert.ok(CONCLUSIONS.length >= 9);

  for (const req of VERIFICATION_REQUIREMENTS) {
    for (const rid of req.linkedRiskIds) {
      assert.ok(getRiskById(rid), `${req.id} references invalid risk ${rid}`);
    }
  }
});

test('offline citation export includes mandatory teaching disclaimer and source URLs', () => {
  const full = buildOfflineCitationText();
  assert.ok(full.includes(TEACHING_DISCLAIMER));
  assert.ok(full.includes('AC 21.17-4'));

  const single = buildOfflineCitationText('S5');
  assert.ok(single.includes('[S5]'));
  assert.ok(single.includes('2026-11-20'));
});

test('36-item acceptance checklist matches exact P0(8)+P1(10)+P2(10)+P3(8) rubric', () => {
  assert.equal(ACCEPTANCE_CHECKLIST_36.length, 36);
  assert.equal(ACCEPTANCE_CHECKLIST_36.filter((i) => i.tier === 'P0').length, 8);
  assert.equal(ACCEPTANCE_CHECKLIST_36.filter((i) => i.tier === 'P1').length, 10);
  assert.equal(ACCEPTANCE_CHECKLIST_36.filter((i) => i.tier === 'P2').length, 10);
  assert.equal(ACCEPTANCE_CHECKLIST_36.filter((i) => i.tier === 'P3').length, 8);
  // Ensure unverified external items are honestly marked pending-user-check
  const publicPagesItem = ACCEPTANCE_CHECKLIST_36.find((i) => i.id === 'P0-5');
  assert.equal(publicPagesItem?.status, 'pending-user-check');
});

test('all 5 flight phases provide qualitative non-numeric envelope profiles', () => {
  const validLevels = new Set(['高', '中', '低']);
  for (const phase of FLIGHT_PHASES) {
    assert.ok(validLevels.has(phase.envelopeProfile.thrustSensitivity));
    assert.ok(validLevels.has(phase.envelopeProfile.modeCoupling));
    assert.ok(validLevels.has(phase.envelopeProfile.timeWindowUrgency));
    assert.ok(validLevels.has(phase.envelopeProfile.externalExposure));
  }
});
