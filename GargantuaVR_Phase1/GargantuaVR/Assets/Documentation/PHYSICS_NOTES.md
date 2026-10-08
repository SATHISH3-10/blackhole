# Gargantua VR: Relativistic Physics Notes

## Unit System
All spatial dimensions in the renderer are computed in geometric units where $G = c = M = 1$:
* Multiples of the gravitational radius: $r_g = \frac{GM}{c^2}$.
* Real-world distances scale linearly with black hole mass: $r_{\text{meters}} = r_{\text{GM}} \cdot \frac{G M}{c^2}$.

## Kerr Closed-Form Metrics
1. **Event Horizon**:
   $$r_+ = 1 + \sqrt{1 - a_*^2} \quad (1.0 \le r_+ \le 2.0)$$
2. **Inner Cauchy Horizon**:
   $$r_- = 1 - \sqrt{1 - a_*^2} \quad (0.0 \le r_- \le 1.0)$$
3. **Ergosphere**:
   $$r_E(\theta) = 1 + \sqrt{1 - a_*^2 \cos^2\theta}$$
4. **Equatorial Photon Orbits**:
   $$r_{\text{ph}}^{\pm} = 2 \left[1 + \cos\left(\frac{2}{3} \arccos(\mp a_*)\right)\right]$$
5. **ISCO (Innermost Stable Circular Orbit)**:
   $$Z_1 = 1 + (1 - a_*^2)^{1/3} \left[(1 + a_*)^{1/3} + (1 - a_*)^{1/3}\right]$$
   $$Z_2 = \sqrt{3 a_*^2 + Z_1^2}$$
   $$r_{\text{ISCO}}^{\text{pro}} = 3 + Z_2 - \sqrt{(3 - Z_1)(3 + Z_1 + 2 Z_2)}$$
6. **ZAMO Angular Velocity ($\omega$)**:
   $$\omega(r, \theta) = \frac{2 a r}{(r^2 + a^2)^2 - a^2 (r^2 - 2r + a^2) \sin^2\theta}$$
7. **Static Observer Clock Rate (Time Dilation)**:
   $$\frac{d\tau}{dt} = \sqrt{\max\left(0, 1 - \frac{2r}{r^2 + a_*^2 \cos^2\theta}\right)}$$
