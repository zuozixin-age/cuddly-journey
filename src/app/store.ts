import type {
  ChapterId,
  FlightPhaseId,
  SafetyMethodTab,
  ScenarioId,
  SubsystemId,
} from '../safety/types';
import { getRiskByScenario } from '../safety/queries';

export type MotionMode = 'full' | 'reduced';
export type QualityMode = 'standard' | 'lite';

export type OpenPanelState =
  | null
  | { type: 'evidence'; sourceId?: string }
  | { type: 'risk'; riskId: string }
  | { type: 'disclaimer' };

export interface AppState {
  chapter: ChapterId;
  flightPhase: FlightPhaseId;
  selectedSubsystem: SubsystemId;
  selectedScenario: ScenarioId;
  activeFaultNode: string;
  selectedMitigation: string;
  activeMethodTab: SafetyMethodTab;
  openPanel: OpenPanelState;
  motionMode: MotionMode;
  qualityMode: QualityMode;
  soundEnabled: boolean;
  introSkipped: boolean;
  routeFallbackMessage: string | null;
}

export const CHAPTER_META: Array<{
  id: ChapterId;
  shortLabel: string;
  actCode: string;
  enTitle: string;
  zhTitle: string;
}> = [
  { id: 'act-0', shortLabel: '觉醒', actCode: 'ACT 0', enTitle: 'THE AWAKENING', zhTitle: '觉醒' },
  { id: 'act-1', shortLabel: '升空', actCode: 'ACT I', enTitle: 'THE ASCENT', zhTitle: '升空' },
  { id: 'act-2', shortLabel: '内部', actCode: 'ACT II', enTitle: 'INSIDE THE MACHINE', zhTitle: '机器内部' },
  { id: 'act-3', shortLabel: '失效', actCode: 'ACT III', enTitle: 'THE EDGE OF FAILURE', zhTitle: '失效边界' },
  { id: 'act-4', shortLabel: '信任', actCode: 'ACT IV', enTitle: 'ENGINEERING TRUST', zhTitle: '工程建立信任' },
  { id: 'act-5', shortLabel: '超越', actCode: 'ACT V', enTitle: 'BEYOND GRAVITY', zhTitle: '超越重力' },
];

const VALID_CHAPTERS = new Set<string>(CHAPTER_META.map((c) => c.id));

export function isValidChapter(value: string): value is ChapterId {
  return VALID_CHAPTERS.has(value);
}

export function parseHashToChapter(hash: string): { chapter: ChapterId | null; invalidHash: string | null } {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (!cleaned) {
    return { chapter: null, invalidHash: null };
  }
  if (isValidChapter(cleaned)) {
    return { chapter: cleaned, invalidHash: null };
  }
  return { chapter: null, invalidHash: cleaned };
}

export function createInitialState(options?: {
  hash?: string;
  search?: string;
  prefersReducedMotion?: boolean;
}): AppState {
  const searchParams = new URLSearchParams(options?.search ?? '');
  const autostart = searchParams.get('autostart') === '1';
  const parsed = parseHashToChapter(options?.hash ?? '');

  let chapter: ChapterId = 'act-0';
  let introSkipped = false;
  let routeFallbackMessage: string | null = null;

  if (parsed.chapter) {
    chapter = parsed.chapter;
    introSkipped = parsed.chapter !== 'act-0';
  } else if (parsed.invalidHash) {
    chapter = 'act-1';
    introSkipped = true;
    routeFallbackMessage = `未找到章节路径 "#${parsed.invalidHash}"，已安全回退至 ACT I · 升空。`;
  } else if (autostart) {
    chapter = 'act-1';
    introSkipped = true;
  }

  return {
    chapter,
    flightPhase: 'climb',
    selectedSubsystem: 'propulsion',
    selectedScenario: 'EX-01',
    activeFaultNode: 'EX01-N2',
    selectedMitigation: 'MIT-01',
    activeMethodTab: 'propagation',
    openPanel: null,
    motionMode: options?.prefersReducedMotion ? 'reduced' : 'full',
    qualityMode: 'standard',
    soundEnabled: false,
    introSkipped,
    routeFallbackMessage,
  };
}

export type AppAction =
  | { type: 'SET_CHAPTER'; chapter: ChapterId }
  | { type: 'SYNC_CHAPTER_FROM_SCROLL'; chapter: ChapterId }
  | { type: 'SKIP_INTRO' }
  | { type: 'SET_FLIGHT_PHASE'; phase: FlightPhaseId }
  | { type: 'SET_SUBSYSTEM'; subsystem: SubsystemId }
  | { type: 'SET_SCENARIO'; scenario: ScenarioId; nodeId?: string }
  | { type: 'SET_FAULT_NODE'; nodeId: string }
  | { type: 'SET_METHOD_TAB'; tab: SafetyMethodTab }
  | { type: 'SET_MITIGATION'; mitigationId: string }
  | { type: 'JUMP_TO_SCENARIO_ANALYSIS'; scenario: ScenarioId; tab?: SafetyMethodTab }
  | { type: 'JUMP_TO_MITIGATION'; mitigationId: string }
  | { type: 'JUMP_TO_SUBSYSTEM'; subsystem: SubsystemId }
  | { type: 'OPEN_PANEL'; panel: OpenPanelState }
  | { type: 'CLOSE_PANEL' }
  | { type: 'TOGGLE_MOTION_MODE' }
  | { type: 'TOGGLE_QUALITY_MODE' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'DISMISS_ROUTE_FALLBACK' }
  | { type: 'SYNC_FROM_HASH'; hash: string };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CHAPTER': {
      if (state.chapter === action.chapter && state.openPanel === null && state.routeFallbackMessage === null) {
        return state;
      }
      return {
        ...state,
        chapter: action.chapter,
        introSkipped: action.chapter === 'act-0' ? state.introSkipped : true,
        openPanel: null,
        routeFallbackMessage: null,
      };
    }

    case 'SYNC_CHAPTER_FROM_SCROLL': {
      if (state.chapter === action.chapter) return state;
      return {
        ...state,
        chapter: action.chapter,
        introSkipped: action.chapter === 'act-0' ? state.introSkipped : true,
      };
    }

    case 'SKIP_INTRO': {
      return {
        ...state,
        chapter: 'act-1',
        introSkipped: true,
        openPanel: null,
        routeFallbackMessage: null,
      };
    }

    case 'SET_FLIGHT_PHASE':
      if (state.flightPhase === action.phase) return state;
      return { ...state, flightPhase: action.phase };

    case 'SET_SUBSYSTEM':
      if (state.selectedSubsystem === action.subsystem) return state;
      return { ...state, selectedSubsystem: action.subsystem };

    case 'SET_SCENARIO': {
      const record = getRiskByScenario(action.scenario);
      const firstNode = action.nodeId ?? record.propagationNodes[1]?.id ?? record.propagationNodes[0]?.id ?? '';
      if (state.selectedScenario === action.scenario && state.activeFaultNode === firstNode) {
        return state;
      }
      return {
        ...state,
        selectedScenario: action.scenario,
        activeFaultNode: firstNode,
      };
    }

    case 'SET_FAULT_NODE':
      if (state.activeFaultNode === action.nodeId) return state;
      return { ...state, activeFaultNode: action.nodeId };

    case 'SET_METHOD_TAB':
      if (state.activeMethodTab === action.tab) return state;
      return { ...state, activeMethodTab: action.tab };

    case 'SET_MITIGATION':
      if (state.selectedMitigation === action.mitigationId) return state;
      return { ...state, selectedMitigation: action.mitigationId };

    case 'JUMP_TO_SCENARIO_ANALYSIS': {
      const record = getRiskByScenario(action.scenario);
      const defaultNode = record.propagationNodes[1]?.id ?? record.propagationNodes[0]?.id ?? '';
      return {
        ...state,
        chapter: 'act-3',
        introSkipped: true,
        selectedScenario: action.scenario,
        activeFaultNode: defaultNode,
        activeMethodTab: action.tab ?? 'propagation',
        openPanel: null,
        routeFallbackMessage: null,
      };
    }

    case 'JUMP_TO_MITIGATION':
      return {
        ...state,
        chapter: 'act-4',
        introSkipped: true,
        selectedMitigation: action.mitigationId,
        openPanel: null,
        routeFallbackMessage: null,
      };

    case 'JUMP_TO_SUBSYSTEM':
      return {
        ...state,
        chapter: 'act-2',
        introSkipped: true,
        selectedSubsystem: action.subsystem,
        openPanel: null,
        routeFallbackMessage: null,
      };

    case 'OPEN_PANEL':
      return { ...state, openPanel: action.panel };

    case 'CLOSE_PANEL':
      if (state.openPanel === null) return state;
      return { ...state, openPanel: null };

    case 'TOGGLE_MOTION_MODE':
      return {
        ...state,
        motionMode: state.motionMode === 'full' ? 'reduced' : 'full',
      };

    case 'TOGGLE_QUALITY_MODE':
      return {
        ...state,
        qualityMode: state.qualityMode === 'standard' ? 'lite' : 'standard',
      };

    case 'TOGGLE_SOUND':
      return {
        ...state,
        soundEnabled: !state.soundEnabled,
      };

    case 'DISMISS_ROUTE_FALLBACK':
      return { ...state, routeFallbackMessage: null };

    case 'SYNC_FROM_HASH': {
      const parsed = parseHashToChapter(action.hash);
      if (parsed.chapter) {
        return {
          ...state,
          chapter: parsed.chapter,
          introSkipped: parsed.chapter !== 'act-0' ? true : state.introSkipped,
          openPanel: null,
          routeFallbackMessage: null,
        };
      }
      if (parsed.invalidHash) {
        return {
          ...state,
          chapter: 'act-1',
          introSkipped: true,
          openPanel: null,
          routeFallbackMessage: `未找到章节路径 "#${parsed.invalidHash}"，已安全回退至 ACT I · 升空。`,
        };
      }
      return state;
    }

    default:
      return state;
  }
}
