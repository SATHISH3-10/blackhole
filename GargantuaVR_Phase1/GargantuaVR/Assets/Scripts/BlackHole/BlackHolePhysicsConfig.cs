// Assets/Scripts/BlackHole/BlackHolePhysicsConfig.cs
// PURPOSE: Single centralized parameter set (ScriptableObject). All other systems read from here.
// UNITS: see KerrMath.cs. SI quantities are explicit (solar masses, kg, m). Geometry is in GM units
// (r_g = GM/c^2). Unity world units = GM units * unityUnitsPerGM (the ONLY Unity<->physical conversion).
using System;
using UnityEngine;
using Gargantua.Physics;

namespace Gargantua.BlackHole
{
    [CreateAssetMenu(fileName = "BlackHolePhysicsConfig", menuName = "Gargantua/Black Hole Physics Config")]
    public class BlackHolePhysicsConfig : ScriptableObject
    {
        public event Action Changed;

        [Header("Mass (SI-derived)")]
        [Tooltip("Black-hole mass in solar masses.")] [Min(1f)] public float massSolar = 1.0e8f;

        [Header("Kerr spin (a* = a/M, dimensionless)")]
        [Tooltip("0 = non-rotating (Schwarzschild limit). Clamped to <1.")] [Range(0f, 0.9999f)] public float spin = 0.9f;
        [Tooltip("Spin axis is the BlackHole object's local +Y. Disk orbits co-rotate if true.")] public bool diskPrograde = true;

        [Header("Observer (static observer, GM units)")]
        [Range(8f, 500f)] public float observerDistanceGM = 30f;
        [Tooltip("Angle between spin axis and line of sight. 90 = equatorial view (strongest far-side disk arcs).")] [Range(0f, 180f)] public float observerInclinationDeg = 84f;
        [Tooltip("Rotation about the spin axis (only visible for tilted disks).")] [Range(0f, 360f)] public float observerAzimuthDeg = 0f;
        [Tooltip("Safe distance used by 'return to safe distance'.")] public float safeDistanceGM = 30f;
        [Tooltip("Closest allowed distance (comfort).")] public float minDistanceGM = 10f;

        [Header("Accretion disk (matter outside the hole)")]
        [Tooltip("Tilt of the disk plane relative to the spin equator. 0 = equatorial. APPROXIMATION: ISCO still uses the equatorial formula.")] [Range(-40f, 40f)] public float diskTiltDeg = 0f;
        public bool useIscoInnerRadius = true;
        [Min(1f)] public float innerRadiusGM = 6f;
        [Min(2f)] public float outerRadiusGM = 24f;
        [Tooltip("Vertical scale height of the accretion disk in GM units (0 = razor-thin, >0 = volumetric gas cloud).")] [Range(0.01f, 0.8f)] public float diskThicknessGM = 0.18f;
        [Range(0f, 6f)] public float diskBrightness = 1.6f;
        [Tooltip("Peak disk temperature (K) before relativistic shifts.")] [Range(2000f, 20000f)] public float diskMaxTempK = 6500f;
        [Range(0.2f, 1f)] public float diskOpacity = 0.92f;

        [Header("Relativistic effects")]
        [Tooltip("1 = full GR light bending. <1 is NON-PHYSICAL artistic weakening.")] [Range(0f, 1f)] public float lensingStrength = 1f;
        [Tooltip("Include Kerr frame-dragging and spin-orbit geodesic coupling in ray-marching.")] public bool kerrGeodesics = true;
        [Tooltip("Blend between ignoring (0) and applying (1) the Doppler/gravitational shift factor g.")] [Range(0f, 1f)] public float relativisticIntensity = 1f;
        public bool dopplerEnabled = true;
        public bool redshiftEnabled = true;
        public bool photonRingGlow = true;
        [Tooltip("Intensity of the razor-sharp photon ring around the event horizon.")] [Range(0f, 3f)] public float photonRingIntensity = 1.4f;
        [Tooltip("Sharpness exponent of the photon ring.")] [Range(5f, 40f)] public float photonRingSharpness = 24f;

        [Header("Time / stars")]
        [Tooltip("Visual speed: GM-time units per real second. ARTISTIC (real orbital periods are hours for 1e8 Msun).")] [Range(0f, 40f)] public float simulationRate = 8f;
        [Range(0f, 0.12f)] public float starDensity = 0.03f;
        [Tooltip("Unity metres per r_g. The only Unity<->GM conversion.")] [Min(0.01f)] public float unityUnitsPerGM = 1f;

        [Header("Educational overlays")]
        public bool showEventHorizon = true;
        public bool showShadowOutline = false;
        public bool showPhotonRegion = false;
        public bool showErgosphere = false;
        public bool showFrameDragging = false;

        // ---- derived, PHYSICALLY CALCULATED --------------------------------
        public double MassKg => massSolar * PhysicalConstants.SolarMass;
        public double GravRadiusMeters => KerrMath.GravitationalRadiusMeters(MassKg);
        public double SchwarzschildRadiusMeters => KerrMath.SchwarzschildRadiusMeters(MassKg);
        public double AngularMomentumSI => KerrMath.AngularMomentumSI(MassKg, spin);
        public double EventHorizonGM => KerrMath.EventHorizonRadius(spin);
        public double IscoGM => KerrMath.Isco(spin, diskPrograde);
        public float InnerRadiusResolvedGM => useIscoInnerRadius ? (float)IscoGM : innerRadiusGM;
        public float OuterRadiusResolvedGM => Mathf.Max(outerRadiusGM, InnerRadiusResolvedGM + 1f);

        public void NotifyChanged() => Changed?.Invoke();
        void OnValidate()
        {
            spin = Mathf.Clamp(spin, 0f, 0.9999f);
            minDistanceGM = Mathf.Clamp(minDistanceGM, 6f, observerDistanceGM);
            Changed?.Invoke();
        }
    }
}
