// web/js/physics.js
// General Relativity Physics Engine: Kerr & Schwarzschild Spacetime Metrics

export const PhysicalConstants = {
    G: 6.67430e-11,        // m^3 kg^-1 s^-2
    C: 299792458.0,        // m/s
    SolarMass: 1.98847e30  // kg
};

export class KerrPhysics {
    constructor() {
        this.massSolar = 1.0e8;       // Gargantua: 100 million solar masses
        this.spin = 0.998;            // High Kerr spin a* = a/M (Interstellar accurate)
        this.diskPrograde = true;
        this.observerDistanceGM = 5.2; // Low-altitude cloud-skimming flight
        this.observerInclinationDeg = 88.4; // Skimming parallel to golden cloud ocean
        this.observerAzimuthDeg = 1.25;
        this.diskTiltDeg = 0.0;
        this.diskBrightness = 2.4;
        this.diskMaxTempK = 6500; // Warm honey, amber & peach gold
        this.diskThicknessGM = 0.24;
        this.diskOpacity = 0.95;
        this.lensingStrength = 1.0;
        this.kerrGeodesics = true;
        this.dopplerEnabled = true;
        this.redshiftEnabled = true;
        this.photonRingGlow = true;
        this.photonRingIntensity = 2.0;
        this.photonRingSharpness = 26.0;
        this.simulationRate = 6.0;
        this.exposure = 1.25;
        this.raymarchSteps = 160;
    }

    // SI Conversions
    get massKg() { return this.massSolar * PhysicalConstants.SolarMass; }
    get gravitationalRadiusMeters() { return (PhysicalConstants.G * this.massKg) / (PhysicalConstants.C * PhysicalConstants.C); }
    get gravitationalRadiusKm() { return this.gravitationalRadiusMeters / 1000.0; }
    get schwarzschildRadiusMeters() { return 2.0 * this.gravitationalRadiusMeters; }
    get angularMomentumSI() { return (this.spin * PhysicalConstants.G * this.massKg * this.massKg) / PhysicalConstants.C; }

    // Kerr Relativistic Radii (in GM/c^2 units)
    get eventHorizonGM() {
        const a = Math.min(0.9999, Math.max(0.0, this.spin));
        return 1.0 + Math.sqrt(Math.max(0.0, 1.0 - a * a));
    }

    get innerHorizonGM() {
        const a = Math.min(0.9999, Math.max(0.0, this.spin));
        return 1.0 - Math.sqrt(Math.max(0.0, 1.0 - a * a));
    }

    ergosphereRadiusGM(thetaRad) {
        const a = Math.min(0.9999, Math.max(0.0, this.spin));
        const c = Math.cos(thetaRad);
        return 1.0 + Math.sqrt(Math.max(0.0, 1.0 - a * a * c * c));
    }

    equatorialPhotonOrbitGM(prograde = true) {
        const a = Math.min(0.9999, Math.max(0.0, this.spin));
        const s = prograde ? -a : a;
        return 2.0 * (1.0 + Math.cos((2.0 / 3.0) * Math.acos(s)));
    }

    get iscoGM() {
        const a = Math.min(0.9999, Math.max(0.0, this.spin));
        const a2 = a * a;
        const z1 = 1.0 + Math.cbrt(1.0 - a2) * (Math.cbrt(1.0 + a) + Math.cbrt(1.0 - a));
        const z2 = Math.sqrt(3.0 * a2 + z1 * z1);
        const root = Math.sqrt(Math.max(0.0, (3.0 - z1) * (3.0 + z1 + 2.0 * z2)));
        return this.diskPrograde ? (3.0 + z2 - root) : (3.0 + z2 + root);
    }

    get innerRadiusResolvedGM() {
        return this.iscoGM;
    }

    get outerRadiusResolvedGM() {
        return Math.max(30.0, this.innerRadiusResolvedGM * 4.5);
    }

    // Static Observer Time Dilation Factor d(tau)/dt
    // Returns fraction of distant Earth time (e.g. 0.1 means 1s here = 10s on Earth)
    get observerClockRate() {
        const r = Math.max(this.eventHorizonGM + 0.01, this.observerDistanceGM);
        const theta = (this.observerInclinationDeg * Math.PI) / 180.0;
        const c = Math.cos(theta);
        const sigma = r * r + this.spin * this.spin * c * c;
        const val = 1.0 - (2.0 * r) / sigma;
        return val > 0.0 ? Math.sqrt(val) : 0.00001;
    }

    // Time Dilation Multiple: How many seconds pass on Earth for 1 second at observer
    get timeDilationMultiplier() {
        const rate = this.observerClockRate;
        return rate > 0.0 ? 1.0 / rate : Infinity;
    }

    // Format human-readable time dilation string (e.g. "1 hour here = 7.1 years on Earth")
    formatTimeDilation() {
        const mult = this.timeDilationMultiplier;
        if (!isFinite(mult) || mult > 1e12) {
            return "Infinite Dilation (Inside Ergosphere)";
        }
        
        const earthSecondsPerLocalHour = 3600.0 * mult;
        const earthDays = earthSecondsPerLocalHour / 86400.0;
        const earthYears = earthDays / 365.25;

        if (earthYears >= 1.0) {
            return `1 Hour Here = ${earthYears.toFixed(1)} Earth Years`;
        } else if (earthDays >= 1.0) {
            return `1 Hour Here = ${earthDays.toFixed(1)} Earth Days`;
        } else {
            const earthHours = earthSecondsPerLocalHour / 3600.0;
            return `1 Hour Here = ${earthHours.toFixed(2)} Earth Hours`;
        }
    }

    // ZAMO (Frame Dragging) Angular Velocity in rad / GM-time
    zamoOmega(r, thetaRad) {
        const a = this.spin;
        const a2 = a * a;
        const delta = r * r - 2.0 * r + a2;
        const s = Math.sin(thetaRad);
        const ra = r * r + a2;
        return (2.0 * a * r) / ((ra * ra) - a2 * delta * s * s);
    }
}
