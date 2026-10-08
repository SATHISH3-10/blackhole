# Gargantua VR: Technical & Physics Limitations

## 1. Relativistic Raymarching Step Approximation
* Real-time mobile VR at 72/90 FPS requires an adaptive step budget ($64\text{--}128$ steps).
* Higher-order photon sub-rings ($n > 2$) are approximated with exponential proximity falloff rather than infinite geodesic integration.

## 2. Accretion Disk Physics
* The accretion disk represents an optically thick, geometrically thin disk with a vertical Gaussian scale height $H(r) = H_0 \sqrt{r/R_{\text{in}}}$.
* It does not compute full 3D relativistic Magnetohydrodynamic (GRMHD) plasma turbulence in real time.

## 3. Observer Invariants & Ergosphere
* The clock rate calculation $d\tau/dt = \sqrt{1 - 2r/\Sigma}$ applies to static (hovering) observers. Inside the ergosphere ($r < r_E$), static observers cannot physically exist, and all matter must co-rotate as ZAMOs.
* The observer is held in controlled orbit and is never pulled into the horizon to protect user comfort and prevent VR simulation sickness.
