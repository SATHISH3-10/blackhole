// Assets/Scripts/Physics/KerrMath.cs
// PURPOSE: Closed-form Kerr / Schwarzschild relations used by the educational model.
// No UnityEngine dependency so it can be unit-tested (see Assets/Tests/EditMode).
//
// UNIT CONVENTION (documented once, used everywhere):
//   * "GM units" = geometric units G = c = M = 1. Lengths are in multiples of r_g = GM/c^2,
//     times in multiples of GM/c^3. Dimensionless spin a* = a/M = cJ/(GM^2), 0 <= a* < 1.
//   * SI conversion helpers below convert r_g to metres for a given mass.
//   * Unity world units <-> GM units conversion is BlackHolePhysicsConfig.unityUnitsPerGM.
//
// CLASSIFICATION: every function here is PHYSICALLY CALCULATED (exact closed forms)
// unless its summary says APPROXIMATION.
using System;

namespace Gargantua.Physics
{
    public static class PhysicalConstants
    {
        public const double G = 6.67430e-11;        // m^3 kg^-1 s^-2 (CODATA 2018)
        public const double C = 299792458.0;        // m/s (exact)
        public const double SolarMass = 1.98847e30; // kg
    }

    public static class KerrMath
    {
        // ---- SI conversions -------------------------------------------------
        /// <summary>r_g = GM/c^2 in metres.</summary>
        public static double GravitationalRadiusMeters(double massKg) => PhysicalConstants.G * massKg / (PhysicalConstants.C * PhysicalConstants.C);

        /// <summary>Schwarzschild radius r_s = 2GM/c^2 (NON-ROTATING case only; NOT the Kerr horizon).</summary>
        public static double SchwarzschildRadiusMeters(double massKg) => 2.0 * GravitationalRadiusMeters(massKg);

        /// <summary>Kerr angular momentum J = a* G M^2 / c  (kg m^2 / s).</summary>
        public static double AngularMomentumSI(double massKg, double spin) => spin * PhysicalConstants.G * massKg * massKg / PhysicalConstants.C;

        /// <summary>GM/c^3 in seconds (time unit of GM units).</summary>
        public static double GravitationalTimeSeconds(double massKg) => PhysicalConstants.G * massKg / Math.Pow(PhysicalConstants.C, 3);

        // ---- Kerr surfaces (Boyer-Lindquist radius, GM units) ---------------
        /// <summary>Outer event horizon r+ = M + sqrt(M^2 - a^2). Equals 2M only for a=0.</summary>
        public static double EventHorizonRadius(double spin) => 1.0 + Math.Sqrt(1.0 - spin * spin);

        /// <summary>Inner (Cauchy) horizon r- = M - sqrt(M^2 - a^2).</summary>
        public static double InnerHorizonRadius(double spin) => 1.0 - Math.Sqrt(1.0 - spin * spin);

        /// <summary>Ergosphere outer boundary r_E(theta) = M + sqrt(M^2 - a^2 cos^2 theta). theta from the spin axis.</summary>
        public static double ErgosphereRadius(double spin, double theta)
        {
            double c = Math.Cos(theta);
            return 1.0 + Math.Sqrt(Math.Max(0.0, 1.0 - spin * spin * c * c));
        }

        /// <summary>
        /// Circular EQUATORIAL photon orbit radius: r = 2M{1 + cos[(2/3) arccos(-/+ a*)]}.
        /// prograde -> arccos(-a*), retrograde -> arccos(+a*). a=0 gives 3M. This is one orbit in the
        /// 3D photon REGION, not a universal shell.
        /// </summary>
        public static double EquatorialPhotonOrbitRadius(double spin, bool prograde)
        {
            double s = prograde ? -spin : spin;
            return 2.0 * (1.0 + Math.Cos((2.0 / 3.0) * Math.Acos(s)));
        }

        /// <summary>Innermost stable circular orbit (Bardeen, Press & Teukolsky 1972). a=0 gives 6M.</summary>
        public static double Isco(double spin, bool prograde)
        {
            double a2 = spin * spin;
            double z1 = 1.0 + Math.Pow(1.0 - a2, 1.0 / 3.0) * (Math.Pow(1.0 + spin, 1.0 / 3.0) + Math.Pow(1.0 - spin, 1.0 / 3.0));
            double z2 = Math.Sqrt(3.0 * a2 + z1 * z1);
            double root = Math.Sqrt((3.0 - z1) * (3.0 + z1 + 2.0 * z2));
            return prograde ? 3.0 + z2 - root : 3.0 + z2 + root;
        }

        // ---- Shadow ---------------------------------------------------------
        public static readonly double SchwarzschildCriticalImpactParameter = 3.0 * Math.Sqrt(3.0); // b_c = 3*sqrt(3) M

        /// <summary>
        /// Angular radius (rad) of the Schwarzschild shadow for a STATIC observer at radius r_obs (GM units):
        /// sin(psi) = (3 sqrt3 M / r) sqrt(1 - 2M/r)  (exact for Schwarzschild). Valid r_obs > 2.
        /// </summary>
        public static double SchwarzschildShadowAngularRadius(double rObs)
        {
            double s = SchwarzschildCriticalImpactParameter / rObs * Math.Sqrt(Math.Max(0.0, 1.0 - 2.0 / rObs));
            s = Math.Min(1.0, s);
            return rObs >= 3.0 ? Math.Asin(s) : Math.PI - Math.Asin(s);
        }

        /// <summary>
        /// APPROXIMATION (physically motivated, NOT a Kerr geodesic solution): linear interpolation of the
        /// shadow radius between the a=0 value and the known extreme-Kerr equatorial value (half-width 4.5M).
        /// </summary>
        public static double ApproxKerrShadowRadiusScale(double spin, double inclinationFromSpinAxis)
            => 1.0 - 0.134 * spin * Math.Sin(inclinationFromSpinAxis);

        /// <summary>
        /// APPROXIMATION: shadow-centre offset (GM units, impact-parameter space) ~ 2 a* sin(i), matching the
        /// extreme-Kerr equatorial D-shape (centre ~ 2-2.5M). Shift is toward the receding side.
        /// </summary>
        public static double ApproxKerrShadowCenterOffset(double spin, double inclinationFromSpinAxis)
            => 2.0 * spin * Math.Sin(inclinationFromSpinAxis);

        // ---- Frame dragging / time dilation / orbits ------------------------
        /// <summary>ZAMO (frame-dragging) angular velocity omega = -g_tphi/g_phiphi = 2 a r / [(r^2+a^2)^2 - a^2 Delta sin^2 theta], rad per GM-time.</summary>
        public static double ZamoAngularVelocity(double r, double theta, double spin)
        {
            double a2 = spin * spin;
            double delta = r * r - 2.0 * r + a2;
            double s = Math.Sin(theta);
            double ra = r * r + a2;
            return 2.0 * spin * r / (ra * ra - a2 * delta * s * s);
        }

        /// <summary>
        /// d(tau)/dt for a STATIC observer: sqrt(1 - 2 M r / Sigma), Sigma = r^2 + a^2 cos^2 theta.
        /// Static observers only exist outside the ergosphere; returns 0 inside it. This is the
        /// gravitational part only (a hovering, non-orbiting clock).
        /// </summary>
        public static double StaticObserverClockRate(double r, double theta, double spin)
        {
            double c = Math.Cos(theta);
            double sigma = r * r + spin * spin * c * c;
            double v = 1.0 - 2.0 * r / sigma;
            return v > 0.0 ? Math.Sqrt(v) : 0.0;
        }

        /// <summary>Keplerian equatorial angular velocity d(phi)/dt (signed; negative = retrograde): +/-1/(r^1.5 +/- a).</summary>
        public static double KeplerianAngularVelocity(double r, double spin, bool prograde)
            => prograde ? 1.0 / (Math.Pow(r, 1.5) + spin) : -1.0 / (Math.Pow(r, 1.5) - spin);
    }
}
