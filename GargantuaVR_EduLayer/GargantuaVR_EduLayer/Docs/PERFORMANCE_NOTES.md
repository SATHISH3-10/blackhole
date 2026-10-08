# PERFORMANCE NOTES
**No profiling was performed; the renderer was not available.** Checklist to run on device (OVR Metrics, RenderDoc, Unity Profiler):
- Target 72 fps Quest 2, 90 fps Quest 3/3S; fixed foveated rendering on; MSAA 2x or off.
- Lensing shader: cap ray-march steps (start 32-64), half-resolution render texture option, no per-pixel branching explosion.
- Post: avoid full-res bloom; use mobile bloom or none. Particle count under 5k. Textures ASTC, max 2048.
- Educational UI: single canvas, TMP atlas static, avoid per-frame string allocation.
- If quality is reduced: keep labels and classification unchanged, document the change here.
