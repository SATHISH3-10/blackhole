# SCIENTIFIC MODEL
Intended model: idealized Kerr black hole, a* = a/M = cJ/(GM^2), 0 <= a* < 1, geometric units G=c=1 with lengths in GM/c^2. Not a rotating solid sphere.
Schwarzschild reference (a*=0): r_s = 2GM/c^2, r_ph = 3GM/c^2, shadow radius 3*sqrt(3) GM/c^2. These do NOT apply to Kerr.
Classification of features (target; **must be confirmed against the shader**):
| Feature | Class |
|---|---|
| Mass scale, horizon r+, ergosphere boundary, ISCO | PHYSICALLY CALCULATED (closed-form, PhysicsFormulas.cs) |
| Shadow outline, photon region, lensing, Doppler, beaming, redshift | PHYSICALLY MOTIVATED APPROXIMATION unless geodesics integrated |
| Disk look, brightness, star field, frame-dragging markers, time-dilation clocks, tilt | ARTISTIC |
Newtonian reference mode shows what is missing without GR.
