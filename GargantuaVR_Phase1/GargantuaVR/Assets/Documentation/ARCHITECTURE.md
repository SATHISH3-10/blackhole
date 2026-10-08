# Gargantua VR: System Architecture

The application is structured into decoupled, single-responsibility C# modules:

```
Assets/Scripts/
├── Physics/
│   └── KerrMath.cs                 # Pure C# General Relativity Kerr/Schwarzschild closed forms
├── BlackHole/
│   ├── BlackHolePhysicsConfig.cs   # Centralized ScriptableObject configuration
│   ├── BlackHoleController.cs      # Owns raymarching sphere & pushes uniforms to shader
│   ├── ObserverController.cs       # Calculates static observer orbits & coordinates
│   ├── BlackHoleOverlayController.cs# Wireframe overlays (Horizon, Ergosphere, ISCO, Shadow)
│   └── FrameDraggingController.cs  # ZAMO marker particles visualizing spacetime swirl
├── Body/
│   ├── SpaceSuitBodyController.cs  # Procedural astronaut space suit with arm IK
│   └── ProceduralMeshes.cs         # Generates suit torso, limbs, helmet rim, and boots
├── Comfort/
│   ├── ComfortSettings.cs          # Vignette, snap turning, seated/standing offsets
│   └── RecenterManager.cs          # Recenter view and reset orientation
├── Input/
│   └── XRInputRouter.cs            # Routes controller input to observer & UI
├── Interaction/
│   ├── ControllerInputController.cs# OVRInput buttons, thumbsticks & remapping
│   ├── HandInteractionController.cs# ISDK hand gestures (pinch, palm menu, hologram zoom)
│   └── GazeInteractionController.cs# Eye-tracking dwell selector & center-screen fallback
├── UI/
│   ├── ParameterPanelController.cs # Floating holographic UI panel & 6 presets
│   └── SafetyNoticeController.cs   # Startup safety & seated/standing modal
├── Education/
│   ├── EducationSequenceController.cs # 11-step guided tour with subtitles & camera tweening
│   └── QuizController.cs           # In-VR interactive knowledge check
├── Audio/
│   └── AudioNarrationController.cs # Voice narration, ambient drone, and volume mixer
└── Core/
    ├── AppBootstrap.cs             # Application lifecycle, camera initialization
    ├── PerformanceMonitor.cs       # Dynamic step scaler for Quest 72/90 FPS
    └── SaveSettingsController.cs   # PlayerPrefs persistence for user comfort
```
