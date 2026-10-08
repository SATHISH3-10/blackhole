# Gargantua VR - setup (Phase 1)
1. Unity 6 (or 2022.3 LTS+) with Android Build Support. Create/convert the project to **URP**; set Color Space = Linear.
2. Copy `Assets/` into the project. Window > Package Manager: install **Meta XR Core SDK** (`com.meta.xr.sdk.core`) and Unity **Test Framework**. Verify current package IDs/versions in Meta's docs.
3. Meta > Tools > Project Setup Tool: apply recommended fixes. Android, IL2CPP, ARM64, Vulkan, OpenXR/Oculus plugin as per Meta's guide.
4. Project Settings > Graphics/URP asset: enable HDR and keep MSAA at 2x-4x. Add Bloom in the active Volume. Depth and opaque textures are not required.
5. In the active URP Renderer Data, add **GargantuaLensingFeature**. Assign `Assets/Materials/GargantuaLensing.mat` to Lens Material and leave it at **After Rendering Transparents**. This pass produces the black horizon, background warp, and folded far-side disk halo.
5. Meta XR Project Config: enable controller + hand tracking support (hand tracking is not consumed by code until Phase 2).
6. Menu **Gargantua > Create Main Scene**, open `Assets/Scenes/GargantuaMain.unity`, add it to Build Settings, build to Quest.
7. Run EditMode tests (Window > General > Test Runner) for KerrMath.
Not compiled or run in this sandbox (no Unity available): expect to fix small API-name mismatches against your SDK version.
