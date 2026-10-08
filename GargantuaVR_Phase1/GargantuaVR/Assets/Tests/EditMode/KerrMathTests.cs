// Assets/Tests/EditMode/KerrMathTests.cs — checks limiting cases of the closed-form Kerr relations.
using NUnit.Framework;
using Gargantua.Physics;

public class KerrMathTests
{
    const double Tol = 1e-6;
    [Test] public void Schwarzschild_Limits()
    {
        Assert.AreEqual(2.0, KerrMath.EventHorizonRadius(0), Tol);
        Assert.AreEqual(3.0, KerrMath.EquatorialPhotonOrbitRadius(0, true), Tol);
        Assert.AreEqual(3.0, KerrMath.EquatorialPhotonOrbitRadius(0, false), Tol);
        Assert.AreEqual(6.0, KerrMath.Isco(0, true), Tol);
        Assert.AreEqual(6.0, KerrMath.Isco(0, false), Tol);
        Assert.AreEqual(2.0, KerrMath.ErgosphereRadius(0, 0.7), Tol);
    }
    [Test] public void ExtremeKerr_Limits()
    {
        double a = 0.999999;
        Assert.AreEqual(1.0, KerrMath.EventHorizonRadius(a), 2e-3);
        Assert.AreEqual(1.0, KerrMath.EquatorialPhotonOrbitRadius(a, true), 2e-3);
        Assert.AreEqual(4.0, KerrMath.EquatorialPhotonOrbitRadius(a, false), 2e-3);
        Assert.AreEqual(1.0, KerrMath.Isco(a, true), 2e-2);
        Assert.AreEqual(9.0, KerrMath.Isco(a, false), 2e-2);
        Assert.AreEqual(2.0, KerrMath.ErgosphereRadius(a, System.Math.PI / 2), Tol); // equatorial ergosphere = 2M
    }
    [Test] public void ShadowAndClock()
    {
        Assert.AreEqual(System.Math.Sqrt(27.0), KerrMath.SchwarzschildCriticalImpactParameter, Tol);
        Assert.Greater(KerrMath.StaticObserverClockRate(30, System.Math.PI / 2, 0.9), 0.96);
        Assert.AreEqual(0.0, KerrMath.StaticObserverClockRate(1.5, System.Math.PI / 2, 0.9), Tol); // inside ergosphere
    }
}
