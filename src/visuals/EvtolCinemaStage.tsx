import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ChevronDown, ChevronUp, Eye, Layers, RotateCcw } from 'lucide-react';
import type { MotionMode } from '../app/store';
import type {
  ChapterId,
  FlightPhaseId,
  ScenarioId,
  SubsystemId,
} from '../safety/types';
import { buildEvtolModel, type EvtolModelRig } from './evtol3d/buildEvtolModel';
import {
  computeCinemaFrame,
  type CinemaChoreographyInput,
  type CinemaFrameState,
} from './evtol3d/cinemaChoreography';
import { createEvtolMaterialKit, type EvtolMaterialKit } from './evtol3d/materials';

export interface EvtolCinemaStageProps {
  chapter: ChapterId;
  act0Progress: number;
  act1Progress: number;
  flightPhase: FlightPhaseId;
  selectedSubsystem: SubsystemId;
  selectedScenario: ScenarioId;
  activeFaultStepIndex: number;
  selectedMitigation: string;
  act5DawnProgress: number;
  motionMode: MotionMode;
  onWebglUnavailable?: () => void;
}

// Reusable module-scoped math helpers (zero per-frame GC allocation)
const _tmpColorA = new THREE.Color();
const _tmpColorB = new THREE.Color();
const _targetVec = new THREE.Vector3();
const _camGoalVec = new THREE.Vector3();
const _offsetVec = new THREE.Vector3();

function detectSoftwareWebGl(): { available: boolean; isSoftwareGl: boolean } {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') ?? probe.getContext('webgl');
    if (!gl) return { available: false, isSoftwareGl: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftware = /SwiftShader|llvmpipe|softpipe|Software|Basic Render|Mesa OffScreen/i.test(gpu);
    return { available: true, isSoftwareGl: isSoftware };
  } catch {
    return { available: false, isSoftwareGl: true };
  }
}

export function EvtolCinemaStage({
  chapter,
  act0Progress,
  act1Progress,
  flightPhase,
  selectedSubsystem,
  selectedScenario,
  activeFaultStepIndex,
  selectedMitigation,
  act5DawnProgress,
  motionMode,
  onWebglUnavailable,
}: EvtolCinemaStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [xrayOverride, setXrayOverride] = useState<'auto' | 'on' | 'off'>('auto');
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [hasOrbitOffset, setHasOrbitOffset] = useState(false);
  const [webglReady, setWebglReady] = useState(true);
  const [wideDesktop, setWideDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  );

  // Live refs consumed inside the persistent WebGL renderer loop (never remounts canvas)
  const targetFrameRef = useRef<CinemaFrameState>(
    computeCinemaFrame({
      chapter,
      act0Progress,
      act1Progress,
      flightPhase,
      selectedSubsystem,
      selectedScenario,
      activeFaultStepIndex,
      selectedMitigation,
      act5DawnProgress,
      xrayOverride,
      wideDesktop,
    }),
  );
  const motionModeRef = useRef<MotionMode>(motionMode);
  motionModeRef.current = motionMode;

  const orbitOffsetRef = useRef<{ yaw: number; pitch: number }>({ yaw: 0, pitch: 0 });
  const dragStateRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const requestRenderRef = useRef<(() => void) | null>(null);

  // Recompute pure target cinema frame whenever scroll/act/selection state updates
  const nextFrame = computeCinemaFrame({
    chapter,
    act0Progress,
    act1Progress,
    flightPhase,
    selectedSubsystem,
    selectedScenario,
    activeFaultStepIndex,
    selectedMitigation,
    act5DawnProgress,
    xrayOverride,
    wideDesktop,
  });
  targetFrameRef.current = nextFrame;

  // Trigger render whenever props/frame state changes
  useEffect(() => {
    requestRenderRef.current?.();
  }, [
    chapter,
    act0Progress,
    act1Progress,
    flightPhase,
    selectedSubsystem,
    selectedScenario,
    activeFaultStepIndex,
    selectedMitigation,
    act5DawnProgress,
    xrayOverride,
    wideDesktop,
    motionMode,
  ]);

  // Track responsive desktop framing breakpoint
  useEffect(() => {
    const onResize = () => setWideDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keyboard shortcut 'H' to collapse/expand bottom 3D control dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'h' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        setHudCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Single persistent WebGLRenderer lifecycle (mounts ONCE, full cleanup on unmount)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const probe = detectSoftwareWebGl();
    if (!probe.available) {
      setWebglReady(false);
      onWebglUnavailable?.();
      return;
    }
    const isSoftwareGl = probe.isSoftwareGl;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglReady(false);
      onWebglUnavailable?.();
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.8));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A0E13');
    scene.fog = new THREE.FogExp2('#0A0E13', 0.032);

    const camera = new THREE.PerspectiveCamera(
      36,
      Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
      0.15,
      85,
    );

    // Mandatory procedural studio environment reflections (RoomEnvironment via PMREMGenerator)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.82;
    roomEnv.dispose();
    pmrem.dispose();

    // 3-Point Aviation Photography Lighting Rig (warm key + cool sky/ground fill + sculptural rim)
    const keyLight = new THREE.DirectionalLight('#FFEBD0', 2.65);
    keyLight.position.set(7.5, 9.5, 6.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 28;
      keyLight.shadow.camera.left = -7;
      keyLight.shadow.camera.right = 7;
      keyLight.shadow.camera.top = 7;
      keyLight.shadow.camera.bottom = -7;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight('#7FA5CA', '#16202C', 0.78);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight('#D99A45', 1.65);
    rimLight.position.set(-7.5, 4.2, -6.0);
    scene.add(rimLight);

    let softboxLight: THREE.RectAreaLight | null = null;
    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      softboxLight = new THREE.RectAreaLight('#EBF4FF', 1.6, 8.5, 3.2);
      softboxLight.position.set(0, 6.4, 2.2);
      softboxLight.lookAt(0, 0.2, 0);
      scene.add(softboxLight);
    }

    // Build procedural PBR material kit & sculpted 6-tilt-rotor eVTOL model
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const materials: EvtolMaterialKit = createEvtolMaterialKit(maxAniso, isSoftwareGl);
    const rig: EvtolModelRig = buildEvtolModel(materials);
    scene.add(rig.root);

    // Pre-compile shaders once on GPU devices
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Mutable damped animation state initialized immediately to first target frame
    const init = targetFrameRef.current;
    const curCamPos = new THREE.Vector3(...init.cameraPos);
    const curCamTarget = new THREE.Vector3(...init.cameraTarget);
    const curAirPos = new THREE.Vector3(...init.aircraftPos);
    const curAirRot = new THREE.Vector3(...init.aircraftRot);
    let curTiltDeg = init.nacelleTiltDeg;
    let curGear = init.gearDeploy;
    let curXray = init.xrayLevel;
    let curFloorOpacity = init.floorOpacity;
    let curRotorSpinAngle = 0.45;
    let disposed = false;
    let contextLost = false;

    const resize = () => {
      if (!container || disposed) return;
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      requestRender();
    });
    resizeObserver.observe(container);

    // Apply current cinema state to Three.js scene objects (returns true if still settling)
    const applyState = (dt: number): boolean => {
      const goal = targetFrameRef.current;
      const reduced = motionModeRef.current === 'reduced';
      // On software GL or reduced motion, settle crisp & briskly so screenshots & wheel scrolling stay responsive
      const lambda = reduced ? 28 : isSoftwareGl ? 18 : 6.2;

      // Apply user pointer-drag orbit offset around camera target
      _targetVec.set(goal.cameraTarget[0], goal.cameraTarget[1], goal.cameraTarget[2]);
      _camGoalVec.set(goal.cameraPos[0], goal.cameraPos[1], goal.cameraPos[2]);
      const { yaw, pitch } = orbitOffsetRef.current;
      if (Math.abs(yaw) > 0.0005 || Math.abs(pitch) > 0.0005) {
        _offsetVec.copy(_camGoalVec).sub(_targetVec);
        const radius = _offsetVec.length();
        const baseTheta = Math.atan2(_offsetVec.x, _offsetVec.z);
        const basePhi = Math.acos(THREE.MathUtils.clamp(_offsetVec.y / Math.max(0.01, radius), -0.95, 0.95));
        const nextTheta = baseTheta + yaw;
        const nextPhi = THREE.MathUtils.clamp(basePhi + pitch, 0.25, 1.48);
        _camGoalVec.set(
          _targetVec.x + radius * Math.sin(nextPhi) * Math.sin(nextTheta),
          _targetVec.y + radius * Math.cos(nextPhi),
          _targetVec.z + radius * Math.sin(nextPhi) * Math.cos(nextTheta),
        );
      }

      curCamPos.x = THREE.MathUtils.damp(curCamPos.x, _camGoalVec.x, lambda, dt);
      curCamPos.y = THREE.MathUtils.damp(curCamPos.y, _camGoalVec.y, lambda, dt);
      curCamPos.z = THREE.MathUtils.damp(curCamPos.z, _camGoalVec.z, lambda, dt);

      curCamTarget.x = THREE.MathUtils.damp(curCamTarget.x, _targetVec.x, lambda, dt);
      curCamTarget.y = THREE.MathUtils.damp(curCamTarget.y, _targetVec.y, lambda, dt);
      curCamTarget.z = THREE.MathUtils.damp(curCamTarget.z, _targetVec.z, lambda, dt);

      camera.position.copy(curCamPos);
      camera.lookAt(curCamTarget);

      curAirPos.x = THREE.MathUtils.damp(curAirPos.x, goal.aircraftPos[0], lambda, dt);
      curAirPos.y = THREE.MathUtils.damp(curAirPos.y, goal.aircraftPos[1], lambda, dt);
      curAirPos.z = THREE.MathUtils.damp(curAirPos.z, goal.aircraftPos[2], lambda, dt);

      curAirRot.x = THREE.MathUtils.damp(curAirRot.x, goal.aircraftRot[0], lambda, dt);
      curAirRot.y = THREE.MathUtils.damp(curAirRot.y, goal.aircraftRot[1], lambda, dt);
      curAirRot.z = THREE.MathUtils.damp(curAirRot.z, goal.aircraftRot[2], lambda, dt);

      rig.aircraftGroup.position.copy(curAirPos);
      rig.aircraftGroup.rotation.set(curAirRot.x, curAirRot.y, curAirRot.z);

      // 6 Articulated Nacelle Tilt Angles (0° hover -> +88° forward cruise)
      curTiltDeg = THREE.MathUtils.damp(curTiltDeg, goal.nacelleTiltDeg, lambda, dt);
      const tiltRad = THREE.MathUtils.degToRad(curTiltDeg);
      for (let i = 0; i < rig.tiltPivots.length; i++) {
        // In EX-01 fault mode, port-outer nacelle (index 0) exhibits subtle tilt lag
        const faultLag = goal.faultMode === 'EX-01' && i === 0 ? -0.18 * goal.faultIntensity : 0;
        rig.tiltPivots[i].rotation.x = tiltRad + faultLag;
      }

      // Spin 6x5-blade scimitar rotors (when full motion)
      if (!reduced && !isSoftwareGl) {
        curRotorSpinAngle += dt * (4.8 * goal.rotorRpmFactor + 0.6);
      } else if (!reduced && isSoftwareGl) {
        curRotorSpinAngle += dt * 1.4;
      }
      for (const item of rig.rotorHubs) {
        const slowdown = goal.faultMode === 'EX-01' && item.nacelleIndex === 0 ? 0.25 : 1.0;
        item.hub.rotation.y = curRotorSpinAngle * item.direction * slowdown + item.nacelleIndex * 0.7;
      }

      // Retractable tricycle landing gear
      curGear = THREE.MathUtils.damp(curGear, goal.gearDeploy, lambda, dt);
      for (const gear of rig.landingGearGroups) {
        gear.scale.y = Math.max(0.05, curGear);
        gear.visible = curGear > 0.08;
      }

      // Smooth X-Ray Cutaway Shell Transition (Act II / Act III / Manual Toggle)
      curXray = THREE.MathUtils.damp(curXray, goal.xrayLevel, lambda, dt);
      const isXrayActive = curXray > 0.04;
      const shellOpacity = 1 - curXray * 0.84;

      rig.internalCutawayRoot.visible = isXrayActive;
      for (const core of rig.internalMotorCores) {
        core.visible = isXrayActive;
      }

      if (materials.fuselageOuter.transparent !== isXrayActive) {
        materials.fuselageOuter.transparent = isXrayActive;
        materials.fuselageOuter.depthWrite = !isXrayActive;
        materials.fuselageOuter.needsUpdate = true;
      }
      materials.fuselageOuter.opacity = shellOpacity;

      if (materials.fuselageBelly.transparent !== isXrayActive) {
        materials.fuselageBelly.transparent = isXrayActive;
        materials.fuselageBelly.depthWrite = !isXrayActive;
        materials.fuselageBelly.needsUpdate = true;
      }
      materials.fuselageBelly.opacity = Math.max(0.14, shellOpacity);

      if (materials.wingComposite.transparent !== isXrayActive) {
        materials.wingComposite.transparent = isXrayActive;
        materials.wingComposite.depthWrite = !isXrayActive;
        materials.wingComposite.needsUpdate = true;
      }
      materials.wingComposite.opacity = Math.max(0.22, 1 - curXray * 0.74);

      // Highlight focused internal subsystem in Act II / Act III
      const focus = goal.focusSubsystem;
      materials.internalPowerPack.emissiveIntensity =
        focus === 'power' ? 0.92 : isXrayActive ? 0.26 : 0.08;
      materials.internalPowerBus.emissiveIntensity =
        focus === 'power' ? 1.15 : isXrayActive ? 0.42 : 0.1;
      materials.internalPropulsionCore.emissiveIntensity =
        focus === 'propulsion' ? 1.05 : isXrayActive ? 0.24 : 0.08;
      materials.internalAvionics.emissiveIntensity =
        focus === 'flight-control' ? 1.05 : isXrayActive ? 0.28 : 0.08;
      materials.internalControlBus.emissiveIntensity =
        focus === 'flight-control' ? 1.15 : isXrayActive ? 0.42 : 0.1;
      materials.internalActuator.emissiveIntensity =
        focus === 'actuators' ? 0.95 : isXrayActive ? 0.2 : 0.05;
      materials.internalStructure.emissiveIntensity =
        focus === 'structures' ? 0.85 : isXrayActive ? 0.18 : 0.04;
      materials.internalAirflow.opacity = focus === 'environment' ? 0.62 : 0;

      // Act III Fault Indicators
      rig.faultIndicators.ex01Nacelle.visible = goal.faultMode === 'EX-01';
      rig.faultIndicators.ex02Battery.visible = goal.faultMode === 'EX-02';
      rig.faultIndicators.ex03Avionics.visible = goal.faultMode === 'EX-03';
      materials.faultHighlight.emissiveIntensity = 0.55 + goal.faultIntensity * 0.85;
      materials.faultAura.opacity = goal.faultMode === 'none' ? 0 : 0.14 + goal.faultIntensity * 0.18;

      // Act IV Seven Concentric Defense Rings
      for (let i = 0; i < rig.defenseRings.length; i++) {
        const ring = rig.defenseRings[i];
        const mat = ring.material as THREE.LineBasicMaterial;
        const active = i < goal.defenseRingCount;
        const isCurrent = i === goal.defenseRingCount - 1;
        const targetOpacity = active ? (isCurrent ? 0.88 : 0.34) : 0;
        mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOpacity, lambda, dt);
        ring.visible = mat.opacity > 0.01;
      }

      // Grounded studio deck opacity (fades away during airborne Act I cruise)
      curFloorOpacity = THREE.MathUtils.damp(curFloorOpacity, goal.floorOpacity, lambda, dt);
      rig.floorGroup.visible = curFloorOpacity > 0.02;
      materials.studioFloor.opacity = curFloorOpacity;
      materials.contactShadow.opacity = curFloorOpacity * 0.72;
      materials.deckRing.opacity = curFloorOpacity * 0.78;

      // Smoothly interpolate studio lighting & dark-to-dawn color mood
      const mood = goal.mood;
      const colorStep = Math.min(1, dt * (isSoftwareGl ? 10 : 4.5));
      _tmpColorA.set(mood.bgHex);
      (scene.background as THREE.Color).lerp(_tmpColorA, colorStep);
      (scene.fog as THREE.FogExp2).color.lerp(_tmpColorA, colorStep);

      _tmpColorB.set(mood.keyHex);
      keyLight.color.lerp(_tmpColorB, colorStep);
      keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, mood.keyIntensity, lambda, dt);
      keyLight.position.x = THREE.MathUtils.damp(keyLight.position.x, mood.keyPos[0], lambda, dt);
      keyLight.position.y = THREE.MathUtils.damp(keyLight.position.y, mood.keyPos[1], lambda, dt);
      keyLight.position.z = THREE.MathUtils.damp(keyLight.position.z, mood.keyPos[2], lambda, dt);

      _tmpColorB.set(mood.fillSkyHex);
      hemiLight.color.lerp(_tmpColorB, colorStep);
      _tmpColorB.set(mood.fillGroundHex);
      hemiLight.groundColor.lerp(_tmpColorB, colorStep);
      hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, mood.fillIntensity, lambda, dt);

      _tmpColorB.set(mood.rimHex);
      rimLight.color.lerp(_tmpColorB, colorStep);
      rimLight.intensity = THREE.MathUtils.damp(rimLight.intensity, mood.rimIntensity, lambda, dt);
      scene.environmentIntensity = THREE.MathUtils.damp(
        scene.environmentIntensity,
        mood.envIntensity,
        lambda,
        dt,
      );
      renderer.toneMappingExposure = THREE.MathUtils.damp(
        renderer.toneMappingExposure,
        mood.exposure,
        lambda,
        dt,
      );

      // Determine whether transitions have visually settled (used by software-GL on-demand renderer)
      const camErr =
        curCamPos.distanceToSquared(_camGoalVec) + curCamTarget.distanceToSquared(_targetVec);
      const stateErr =
        Math.abs(curTiltDeg - goal.nacelleTiltDeg) +
        Math.abs(curXray - goal.xrayLevel) * 10 +
        Math.abs(curGear - goal.gearDeploy) * 10 +
        Math.abs(curFloorOpacity - goal.floorOpacity) * 10;
      return camErr > 0.0015 || stateErr > 0.08;
    };

    // Rendering scheduler:
    // - GPU devices: silky requestAnimationFrame while visible & active
    // - Software WebGL: strictly coalesced on-demand requestRender() + afterDraw() fence sync
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed || contextLost || document.hidden) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = window.requestAnimationFrame((now) => {
        if (disposed || contextLost) {
          renderBusy = false;
          return;
        }
        renderDirty = false;
        const dt = Math.min(0.08, Math.max(0.008, (now - lastTime) / 1000));
        lastTime = now;

        const stillSettling = applyState(isSoftwareGl ? 0.16 : dt);
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          const keepSpinningOnGpu = !isSoftwareGl && motionModeRef.current === 'full';
          if (renderDirty || stillSettling || keepSpinningOnGpu) {
            requestRender();
          }
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    }

    requestRenderRef.current = requestRender;

    // WebGL context loss/restore resilience
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      renderBusy = false;
    };
    const onContextRestored = () => {
      contextLost = false;
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        lastTime = performance.now();
        requestRender();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Draw initial crisp frame immediately
    applyState(1.0);
    renderer.render(scene, camera);
    requestRender();

    return () => {
      disposed = true;
      requestRenderRef.current = null;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      envTarget.dispose();
      rig.dispose();
      materials.dispose();
      if (softboxLight) scene.remove(softboxLight);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [onWebglUnavailable]);

  if (!webglReady) return null;

  // Pointer-drag orbit handlers on the unobstructed right half of the desktop cinema stage
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragStateRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;
    const dx = e.clientX - dragStateRef.current.lastX;
    const dy = e.clientY - dragStateRef.current.lastY;
    dragStateRef.current.lastX = e.clientX;
    dragStateRef.current.lastY = e.clientY;
    orbitOffsetRef.current.yaw = THREE.MathUtils.clamp(
      orbitOffsetRef.current.yaw - dx * 0.0065,
      -2.2,
      2.2,
    );
    orbitOffsetRef.current.pitch = THREE.MathUtils.clamp(
      orbitOffsetRef.current.pitch - dy * 0.0045,
      -0.65,
      0.75,
    );
    setHasOrbitOffset(true);
    requestRenderRef.current?.();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStateRef.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleResetOrbit = () => {
    orbitOffsetRef.current = { yaw: 0, pitch: 0 };
    setHasOrbitOffset(false);
    requestRenderRef.current?.();
  };

  const cycleXrayMode = () => {
    setXrayOverride((prev) => (prev === 'auto' ? 'on' : prev === 'on' ? 'off' : 'auto'));
  };

  const xrayLabel =
    xrayOverride === 'auto'
      ? nextFrame.xrayLevel > 0.25
        ? '透视：自动（开）'
        : '透视：自动（外壳）'
      : xrayOverride === 'on'
        ? '透视：强制透视'
        : '透视：强制外壳';

  return (
    <>
      {/* Persistent Fixed 3D Cinema Backdrop (zero unmount across all 6 Acts) */}
      <div
        aria-hidden="true"
        data-evtol-3d-stage="active"
        data-cinema-chapter={chapter}
        className="pointer-events-none fixed inset-x-0 top-14 z-0 h-[40vh] overflow-hidden bg-[#0A0E13] lg:h-[calc(100vh-56px)]"
      >
        {/* Dedicated empty mount node for Three.js WebGLCanvas (Rule 4.1) */}
        <div ref={mountRef} className="h-full w-full" />

        {/* Subtle directional edge vignette so scrolling text on the left always maintains crisp contrast */}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              'linear-gradient(90deg, rgba(10,14,19,0.78) 0%, rgba(10,14,19,0.42) 34%, rgba(10,14,19,0.0) 56%, rgba(10,14,19,0.22) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 lg:hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(10,14,19,0) 0%, rgba(10,14,19,0.96) 100%)',
          }}
        />
      </div>

      {/* Desktop Right-Half Pointer-Drag Inspection Hit Zone (never intercepts wheel scroll!) */}
      <div
        aria-label="拖拽旋转 3D 六倾转旋翼 eVTOL 教学模型视角"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="fixed bottom-16 right-0 top-14 z-[5] hidden w-[52vw] cursor-grab active:cursor-grabbing lg:block"
      />

      {/* Collapsible Bottom-Right Cinema Telemetry & X-Ray Control Dock (solid dark surface, zero backdrop-blur) */}
      <div className="fixed bottom-4 right-4 z-30 hidden flex-col items-end gap-1.5 lg:flex">
        <button
          type="button"
          onClick={() => setHudCollapsed((prev) => !prev)}
          aria-expanded={!hudCollapsed}
          className="inline-flex items-center gap-1.5 border border-[#B8C1C8]/22 bg-[#0D1219] px-2.5 py-1 font-mono-tabular text-[11px] text-[#B8C1C8] transition-colors hover:border-[#D99A45] hover:text-[#F2EFE7]"
        >
          {hudCollapsed ? (
            <>
              <ChevronUp className="h-3 w-3 text-[#D99A45]" aria-hidden="true" />
              <span>展开 3D 视口控制 (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 text-[#D99A45]" aria-hidden="true" />
              <span>收起控制条 (H)</span>
            </>
          )}
        </button>

        {!hudCollapsed && (
          <div className="flex flex-wrap items-center gap-3 border border-[#B8C1C8]/20 bg-[#0D1219]/96 px-3.5 py-2 text-xs text-[#B8C1C8]">
            <span className="font-mono-tabular text-[11px] text-[#84909B]">
              [D] 6-TILT eVTOL · 倾转{' '}
              <strong className="font-medium text-[#D99A45]">
                {Math.round(nextFrame.nacelleTiltDeg)}°
              </strong>
            </span>

            <span aria-hidden="true" className="text-[#B8C1C8]/20">|</span>

            <button
              type="button"
              onClick={cycleXrayMode}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                xrayOverride !== 'auto' ? 'text-[#D99A45]' : 'text-[#B8C1C8] hover:text-[#F2EFE7]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{xrayLabel}</span>
            </button>

            {hasOrbitOffset && (
              <>
                <span aria-hidden="true" className="text-[#B8C1C8]/20">|</span>
                <button
                  type="button"
                  onClick={handleResetOrbit}
                  className="inline-flex items-center gap-1 whitespace-nowrap text-[#D99A45] hover:text-[#F2EFE7]"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>重置镜头</span>
                </button>
              </>
            )}

            <span aria-hidden="true" className="text-[#B8C1C8]/20">|</span>

            <span className="inline-flex items-center gap-1 text-[11px] text-[#84909B]">
              <Eye className="h-3 w-3" aria-hidden="true" />
              <span>右侧拖拽可旋转模型</span>
            </span>
          </div>
        )}
      </div>
    </>
  );
}
