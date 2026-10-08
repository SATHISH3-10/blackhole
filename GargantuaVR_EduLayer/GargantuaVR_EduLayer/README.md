# Gargantua VR: Educational Layer (source package)

**Status: standalone source package. The original "Gargantua VR: Immersive Black Hole Explorer" Unity project was never provided, so nothing here has been verified against its renderer, shaders or XR rig, and nothing has been built or tested on a Quest device.**

## Purpose
Adds a scientifically labeled educational layer to a Kerr black-hole VR visualization: 18-lesson guided mode (~10 min), quiz, teacher mode, label system, parameter panel data model, model comparison, accessibility, comfort and localization.

## Social-impact objective
Make strong-field gravity understandable and honest: every effect is labeled physical, approximation or artistic, so learners are not misled by film-style imagery.

## Target devices
Meta Quest 2, 3, 3S (Quest Pro optional). Not tested.

## Unity version / packages
Unity 2022.3 LTS or newer (assumed). Meta XR Core SDK (OVRManager), TextMeshPro, Newtonsoft JSON (`com.unity.nuget.newtonsoft-json`).

## Setup and build
See SETUP.md. Controls: CONTROLS.md. Limitations: LIMITATIONS.md.

## Current status
Done: data (en.json, parameters.json), 14 C# scripts, 13 docs. Not done: renderer adapter implementation, UI prefabs, narration audio, device tests, performance profiling.

## Next steps
See ROADMAP.md.

> The visual effect is an educational approximation unless a full relativistic renderer has actually been implemented.
