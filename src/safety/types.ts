export type FactLabel = 'F' | 'A' | 'D' | 'U';

export type ChapterId = 'act-0' | 'act-1' | 'act-2' | 'act-3' | 'act-4' | 'act-5';

export type FlightPhaseId = 'takeoff' | 'climb' | 'cruise' | 'approach' | 'landing';

export type SubsystemId =
  | 'propulsion'
  | 'power'
  | 'flight-control'
  | 'structures'
  | 'actuators'
  | 'environment';

export type ScenarioId = 'EX-01' | 'EX-02' | 'EX-03';

export type SafetyMethodTab = 'propagation' | 'fha' | 'fmea' | 'fta' | 'stpa';

export type QualitativeSeverity = '潜在高严重性（需结合工况评估）' | '中等至高严重性（视隔离与阶段）' | '中等严重性（增加机组负荷）';

export type SeverityRank = 3 | 2 | 1;

export interface EvidenceSource {
  id: string;
  code: string;
  publisher: string;
  title: string;
  url: string;
  accessDate: string;
  scope: string;
  summary: string;
  category: 'regulatory' | 'platform' | 'deployment';
}

export interface LabeledStatement {
  id: string;
  label: FactLabel;
  text: string;
  sourceIds?: string[];
}

export type QualitativeLevel = '高' | '中' | '低';

export interface PhaseEnvelopeProfile {
  thrustSensitivity: QualitativeLevel;
  modeCoupling: QualitativeLevel;
  timeWindowUrgency: QualitativeLevel;
  externalExposure: QualitativeLevel;
}

export interface FlightPhaseSpec {
  id: FlightPhaseId;
  order: number;
  nameZh: string;
  nameEn: string;
  tiltAngleLabel: string;
  altitudeBandLabel: string;
  operationalSummary: string;
  attitudeNote: string;
  envelopeProfile: PhaseEnvelopeProfile;
  keyHazardIds: string[];
  primarySubsystemId: SubsystemId;
  linkedScenarioId: ScenarioId;
  factLabel: FactLabel;
  sourceIds: string[];
}

export interface SubsystemSpec {
  id: SubsystemId;
  code: string;
  nameZh: string;
  shortLabelZh: string;
  nameEn: string;
  flowStream: 'energy' | 'control' | 'structure-ops';
  hotspot: { x: number; y: number; labelX: number; labelY: number };
  functionDesc: string;
  publicFactBoundary: LabeledStatement;
  teachingAssumptions: LabeledStatement[];
  potentialFailureModes: string[];
  candidateControls: string[];
  linkedRiskIds: string[];
  linkedScenarioId: ScenarioId;
  linkedMitigationIds: string[];
}

export interface PropagationNode {
  id: string;
  stepIndex: number;
  stageZh: string;
  title: string;
  detail: string;
  label: FactLabel;
  severityTone: 'neutral' | 'amber' | 'crimson' | 'blue';
  linkedMitigationIds?: string[];
  sourceIds?: string[];
}

export interface RiskRecord {
  id: string;
  scenarioId?: ScenarioId;
  title: string;
  phase: FlightPhaseId;
  phaseLabel: string;
  subsystem: SubsystemId;
  subsystemLabel: string;
  operationalContext: string;
  hazard: string;
  failureMechanism: string;
  propagationNodes: PropagationNode[];
  consequence: string;
  severity: QualitativeSeverity;
  severityRank: SeverityRank;
  likelihoodEvidence: string;
  riskStatus: string;
  proposedControls: string[];
  linkedMitigationIds: string[];
  verificationMethods: string[];
  residualRisk: string;
  facts: LabeledStatement[];
  assumptions: LabeledStatement[];
  sources: string[];
  evidenceStatus: FactLabel;
}

export interface FhaRecord {
  id: string;
  phase: FlightPhaseId;
  functionCategory: '推力' | '姿态' | '供能' | '感知' | '结构' | '地面保障';
  functionName: string;
  failureCondition: string;
  operationalEffect: string;
  severityRationale: string;
  evidenceStatus: FactLabel;
  linkedRiskId: string;
  sourceIds: string[];
}

export interface FtaNode {
  id: string;
  code: string;
  title: string;
  gateType?: 'OR' | 'AND';
  childIds?: string[];
  explanation: string;
  label: FactLabel;
  linkedRiskId?: string;
}

export type StpaUcaType = 'not-provided' | 'provided-incorrectly' | 'wrong-timing' | 'stopped-too-soon-or-long';

export interface StpaUcaRecord {
  id: string;
  type: StpaUcaType;
  typeLabelZh: string;
  controller: string;
  controlAction: string;
  context: string;
  hazardousOutcome: string;
  causalScenario: string;
  safetyConstraint: string;
  linkedRiskId: string;
  linkedMitigationId: string;
  label: FactLabel;
}

export interface MitigationLayer {
  id: string;
  code: string;
  nameZh: string;
  nameEn: string;
  layerOrder: number;
  categorySummary: string;
  mechanism: string;
  coveredRiskIds: string[];
  verificationMethods: string[];
  residualUncertainty: string;
  nonClaimNotice: string;
  label: FactLabel;
  sourceIds: string[];
}

export interface VerificationRequirement {
  id: string;
  title: string;
  linkedRiskIds: string[];
  linkedMitigationId: string;
  verificationArtifact: string;
  regulatoryContext: string;
  statusNote: string;
  label: FactLabel;
  sourceIds: string[];
}

export interface ConclusionItem {
  id: string;
  column: 'facts' | 'assumptions' | 'unverified';
  label: FactLabel;
  title: string;
  summary: string;
  targetChapter: ChapterId;
  targetRiskId?: string;
  targetSourceId?: string;
}
