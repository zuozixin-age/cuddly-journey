import * as THREE from 'three';

export interface EvtolMaterialKit {
  fuselageOuter: THREE.MeshPhysicalMaterial;
  fuselageBelly: THREE.MeshStandardMaterial;
  wingComposite: THREE.MeshPhysicalMaterial;
  canopyGlass: THREE.MeshPhysicalMaterial;
  canopyFrame: THREE.MeshStandardMaterial;
  brushedAluminum: THREE.MeshPhysicalMaterial;
  darkTitanium: THREE.MeshStandardMaterial;
  propellerBlade: THREE.MeshStandardMaterial;
  rotorDisc: THREE.MeshBasicMaterial;
  rubberTire: THREE.MeshStandardMaterial;
  cabinFloor: THREE.MeshStandardMaterial;
  cabinSeat: THREE.MeshStandardMaterial;
  cockpitHudGlow: THREE.MeshStandardMaterial;
  amberAccent: THREE.MeshStandardMaterial;
  navPortRed: THREE.MeshStandardMaterial;
  navStbdGreen: THREE.MeshStandardMaterial;
  // Internal cutaway subsystem materials
  internalPowerPack: THREE.MeshStandardMaterial;
  internalPowerBus: THREE.MeshStandardMaterial;
  internalPropulsionCore: THREE.MeshStandardMaterial;
  internalAvionics: THREE.MeshStandardMaterial;
  internalControlBus: THREE.MeshStandardMaterial;
  internalActuator: THREE.MeshStandardMaterial;
  internalStructure: THREE.MeshStandardMaterial;
  internalAirflow: THREE.MeshBasicMaterial;
  // Fault isolation highlight materials (Act III)
  faultHighlight: THREE.MeshStandardMaterial;
  faultAura: THREE.MeshBasicMaterial;
  // Studio floor & contact shadow
  studioFloor: THREE.MeshStandardMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  deckRing: THREE.MeshBasicMaterial;
  dispose: () => void;
}

function createCompositeMicroWeaveTexture(maxAnisotropy: number): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 256;
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bctx = bumpCanvas.getContext('2d');

  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rctx = roughCanvas.getContext('2d');

  if (bctx && rctx) {
    // Subtle aerospace composite satin weave + precision panel seam hairlines
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, size, size);
    rctx.fillStyle = '#5c5c5c';
    rctx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        const checker = ((x + y) / 4) % 2 === 0;
        bctx.fillStyle = checker ? '#878787' : '#797979';
        bctx.fillRect(x, y, 4, 4);
        rctx.fillStyle = checker ? '#636363' : '#555555';
        rctx.fillRect(x, y, 4, 4);
      }
    }

    // Crisp recessed aerodynamic skin panel seams
    bctx.strokeStyle = '#383838';
    bctx.lineWidth = 1.5;
    bctx.beginPath();
    bctx.moveTo(0, 64);
    bctx.lineTo(size, 64);
    bctx.moveTo(0, 192);
    bctx.lineTo(size, 192);
    bctx.moveTo(128, 0);
    bctx.lineTo(128, size);
    bctx.stroke();

    rctx.strokeStyle = '#999999';
    rctx.lineWidth = 1.5;
    rctx.beginPath();
    rctx.moveTo(0, 64);
    rctx.lineTo(size, 64);
    rctx.moveTo(0, 192);
    rctx.lineTo(size, 192);
    rctx.moveTo(128, 0);
    rctx.lineTo(128, size);
    rctx.stroke();
  }

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 4);
  bumpMap.anisotropy = maxAnisotropy;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(6, 4);
  roughnessMap.anisotropy = maxAnisotropy;

  return { bumpMap, roughnessMap };
}

function createBrushedMetalTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    // Deterministic linear brushed streaks
    for (let y = 0; y < size; y += 1) {
      const shade = 112 + ((y * 37 + (y % 7) * 13) % 34);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, size, 1);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    // Soft fuselage + wing ground occlusion shadow
    const cx = size / 2;
    const cy = size / 2;

    const mainGrad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 220);
    mainGrad.addColorStop(0, 'rgba(2, 5, 10, 0.78)');
    mainGrad.addColorStop(0.42, 'rgba(2, 5, 10, 0.42)');
    mainGrad.addColorStop(0.76, 'rgba(2, 5, 10, 0.12)');
    mainGrad.addColorStop(1, 'rgba(2, 5, 10, 0)');
    ctx.fillStyle = mainGrad;
    ctx.fillRect(0, 0, size, size);

    // Subtle elongated wingspan ambient occlusion band
    ctx.save();
    ctx.translate(cx, cy - 10);
    ctx.scale(1.65, 0.42);
    const wingGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, 140);
    wingGrad.addColorStop(0, 'rgba(2, 5, 10, 0.5)');
    wingGrad.addColorStop(0.6, 'rgba(2, 5, 10, 0.18)');
    wingGrad.addColorStop(1, 'rgba(2, 5, 10, 0)');
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 140, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAviationDeckRingTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;

    // Outer calibrated datum circle
    ctx.strokeStyle = 'rgba(184, 193, 200, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 448, 0, Math.PI * 2);
    ctx.stroke();

    // Inner pad circle
    ctx.strokeStyle = 'rgba(217, 154, 69, 0.28)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(cx, cy, 316, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Degree tick marks around outer perimeter
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const major = deg % 30 === 0;
      const r0 = major ? 424 : 436;
      const r1 = 448;
      ctx.strokeStyle = major ? 'rgba(217, 154, 69, 0.36)' : 'rgba(184, 193, 200, 0.16)';
      ctx.lineWidth = major ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * r0, cy + Math.sin(rad) * r0);
      ctx.lineTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
      ctx.stroke();
    }

    // Crosshair center alignment hairlines
    ctx.strokeStyle = 'rgba(184, 193, 200, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 460, cy);
    ctx.lineTo(cx + 460, cy);
    ctx.moveTo(cx, cy - 460);
    ctx.lineTo(cx, cy + 460);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createEvtolMaterialKit(
  maxAnisotropy: number,
  isSoftwareGl: boolean,
): EvtolMaterialKit {
  const compositeMaps = createCompositeMicroWeaveTexture(maxAnisotropy);
  const brushedBump = createBrushedMetalTexture(maxAnisotropy);
  const contactShadowTex = createContactShadowTexture();
  const deckRingTex = createAviationDeckRingTexture(maxAnisotropy);

  // Primary satin ceramic-pearl aerospace composite (distinct high-contrast read against #0A0E13 studio)
  const fuselageOuter = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#D4DCE4'),
    roughness: 0.36,
    metalness: 0.12,
    clearcoat: 0.48,
    clearcoatRoughness: 0.22,
    bumpMap: compositeMaps.bumpMap,
    bumpScale: 0.008,
    roughnessMap: compositeMaps.roughnessMap,
    transparent: false,
    opacity: 1,
  });

  // Lower belly composite fairing: darker graphite-carbon contrast (>= 0.25 roughness shift vs brushed metal)
  const fuselageBelly = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#27313D'),
    roughness: 0.58,
    metalness: 0.18,
    bumpMap: compositeMaps.bumpMap,
    bumpScale: 0.01,
    transparent: false,
    opacity: 1,
  });

  // Swept high-aspect-ratio wing satin ceramic composite
  const wingComposite = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#CDD6DF'),
    roughness: 0.34,
    metalness: 0.14,
    clearcoat: 0.45,
    clearcoatRoughness: 0.24,
    bumpMap: compositeMaps.bumpMap,
    bumpScale: 0.007,
    transparent: false,
    opacity: 1,
  });

  // Optical smoked sapphire panoramic canopy glass (software-GL safe fallback)
  const canopyGlass = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#0E1B2B'),
    roughness: 0.07,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    ior: 1.52,
    transmission: isSoftwareGl ? 0 : 0.62,
    thickness: 0.35,
    transparent: true,
    opacity: isSoftwareGl ? 0.58 : 0.88,
    depthWrite: false,
  });

  const canopyFrame = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1B232D'),
    roughness: 0.48,
    metalness: 0.35,
  });

  // Anodized brushed aerospace aluminum (tilt yokes, spinners, leading edge cuffs, oleo struts)
  const brushedAluminum = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#C4CDD6'),
    metalness: 0.88,
    roughness: 0.22,
    anisotropy: isSoftwareGl ? 0 : 0.65,
    bumpMap: brushedBump,
    bumpScale: 0.006,
  });

  // Dark machined titanium (hub collars, actuator housings, nacelle cooling bezels)
  const darkTitanium = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#343F4C'),
    metalness: 0.78,
    roughness: 0.3,
    bumpMap: brushedBump,
    bumpScale: 0.005,
  });

  // Matte woven carbon propeller blades
  const propellerBlade = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1F262F'),
    metalness: 0.22,
    roughness: 0.42,
  });

  const rotorDisc = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#B8C1C8'),
    transparent: true,
    opacity: 0.09,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  // High-roughness matte rubber aircraft tires
  const rubberTire = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#15181C'),
    metalness: 0.02,
    roughness: 0.9,
  });

  const cabinFloor = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#181E26'),
    roughness: 0.78,
    metalness: 0.08,
  });

  const cabinSeat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#2E3744'),
    roughness: 0.72,
    metalness: 0.06,
  });

  const cockpitHudGlow = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#638DB0'),
    emissive: new THREE.Color('#638DB0'),
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.2,
  });

  const amberAccent = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#D99A45'),
    emissive: new THREE.Color('#D99A45'),
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.45,
  });

  const navPortRed = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C84D46'),
    emissive: new THREE.Color('#C84D46'),
    emissiveIntensity: 1.35,
    roughness: 0.2,
  });

  const navStbdGreen = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#479E7B'),
    emissive: new THREE.Color('#479E7B'),
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });

  // Internal Cutaway Engineering Subsystems
  const internalPowerPack = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#B8843B'),
    emissive: new THREE.Color('#D99A45'),
    emissiveIntensity: 0.16,
    roughness: 0.38,
    metalness: 0.48,
  });

  const internalPowerBus = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#D99A45'),
    emissive: new THREE.Color('#D99A45'),
    emissiveIntensity: 0.35,
    roughness: 0.32,
    metalness: 0.52,
  });

  const internalPropulsionCore = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C97A4A'),
    emissive: new THREE.Color('#C97A4A'),
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.85,
  });

  const internalAvionics = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#4F7CA3'),
    emissive: new THREE.Color('#638DB0'),
    emissiveIntensity: 0.24,
    roughness: 0.35,
    metalness: 0.55,
  });

  const internalControlBus = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#638DB0'),
    emissive: new THREE.Color('#638DB0'),
    emissiveIntensity: 0.38,
    roughness: 0.28,
    metalness: 0.45,
  });

  const internalActuator = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8BA1B5'),
    emissive: new THREE.Color('#8BA1B5'),
    emissiveIntensity: 0.14,
    roughness: 0.24,
    metalness: 0.82,
  });

  const internalStructure = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5A6775'),
    emissive: new THREE.Color('#7B8B9C'),
    emissiveIntensity: 0.12,
    roughness: 0.48,
    metalness: 0.62,
  });

  const internalAirflow = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#7BA6CE'),
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const faultHighlight = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#C84D46'),
    emissive: new THREE.Color('#D9564A'),
    emissiveIntensity: 0.95,
    roughness: 0.32,
    metalness: 0.3,
  });

  const faultAura = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#D9564A'),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const studioFloor = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0C1118'),
    roughness: 0.86,
    metalness: 0.12,
    transparent: true,
    opacity: 1,
  });

  const contactShadow = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });

  const deckRing = new THREE.MeshBasicMaterial({
    map: deckRingTex,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const allTextures: THREE.Texture[] = [
    compositeMaps.bumpMap,
    compositeMaps.roughnessMap,
    brushedBump,
    contactShadowTex,
    deckRingTex,
  ];

  const allMaterials: THREE.Material[] = [
    fuselageOuter,
    fuselageBelly,
    wingComposite,
    canopyGlass,
    canopyFrame,
    brushedAluminum,
    darkTitanium,
    propellerBlade,
    rotorDisc,
    rubberTire,
    cabinFloor,
    cabinSeat,
    cockpitHudGlow,
    amberAccent,
    navPortRed,
    navStbdGreen,
    internalPowerPack,
    internalPowerBus,
    internalPropulsionCore,
    internalAvionics,
    internalControlBus,
    internalActuator,
    internalStructure,
    internalAirflow,
    faultHighlight,
    faultAura,
    studioFloor,
    contactShadow,
    deckRing,
  ];

  return {
    fuselageOuter,
    fuselageBelly,
    wingComposite,
    canopyGlass,
    canopyFrame,
    brushedAluminum,
    darkTitanium,
    propellerBlade,
    rotorDisc,
    rubberTire,
    cabinFloor,
    cabinSeat,
    cockpitHudGlow,
    amberAccent,
    navPortRed,
    navStbdGreen,
    internalPowerPack,
    internalPowerBus,
    internalPropulsionCore,
    internalAvionics,
    internalControlBus,
    internalActuator,
    internalStructure,
    internalAirflow,
    faultHighlight,
    faultAura,
    studioFloor,
    contactShadow,
    deckRing,
    dispose: () => {
      allTextures.forEach((t) => t.dispose());
      allMaterials.forEach((m) => m.dispose());
    },
  };
}
