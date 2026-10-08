# Gargantua VR: Scientific & Educational Specification

This document defines the physics, geometry, educational principles, and rendering models for the Gargantua black hole simulation.

---

## 1. Black-Hole Fundamental Properties

The simulation parameterizes the central black hole using the following fundamental quantities:

* **Mass ($M$)**: Total black hole mass in solar masses ($M_\odot$) and SI kilograms ($M = M_{\odot} \times 1.98847 \times 10^{30}\text{ kg}$).
* **Gravitational Radius ($r_g$)**: Fundamental geometric length unit:
  $$r_g = \frac{GM}{c^2}$$
* **Schwarzschild Radius ($r_s$)**: Exact event horizon radius for a non-rotating ($a_*=0$) Schwarzschild black hole only:
  $$r_s = \frac{2GM}{c^2} = 2 r_g$$
* **Dimensionless Spin Parameter ($a_* = a/M$)**: Rotational parameter $a_* = \frac{cJ}{GM^2}$, where $0 \le a_* < 1$.
* **Angular Momentum ($J$)**: Physical spin angular momentum:
  $$J = a_* \frac{G M^2}{c}$$
* **Event Horizon Radius ($r_+$)**: Outer Kerr causal boundary (see Section 4).
* **Black-Hole Shadow Radius ($\psi_{\text{shadow}}$)**: Apparent optical boundary seen by a distant observer (see Section 5).
* **Photon Orbit / Photon Region ($r_{\text{ph}}$)**: Unstable bound photon trajectories (see Section 6).
* **Observer Distance ($r_{\text{obs}}$)**: Radial coordinate in $GM/c^2$ units ($r_g$).
* **Observer Inclination ($i$)**: Polar angle between the black hole's spin axis ($+Y$) and the observer's line of sight ($i = 90^\circ$ is equatorial, maximizing upper/lower disk arcs).

> **Important Distinction**: For a rotating Kerr black hole, the event horizon is **not** $r_s = 2GM/c^2$. It shrinks towards $r_+ = 1GM/c^2$ as $a_* \to 1$.

---

## 2. Kerr Black-Hole Model

Gargantua is modeled as a rapidly rotating Kerr spacetime in Boyer-Lindquist coordinates:

* **Kerr Metric Geometry**: Spacetime curvature governed by mass $M$ and spin $a = J/(Mc)$.
* **Prograde vs. Retrograde Trajectories**:
  * **Prograde orbits** (co-rotating with spin) experience attractive frame-dragging, pulling them closer to the hole:
    $$r_{\text{ISCO}}^{\text{pro}} \to 1.0\,r_g \quad (\text{as } a_* \to 1)$$
    $$r_{\text{ph}}^{\text{pro}} = 2 \left[1 + \cos\left(\frac{2}{3} \arccos(-a_*)\right)\right] r_g \to 1.0\,r_g$$
  * **Retrograde orbits** (counter-rotating) are repelled to larger radii:
    $$r_{\text{ISCO}}^{\text{retro}} \to 9.0\,r_g \quad (\text{as } a_* \to 1)$$
    $$r_{\text{ph}}^{\text{retro}} = 2 \left[1 + \cos\left(\frac{2}{3} \arccos(a_*)\right)\right] r_g \to 4.0\,r_g$$
* **Frame Dragging (Lense-Thirring Effect)**: Spacetime itself is dragged in the direction of rotation with zero-angular-momentum observer (ZAMO) angular velocity:
  $$\omega(r, \theta) = -\frac{g_{t\phi}}{g_{\phi\phi}} = \frac{2 a r}{(r^2 + a^2)^2 - a^2 \Delta \sin^2\theta} \frac{c}{r_g}$$
* **Kerr Event Horizon ($r_+$)**:
  $$r_+ = M + \sqrt{M^2 - a^2} = r_g \left(1 + \sqrt{1 - a_*^2}\right)$$
* **Ergosphere ($r_E(\theta)$)**: The stationary limit surface where $g_{tt} = 0$:
  $$r_E(\theta) = r_g \left(1 + \sqrt{1 - a_*^2 \cos^2\theta}\right)$$
  Inside the ergosphere, no static observer can exist; all particles and light must rotate in the direction of the black hole's spin.
* **Visual Impact of Increasing Spin**:
  * As $a_* \to 1$, the shadow becomes asymmetric, flattening on the approaching (prograde) side and forming the iconic Kerr **D-shape**.
  * The accretion disk inner edge ($\text{ISCO}$) moves much closer to the horizon for prograde orbits, increasing gravitational redshift and peak temperature.

---

## 3. Accretion Disk Physics

The accretion disk represents luminous, superheated plasma orbiting in the equatorial plane outside the event horizon.

* **Educational Principle**: **The accretion disk is NOT the black hole itself.** It is external matter orbiting in the curved spacetime outside the event horizon.
* **Inner Radius ($R_{\text{in}}$)**: Governed by the Innermost Stable Circular Orbit ($\text{ISCO}$). Gas inside $R_{\text{in}}$ plunges dynamically into the event horizon without emitting stable thermal radiation.
* **Outer Radius ($R_{\text{out}}$)**: The visual outer boundary of the emitting disk (typically $20\text{--}30\,r_g$).
* **Temperature & Radiative Flux Gradient**: Modeled after the relativistic Novikov-Thorne thin-disk dissipation profile:
  $$F(r) \propto \frac{1}{r^3} \left(1 - \sqrt{\frac{R_{\text{in}}}{r}}\right)$$
  * **Hot inner region**: Near $R_{\text{in}}$, peak temperatures reach thousands to millions of Kelvins ($6,000\text{--}20,000\text{ K}$).
  * **Cooler outer region**: Temperature drops steadily outward following $T(r) \propto r^{-3/4}$.
* **Relativistic Doppler Boosting & Beaming**:
  Orbital velocity $\beta = v/c$ creates relativistic beaming towards the observer on the approaching side and dimming on the receding side:
  $$D = \frac{1}{\gamma (1 - \beta \cos\alpha)}, \quad \gamma = \frac{1}{\sqrt{1 - \beta^2}}$$
  The observed intensity scales as $I_{\text{obs}} = I_{\text{emit}} \cdot g^4$.
* **Gravitational Redshift**:
  Photons escaping the gravitational well lose energy, redshifting their wavelength and reducing apparent temperature:
  $$g_{\text{grav}} = \sqrt{1 - \frac{2 r_g r}{r^2 + a^2 \cos^2\theta}}$$
  Combined relativistic frequency shift: $g = D \cdot g_{\text{grav}}$.
* **Optical Depth (Thick vs. Thin)**:
  * *Optically thick*: The disk absorbs background rays that hit its plane.
  * *Volumetric profile*: Vertical scale height $H(r) = H_0 \sqrt{r/R_{\text{in}}}$ provides soft glowing gas filaments without artificial razor-thin clipping.

---

## 4. Event Horizon

* **Educational Definition**: **The event horizon is a causal boundary beyond which light and matter cannot escape to a distant observer.**
* **Visualization Rule**: The event horizon is **NOT** a physical glowing sphere, solid crust, or reflective surface. It is an immaterial, one-way boundary of spacetime. Within the visualization, it is represented as total blackness (the interior capture of light).

---

## 5. Black-Hole Shadow vs. Event Horizon

* **Core Distinction**:
  $$\text{Event Horizon } (r_+) \neq \text{Black-Hole Shadow } (\psi_{\text{shadow}})$$
* **The Event Horizon**: The physical causal boundary ($r_+ = 1 + \sqrt{1 - a_*^2}\,r_g \le 2 r_g$).
* **The Shadow**: An apparent dark silhouette formed by photon capture. Due to strong gravitational lensing, light rays with impact parameter $b < b_c = 3\sqrt{3}\,r_g \approx 5.196\,r_g$ are captured by the hole.
* **Apparent Size**: The black-hole shadow appears roughly **$2.6\times$ larger** than the event horizon coordinate sphere when viewed from afar.

---

## 6. Photon Sphere & Photon Region

* **Non-Rotating Schwarzschild Case ($a_* = 0$)**:
  Unstable circular photon orbits form a single spherical 2D shell at:
  $$r_{\text{photon}} = \frac{3GM}{c^2} = 3 r_g$$
* **Rotating Kerr Spacetime ($a_* > 0$)**:
  Due to frame dragging, photon orbits depend on orbital inclination and angular momentum.
  * Prograde equatorial orbit: $r_{\text{ph}}^+ \in [1 r_g, 3 r_g)$.
  * Retrograde equatorial orbit: $r_{\text{ph}}^- \in (3 r_g, 4 r_g]$.
  * Non-equatorial orbits fill a **3-dimensional photon region** bounded between $r_{\text{ph}}^+$ and $r_{\text{ph}}^-$.
* **Visualization Rule**: **Do NOT visualize the Kerr photon region as a simple spherical shell.** It is a complex 3D volume of unstable null geodesics.

---

## 7. Gravitational Lensing

* **Light Bending & Deflection**: Strong spacetime curvature bends photon trajectories passing near the black hole.
* **Far-Side Accretion Disk Visibility**: Light emitted from the rear of the accretion disk is bent upwards over and downwards under the black hole, making both the top and bottom of the far disk visible simultaneously to the observer.
* **Higher-Order Lensed Images**: Photons looping $180^\circ$, $360^\circ$, or multiple orbits around the photon region generate secondary and tertiary Einstein rings (sub-rings) hugging the shadow rim.
* **Computational Integrity**: The shader actively integrates the null-geodesic equation $\frac{d^2 \mathbf{r}}{d\lambda^2}$ per pixel step-by-step; it does not use a flat 2D post-processing distortion texture.

---

## 8. Relativistic Effects Classification

Every visual effect in the simulation is categorized into one of three strict tiers:

### 🟢 1. PHYSICALLY MODELED
* **Schwarzschild null-geodesic deflection**: Per-pixel ray acceleration $\mathbf{a} = -3 M h^2 \mathbf{r}/r^5$.
* **Kerr spin-orbit frame dragging of light**: Perturbation acceleration $\mathbf{a}_{\text{Kerr}} \propto \frac{2 a}{r^5} [3 (\mathbf{h} \cdot \hat{\mathbf{y}})\mathbf{r} + (\mathbf{h} \times \hat{\mathbf{y}})r]$.
* **Event horizon radius ($r_+$)**: $r_g (1 + \sqrt{1 - a_*^2})$.
* **Ergosphere boundary ($r_E(\theta)$)**: $r_g (1 + \sqrt{1 - a_*^2 \cos^2\theta})$.
* **Equatorial photon orbit radii ($r_{\text{ph}}^{\pm}$)**: Closed-form solutions for prograde and retrograde orbits.
* **ISCO boundary ($r_{\text{ISCO}}$)**: Bardeen-Press-Teukolsky closed-form formula.
* **ZAMO frame dragging angular velocity ($\omega$)**: Exact metric ratio $-g_{t\phi}/g_{\phi\phi}$.
* **Static observer gravitational time dilation ($d\tau/dt$)**: $\sqrt{1 - 2r/\Sigma}$.

### 🟡 2. APPROXIMATED
* **Accretion disk temperature profile**: Novikov-Thorne $(r_{\text{in}}/r)^3 (1 - \sqrt{r_{\text{in}}/r})$ dissipation curve.
* **Relativistic Doppler boosting & beaming**: $D = \frac{1}{\gamma (1 - \beta \cos\alpha)}$ using static local velocity approximations.
* **Gravitational redshift color shift**: Planck blackbody radiation curve scaled by $T_{\text{obs}} = T_{\text{disk}} \cdot g$.
* **Raymarching step integration**: Adaptive Runge-Kutta/Euler stepping within a GPU step budget ($64\text{--}128$ steps).
* **Volumetric gas height**: Gaussian envelope $H(r) = H_0 \sqrt{r/R_{\text{in}}}$.

### 🟣 3. PURELY VISUAL / ARTISTIC
* **Differential Keplerian turbulence**: Multi-octave FBM noise sheared along the accretion disk.
* **Photon ring proximity glow**: Exponential highlight around the critical curve.
* **Background starfield density & distribution**: Procedurally hashed celestial sphere.
* **ACES filmic tone mapping**: High dynamic range color compression for cinematic visual fidelity.
