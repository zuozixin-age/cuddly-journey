import { clamp01, interpolateFlightAircraft } from '../../app/scrollDirector';
import { MITIGATION_LAYERS } from '../../safety/data';
import type {
  ChapterId,
  FlightPhaseId,
  ScenarioId,
  SubsystemId,
} from '../../safety/types';

export interface LightingMood {
  bgHex: string;
  fogHex: string;
  keyHex: string;
  keyIntensity: number;
  keyPos: [number, number, number];
  fillSkyHex: string;
  fillGroundHex: string;
  fillIntensity: number;
  rimHex: string;
  rimIntensity: number;
  rimPos: [number, number, number];
  envIntensity: number;
  exposure: number;
}

export interface CinemaChoreographyInput {
  chapter: ChapterId;
  act0Progress: number;
  act1Progress: number;
  flightPhase: FlightPhaseId;
  selectedSubsystem: SubsystemId;
  selectedScenario: ScenarioId;
  activeFaultStepIndex: number; // 1..6
  selectedMitigation: string;
  act5DawnProgress: number;
  xrayOverride: 'auto' | 'on' | 'off';
  wideDesktop: boolean;
}

export interface CinemaFrameState {
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  aircraftPos: [number, number, number];
  aircraftRot: [number, number, number]; // pitch (X), yaw (Y), roll (Z) in radians
  nacelleTiltDeg: number; // 0 = vertical rotor thrust, 88 = forward fixed-wing cruise
  gearDeploy: number; // 0 = retracted, 1 = extended
  rotorRpmFactor: number; // relative spin speed
  xrayLevel: number; // 0 = solid outer composite, 0.86 = cutaway X-ray
  focusSubsystem: SubsystemId | null;
  faultMode: 'none' | 'EX-01' | 'EX-02' | 'EX-03';
  faultIntensity: number; // 0..1
  defenseRingCount: number; // 0..7
  floorOpacity: number; // 0..1
  mood: LightingMood;
}

const DEG2RAD = Math.PI / 180;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp01(t);
}

function resolveMitigationLayerOrder(mitigationId: string): number {
  const found = MITIGATION_LAYERS.find((m) => m.id === mitigationId);
  return found ? found.layerOrder : 1;
}

function getSubsystemCamera(sub: SubsystemId): {
  pos: [number, number, number];
  target: [number, number, number];
  tiltDeg: number;
} {
  switch (sub) {
    case 'propulsion':
      return { pos: [5.6, 2.35, 5.1], target: [0.6, 0.25, 0.1], tiltDeg: 38 };
    case 'power':
      return { pos: [4.2, 2.8, 5.4], target: [0.0, 0.05, 0.15], tiltDeg: 18 };
    case 'flight-control':
      return { pos: [3.9, 1.85, 5.6], target: [0.0, 0.22, 1.15], tiltDeg: 28 };
    case 'actuators':
      return { pos: [5.8, 1.95, 4.4], target: [0.9, 0.3, -0.35], tiltDeg: 52 };
    case 'structures':
      return { pos: [0.6, 6.2, 5.6], target: [0.0, 0.18, -0.1], tiltDeg: 12 };
    case 'environment':
      return { pos: [6.4, 2.2, 5.9], target: [0.0, 0.15, 0.0], tiltDeg: 44 };
  }
}

/**
 * Pure deterministic cinema director mapping continuous scroll & chapter state
 * to physically grounded 3D camera, aircraft kinematics, cutaway X-ray, and studio lighting.
 */
export function computeCinemaFrame(input: CinemaChoreographyInput): CinemaFrameState {
  const act0 = clamp01(input.act0Progress);
  const act1 = clamp01(input.act1Progress);
  const dawn = clamp01(input.act5DawnProgress);

  // Shift lookAt target slightly to -X on wide desktop so the full 8.8u wingspan eVTOL
  // frames cleanly inside the unobstructed right 58% cinema window with zero wingtip cropping.
  const framingShiftX = input.wideDesktop ? -1.85 : 0;
  const distScale = input.wideDesktop ? 1.16 : 1.38;

  let cameraPos: [number, number, number] = [5.4, 1.9, 6.3];
  let cameraTarget: [number, number, number] = [0, 0.15, 0];
  let aircraftPos: [number, number, number] = [0, 0, 0];
  let aircraftRot: [number, number, number] = [0, -0.35, 0];
  let nacelleTiltDeg = 0;
  let gearDeploy = 1;
  let rotorRpmFactor = 0.25;
  let xrayLevel = 0;
  let focusSubsystem: SubsystemId | null = null;
  let faultMode: 'none' | 'EX-01' | 'EX-02' | 'EX-03' = 'none';
  let faultIntensity = 0;
  let defenseRingCount = 0;
  let floorOpacity = 1;

  let mood: LightingMood = {
    bgHex: '#0A0E13',
    fogHex: '#0A0E13',
    keyHex: '#FFF0D8',
    keyIntensity: 2.6,
    keyPos: [7.5, 9.5, 6.5],
    fillSkyHex: '#7DA2C7',
    fillGroundHex: '#18202B',
    fillIntensity: 0.72,
    rimHex: '#D99A45',
    rimIntensity: 1.55,
    rimPos: [-7.5, 4.2, -6.0],
    envIntensity: 0.78,
    exposure: 1.12,
  };

  switch (input.chapter) {
    case 'act-0': {
      // Dramatic low-angle awakening reveal in dark aviation studio; gentle orbit as user scrolls
      const orbitAngle = lerp(0.72, 0.34, act0);
      const radius = lerp(9.4, 8.4, act0);
      cameraPos = [
        Math.sin(orbitAngle) * radius,
        lerp(1.65, 2.35, act0),
        Math.cos(orbitAngle) * radius,
      ];
      cameraTarget = [0, 0.2, 0.05];
      aircraftPos = [0, lerp(0, 0.14, act0), 0];
      aircraftRot = [lerp(-0.02, 0.02, act0), lerp(-0.28, -0.14, act0), 0];
      nacelleTiltDeg = lerp(0, 12, act0);
      gearDeploy = 1;
      rotorRpmFactor = lerp(0.22, 0.55, act0);
      floorOpacity = 1;
      mood = {
        bgHex: '#0A0E13',
        fogHex: '#0A0E13',
        keyHex: '#FFEBD0',
        keyIntensity: lerp(2.3, 2.9, act0),
        keyPos: [lerp(6.5, 8.2, act0), 9.0, 6.8],
        fillSkyHex: '#7A9EC2',
        fillGroundHex: '#141B24',
        fillIntensity: 0.68,
        rimHex: '#D99A45',
        rimIntensity: lerp(1.4, 1.85, act0),
        rimPos: [-7.0, 3.8, -6.5],
        envIntensity: 0.84,
        exposure: 1.14,
      };
      break;
    }

    case 'act-1': {
      const pose = interpolateFlightAircraft(act1);
      nacelleTiltDeg = pose.nacelleDeg;

      const liftCurve = Math.sin(act1 * Math.PI);
      const altitudeY = 0.05 + liftCurve * 1.05;
      const pitchRad =
        act1 < 0.22
          ? lerp(0.06, -0.05, act1 / 0.22)
          : act1 < 0.45
            ? lerp(-0.05, -0.09, (act1 - 0.22) / 0.23)
            : act1 < 0.72
              ? -0.02
              : act1 < 0.9
                ? 0.09
                : lerp(0.09, 0.0, (act1 - 0.9) / 0.1);
      const bankRad =
        act1 > 0.36 && act1 < 0.72 ? Math.sin(((act1 - 0.36) / 0.36) * Math.PI) * 0.16 : 0;

      aircraftPos = [0, altitudeY, 0];
      aircraftRot = [pitchRad, lerp(-0.48, 0.32, act1), bankRad];
      gearDeploy = act1 > 0.32 && act1 < 0.76 ? 0 : 1;
      rotorRpmFactor = act1 > 0.42 && act1 < 0.68 ? 0.78 : 1.0;
      floorOpacity = clamp01(1 - liftCurve * 1.45);

      const camYaw = lerp(0.7, -0.42, act1);
      cameraPos = [
        Math.sin(camYaw) * 9.5,
        altitudeY + lerp(1.85, 2.55, liftCurve),
        Math.cos(camYaw) * 9.5,
      ];
      cameraTarget = [0, altitudeY + 0.12, 0];

      mood = {
        bgHex: '#0C141E',
        fogHex: '#0C141E',
        keyHex: '#FFF4E2',
        keyIntensity: 2.95,
        keyPos: [8.5, 11.0, 5.5],
        fillSkyHex: '#8BB4DB',
        fillGroundHex: '#1C2836',
        fillIntensity: 0.92,
        rimHex: '#638DB0',
        rimIntensity: 1.5,
        rimPos: [-8.0, 4.5, -6.5],
        envIntensity: 0.92,
        exposure: 1.16,
      };
      break;
    }

    case 'act-2': {
      const subCam = getSubsystemCamera(input.selectedSubsystem);
      cameraPos = subCam.pos;
      cameraTarget = subCam.target;
      aircraftPos = [0, 0.3, 0];
      aircraftRot = [0.04, -0.22, 0];
      nacelleTiltDeg = subCam.tiltDeg;
      gearDeploy = 0.25;
      rotorRpmFactor = 0.38;
      xrayLevel = 0.86;
      focusSubsystem = input.selectedSubsystem;
      floorOpacity = 0.35;

      mood = {
        bgHex: '#0B1119',
        fogHex: '#0B1119',
        keyHex: '#F5FAFF',
        keyIntensity: 2.4,
        keyPos: [7.0, 9.5, 7.5],
        fillSkyHex: '#7EA8D0',
        fillGroundHex: '#141D28',
        fillIntensity: 0.86,
        rimHex: '#638DB0',
        rimIntensity: 1.75,
        rimPos: [-7.5, 4.2, -5.5],
        envIntensity: 0.88,
        exposure: 1.14,
      };
      break;
    }

    case 'act-3': {
      faultMode = input.selectedScenario;
      faultIntensity = clamp01(0.35 + (input.activeFaultStepIndex / 6) * 0.65);
      xrayLevel = input.selectedScenario === 'EX-02' || input.selectedScenario === 'EX-03' ? 0.82 : 0.42;
      floorOpacity = 0.28;
      rotorRpmFactor = input.selectedScenario === 'EX-01' ? 0.52 : 0.72;
      gearDeploy = input.selectedScenario === 'EX-02' ? 1 : 0;

      if (input.selectedScenario === 'EX-01') {
        cameraPos = [-7.0, 2.55, 6.4];
        cameraTarget = [-0.6, 0.32, 0.1];
        aircraftPos = [0, 0.5, 0];
        aircraftRot = [0.05, 0.32, -0.14 * faultIntensity];
        nacelleTiltDeg = 42;
        focusSubsystem = 'propulsion';
      } else if (input.selectedScenario === 'EX-02') {
        cameraPos = [5.8, 2.45, 6.2];
        cameraTarget = [0.0, 0.08, -0.05];
        aircraftPos = [0, 0.12, 0];
        aircraftRot = [0.02, -0.35, 0];
        nacelleTiltDeg = 0;
        focusSubsystem = 'power';
      } else {
        cameraPos = [5.1, 2.1, 6.6];
        cameraTarget = [0.0, 0.25, 0.95];
        aircraftPos = [0, 0.45, 0];
        aircraftRot = [0.09 * faultIntensity, -0.22, 0.08 * faultIntensity];
        nacelleTiltDeg = 34;
        focusSubsystem = 'flight-control';
      }

      mood = {
        bgHex: '#100C10',
        fogHex: '#100C10',
        keyHex: '#FFE4D0',
        keyIntensity: 2.35,
        keyPos: [6.5, 8.8, 6.0],
        fillSkyHex: '#7A899D',
        fillGroundHex: '#241418',
        fillIntensity: 0.72,
        rimHex: '#C8554C',
        rimIntensity: 1.85,
        rimPos: [-7.2, 3.6, -5.8],
        envIntensity: 0.74,
        exposure: 1.1,
      };
      break;
    }

    case 'act-4': {
      const layerOrder = resolveMitigationLayerOrder(input.selectedMitigation);
      defenseRingCount = layerOrder;
      const orbit = lerp(-0.32, 0.42, (layerOrder - 1) / 6);
      cameraPos = [Math.sin(orbit) * 9.8, 3.35, Math.cos(orbit) * 9.8];
      cameraTarget = [0, 0.22, 0];
      aircraftPos = [0, 0.36, 0];
      aircraftRot = [-0.02, -0.22 + orbit * 0.2, 0];
      nacelleTiltDeg = 22;
      gearDeploy = 0.4;
      rotorRpmFactor = 0.55;
      xrayLevel = 0.3;
      floorOpacity = 0.55;

      mood = {
        bgHex: '#0B1117',
        fogHex: '#0B1117',
        keyHex: '#FFF2DC',
        keyIntensity: 2.7,
        keyPos: [7.8, 10.0, 6.2],
        fillSkyHex: '#7FA5CA',
        fillGroundHex: '#16202C',
        fillIntensity: 0.85,
        rimHex: '#D99A45',
        rimIntensity: 1.6,
        rimPos: [-7.4, 4.5, -6.2],
        envIntensity: 0.88,
        exposure: 1.15,
      };
      break;
    }

    case 'act-5': {
      const orbit = lerp(0.56, 0.24, dawn);
      cameraPos = [Math.sin(orbit) * 9.5, lerp(1.9, 2.35, dawn), Math.cos(orbit) * 9.5];
      cameraTarget = [0, 0.22, 0.05];
      aircraftPos = [0, 0, 0];
      aircraftRot = [0, lerp(-0.24, -0.08, dawn), 0];
      nacelleTiltDeg = lerp(8, 0, dawn);
      gearDeploy = 1;
      rotorRpmFactor = 0.18;
      xrayLevel = 0;
      floorOpacity = 1;

      mood = {
        bgHex: '#10141B',
        fogHex: '#10141B',
        keyHex: '#FFDFB5',
        keyIntensity: lerp(2.75, 3.25, dawn),
        keyPos: [9.0, 6.2, 5.0],
        fillSkyHex: '#92B0D1',
        fillGroundHex: '#2A221B',
        fillIntensity: 0.96,
        rimHex: '#E5A855',
        rimIntensity: 2.05,
        rimPos: [-8.2, 3.4, -5.5],
        envIntensity: 0.98,
        exposure: 1.2,
      };
      break;
    }
  }

  if (input.xrayOverride === 'on') {
    xrayLevel = Math.max(xrayLevel, 0.86);
  } else if (input.xrayOverride === 'off') {
    xrayLevel = 0;
  }

  // Scale distance from target cleanly so full wingspan + 6 rotors fit inside desktop & mobile viewports
  const scaledPos: [number, number, number] = [
    cameraTarget[0] + (cameraPos[0] - cameraTarget[0]) * distScale,
    cameraTarget[1] + (cameraPos[1] - cameraTarget[1]) * distScale,
    cameraTarget[2] + (cameraPos[2] - cameraTarget[2]) * distScale,
  ];

  const framedTarget: [number, number, number] = [
    cameraTarget[0] + framingShiftX,
    cameraTarget[1],
    cameraTarget[2],
  ];
  const framedPos: [number, number, number] = [
    scaledPos[0] + framingShiftX * 0.72,
    scaledPos[1],
    scaledPos[2],
  ];

  // Ensure angles are finite & clamped cleanly
  void DEG2RAD;
  return {
    cameraPos: framedPos,
    cameraTarget: framedTarget,
    aircraftPos,
    aircraftRot,
    nacelleTiltDeg: Math.max(0, Math.min(90, nacelleTiltDeg)),
    gearDeploy: clamp01(gearDeploy),
    rotorRpmFactor: Math.max(0, rotorRpmFactor),
    xrayLevel: clamp01(xrayLevel),
    focusSubsystem,
    faultMode,
    faultIntensity: clamp01(faultIntensity),
    defenseRingCount: Math.max(0, Math.min(7, defenseRingCount)),
    floorOpacity: clamp01(floorOpacity),
    mood,
  };
}
