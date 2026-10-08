# Gargantua VR: QA Testing Checklist

## Hardware Verification Matrix
- [ ] **Meta Quest 2**: Verify stable 72 FPS with default 64-step raymarching.
- [ ] **Meta Quest 3 / 3S**: Verify 90 FPS with 80-step raymarching and volumetric disk enabled.
- [ ] **Meta Quest Pro**: Verify hardware eye-tracking permissions and gaze reticle tracking.

## Interaction & Input
- [ ] **Touch Controllers**: Left stick zooms/turns; right stick adjusts inclination; X/A toggles menu; B recenters.
- [ ] **Hand Tracking**: Pinch gesture selects buttons; palm-up summons menu at wrist; two-hand pinch scales model.
- [ ] **Gaze Fallback**: Center-screen reticle dwells for 1.5s to trigger UI on non-eye-tracking headsets.
- [ ] **Left-Handed Mode**: Verify UI and palm menu trigger correctly when swapped.

## Comfort & Motion Safety
- [ ] **Seated / Standing Mode**: Verify eye height and torso offsets adjust correctly upon selection.
- [ ] **Recenter**: Verify instantaneous recenter orientation without disorientation.
- [ ] **No Uncommanded Camera Pull**: Confirm camera never falls involuntarily into the event horizon.
- [ ] **Comfort Vignette**: Confirm smooth darkening around peripheral vision during rapid movement.

## Educational System
- [ ] **11-Step Guided Sequence**: Verify all subtitles, camera tweens, and overlay toggles execute sequentially.
- [ ] **Interactive Quiz**: Test question feedback, correct answer progression, and completion modal.
- [ ] **6 Presets**: Verify Distant, Closeup, Lensing, Photon Orbits, Event Horizon, and Scientific/Artistic presets.
