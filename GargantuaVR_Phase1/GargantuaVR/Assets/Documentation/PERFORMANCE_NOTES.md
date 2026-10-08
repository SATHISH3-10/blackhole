# Gargantua VR: Performance & Optimization Notes

## Target Performance Budgets
* **Meta Quest 2**: 72 FPS (13.88 ms frame budget).
* **Meta Quest 3 / 3S**: 90 FPS (11.11 ms frame budget).
* **Meta Quest Pro**: 90 FPS with eye-tracking gaze enabled.

## Optimization Strategies
1. **Adaptive Geodesic Step Sizing**:
   * Steps scale dynamically with gravitational gradient: $dt = \text{clamp}(0.08 \cdot r, 0.03, 6.0)$.
   * Near horizon ($r < 3 r_g$), fine steps capture intense light deflection.
   * In weak field ($r > 15 r_g$), large steps leap forward to minimize ALU cycles.
2. **PerformanceMonitor Dynamic Scaling**:
   * Automatically monitors frame time via `OVRPlugin` / Unity stats.
   * Reduces `raymarchSteps` from 80 down to 48 if frame drops occur, ensuring zero nausea/judder.
3. **Single-Pass Instanced Stereo**:
   * Both eye views rendered in a single draw call to minimize CPU overhead.
4. **Procedural Geometry Caching**:
   * Space-suit body and overlay line renderers generated once and transformed locally.
