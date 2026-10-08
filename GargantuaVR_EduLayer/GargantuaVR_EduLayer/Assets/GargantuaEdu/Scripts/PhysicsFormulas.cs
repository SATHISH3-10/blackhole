using System;
namespace GargantuaEdu
{
    /// Closed-form relations from GR. Units: lengths in GM/c^2 unless stated.
    /// Implemented = exact formula for the stated case; see Docs/PHYSICS_NOTES.md.
    public static class PhysicsFormulas
    {
        public const double G = 6.67430e-11, C = 299792458.0, MSun = 1.98847e30;

        /// Schwarzschild radius r_s = 2GM/c^2 in metres. Non-rotating case only.
        public static double SchwarzschildRadiusMeters(double massSolar) => 2.0 * G * massSolar * MSun / (C * C);
        /// Length scale GM/c^2 in metres.
        public static double GravitationalRadiusMeters(double massSolar) => G * massSolar * MSun / (C * C);
        /// Schwarzschild photon sphere r_ph = 3GM/c^2 (in GM/c^2 units = 3). Schwarzschild only.
        public static double SchwarzschildPhotonSphere() => 3.0;
        /// Schwarzschild shadow critical impact parameter 3*sqrt(3) GM/c^2. Schwarzschild only.
        public static double SchwarzschildShadowRadius() => 3.0 * Math.Sqrt(3.0);

        /// Kerr outer horizon r_+ = 1 + sqrt(1 - a*^2) (Boyer-Lindquist, GM/c^2).
        public static double KerrHorizon(double aStar) { Check(aStar); return 1.0 + Math.Sqrt(1.0 - aStar * aStar); }
        /// Kerr ergosphere outer boundary r_E(theta) = 1 + sqrt(1 - a*^2 cos^2 theta).
        public static double KerrErgosphere(double aStar, double thetaRad) { Check(aStar); return 1.0 + Math.Sqrt(1.0 - aStar * aStar * Math.Pow(Math.Cos(thetaRad), 2)); }

        /// Prograde (sign=+1) / retrograde (sign=-1) ISCO radius for Kerr equatorial circular orbits (Bardeen, Press, Teukolsky 1972).
        public static double KerrIsco(double aStar, int sign = 1)
        {
            Check(aStar);
            double a2 = aStar * aStar;
            double z1 = 1 + Math.Pow(1 - a2, 1.0 / 3) * (Math.Pow(1 + aStar, 1.0 / 3) + Math.Pow(1 - aStar, 1.0 / 3));
            double z2 = Math.Sqrt(3 * a2 + z1 * z1);
            return 3 + z2 - sign * Math.Sqrt((3 - z1) * (3 + z1 + 2 * z2));
        }

        /// Static-emitter gravitational redshift factor nu_obs/nu_emit = sqrt(1 - 2/r). Schwarzschild; valid r>2.
        public static double StaticRedshiftFactor(double r) => r > 2 ? Math.Sqrt(1 - 2.0 / r) : 0.0;
        /// Static-observer clock rate dtau/dt = sqrt(1 - 2/r). Static observers only; not for infall.
        public static double StaticClockRate(double r) => StaticRedshiftFactor(r);

        /// Doppler factor g = 1/(gamma(1 - beta cos theta)).
        public static double DopplerFactor(double beta, double cosTheta)
        {
            double gamma = 1.0 / Math.Sqrt(1 - beta * beta);
            return 1.0 / (gamma * (1 - beta * cosTheta));
        }
        /// Relativistic beaming of specific intensity I_obs = g^3 I_emit.
        public static double BeamingIntensity(double g, double iEmit) => Math.Pow(g, 3) * iEmit;

        /// Weak-field light deflection alpha = 4GM/(c^2 b), b in GM/c^2. Valid only for b >> 1.
        public static double WeakFieldDeflection(double b) => 4.0 / b;
        /// Weak-field Lense-Thirring frame-dragging rate omega = 2J/r^3 (G=c=M=1 -> 2 a*/r^3). Far field only.
        public static double WeakFieldFrameDragging(double aStar, double r) => 2.0 * aStar / (r * r * r);
        /// Thin-disk temperature trend T/T0 = (r/r0)^(-3/4); ignores inner boundary factor.
        public static double ThinDiskTemperatureTrend(double r, double r0) => Math.Pow(r / r0, -0.75);

        static void Check(double aStar) { if (aStar < 0 || aStar >= 1) throw new ArgumentOutOfRangeException(nameof(aStar), "Requires 0 <= a* < 1"); }
    }
}
