# Architectural & Engineering Decisions (`DECISIONS.md`)

## D-01: 100% Static Offline Runtime (Zero Runtime AI / Zero API Keys)
- **Decision**: All application data, safety analyses, SVG technical diagrams, and offline Markdown citation exports execute purely in the browser without calling `@google/genai`, Gemini APIs, external font CDNs, map APIs, or cloud databases.
- **Rationale**: Satisfies P0 zero-billing, privacy/security, offline reproducibility, and GitHub Pages static deployment requirements.
- **Trade-off**: System CJK/Latin typography stacks are used instead of remote Google Fonts so zero third-party network requests occur.

## D-02: Layered 2D Precision SVG over Unverified 3D WebGL Primitives (Architecture C+D Baseline)
- **Decision**: Act 0 (`AircraftSilhouetteSvg`), Act I (`FlightProfileSvg`), Act II (`MachineAnatomySvg`), and Act III (`PropagationGraphSvg` + STPA control loop) are implemented as bespoke, data-driven SVG technical illustrations + semantic DOM controls, omitting a crude Three.js primitive box/cylinder placeholder.
- **Rationale**: Per A2/C guidelines, in the absence of a verified, legally licensed high-detail eVTOL CAD mesh, high-precision layered 2D technical dissection avoids misleading viewers about proprietary Joby S4 internal geometry while guaranteeing 60fps desktop smoothness, zero WebGL context loss, zero memory leaks, and full mobile compatibility.

## D-03: Centralized Single-Source-of-Truth State Contract (`src/app/store.ts`)
- **Decision**: All business state (`chapter`, `flightPhase`, `selectedSubsystem`, `selectedScenario`, `activeFaultNode`, `selectedMitigation`, `activeMethodTab`, `openPanel`, `motionMode`, `qualityMode`, `soundEnabled`) is managed through one pure `appReducer`.
- **Rationale**: Eliminates animation/state races, guarantees idempotent rapid chapter switching, supports browser Back/Forward via hash history (`#act-0` .. `#act-5`), handles invalid routes safely with a non-blocking recovery banner, and allows deterministic `node:test` unit testing.

## D-04: Portable Relative Base Path for GitHub Pages (`vite.config.ts`)
- **Decision**: Configured `base: process.env.VITE_BASE_PATH || './'` in `vite.config.ts`, kept root `/index.html`, and added `.github/workflows/deploy-pages.yml` with a build-time `dist/` secret/API scanner.
- **Rationale**: Ensures the exact same build works both locally (`http://localhost:3000/`) and under any GitHub Pages repository subpath (`https://<username>.github.io/<repo>/`) without broken asset URLs.

## D-05: Continuous Scroll-Driven Cinema Architecture & Hybrid 3D/2D Engine
- **Decision**: Upgraded the experience from discrete tab switching into a seamless, continuous scroll-driven film reel (Acts 0 through V) synchronized with a persistent Three.js 3D eVTOL cinema stage (`EvtolCinemaStage.tsx`).
- **3D Modeling & Choreography**:
  - Procedural PBR 6-tilt-rotor aircraft (`[D]` conceptual teaching model) with lofted aerodynamic fuselage, flush canopy, 5-seat cabin interior, cambered NACA wings, V-tail stabilizers, 6 articulated tilt-rotor nacelles (0°–88° tilt range), 5-blade scimitar rotors with spin velocity mapping, and retractable tricycle landing gear.
  - Subsystem X-ray cutaway with smooth opacity transitions revealing dual battery packs, amber high-voltage busbars, triple FCC avionics rack, steel-blue control buses, and wing carbon spar.
  - Act III fault auras (pulsing red/amber point lights and highlight rings) and Act IV 7 concentric defense rings (L01–L07).
  - Act V dark-to-golden-dawn studio lighting transformation.
- **Resilience & Fallback**:
  - Single-mount WebGL canvas with persistent PMREM environment and explicit texture/geometry `dispose()` cleanup.
  - Automatic detection of software-rendered WebGL or low-spec hardware (`isSoftwareGl`).
  - Seamless fallback to high-precision 2D SVG technical schematics (`AircraftSilhouetteSvg`, `FlightProfileSvg`, `MachineAnatomySvg`, `PropagationGraphSvg`) when `qualityMode === 'lite'` or WebGL is unsupported.

## D-06: Dependency Hardening & Runtime Stability
- **Decision**:
  1. Resolved `esbuild` peer dependency conflict by pinning `^0.28.0` matching `vite@8.3.8`.
  2. Implemented cross-platform Node cleanup in `npm run clean`.
  3. Eliminated React 19 "Cannot update a component while rendering a different component" warnings during continuous scroll by using `useRef` thresholding and decoupling parent state updates from local `setState` updaters.
  4. Added identity guards in `appReducer` to eliminate redundant renders during rapid scroll.
  5. Gated internal cutaway component rendering with `isXrayActive` to prevent mesh bleeding during solid composite exterior inspection.
