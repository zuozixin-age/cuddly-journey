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
} from './data';
import { EVIDENCE_SOURCES, SOURCE_MAP, TEACHING_DISCLAIMER } from './sources';
import type {
  FhaRecord,
  FlightPhaseId,
  FtaNode,
  MitigationLayer,
  RiskRecord,
  ScenarioId,
  StpaUcaRecord,
  StpaUcaType,
  SubsystemId,
} from './types';

export type FmeaSortField = 'id' | 'subsystem' | 'severityRank';
export type SortDirection = 'asc' | 'desc';

export function getRiskById(riskId: string): RiskRecord | undefined {
  return RISK_RECORDS.find((r) => r.id === riskId);
}

export function getRiskByScenario(scenarioId: ScenarioId): RiskRecord {
  const found = RISK_RECORDS.find((r) => r.scenarioId === scenarioId);
  return found ?? RISK_RECORDS[0];
}

export function getRisksForPhase(phase: FlightPhaseId): RiskRecord[] {
  const phaseSpec = FLIGHT_PHASES.find((p) => p.id === phase);
  if (!phaseSpec) return [];
  const idSet = new Set(phaseSpec.keyHazardIds);
  return RISK_RECORDS.filter((r) => r.phase === phase || idSet.has(r.id));
}

export function filterFhaRecords(
  phaseFilter: FlightPhaseId | 'all',
  categoryFilter: FhaRecord['functionCategory'] | 'all',
): FhaRecord[] {
  return FHA_RECORDS.filter((item) => {
    const matchPhase = phaseFilter === 'all' || item.phase === phaseFilter;
    const matchCat = categoryFilter === 'all' || item.functionCategory === categoryFilter;
    return matchPhase && matchCat;
  });
}

export function filterAndSortFmea(options: {
  subsystem: SubsystemId | 'all';
  query: string;
  sortBy: FmeaSortField;
  direction: SortDirection;
}): RiskRecord[] {
  const normalizedQuery = options.query.trim().toLowerCase();
  const filtered = RISK_RECORDS.filter((record) => {
    const matchSub = options.subsystem === 'all' || record.subsystem === options.subsystem;
    if (!matchSub) return false;
    if (!normalizedQuery) return true;
    const haystack = [
      record.id,
      record.title,
      record.subsystemLabel,
      record.phaseLabel,
      record.hazard,
      record.failureMechanism,
      record.consequence,
      record.residualRisk,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (options.sortBy === 'id') {
      cmp = a.id.localeCompare(b.id);
    } else if (options.sortBy === 'subsystem') {
      cmp = a.subsystemLabel.localeCompare(b.subsystemLabel, 'zh-CN');
    } else {
      cmp = a.severityRank - b.severityRank;
    }
    return options.direction === 'asc' ? cmp : -cmp;
  });

  return sorted;
}

export function getFtaChildren(nodeId: string): FtaNode[] {
  const node = FTA_NODES[nodeId];
  if (!node || !node.childIds) return [];
  return node.childIds.map((id) => FTA_NODES[id]).filter(Boolean);
}

export function filterStpaUcas(typeFilter: StpaUcaType | 'all'): StpaUcaRecord[] {
  if (typeFilter === 'all') return STPA_UCAS;
  return STPA_UCAS.filter((u) => u.type === typeFilter);
}

export function getMitigationById(mitigationId: string): MitigationLayer | undefined {
  return MITIGATION_LAYERS.find((m) => m.id === mitigationId);
}

export function getRequirementsForMitigation(mitigationId: string) {
  return VERIFICATION_REQUIREMENTS.filter((req) => req.linkedMitigationId === mitigationId);
}

export function getMitigationsForRisk(riskId: string): MitigationLayer[] {
  return MITIGATION_LAYERS.filter((m) => m.coveredRiskIds.includes(riskId));
}

export function buildOfflineCitationText(sourceId?: string): string {
  if (sourceId && SOURCE_MAP[sourceId]) {
    const s = SOURCE_MAP[sourceId];
    return `[${s.code}] ${s.publisher}: ${s.title}. URL: ${s.url} (访问日期: ${s.accessDate})`;
  }

  const lines = [
    '# BEYOND GRAVITY / 《超越重力：天空的代价》— 课程安全工程研究引用摘要',
    '',
    `免责声明：${TEACHING_DISCLAIMER}`,
    '',
    '## 核心结论分类',
    ...CONCLUSIONS.map((c) => `- [${c.label}] ${c.title}：${c.summary}`),
    '',
    '## 风险记录索引',
    ...RISK_RECORDS.map(
      (r) => `- ${r.id} [${r.evidenceStatus}] ${r.title} | 严重性：${r.severity} | 可能性：${r.likelihoodEvidence}`,
    ),
    '',
    '## 参考文献与公开资料（访问日期：2026-11-20）',
    ...EVIDENCE_SOURCES.map((s) => `- [${s.code}] ${s.publisher}: ${s.title} — ${s.url} (${s.accessDate})`),
  ];

  return lines.join('\n');
}

export function getSubsystemById(id: SubsystemId) {
  return SUBSYSTEMS.find((s) => s.id === id) ?? SUBSYSTEMS[0];
}
