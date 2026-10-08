# Gargantua VR: Immersive Black Hole Explorer

**Gargantua VR** is an immersive, 360-degree educational virtual reality experience for Meta Quest headsets inspired by the visual beauty of supermassive Kerr black holes. The user floats in deep space within a virtual space suit to explore and understand the physics of General Relativity, black hole shadows, accretion disks, gravitational lensing, and time dilation.

---

## 🎯 Purpose & Social-Impact Objective
Make strong-field General Relativity and astrophysics accessible, intuitive, and honest:
* Teach students and the general public how extreme gravity bends light paths into dual-arc accretion images.
* Clearly differentiate the immaterial **event horizon** from the optical **shadow**.
* Categorize all visual features into **Physically Modeled**, **Approximated**, or **Purely Visual** to prevent scientific misconceptions.

---

## 🥽 Target Devices
* **Meta Quest 2**
* **Meta Quest 3 / Quest 3S**
* **Meta Quest Pro** (supports eye-tracking features)

---

## 🛠️ Unity Version & Required Packages
* **Unity Version**: 2022.3 LTS or newer.
* **Render Pipeline**: Universal Render Pipeline (URP).
* **Meta XR Core SDK**: `com.meta.xr.sdk.core` (v60+).
* **Interaction SDK**: `com.meta.xr.sdk.interaction`.
* **TextMeshPro**: Built-in UPM package.

---

## 🚀 Quick Setup & Scene Generation
1. Open the project in Unity 2022.3+ LTS.
2. In the top menu, select: **`Gargantua > Create Main Scene`**.
3. The scene builder will generate all materials, configuration assets, and the complete scene hierarchy at `Assets/Scenes/GargantuaMain.unity`.
4. Press **Play** or build to Meta Quest!

---

## 🎮 Controls Overview
| Input | Action |
|---|---|
| **Left Thumbstick (X / Y)** | Horizontal orbit azimuth / distance zoom |
| **Right Thumbstick (Y)** | Polar inclination adjustment |
| **Button X / Button A** | Open / close floating parameter control panel |
| **Button B / Button Y** | Recenter view pose / Return to safe distance |
| **Hand Tracking (Pinch)** | Select UI buttons and grab holographic model |
| **Hand Tracking (Open Palm)**| Open floating parameter menu near wrist |
| **Eye Gaze / Center Fallback**| Reticle targeting with 1.5s dwell selection |

---

## ⚠️ Known Limitations
* Geodesic raymarching utilizes an adaptive step budget ($64\text{--}128$ steps) tailored for mobile VR 72/90 FPS.
* The accretion disk uses a volumetric scale height envelope rather than a full Magnetohydrodynamic (MHD) simulation.
* Static observer clock rates reflect gravitational time dilation outside the ergosphere.

---

## 📋 Documentation Index
* [`SETUP.md`](SETUP.md) — Detailed build & deployment guide.
* [`ARCHITECTURE.md`](ARCHITECTURE.md) — Modular C# system architecture.
* [`CONTROLS.md`](CONTROLS.md) — Input mapping and interaction design.
* [`PHYSICS_NOTES.md`](PHYSICS_NOTES.md) — Exact Kerr formulas and relativistic math.
* [`PERFORMANCE_NOTES.md`](PERFORMANCE_NOTES.md) — Quest optimization and profiling guidelines.
* [`TESTING_CHECKLIST.md`](TESTING_CHECKLIST.md) — QA test matrix across all Quest headsets.
* [`ROADMAP.md`](ROADMAP.md) — Future milestone development phases.
* [`ASSET_LICENSES.md`](ASSET_LICENSES.md) — Open-source and procedural asset credits.
* [`LIMITATIONS.md`](LIMITATIONS.md) — Mathematical and computational constraints.
* [`SCIENTIFIC_SPECIFICATION.md`](SCIENTIFIC_SPECIFICATION.md) — Comprehensive 8-point physics specification.
