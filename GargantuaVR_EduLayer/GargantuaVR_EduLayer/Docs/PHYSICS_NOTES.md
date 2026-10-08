# PHYSICS NOTES
Units: G=c=1 inside formulas (lengths in GM/c^2). "Implemented" refers to `PhysicsFormulas.cs` in this package, not to the (unseen) renderer.

1. **Mass M**: sets length scale GM/c^2 (1 Msun = 1.477 km). Implemented: GravitationalRadiusMeters.
2. **Schwarzschild radius** r_s = 2GM/c^2. G gravitational constant, M mass, c light speed. Event-horizon radius for a non-rotating hole only. Implemented.
3. **Kerr model**: vacuum solution for rotating uncharged hole, Boyer-Lindquist coordinates (t,r,theta,phi). Assumes isolated, stationary.
4. **Dimensionless spin** a* = a/M = cJ/(GM^2), 0<=a*<1. Enforced in code.
5. **Angular momentum** J = a* GM^2/c.
6. **Event horizon** r+ = GM/c^2 (1+sqrt(1-a*^2)). Exact; coordinate radius, not a measured distance. Implemented (KerrHorizon).
7. **Ergosphere** r_E = GM/c^2 (1+sqrt(1-a*^2 cos^2 theta)); equator 2GM/c^2. Static observers impossible inside. Implemented.
8. **Frame dragging** omega = -g_tphi/g_phiphi; weak field 2GJ/(c^2 r^3). Implemented only weak-field form; visualization is an analogy.
9. **Schwarzschild photon sphere** r_ph = 3GM/c^2. Schwarzschild only. Implemented (constant).
10. **Kerr photon region**: spherical photon orbits with radius depending on a* and inclination; no single shell. NOT implemented; renderer ring is an approximation.
11. **Shadow**: Schwarzschild b_c = 3*sqrt(3) GM/c^2 (about 5.196 GM/c^2). Kerr shadow is flattened/offset; not implemented.
12. **Accretion disk**: thin disk, T ~ r^(-3/4) far from inner edge, inner edge at ISCO (assumption). Implemented: trend and ISCO.
13. **Disk inclination**: angle between disk and spin axis; equilibrium disks align with spin (Bardeen-Petterson). Tilt is artistic.
14. **Doppler** g = 1/(gamma(1-beta cos theta)); beta = v/c, theta angle between velocity and line of sight (emitter frame conventions vary). Implemented.
15. **Beaming** I_obs = g^3 I_emit (specific intensity). Implemented.
16. **Gravitational redshift** nu_obs/nu_emit = sqrt(1-2GM/(c^2 r)) static emitter, Schwarzschild. Kerr/orbiting emitters need full factor; not implemented.
17. **Lensing** weak field alpha = 4GM/(c^2 b), b impact parameter, b >> GM/c^2. Strong field requires geodesic integration; not implemented here.
18. **Time dilation** dtau/dt = sqrt(1-2GM/(c^2 r)) for static observers. Infalling observers cross r+ in finite proper time. Implemented formula; visualization conceptual.
19. **Observer geometry**: distance r_obs and inclination i from spin axis determine shadow offset, disk asymmetry. Placeholders in parameters.
20. **Quest limitations**: see LIMITATIONS.md.
