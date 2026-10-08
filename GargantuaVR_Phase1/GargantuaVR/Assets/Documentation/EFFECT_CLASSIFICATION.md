# Relativistic Effect Classification (Gargantua VR)

Every visual and physical component in the simulation is strictly categorized into one of three classifications:

* **PHYSICALLY MODELED**: Calculated directly from General Relativity closed-form solutions or numerical geodesic ray-marching equations.
* **APPROXIMATED**: Physically motivated analytical equations with necessary computational simplifications for real-time VR frame rates.
* **PURELY VISUAL**: Artistic representations, noise patterns, or filmic color grading used to enhance realism without claiming physical derivation.

---

| Effect / Feature | Classification | Description & Relativistic Basis |
|---|---|---|
| **Light Deflection & Gravitational Lensing** | **PHYSICALLY MODELED** | Numerical integration of null-geodesic equation $d^2\mathbf{r}/d\lambda^2 = -3M h^2 \mathbf{r}/r^5$ with adaptive step sizing. |
| **Kerr Frame Dragging on Light Paths** | **PHYSICALLY MODELED** | Spin-orbit coupling acceleration $\mathbf{a}_{\text{Kerr}} \propto \frac{2a}{r^5}[3(\mathbf{h}\cdot\hat{\mathbf{y}})\mathbf{r} + (\mathbf{h}\times\hat{\mathbf{y}})r]$ forming the D-shaped shadow. |
| **Kerr Event Horizon ($r_+$)** | **PHYSICALLY MODELED** | Outer causal boundary $r_+ = r_g(1 + \sqrt{1 - a_*^2})$. Immaterial causal trap (not a solid surface). |
| **Ergosphere Boundary ($r_E(\theta)$)** | **PHYSICALLY MODELED** | Stationary limit surface $r_E(\theta) = r_g(1 + \sqrt{1 - a_*^2 \cos^2\theta})$. |
| **Equatorial Photon Orbits ($r_{\text{ph}}^{\pm}$)** | **PHYSICALLY MODELED** | Exact prograde & retrograde radii: $r_{\text{ph}} = 2r_g[1 + \cos(\frac{2}{3}\arccos(\mp a_*))]$. |
| **ISCO Inner Disk Boundary ($r_{\text{ISCO}}$)** | **PHYSICALLY MODELED** | Bardeen-Press-Teukolsky analytical formula determining accretion disk inner termination. |
| **ZAMO Frame Dragging Velocity ($\omega$)** | **PHYSICALLY MODELED** | Relativistic spacetime swirl velocity $\omega = -g_{t\phi}/g_{\phi\phi}$. |
| **Gravitational Time Dilation Rate** | **PHYSICALLY MODELED** | Static clock rate $d\tau/dt = \sqrt{1 - 2r/\Sigma}$ outside the ergosphere. |
| **Accretion Disk Dissipation Profile** | **APPROXIMATED** | Relativistic Novikov-Thorne radial flux curve $F(r) \sim (R_{\text{in}}/r)^3 (1 - \sqrt{R_{\text{in}}/r})$. |
| **Doppler Boosting & Beaming** | **APPROXIMATED** | Relativistic Doppler factor $D = 1/[\gamma(1 - \beta \cos\alpha)]$ with intensity scaling $I \propto g^4$. |
| **Gravitational Redshift Color Shift** | **APPROXIMATED** | Blackbody temperature scaling $T_{\text{obs}} = T_{\text{disk}} \cdot g$ via Planckian locus approximation. |
| **Volumetric Accretion Scale Height** | **APPROXIMATED** | Vertical Gaussian profile $H(r) = H_0 \sqrt{r/R_{\text{in}}}$ integrated along ray steps. |
| **Shadow Outline Overlay** | **APPROXIMATED** | Closed-form Kerr shadow projection radius & center displacement for HUD wireframes. |
| **Accretion Disk Turbulence** | **PURELY VISUAL** | Multi-octave FBM noise sheared at differential Keplerian angular velocity $\Omega(r) = 1/(r^{3/2} + a)$. |
| **Photon Ring Proximity Glow** | **PURELY VISUAL** | Exponential radiance boost with chromatic dispersion for rays skimming $r_{\text{ph}}$. |
| **Lensed Starfield Texture** | **PURELY VISUAL** | Procedurally hashed celestial sphere deflected along escaping light geodesics. |
| **ACES Filmic Tone Mapping** | **PURELY VISUAL** | Cinematic S-curve compression preserving bright disk highlights and deep shadow blacks. |
