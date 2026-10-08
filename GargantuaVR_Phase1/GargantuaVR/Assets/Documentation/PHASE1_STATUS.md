# PHASE 1 STATUS
## 1 Completed
Physics module (Kerr horizon, ergosphere, photon orbits, ISCO, ZAMO omega, clock rate, shadow size), central config asset, per-pixel Schwarzschild geodesic ray-marched sky + thin disk + stars, Doppler/redshift/beaming approximation, Kerr-aware overlays, frame-dragging markers, observer placement, controller input, seated/standing/recenter, snap/smooth turn, procedural suit body with arm IK, adaptive performance, settings persistence, one-click scene builder, EditMode tests.
## 2 Files
Scripts: Physics/KerrMath.cs, BlackHole/{BlackHolePhysicsConfig, BlackHoleController, ObserverController, BlackHoleOverlayController, FrameDraggingController}.cs, Body/{SpaceSuitBodyController, ProceduralMeshes}.cs, Comfort/{ComfortSettings, RecenterManager}.cs, Input/XRInputRouter.cs, Core/{AppBootstrap, PerformanceMonitor, SaveSettingsController}.cs. Shader: GargantuaLensedSpace.shader. Editor: GargantuaSceneBuilder.cs. Tests: KerrMathTests.cs.
## 3 What should run
After scene build: floating view, lensed disk with arcs above/below the shadow, stars, body, stick control, overlays via X.
## 4 Mocked / not real
Nothing is faked, but: scripts merged (see below), UI/hand/gaze absent.
## 5 Bugs / limitations (known)
- NEVER compiled or run in Unity or on a headset. Only the KerrMath formulas were numerically checked (Python).
- Ray tracer is Schwarzschild only: no Kerr shadow shape, no frame-dragged light, no ISCO-region dynamics.
- Thin disk only; disk thickness, self-illumination lensing, scattering absent.
- Coarse integration: photon ring/higher-order images are approximate; Quest 2 performance unmeasured.
- Step/performance constants, noise scales, key-light values are untuned guesses.
- Tilted disk: ISCO still uses equatorial formula.
- No vignette, fade, teleport/waypoints, pause, audio, subtitles, narration yet.
- Gloves are rigid; no ISDK hand skeleton. Device detection via deviceModel string is a heuristic.
- Runtime edits write into the ScriptableObject assets while in the Editor.
## 6 Test steps
EditMode tests; build to Quest; check sticks, A/B/X/Y, left grip+X, recenter, overlays; profile with OVR Metrics Tool; compare mass/spin/distance/inclination changes (edit the config asset live).
## 7 Next steps (NOT done, all still required by the brief)
1 Safety notice + seated/standing start screen. 2 Floating control panel with all listed controls + 10 presets (Interaction SDK PointableCanvas). 3 Hand tracking (pinch, grab/rotate hologram, palm menu, two-hand scale) via ISDK. 4 Gaze: eye tracking (permission, no storage), reticle, dwell, center fallback, disable option. 5 Remappable controls. 6 Comfort: vignette, fade transitions, teleport/waypoints, pause. 7 Labels in-world with PC/PM/AR tags. 8 Time-dilation display. 9 Audio/subtitles/narration. 10 Kerr ray tracing (Carter-constant geodesics or precomputed lookup), disk thickness, optional high-quality mode. 11 Separate Doppler/Redshift/Starfield/Lensing controllers if desired (currently in shader + BlackHoleController). 12 Device testing matrix (Quest 2/3/3S/Pro, left-handed, tracking loss).
## 8 Scientific accuracy status
Closed forms exact; light bending exact for Schwarzschild up to step error; Kerr effects in rendering are limited to ISCO and shear; Doppler/redshift/temperature are approximations. Not a full GR renderer.
