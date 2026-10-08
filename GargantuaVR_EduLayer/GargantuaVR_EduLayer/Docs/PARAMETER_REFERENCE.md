# PARAMETER REFERENCE

Every control, its range, and why. Classification: PHYSICAL = calculated from a GR formula; APPROXIMATION = physically motivated; ARTISTIC = visual choice.

## 1. Mass
- Symbol: M
- Unit: solar masses (Msun)
- Minimum: 1
- Maximum: 10000000000.0
- Default: 10000000.0
- Scientific meaning: Total mass-energy of the hole; sets the length scale GM/c^2.
- Visual effect: Scales all radii; in VR the scene is normalized to units of GM/c^2 so appearance is mass-independent.
- Classification: PHYSICAL
- Limitations: Visual size is normalized; mass changes labels and physical scales (km, light-seconds), not apparent shape.
- Why these numbers: Range spans stellar-mass to supermassive holes; default 1e7 is a representative supermassive value, not a specific object.

## 2. Dimensionless spin
- Symbol: a*
- Unit: dimensionless
- Minimum: 0
- Maximum: 0.998
- Default: 0.9
- Scientific meaning: a* = a/M = cJ/(GM^2). 0 = Schwarzschild.
- Visual effect: Shrinks horizon, shifts disk inner edge inward (prograde), shifts shadow off-center.
- Classification: APPROXIMATION
- Limitations: Shadow shape in the renderer is approximated unless geodesics are integrated.
- Why these numbers: Upper bound 0.998 is the Thorne limit for disk accretion; a* must stay < 1.

## 3. Observer distance
- Symbol: r_obs
- Unit: GM/c^2
- Minimum: 10
- Maximum: 1000
- Default: 50
- Scientific meaning: Radial distance of observer from the hole.
- Visual effect: Changes apparent size of shadow and disk.
- Classification: PHYSICAL
- Limitations: Large-distance approximation; Doppler/beaming computed for the disk, not the observer's motion.
- Why these numbers: Min 10 keeps the observer well outside the photon region for comfort and safety.

## 4. Observer inclination
- Symbol: i_obs
- Unit: degrees
- Minimum: 0
- Maximum: 90
- Default: 75
- Scientific meaning: Angle between observer line of sight and the spin axis.
- Visual effect: Face-on (0) to edge-on (90); controls disk ellipticity and asymmetry.
- Classification: PHYSICAL
- Limitations: Geometry only; no free-falling observer.
- Why these numbers: 75 degrees gives a pronounced far-side lensing arc for teaching.

## 5. Disk inclination
- Symbol: i_disk
- Unit: degrees
- Minimum: 0
- Maximum: 90
- Default: 0
- Scientific meaning: Tilt of the disk plane relative to the spin axis.
- Visual effect: Tilts disk; nonzero values are NOT in equilibrium in real Kerr (Bardeen-Petterson alignment).
- Classification: ARTISTIC
- Limitations: Educational only: tilted thin disks would warp/align near the hole.
- Why these numbers: Default 0 = equatorial disk, the standard model.

## 6. Inner disk radius
- Symbol: r_in
- Unit: GM/c^2
- Minimum: 1
- Maximum: 20
- Default: 0
- Scientific meaning: Inner edge of emitting disk. 0 means 'use ISCO for current spin'.
- Visual effect: Where the disk visibly ends.
- Classification: APPROXIMATION
- Limitations: ISCO is exact for Kerr equatorial circular orbits; emission cutoff there is a model assumption.
- Why these numbers: Default tied to ISCO (Bardeen-Press-Teukolsky 1972).

## 7. Outer disk radius
- Symbol: r_out
- Unit: GM/c^2
- Minimum: 10
- Maximum: 200
- Default: 30
- Scientific meaning: Outer edge of the rendered disk.
- Visual effect: Disk extent.
- Classification: ARTISTIC
- Limitations: Arbitrary truncation for rendering.
- Why these numbers: 30 keeps the disk inside the view at default distance.

## 8. Disk brightness
- Symbol: B
- Unit: relative
- Minimum: 0
- Maximum: 2
- Default: 1
- Scientific meaning: Overall emission scale.
- Visual effect: Intensity multiplier.
- Classification: ARTISTIC
- Limitations: Not calibrated radiance.
- Why these numbers: Artistic exposure control.

## 9. Temperature visualization
- Symbol: T
- Unit: relative / false color
- Minimum: 0
- Maximum: 1
- Default: 1
- Scientific meaning: Radial temperature trend T ~ r^(-3/4) (thin disk).
- Visual effect: Hot inner region, cooler outer region.
- Classification: APPROXIMATION
- Limitations: Color is false color, not literal photon color.
- Why these numbers: Power law from Shakura-Sunyaev thin-disk scaling far from the inner edge.

## 10. Lensing strength
- Symbol: -
- Unit: fraction of GR
- Minimum: 0
- Maximum: 1
- Default: 1
- Scientific meaning: Scales light-bending. 1 = full model deflection; <1 is counterfactual.
- Visual effect: Distortion of disk and stars.
- Classification: APPROXIMATION
- Limitations: Values below 1 are not physical; for comparison only. Full value uses an approximate deflection function unless geodesics are integrated.
- Why these numbers: Slider exists to demonstrate absence of lensing (Newtonian-like).

## 11. Star density
- Symbol: -
- Unit: stars per steradian (relative)
- Minimum: 0
- Maximum: 1
- Default: 0.5
- Scientific meaning: Background starfield density.
- Visual effect: More/fewer background stars to show distortion.
- Classification: ARTISTIC
- Limitations: Star positions are procedural, not a catalog.
- Why these numbers: Purely a clarity control.

## 12. Doppler
- Symbol: delta
- Unit: toggle / 0-1
- Minimum: 0
- Maximum: 1
- Default: 1
- Scientific meaning: Frequency shift from emitter motion along line of sight.
- Visual effect: Approaching side shifted blue and brighter; receding red and dimmer.
- Classification: APPROXIMATION
- Limitations: Uses disk orbital speed; no full transfer function.
- Why these numbers: Shown separately from beaming and redshift.

## 13. Redshift
- Symbol: g
- Unit: toggle / 0-1
- Minimum: 0
- Maximum: 1
- Default: 1
- Scientific meaning: Gravitational redshift sqrt(1 - r_s/r) for static emitters (Kerr: approximated).
- Visual effect: Dimmer, redder light near the hole.
- Classification: APPROXIMATION
- Limitations: Static-observer formula; full Kerr factor needs orbital 4-velocity.
- Why these numbers: Labeled 'observed-frequency visualization'.

## 14. Frame dragging
- Symbol: omega
- Unit: toggle / 0-1
- Minimum: 0
- Maximum: 1
- Default: 0
- Scientific meaning: Optional visualization of dragging of inertial frames.
- Visual effect: Animated markers co-rotating near the hole.
- Classification: ARTISTIC
- Limitations: Analogy visualization only; space does not flow like water.
- Why these numbers: Off by default to avoid misleading impression.

## 15. Time dilation
- Symbol: dtau/dt
- Unit: toggle / 0-1
- Minimum: 0
- Maximum: 1
- Default: 0
- Scientific meaning: Conceptual clock-rate comparison for a static observer at r.
- Visual effect: Paired clocks tick at different rates.
- Classification: ARTISTIC
- Limitations: Conceptual; time does not 'stop' at the horizon for an infalling observer.
- Why these numbers: Static-observer formula sqrt(1 - r_s/r) is exact only outside horizon for static observers.

## 16. Photon region
- Symbol: -
- Unit: toggle
- Minimum: 0
- Maximum: 1
- Default: 1
- Scientific meaning: Region of unstable photon orbits (Kerr: not one sphere).
- Visual effect: Ring-like overlay near the shadow edge.
- Classification: APPROXIMATION
- Limitations: Drawn as a ring approximation, not the exact Kerr photon region.
- Why these numbers: Labeled 'photon-ring-like approximation'.

## 17. Shadow
- Symbol: -
- Unit: toggle
- Minimum: 0
- Maximum: 1
- Default: 1
- Scientific meaning: Apparent dark region from photon capture.
- Visual effect: Highlights the shadow outline.
- Classification: APPROXIMATION
- Limitations: Outline is approximate unless computed from geodesics.
- Why these numbers: Distinct from event horizon.

## 18. Event horizon
- Symbol: r_+
- Unit: GM/c^2
- Minimum: 0
- Maximum: 1
- Default: 1
- Scientific meaning: Causal boundary; r_+ = GM/c^2 (1 + sqrt(1 - a*^2)).
- Visual effect: Schematic sphere/ellipse overlay.
- Classification: PHYSICAL
- Limitations: Boyer-Lindquist radius; coordinate-dependent depiction; schematic only.
- Why these numbers: Formula is exact for Kerr.
