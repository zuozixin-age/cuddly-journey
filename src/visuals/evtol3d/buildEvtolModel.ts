import * as THREE from 'three';
import type { SubsystemId } from '../../safety/types';
import type { EvtolMaterialKit } from './materials';

export interface EvtolModelRig {
  root: THREE.Group;
  aircraftGroup: THREE.Group;
  tiltPivots: THREE.Group[]; // 6 articulated tilt-rotor nacelle pivots (0..3 wing, 4..5 V-tail)
  rotorHubs: Array<{ hub: THREE.Group; direction: 1 | -1; nacelleIndex: number }>;
  landingGearGroups: THREE.Group[];
  internalCutawayRoot: THREE.Group;
  internalMotorCores: THREE.Mesh[];
  subsystemGroups: Record<SubsystemId, THREE.Group>;
  faultIndicators: {
    ex01Nacelle: THREE.Group;
    ex02Battery: THREE.Group;
    ex03Avionics: THREE.Group;
  };
  defenseRings: THREE.LineLoop[];
  floorGroup: THREE.Group;
  dispose: () => void;
}

/**
 * Parametric lofted teardrop aerospace fuselage geometry (nose at +Z, tailcone at -Z).
 */
function buildLoftedFuselageGeometry(
  zStart: number,
  zEnd: number,
  axialSegments: number,
  radialSegments: number,
  profileFn: (u: number) => {
    halfWidth: number;
    yTop: number;
    yBot: number;
    squareness: number;
  },
  angleStart = 0,
  angleLength = Math.PI * 2,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= axialSegments; i++) {
    const u = i / axialSegments;
    const z = zStart + (zEnd - zStart) * u;
    const p = profileFn(u);
    const yMid = (p.yTop + p.yBot) * 0.5;
    const halfH = Math.max(0.002, (p.yTop - p.yBot) * 0.5);
    const halfW = Math.max(0.002, p.halfWidth);
    const exp = 2 / Math.max(1.4, p.squareness);

    for (let j = 0; j <= radialSegments; j++) {
      const v = j / radialSegments;
      const theta = angleStart + v * angleLength;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const sx = Math.sign(cosT) * Math.pow(Math.abs(cosT), exp);
      const sy = Math.sign(sinT) * Math.pow(Math.abs(sinT), exp);

      const x = sx * halfW;
      const y = yMid + sy * halfH;

      positions.push(x, y, z);
      uvs.push(u * 2.2, v);
    }
  }

  const stride = radialSegments + 1;
  for (let i = 0; i < axialSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, d, b);
      indices.push(b, d, c);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Generates a real cambered NACA-style tapered swept airfoil half-wing or V-tail fin.
 */
function buildTaperedAirfoilWingGeometry(opts: {
  side: 1 | -1;
  span: number;
  rootChord: number;
  tipChord: number;
  rootThickness: number;
  tipThickness: number;
  sweepBack: number;
  dihedralRise: number;
  camber: number;
  spanSegments?: number;
  chordSegments?: number;
}): THREE.BufferGeometry {
  const spanSegs = opts.spanSegments ?? 18;
  const chordSegs = opts.chordSegments ?? 24;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const evalAirfoil = (tNorm: number, upper: boolean, camber: number, thickness: number) => {
    const yt =
      5 *
      thickness *
      (0.2969 * Math.sqrt(Math.max(0, tNorm)) -
        0.126 * tNorm -
        0.3516 * tNorm * tNorm +
        0.2843 * tNorm * tNorm * tNorm -
        0.1015 * tNorm * tNorm * tNorm * tNorm);
    const yc = camber * 4 * tNorm * (1 - tNorm);
    return upper ? yc + yt : yc - yt * 0.72;
  };

  const ringPts = chordSegs * 2;

  for (let i = 0; i <= spanSegs; i++) {
    const s = i / spanSegs;
    const x = opts.side * s * opts.span;
    const chord = opts.rootChord + (opts.tipChord - opts.rootChord) * s;
    const thick = opts.rootThickness + (opts.tipThickness - opts.rootThickness) * s;
    const zLead = -opts.sweepBack * s;
    const yBase = opts.dihedralRise * s;

    for (let j = 0; j <= ringPts; j++) {
      const frac = j / ringPts;
      let tNorm: number;
      let upper: boolean;
      if (frac <= 0.5) {
        const a = frac * 2;
        tNorm = 0.5 * (1 + Math.cos(a * Math.PI));
        upper = true;
      } else {
        const a = (frac - 0.5) * 2;
        tNorm = 0.5 * (1 - Math.cos(a * Math.PI));
        upper = false;
      }
      const z = zLead - (tNorm - 0.28) * chord;
      const y = yBase + evalAirfoil(tNorm, upper, opts.camber, thick) * chord;
      positions.push(x, y, z);
      uvs.push(s * 2.4, frac);
    }
  }

  const stride = ringPts + 1;
  for (let i = 0; i < spanSegs; i++) {
    for (let j = 0; j < ringPts; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      if (opts.side > 0) {
        indices.push(a, b, d);
        indices.push(b, c, d);
      } else {
        indices.push(a, d, b);
        indices.push(b, d, c);
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Sculpted twisted scimitar propeller blade (built along +X radial axis from root to tip).
 */
function buildScimitarBladeGeometry(radius: number): THREE.BufferGeometry {
  const spanSegs = 12;
  const profileSegs = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= spanSegs; i++) {
    const u = i / spanSegs;
    const r = 0.08 + u * (radius - 0.08);
    const chord =
      radius * (0.086 + Math.sin(Math.pow(u, 0.72) * Math.PI) * 0.072) * (1 - 0.34 * u * u);
    const thick = chord * (0.18 - 0.1 * u);
    const pitchRad = (32 - 19 * u) * (Math.PI / 180);
    const sweepZ = Math.sin(u * Math.PI * 0.9) * 0.045 - u * u * 0.055;

    const cosP = Math.cos(pitchRad);
    const sinP = Math.sin(pitchRad);

    for (let j = 0; j <= profileSegs; j++) {
      const theta = (j / profileSegs) * Math.PI * 2;
      const localC = Math.cos(theta) * chord * 0.5;
      const localT = Math.sin(theta) * thick * 0.5;

      const z = localC * cosP - localT * sinP + sweepZ;
      const y = localC * sinP + localT * cosP;
      positions.push(r, y, z);
      uvs.push(u, j / profileSegs);
    }
  }

  const stride = profileSegs + 1;
  for (let i = 0; i < spanSegs; i++) {
    for (let j = 0; j < profileSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Teardrop motor nacelle cowling oriented along +Y (vertical hover at tilt = 0°).
 */
function buildNacelleCowlingGeometry(length: number, maxRadius: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = (t - 0.42) * length;
    const r =
      t < 0.04
        ? 0.004
        : t > 0.96
          ? maxRadius * 0.48
          : maxRadius * Math.sin(Math.pow(t, 0.72) * Math.PI * 0.92);
    pts.push(new THREE.Vector2(Math.max(0.003, r), y));
  }
  const geom = new THREE.LatheGeometry(pts, 28);
  geom.computeVertexNormals();
  return geom;
}

function buildSpinnerConeGeometry(radius: number, height: number): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    const r = radius * Math.pow(1 - t, 0.72);
    const y = t * height;
    pts.push(new THREE.Vector2(Math.max(0.002, r), y));
  }
  const geom = new THREE.LatheGeometry(pts, 24);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds the conceptual 3D 6-tilt-rotor eVTOL model ([D] teaching geometry inspired by Joby S4).
 */
export function buildEvtolModel(materials: EvtolMaterialKit): EvtolModelRig {
  const geometries: THREE.BufferGeometry[] = [];
  const track = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  const root = new THREE.Group();
  root.name = 'evtol-cinema-root';

  const aircraftGroup = new THREE.Group();
  aircraftGroup.name = 'evtol-aircraft';
  root.add(aircraftGroup);

  // =========================================================================
  // 1. LOFTED AERODYNAMIC TEARDROP FUSELAGE (Nose +2.65 -> Tailcone -2.55)
  // =========================================================================
  const fuselageProfile = (u: number) => {
    if (u >= 0.44) {
      // Forward cabin & sleek pointed nose (u in [0.44, 1.0])
      const f = (u - 0.44) / 0.56;
      const widthEnv = Math.sin(Math.pow(1 - f, 0.62) * Math.PI * 0.5) * 0.65;
      const topEnv =
        f < 0.7
          ? 0.59 - 0.16 * Math.pow(f / 0.7, 1.65)
          : 0.43 * Math.pow(Math.max(0, 1 - (f - 0.7) / 0.3), 0.66) - 0.06 * ((f - 0.7) / 0.3);
      const botEnv =
        f < 0.78
          ? -0.46 + 0.13 * Math.pow(f / 0.78, 2.0)
          : -0.33 * Math.pow(Math.max(0, 1 - (f - 0.78) / 0.22), 0.7) - 0.06 * ((f - 0.78) / 0.22);
      return {
        halfWidth: Math.max(0.012, widthEnv),
        yTop: topEnv,
        yBot: botEnv,
        squareness: 2.38 - 0.38 * f,
      };
    } else {
      // Tapered aerodynamic aft tailcone (u in [0, 0.44])
      const t = u / 0.44;
      const smooth = t * t * (3 - 2 * t);
      return {
        halfWidth: 0.11 + 0.54 * smooth,
        yTop: 0.16 + 0.43 * smooth,
        yBot: -0.04 - 0.42 * smooth,
        squareness: 2.05 + 0.33 * smooth,
      };
    }
  };

  const fuselageGeom = track(
    buildLoftedFuselageGeometry(-2.55, 2.65, 48, 36, fuselageProfile),
  );
  const fuselageMesh = new THREE.Mesh(fuselageGeom, materials.fuselageOuter);
  fuselageMesh.castShadow = true;
  fuselageMesh.receiveShadow = true;
  aircraftGroup.add(fuselageMesh);

  // Seamless dark-carbon belly strake & battery bay fairing conformed tightly to lower fuselage curve
  const bellyFairingGeom = track(
    buildLoftedFuselageGeometry(
      -1.35,
      1.95,
      26,
      20,
      (u) => {
        const z = -1.35 + u * 3.3;
        const hullU = (z - -2.55) / 5.2;
        const p = fuselageProfile(hullU);
        const swell = Math.sin(u * Math.PI);
        return {
          halfWidth: p.halfWidth + 0.008,
          yTop: p.yBot + 0.22,
          yBot: p.yBot - 0.022 * swell,
          squareness: p.squareness,
        };
      },
      Math.PI * 1.12,
      Math.PI * 0.76,
    ),
  );
  const bellyFairing = new THREE.Mesh(bellyFairingGeom, materials.fuselageBelly);
  bellyFairing.castShadow = true;
  aircraftGroup.add(bellyFairing);

  // Sleek amber livery horizon pinstripe running cleanly along port & starboard flanks
  for (const side of [-1, 1] as const) {
    const stripePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const u = 0.14 + (i / 20) * 0.74;
      const p = fuselageProfile(u);
      const z = -2.55 + u * 5.2;
      stripePts.push(new THREE.Vector3(side * (p.halfWidth + 0.009), -0.05 + (u - 0.5) * 0.04, z));
    }
    const stripeCurve = new THREE.CatmullRomCurve3(stripePts);
    const stripeGeom = track(new THREE.TubeGeometry(stripeCurve, 26, 0.013, 6, false));
    aircraftGroup.add(new THREE.Mesh(stripeGeom, materials.amberAccent));
  }

  // =========================================================================
  // 2. FLUSH PANORAMIC OPTICAL CANOPY & 5-SEAT SCULPTED CABIN INTERIOR
  // =========================================================================
  const canopyGeom = track(
    buildLoftedFuselageGeometry(
      0.24,
      2.22,
      24,
      22,
      (u) => {
        const z = 0.24 + u * 1.98;
        const hullU = (z - -2.55) / 5.2;
        const p = fuselageProfile(hullU);
        return {
          halfWidth: p.halfWidth + 0.014,
          yTop: p.yTop + 0.015,
          yBot: p.yBot,
          squareness: p.squareness,
        };
      },
      Math.PI * 0.14,
      Math.PI * 0.72,
    ),
  );
  const canopyMesh = new THREE.Mesh(canopyGeom, materials.canopyGlass);
  canopyMesh.renderOrder = 4;
  aircraftGroup.add(canopyMesh);

  // Flush sculpted A-pillar window trim conforming tightly to the exact canopy surface (zero protrusion!)
  const trimStations = [0.28, 1.32];
  for (const tz of trimStations) {
    const hullU = (tz - -2.55) / 5.2;
    const p = fuselageProfile(hullU);
    const yMid = (p.yTop + p.yBot) * 0.5;
    const halfH = (p.yTop - p.yBot) * 0.5 + 0.015;
    const halfW = p.halfWidth + 0.015;
    const exp = 2 / p.squareness;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 16; k++) {
      const theta = Math.PI * 0.14 + (k / 16) * (Math.PI * 0.72);
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const x = Math.sign(cosT) * Math.pow(Math.abs(cosT), exp) * halfW;
      const y = yMid + Math.sign(sinT) * Math.pow(Math.abs(sinT), exp) * halfH;
      pts.push(new THREE.Vector3(x, y, tz));
    }
    const trimCurve = new THREE.CatmullRomCurve3(pts);
    const trimMesh = new THREE.Mesh(
      track(new THREE.TubeGeometry(trimCurve, 20, 0.012, 8, false)),
      materials.canopyFrame,
    );
    aircraftGroup.add(trimMesh);
  }

  // Sculpted 5-seat cabin interior (1 pilot + 4 passengers)
  const cabinGroup = new THREE.Group();
  const floorGeom = track(new THREE.BoxGeometry(0.92, 0.04, 1.72));
  const floorMesh = new THREE.Mesh(floorGeom, materials.cabinFloor);
  floorMesh.position.set(0, -0.22, 0.92);
  cabinGroup.add(floorMesh);

  const dashGeom = track(new THREE.BoxGeometry(0.66, 0.15, 0.26));
  const dashMesh = new THREE.Mesh(dashGeom, materials.canopyFrame);
  dashMesh.position.set(0, 0.05, 1.72);
  cabinGroup.add(dashMesh);

  const hudStripGeom = track(new THREE.BoxGeometry(0.44, 0.04, 0.02));
  const hudStrip = new THREE.Mesh(hudStripGeom, materials.cockpitHudGlow);
  hudStrip.position.set(0, 0.11, 1.58);
  cabinGroup.add(hudStrip);

  const seatBaseGeom = track(new THREE.BoxGeometry(0.25, 0.07, 0.27));
  const seatBackGeom = track(new THREE.BoxGeometry(0.23, 0.33, 0.055));
  const seatPositions: Array<[number, number]> = [
    [0, 1.32],
    [-0.24, 0.84],
    [0.24, 0.84],
    [-0.23, 0.36],
    [0.23, 0.36],
  ];
  for (const [sx, sz] of seatPositions) {
    const seat = new THREE.Group();
    const base = new THREE.Mesh(seatBaseGeom, materials.cabinSeat);
    base.position.set(0, -0.14, 0);
    const back = new THREE.Mesh(seatBackGeom, materials.cabinSeat);
    back.position.set(0, 0.04, -0.12);
    back.rotation.x = -0.18;
    seat.add(base, back);
    seat.position.set(sx, 0, sz);
    cabinGroup.add(seat);
  }
  aircraftGroup.add(cabinGroup);

  // =========================================================================
  // 3. CAMBERED AIRFOIL SWEPT HIGH-ASPECT-RATIO MAIN WING + BOOMS + FLAPS
  // =========================================================================
  const wingMountY = 0.5;
  const wingMountZ = 0.14;
  const halfSpan = 4.25;

  // Sculpted dorsal wing-fuselage saddle fairing
  const saddleGeom = track(
    buildLoftedFuselageGeometry(-0.74, 0.96, 18, 20, (u) => {
      const s = Math.sin(u * Math.PI);
      return {
        halfWidth: 0.44 * Math.pow(s, 0.45),
        yTop: 0.61 + 0.08 * s,
        yBot: 0.34,
        squareness: 2.35,
      };
    }),
  );
  const saddleMesh = new THREE.Mesh(saddleGeom, materials.fuselageOuter);
  saddleMesh.castShadow = true;
  aircraftGroup.add(saddleMesh);

  for (const side of [-1, 1] as const) {
    const halfWingGeom = track(
      buildTaperedAirfoilWingGeometry({
        side,
        span: halfSpan,
        rootChord: 1.12,
        tipChord: 0.56,
        rootThickness: 0.148,
        tipThickness: 0.118,
        sweepBack: 0.34,
        dihedralRise: 0.24,
        camber: 0.028,
      }),
    );
    const halfWingMesh = new THREE.Mesh(halfWingGeom, materials.wingComposite);
    halfWingMesh.position.set(0, wingMountY, wingMountZ);
    halfWingMesh.castShadow = true;
    halfWingMesh.receiveShadow = true;
    aircraftGroup.add(halfWingMesh);

    // Brushed aluminum leading-edge erosion cuff
    const cuffPts = [
      new THREE.Vector3(side * 0.42, wingMountY + 0.02, wingMountZ + 0.3),
      new THREE.Vector3(side * 2.2, wingMountY + 0.14, wingMountZ + 0.14),
      new THREE.Vector3(side * (halfSpan - 0.06), wingMountY + 0.24, wingMountZ - 0.17),
    ];
    const cuffCurve = new THREE.CatmullRomCurve3(cuffPts);
    aircraftGroup.add(
      new THREE.Mesh(track(new THREE.TubeGeometry(cuffCurve, 20, 0.022, 8, false)), materials.brushedAluminum),
    );

    // Dark titanium trailing-edge flap accent strip for visual depth
    const flapPts = [
      new THREE.Vector3(side * 0.55, wingMountY + 0.03, wingMountZ - 0.72),
      new THREE.Vector3(side * 3.65, wingMountY + 0.21, wingMountZ - 0.62),
    ];
    const flapCurve = new THREE.CatmullRomCurve3(flapPts);
    aircraftGroup.add(
      new THREE.Mesh(track(new THREE.TubeGeometry(flapCurve, 12, 0.012, 6, false)), materials.darkTitanium),
    );

    // Wingtip navigation light lens
    const navGeom = track(new THREE.SphereGeometry(0.032, 12, 12));
    const navLight = new THREE.Mesh(navGeom, side < 0 ? materials.navPortRed : materials.navStbdGreen);
    navLight.position.set(side * (halfSpan + 0.05), wingMountY + 0.24, wingMountZ - 0.12);
    aircraftGroup.add(navLight);

    // Sculpted aerodynamic forward nacelle boom for inner wing tilt-rotor (x = ±1.72)
    const boomGeom = track(
      buildLoftedFuselageGeometry(-0.46, 0.9, 18, 18, (u) => {
        const s = Math.sin(Math.pow(u, 0.68) * Math.PI);
        return {
          halfWidth: 0.105 * Math.max(0.32, s),
          yTop: 0.105 * Math.max(0.32, s),
          yBot: -0.105 * Math.max(0.32, s),
          squareness: 2.0,
        };
      }),
    );
    const boomMesh = new THREE.Mesh(boomGeom, materials.fuselageOuter);
    boomMesh.position.set(side * 1.72, wingMountY + 0.07, wingMountZ + 0.16);
    boomMesh.castShadow = true;
    aircraftGroup.add(boomMesh);
  }

  // =========================================================================
  // 4. SCULPTED WIDE-CHORD V-TAIL STABILIZERS (±37° Dihedral Airfoil Fins)
  // =========================================================================
  const vTailSpan = 1.85;
  const vTailRootY = 0.06;
  const vTailRootZ = -2.02;
  const vTailDihedral = 1.06;
  const vTailSweep = 0.36;

  for (const side of [-1, 1] as const) {
    const vTailGeom = track(
      buildTaperedAirfoilWingGeometry({
        side,
        span: vTailSpan,
        rootChord: 0.94,
        tipChord: 0.5,
        rootThickness: 0.15,
        tipThickness: 0.12,
        sweepBack: vTailSweep,
        dihedralRise: vTailDihedral,
        camber: 0.0,
        spanSegments: 14,
        chordSegments: 18,
      }),
    );
    const vTailMesh = new THREE.Mesh(vTailGeom, materials.wingComposite);
    vTailMesh.position.set(0, vTailRootY, vTailRootZ);
    vTailMesh.castShadow = true;
    aircraftGroup.add(vTailMesh);

    // Brushed aluminum leading edge cuff along V-tail stabilizer
    const vCuffCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.1, vTailRootY + 0.05, vTailRootZ + 0.24),
      new THREE.Vector3(side * (vTailSpan - 0.04), vTailRootY + vTailDihedral - 0.02, vTailRootZ - vTailSweep + 0.14),
    ]);
    aircraftGroup.add(
      new THREE.Mesh(track(new THREE.TubeGeometry(vCuffCurve, 14, 0.017, 8, false)), materials.brushedAluminum),
    );
  }

  // =========================================================================
  // 5. SIX ARTICULATED 5-BLADE SCIMITAR TILT-ROTOR ASSEMBLIES
  // =========================================================================
  const tiltPivots: THREE.Group[] = [];
  const rotorHubs: Array<{ hub: THREE.Group; direction: 1 | -1; nacelleIndex: number }> = [];
  const internalMotorCores: THREE.Mesh[] = [];

  const nacelleSpecs: Array<{
    pos: [number, number, number];
    rotorRadius: number;
    spinDir: 1 | -1;
    name: string;
  }> = [
    { pos: [-4.28, wingMountY + 0.25, wingMountZ - 0.14], rotorRadius: 0.94, spinDir: 1, name: 'port-outer' },
    { pos: [-1.72, wingMountY + 0.11, wingMountZ + 1.04], rotorRadius: 0.98, spinDir: -1, name: 'port-inner' },
    { pos: [1.72, wingMountY + 0.11, wingMountZ + 1.04], rotorRadius: 0.98, spinDir: 1, name: 'stbd-inner' },
    { pos: [4.28, wingMountY + 0.25, wingMountZ - 0.14], rotorRadius: 0.94, spinDir: -1, name: 'stbd-outer' },
    { pos: [-1.85, vTailRootY + vTailDihedral, vTailRootZ - vTailSweep - 0.04], rotorRadius: 0.88, spinDir: -1, name: 'vtail-port' },
    { pos: [1.85, vTailRootY + vTailDihedral, vTailRootZ - vTailSweep - 0.04], rotorRadius: 0.88, spinDir: 1, name: 'vtail-stbd' },
  ];

  const sharedNacelleGeom = track(buildNacelleCowlingGeometry(0.68, 0.148));
  const sharedBezelGeom = track(new THREE.TorusGeometry(0.118, 0.02, 10, 24));
  const sharedYokeGeom = track(new THREE.CylinderGeometry(0.038, 0.044, 0.2, 14));
  const sharedHubCollarGeom = track(new THREE.CylinderGeometry(0.09, 0.104, 0.09, 20));
  const sharedSpinnerGeom = track(buildSpinnerConeGeometry(0.094, 0.21));
  const sharedMotorCoreGeom = track(new THREE.CylinderGeometry(0.092, 0.092, 0.22, 18));

  const ex01FaultGroup = new THREE.Group();
  ex01FaultGroup.visible = false;

  nacelleSpecs.forEach((spec, index) => {
    const mountGroup = new THREE.Group();
    mountGroup.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    aircraftGroup.add(mountGroup);

    // Brushed aluminum horizontal tilt yoke axle + machined collar
    const yoke = new THREE.Mesh(sharedYokeGeom, materials.brushedAluminum);
    yoke.rotation.z = Math.PI / 2;
    mountGroup.add(yoke);

    const pivot = new THREE.Group();
    pivot.name = `tilt-pivot-${spec.name}`;
    mountGroup.add(pivot);
    tiltPivots.push(pivot);

    // Teardrop composite motor cowling
    const cowling = new THREE.Mesh(sharedNacelleGeom, materials.fuselageOuter);
    cowling.castShadow = true;
    pivot.add(cowling);

    // Dark titanium cooling intake ring
    const bezel = new THREE.Mesh(sharedBezelGeom, materials.darkTitanium);
    bezel.rotation.x = Math.PI / 2;
    bezel.position.y = 0.22;
    pivot.add(bezel);

    // Internal copper dual-stator motor core (only shown during X-ray cutaway)
    const motorCore = new THREE.Mesh(sharedMotorCoreGeom, materials.internalPropulsionCore);
    motorCore.position.y = 0.04;
    motorCore.visible = false;
    pivot.add(motorCore);
    internalMotorCores.push(motorCore);

    // Rotating 5-blade scimitar propeller hub
    const hub = new THREE.Group();
    hub.position.y = 0.31;
    pivot.add(hub);
    rotorHubs.push({ hub, direction: spec.spinDir, nacelleIndex: index });

    const collar = new THREE.Mesh(sharedHubCollarGeom, materials.darkTitanium);
    hub.add(collar);

    const spinner = new THREE.Mesh(sharedSpinnerGeom, materials.brushedAluminum);
    spinner.position.y = 0.045;
    hub.add(spinner);

    // 5 individually pitched scimitar airfoil blades
    const bladeGeom = track(buildScimitarBladeGeometry(spec.rotorRadius));
    for (let b = 0; b < 5; b++) {
      const bladeWrap = new THREE.Group();
      bladeWrap.rotation.y = (b / 5) * Math.PI * 2;
      const bladeMesh = new THREE.Mesh(bladeGeom, materials.propellerBlade);
      bladeMesh.scale.z = spec.spinDir;
      bladeMesh.castShadow = true;
      bladeWrap.add(bladeMesh);

      const tipGeom = track(new THREE.BoxGeometry(0.055, 0.008, 0.048));
      const tipStripe = new THREE.Mesh(tipGeom, materials.amberAccent);
      tipStripe.position.set(spec.rotorRadius - 0.045, 0.004, -0.015 * spec.spinDir);
      bladeWrap.add(tipStripe);

      hub.add(bladeWrap);
    }

    const discGeom = track(new THREE.RingGeometry(spec.rotorRadius * 0.24, spec.rotorRadius, 40));
    const discMesh = new THREE.Mesh(discGeom, materials.rotorDisc);
    discMesh.rotation.x = -Math.PI / 2;
    discMesh.position.y = 0.02;
    hub.add(discMesh);

    if (index === 0) {
      const faultRingGeom = track(new THREE.TorusGeometry(spec.rotorRadius * 0.56, 0.028, 12, 36));
      const faultRing = new THREE.Mesh(faultRingGeom, materials.faultHighlight);
      faultRing.rotation.x = Math.PI / 2;
      faultRing.position.y = 0.34;
      const faultShellGeom = track(new THREE.SphereGeometry(0.32, 18, 16));
      const faultShell = new THREE.Mesh(faultShellGeom, materials.faultAura);
      faultShell.position.y = 0.14;
      ex01FaultGroup.add(faultRing, faultShell);
      pivot.add(ex01FaultGroup);
    }
  });

  // =========================================================================
  // 6. RETRACTABLE TRICYCLE LANDING GEAR WITH AERODYNAMIC STRUT FAIRINGS
  //    (Tires ground cleanly at y = -1.08)
  // =========================================================================
  const landingGearGroups: THREE.Group[] = [];
  const wheelTireGeom = track(new THREE.TorusGeometry(0.125, 0.056, 14, 26));
  const wheelRimGeom = track(new THREE.CylinderGeometry(0.092, 0.092, 0.072, 18));

  const gearConfigs: Array<{ pos: [number, number, number]; strutLen: number; isNose: boolean }> = [
    { pos: [0, -0.43, 1.48], strutLen: 0.47, isNose: true },
    { pos: [-0.66, -0.41, -0.22], strutLen: 0.49, isNose: false },
    { pos: [0.66, -0.41, -0.22], strutLen: 0.49, isNose: false },
  ];

  for (const cfg of gearConfigs) {
    const gearPivot = new THREE.Group();
    gearPivot.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);

    // Aerodynamic composite upper strut fairing
    const fairingGeom = track(new THREE.BoxGeometry(0.052, cfg.strutLen * 0.62, 0.12));
    const fairing = new THREE.Mesh(fairingGeom, materials.darkTitanium);
    fairing.position.y = -cfg.strutLen * 0.31;
    gearPivot.add(fairing);

    // Brushed aluminum chrome oleo shock cylinder
    const oleoGeom = track(new THREE.CylinderGeometry(0.022, 0.022, cfg.strutLen * 0.48, 12));
    const oleo = new THREE.Mesh(oleoGeom, materials.brushedAluminum);
    oleo.position.y = -cfg.strutLen * 0.74;
    gearPivot.add(oleo);

    // Wheel fork & beefy rubber tire + machined aluminum hub
    const wheelGroup = new THREE.Group();
    wheelGroup.position.y = -cfg.strutLen - 0.02;
    const tire = new THREE.Mesh(wheelTireGeom, materials.rubberTire);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = true;
    const rim = new THREE.Mesh(wheelRimGeom, materials.brushedAluminum);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(tire, rim);
    gearPivot.add(wheelGroup);

    aircraftGroup.add(gearPivot);
    landingGearGroups.push(gearPivot);
  }

  // =========================================================================
  // 7. INTERNAL 3D ENGINEERING CUTAWAY SUBSYSTEMS
  //    (Hidden cleanly when outer composite is solid; revealed in X-Ray!)
  // =========================================================================
  const internalCutawayRoot = new THREE.Group();
  internalCutawayRoot.name = 'internal-cutaway-root';
  internalCutawayRoot.visible = false;
  aircraftGroup.add(internalCutawayRoot);

  const internalPowerGroup = new THREE.Group();
  const internalPropulsionGroup = new THREE.Group();
  const internalFccGroup = new THREE.Group();
  const internalActuatorsGroup = new THREE.Group();
  const internalStructGroup = new THREE.Group();
  const internalEnvGroup = new THREE.Group();

  // 7A. Power Subsystem: 4 armored HV lithium battery modules + internal amber HV power busbars
  const packGeom = track(new THREE.BoxGeometry(0.3, 0.13, 0.58));
  const packCoords: Array<[number, number, number]> = [
    [-0.21, -0.33, 0.4],
    [0.21, -0.33, 0.4],
    [-0.21, -0.33, -0.3],
    [0.21, -0.33, -0.3],
  ];
  for (const [px, py, pz] of packCoords) {
    const pack = new THREE.Mesh(packGeom, materials.internalPowerPack);
    pack.position.set(px, py, pz);
    internalPowerGroup.add(pack);
  }

  // Internal 3D Amber HV Power Busbars strictly routed INSIDE wing & V-tail airfoils
  const hvBusRoutes: THREE.Vector3[][] = [
    [
      new THREE.Vector3(-0.2, -0.28, 0.06),
      new THREE.Vector3(-0.32, 0.46, 0.1),
      new THREE.Vector3(-1.72, 0.57, 0.08),
      new THREE.Vector3(-4.15, 0.72, -0.14),
    ],
    [
      new THREE.Vector3(0.2, -0.28, 0.06),
      new THREE.Vector3(0.32, 0.46, 0.1),
      new THREE.Vector3(1.72, 0.57, 0.08),
      new THREE.Vector3(4.15, 0.72, -0.14),
    ],
    [
      new THREE.Vector3(-1.72, 0.57, 0.08),
      new THREE.Vector3(-1.72, 0.58, 1.02),
    ],
    [
      new THREE.Vector3(1.72, 0.57, 0.08),
      new THREE.Vector3(1.72, 0.58, 1.02),
    ],
    [
      new THREE.Vector3(-0.14, -0.26, -0.45),
      new THREE.Vector3(-0.08, 0.07, -2.02),
      new THREE.Vector3(-1.82, vTailRootY + vTailDihedral, vTailRootZ - vTailSweep - 0.04),
    ],
    [
      new THREE.Vector3(0.14, -0.26, -0.45),
      new THREE.Vector3(0.08, 0.07, -2.02),
      new THREE.Vector3(1.82, vTailRootY + vTailDihedral, vTailRootZ - vTailSweep - 0.04),
    ],
  ];
  for (const pts of hvBusRoutes) {
    const curve = new THREE.CatmullRomCurve3(pts);
    internalPowerGroup.add(
      new THREE.Mesh(
        track(new THREE.TubeGeometry(curve, 22, 0.024, 8, false)),
        materials.internalPowerBus,
      ),
    );
  }

  // EX-02 Battery Thermal Fault Aura
  const ex02FaultGroup = new THREE.Group();
  ex02FaultGroup.position.set(-0.21, -0.33, -0.3);
  ex02FaultGroup.visible = false;
  ex02FaultGroup.add(
    new THREE.Mesh(track(new THREE.BoxGeometry(0.38, 0.19, 0.68)), materials.faultHighlight),
    new THREE.Mesh(track(new THREE.SphereGeometry(0.55, 18, 16)), materials.faultAura),
  );
  aircraftGroup.add(ex02FaultGroup);

  // 7B. Flight Control & Sensing Subsystem: Triple-redundant FCC/IMU rack + nose pitot + steel-blue buses
  const fccRack = new THREE.Mesh(
    track(new THREE.BoxGeometry(0.4, 0.21, 0.32)),
    materials.internalAvionics,
  );
  fccRack.position.set(0, 0.03, 1.86);
  internalFccGroup.add(fccRack);

  const ctrlBusRoutes: THREE.Vector3[][] = [
    [
      new THREE.Vector3(0, 0.06, 1.8),
      new THREE.Vector3(0, 0.44, 0.26),
      new THREE.Vector3(-1.72, 0.58, 0.2),
      new THREE.Vector3(-4.08, 0.72, -0.08),
    ],
    [
      new THREE.Vector3(0, 0.06, 1.8),
      new THREE.Vector3(0, 0.44, 0.26),
      new THREE.Vector3(1.72, 0.58, 0.2),
      new THREE.Vector3(4.08, 0.72, -0.08),
    ],
    [
      new THREE.Vector3(0, 0.06, 1.8),
      new THREE.Vector3(0, 0.34, -0.3),
      new THREE.Vector3(0, 0.09, -2.02),
    ],
  ];
  for (const pts of ctrlBusRoutes) {
    const curve = new THREE.CatmullRomCurve3(pts);
    internalFccGroup.add(
      new THREE.Mesh(
        track(new THREE.TubeGeometry(curve, 22, 0.017, 8, false)),
        materials.internalControlBus,
      ),
    );
  }

  // Twin exterior nose air-data pitot probes (always visible subtly on nose)
  const pitotGeom = track(new THREE.CylinderGeometry(0.008, 0.014, 0.2, 10));
  for (const side of [-1, 1] as const) {
    const pitot = new THREE.Mesh(pitotGeom, materials.brushedAluminum);
    pitot.rotation.x = Math.PI / 2;
    pitot.position.set(side * 0.14, -0.06, 2.54);
    aircraftGroup.add(pitot);
  }

  // EX-03 Sensor / FCC Fault Halo
  const ex03FaultGroup = new THREE.Group();
  ex03FaultGroup.position.set(0, 0.05, 1.94);
  ex03FaultGroup.visible = false;
  ex03FaultGroup.add(
    new THREE.Mesh(track(new THREE.BoxGeometry(0.48, 0.27, 0.42)), materials.faultHighlight),
    new THREE.Mesh(track(new THREE.SphereGeometry(0.46, 18, 16)), materials.faultAura),
  );
  aircraftGroup.add(ex03FaultGroup);

  // 7C. Structures Subsystem: Full-span carbon main wing spar + fuselage bulkhead ribs
  const sparCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.15, wingMountY + 0.24, wingMountZ - 0.14),
    new THREE.Vector3(0, wingMountY + 0.04, wingMountZ + 0.12),
    new THREE.Vector3(4.15, wingMountY + 0.24, wingMountZ - 0.14),
  ]);
  internalStructGroup.add(
    new THREE.Mesh(
      track(new THREE.TubeGeometry(sparCurve, 26, 0.044, 8, false)),
      materials.internalStructure,
    ),
  );

  for (const bz of [-1.45, -0.7, 0.05, 0.72, 1.38]) {
    const u = (bz - -2.55) / 5.2;
    const p = fuselageProfile(u);
    const ringMesh = new THREE.Mesh(
      track(new THREE.TorusGeometry(Math.max(0.16, p.halfWidth * 0.84), 0.019, 8, 28)),
      materials.internalStructure,
    );
    ringMesh.position.set(0, (p.yTop + p.yBot) * 0.5, bz);
    ringMesh.scale.y = Math.max(
      0.5,
      ((p.yTop - p.yBot) * 0.43) / Math.max(0.16, p.halfWidth * 0.84),
    );
    internalStructGroup.add(ringMesh);
  }

  // 7D. Actuators Subsystem: wing flap servos & tilt actuator modules
  const flapServoGeom = track(new THREE.BoxGeometry(0.14, 0.055, 0.22));
  for (const side of [-1, 1] as const) {
    const servo = new THREE.Mesh(flapServoGeom, materials.internalActuator);
    servo.position.set(side * 2.85, wingMountY + 0.15, wingMountZ - 0.36);
    internalActuatorsGroup.add(servo);
  }

  internalCutawayRoot.add(
    internalPowerGroup,
    internalPropulsionGroup,
    internalFccGroup,
    internalActuatorsGroup,
    internalStructGroup,
  );

  // 7E. Environment Subsystem: Aerodynamic airflow / crosswind streamlines (shown when focusing environment)
  const flowTracks: Array<[number, number]> = [
    [-3.1, 0.92],
    [-1.6, 0.96],
    [0, 1.02],
    [1.6, 0.96],
    [3.1, 0.92],
  ];
  for (const [fx, fy] of flowTracks) {
    const flowCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(fx, fy + 0.18, 3.2),
      new THREE.Vector3(fx, fy + 0.06, 0.8),
      new THREE.Vector3(fx, fy - 0.18, -1.6),
      new THREE.Vector3(fx, fy - 0.34, -3.5),
    ]);
    internalEnvGroup.add(
      new THREE.Mesh(
        track(new THREE.TubeGeometry(flowCurve, 26, 0.015, 6, false)),
        materials.internalAirflow,
      ),
    );
  }
  aircraftGroup.add(internalEnvGroup);

  // =========================================================================
  // 8. SEVEN CONCENTRIC DEFENSE-IN-DEPTH TELEMETRY RINGS (Act IV)
  // =========================================================================
  const defenseRings: THREE.LineLoop[] = [];
  const defenseGroup = new THREE.Group();
  defenseGroup.position.set(0, 0.15, 0);
  for (let i = 0; i < 7; i++) {
    const radius = 3.25 + i * 0.36;
    const pts: THREE.Vector3[] = [];
    const segs = 96;
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const ringGeom = track(new THREE.BufferGeometry().setFromPoints(pts));
    const ringMat = new THREE.LineBasicMaterial({
      color: i % 2 === 0 ? 0xd99a45 : 0x638db0,
      transparent: true,
      opacity: 0,
    });
    const loop = new THREE.LineLoop(ringGeom, ringMat);
    loop.rotation.x = (i % 3 === 0 ? 0.08 : i % 3 === 1 ? -0.06 : 0.03) * (1 + i * 0.08);
    loop.rotation.z = i % 2 === 0 ? 0.05 : -0.05;
    defenseGroup.add(loop);
    defenseRings.push(loop);
  }
  aircraftGroup.add(defenseGroup);

  // =========================================================================
  // 9. GROUNDED STUDIO HANGAR FLOOR + RADIAL CONTACT SHADOW + DATUM RING
  // =========================================================================
  const floorGroup = new THREE.Group();
  const floorY = -1.08;

  const studioFloorMesh = new THREE.Mesh(
    track(new THREE.CircleGeometry(30, 48)),
    materials.studioFloor,
  );
  studioFloorMesh.rotation.x = -Math.PI / 2;
  studioFloorMesh.position.y = floorY;
  studioFloorMesh.receiveShadow = true;
  floorGroup.add(studioFloorMesh);

  const contactMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(9.2, 7.8)),
    materials.contactShadow,
  );
  contactMesh.rotation.x = -Math.PI / 2;
  contactMesh.position.set(0, floorY + 0.015, 0);
  floorGroup.add(contactMesh);

  const deckRingMesh = new THREE.Mesh(
    track(new THREE.PlaneGeometry(12.2, 12.2)),
    materials.deckRing,
  );
  deckRingMesh.rotation.x = -Math.PI / 2;
  deckRingMesh.position.set(0, floorY + 0.025, 0);
  floorGroup.add(deckRingMesh);

  root.add(floorGroup);

  return {
    root,
    aircraftGroup,
    tiltPivots,
    rotorHubs,
    landingGearGroups,
    internalCutawayRoot,
    internalMotorCores,
    subsystemGroups: {
      propulsion: internalPropulsionGroup,
      power: internalPowerGroup,
      'flight-control': internalFccGroup,
      actuators: internalActuatorsGroup,
      structures: internalStructGroup,
      environment: internalEnvGroup,
    },
    faultIndicators: {
      ex01Nacelle: ex01FaultGroup,
      ex02Battery: ex02FaultGroup,
      ex03Avionics: ex03FaultGroup,
    },
    defenseRings,
    floorGroup,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      defenseRings.forEach((loop) => {
        (loop.material as THREE.Material).dispose();
      });
    },
  };
}
