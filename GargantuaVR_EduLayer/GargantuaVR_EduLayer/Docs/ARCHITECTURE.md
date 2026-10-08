# ARCHITECTURE
Data-driven layer over an existing renderer.
- `LocalizationService` loads `Resources/GargantuaEdu/Localization/<lang>.json` (labels, lessons, quiz, comparison, UI strings).
- `IBlackHoleRendererAdapter` is the only coupling to the renderer (parameters, overlays, render mode, camera focus).
- `LessonSequencer` -> `LabelManager`, `NarrationPlayer`, `SubtitleDisplay`, `QuizController`.
- `TeacherModeController` fronts sequencer, labels, parameters, comparison, quiz, comfort.
- `ParameterPanelModel` reads `parameters.json`, clamps (spin < 1), forwards to adapter.
- `AccessibilitySettings` (local PlayerPrefs) + `ComfortSettings` (vignette, fade, safe distance, recenter).
- `PhysicsFormulas` holds exact closed-form relations used for labels/overlays/readouts.
Adding a language: copy en.json to `<lang>.json` and translate values only.
