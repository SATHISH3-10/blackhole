# Gargantua VR: Input & Interaction Design

## 1. Touch Controllers (OVRInput)
* **Left Thumbstick**:
  * *Horizontal*: Orbital Azimuth rotation (Snap turn by default; Smooth turn optional).
  * *Vertical*: Distance Zoom ($r_{\text{obs}}$ closer or farther from the black hole).
* **Right Thumbstick**:
  * *Vertical*: Polar Inclination ($i = 0^\circ \dots 180^\circ$).
* **Primary / Secondary Triggers**:
  * Raycast pointer selection on UI buttons and holographic sliders.
* **Primary / Secondary Grips**:
  * Grab and physically rotate the 3D black hole hologram.
* **Button X / Button A**:
  * Toggle floating holographic control panel in front of user.
* **Button B / Button Y**:
  * Recenter headset tracking / Return to safe observation distance ($30\,r_g$).
* **Thumbstick Click**:
  * Toggle between Snap Turn ($45^\circ$) and Smooth Turn mode.

## 2. Hand Tracking (Meta Interaction SDK)
* **Pinch Gesture (Index + Thumb)**: Select UI elements, pinch sliders to adjust values.
* **Palm-Up Facing Head**: Automatically summons the parameter panel near the left wrist.
* **Two-Hand Pinch & Spread**: Scale the 3D educational black hole hologram up or down.

## 3. Eye Tracking & Gaze Selection
* **Eye-Tracking Mode (Quest Pro)**: Real-time gaze raycast using hardware sensors.
* **Center-Screen Fallback (Quest 2 / 3 / 3S)**: Head-orientation reticle at center of view.
* **Dwell Selection**: 1.5-second dwell with visual radial progress fill to confirm selections without accidental clicks.
* **Privacy Guarantee**: Eye-tracking data is processed ephemerally in RAM and is **never** recorded, stored, or transmitted.
