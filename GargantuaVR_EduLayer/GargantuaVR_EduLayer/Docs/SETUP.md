# SETUP
1. Open the existing Gargantua VR project (Unity 2022.3+). Install Meta XR Core SDK, TextMeshPro, Newtonsoft JSON.
2. Copy `Assets/GargantuaEdu` into the project.
3. Implement `IBlackHoleRendererAdapter` against the existing renderer (map parameter ids in `Resources/GargantuaEdu/parameters.json` to shader properties).
4. Create scene objects: LocalizationService, LabelManager, NarrationPlayer(+AudioSource), SubtitleDisplay(+TMP, CanvasGroup+Image), QuizController, LessonSequencer, ParameterPanelModel, ComparisonModeController, ComfortSettings, TeacherModeController, AccessibilitySettings. Assign references and the adapter.
5. Build world-space UI (panels, buttons) calling the public methods; use the existing Meta XR interaction rig.
6. Android build: Switch platform to Android, IL2CPP, ARM64, Vulkan or OpenGLES3 per existing project, run Meta XR project setup tool, build and sideload with `adb install`.
7. Add narration clips to `Resources/GargantuaEdu/Audio/en/` (keys in en.json `audioKey`).
