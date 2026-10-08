// web/js/shader.js
// Ultra-High Quality Relativistic WebGL2 Kerr Raymarching Shader
// Butter-smooth RK2 Symplectic Geodesic Integration + Multi-Scale Dynamic Orbital Plasma Rays
// True Interstellar Gargantua Architecture: Thin Geodesic Plane Crossing, Zero Fogging, Clear Shadow Gap

export const vertexShaderSource = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

// Uniforms
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_camPos;
uniform vec3 u_camTarget;
uniform vec3 u_camUp;
uniform float u_fov;
uniform vec3 u_eyeOffset;
uniform float u_isVR;
uniform mat3 u_vrOrientation;

// Physics Parameters
uniform float u_spin;
uniform float u_orbitSign;
uniform float u_rIn;
uniform float u_rOut;
uniform float u_diskThickness;
uniform float u_diskBrightness;
uniform float u_tMaxK;
uniform float u_diskOpacity;
uniform float u_lensing;
uniform float u_kerrGeodesics;
uniform float u_dopplerOn;
uniform float u_redshiftOn;
uniform float u_photonGlow;
uniform float u_photonIntensity;
uniform float u_photonSharpness;
uniform float u_exposure;
uniform int u_maxSteps;
uniform float u_stepScale;
uniform float u_captureR;

// Astronaut Visor HUD & Overlays
uniform float u_showHorizon;
uniform float u_showErgosphere;
uniform float u_showISCO;
uniform float u_helmetVisor;

#define MAX_STEPS 200

// ---- Fast High-Quality Hash & Smooth 2D/3D Noise ----------------------------
float Hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

vec3 Hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
}

float Noise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = Hash21(i);
    float b = Hash21(i + vec2(1.0, 0.0));
    float c = Hash21(i + vec2(0.0, 1.0));
    float d = Hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float FBM2D(vec2 p) {
    float val = 0.0;
    float amp = 0.55;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 4; i++) {
        val += amp * Noise2D(p);
        p = rot * p * 2.15 + vec2(1.7, 3.2);
        amp *= 0.48;
    }
    return val;
}

// 360° Deep Space Starfield
vec3 CosmicSkybox(vec3 dir) {
    vec3 p = dir * 180.0;
    vec3 cell = floor(p);
    vec3 f = fract(p);
    vec3 h = Hash33(cell);
    float starHit = step(0.975, h.x);
    vec3 ctr = 0.2 + 0.6 * Hash33(cell + 19.0);
    float d = length(f - ctr);
    float starBrightness = starHit * smoothstep(0.12, 0.0, d) * (0.3 + 4.5 * h.y * h.y);
    vec3 starTint = mix(vec3(1.0, 0.94, 0.85), vec3(0.80, 0.92, 1.0), h.z);
    
    // Very faint distant background cosmic glow
    float bgGlow = FBM2D(dir.xy * 2.0) * 0.008;
    return starBrightness * starTint * 1.3 + vec3(0.02, 0.015, 0.03) * bgGlow;
}

// Continuous Dynamic Moving Relativistic Plasma Rays
// Creates fibrous, glowing rays of gas orbiting in real-time with Keplerian differential speed
float DynamicPlasmaRays(vec2 xz, float r) {
    float phi = atan(xz.y, xz.x);
    
    // Keplerian angular velocity: inner matter orbits rapidly, outer matter orbits slower
    float omega = 1.8 / (pow(r, 1.5) + u_spin * u_orbitSign * 0.5);
    float phiRot = phi - omega * u_time * 0.75 * u_orbitSign;
    
    // Spiral winding coordinates
    float logR = log(max(r, 0.5));
    float spiral = phiRot * 1.5 - logR * 5.2;

    // 1. Primary sweeping orbital stream bands
    vec2 flow1 = vec2(phiRot * 2.0, r * 3.5);
    float stream1 = sin(spiral * 6.0 + FBM2D(flow1) * 5.0) * 0.5 + 0.5;

    // 2. Fine fibrous plasma rays (glowing streams around the black hole)
    vec2 flow2 = vec2(phiRot * 5.0, r * 9.0);
    float stream2 = sin(spiral * 18.0 - FBM2D(flow2) * 6.0) * 0.5 + 0.5;

    // 3. Micro-scale filaments (visible when zooming in)
    vec2 flow3 = vec2(phiRot * 14.0, r * 22.0);
    float stream3 = sin(spiral * 42.0 + Noise2D(flow3) * 4.0) * 0.5 + 0.5;

    // 4. Turbulent swirling vortices & Kelvin-Helmholtz eddies
    vec2 turbCoord = vec2(phiRot * 3.0, logR * 4.0);
    float turb = FBM2D(turbCoord + vec2(u_time * 0.05, 0.0));

    // Blend streams into layered, dynamic fibrous plasma
    float rays = mix(stream1, stream2, 0.52);
    rays = mix(rays, stream3, 0.38);
    rays = rays * (0.65 + 0.75 * turb);

    return smoothstep(0.08, 0.95, rays) * 1.4;
}

// Authentic Interstellar Gargantua Color Palette:
// Radiant Incandescent Pure White Core -> Cream Gold -> Warm Amber / Honey -> Smoked Bronze / Sepia Outer Wisps
vec3 VolumetricCloudShading(float r, float g, float rayPattern) {
    vec3 smokedSepia = vec3(0.20, 0.07, 0.02);
    vec3 bronzeAmber = vec3(0.75, 0.36, 0.10);
    vec3 glowingGold = vec3(1.55, 1.00, 0.45);
    vec3 peachCream = vec3(2.30, 1.85, 1.35);
    vec3 incandescentWhite = vec3(3.90, 3.55, 3.10);

    float rNorm = (r - u_rIn) / max(u_rOut - u_rIn, 0.1);
    
    // Relativistic Novikov-Thorne thermal profile: peak near inner edge
    float rRel = max(r / max(u_rIn, 0.5), 1.001);
    float tProfile = pow(1.0 / rRel, 0.75) * pow(max(1.0 - sqrt(1.0 / rRel), 0.0), 0.25) * 3.0;
    float coreLight = clamp((tProfile * 1.8 + exp(-rNorm * 3.0)) * pow(max(g, 0.0), 1.2), 0.0, 3.0);

    // Dynamic gradient mixing
    vec3 col = mix(smokedSepia, bronzeAmber, smoothstep(0.05, 0.35, rayPattern));
    col = mix(col, glowingGold, smoothstep(0.32, 0.70, rayPattern));
    col = mix(col, peachCream, smoothstep(0.65, 0.95, rayPattern));
    col = mix(col, incandescentWhite, clamp(coreLight * 0.85 + smoothstep(0.85, 1.35, rayPattern) * 0.65, 0.0, 1.0));

    col *= (0.75 + 0.55 * rayPattern);
    return col;
}

// Filmic ACES Tone Mapping
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Thin Accretion Disk Crossing Sample
vec4 SampleAccretionDiskCrossing(vec3 hitPos, vec3 rayDir) {
    float r = length(hitPos.xz);
    if (r < u_rIn || r > u_rOut) return vec4(0.0);

    // Relativistic orbital velocity in Kerr equatorial plane
    vec3 phiVec = normalize(vec3(hitPos.z, 0.0, -hitPos.x)) * u_orbitSign;
    float beta = min(0.985, inversesqrt(max(r - 2.0 + u_spin * 0.5, 0.06)));
    float gamma = inversesqrt(max(1.0 - beta * beta, 0.001));
    vec3 n = -rayDir;

    // Doppler factor D
    float D = 1.0 / (gamma * max(1.0 - beta * dot(phiVec, n), 0.01));

    // Gravitational Redshift
    float gGrav = sqrt(max(1.0 - 2.0 / r, 0.0));
    float g = mix(1.0, D, u_dopplerOn) * mix(1.0, gGrav, u_redshiftOn);

    // Dynamic moving plasma rays pattern
    float rayPattern = DynamicPlasmaRays(hitPos.xz, r);

    // Disk physical scale height
    float scaleHeight = max(0.03, u_diskThickness * sqrt(r / u_rIn));
    float slantPath = (2.0 * scaleHeight) / max(abs(rayDir.y), 0.045);

    // Emission Profile
    float rNorm = r / u_rIn;
    float flux = pow(1.0 / max(rNorm, 1.0), 1.02) * smoothstep(u_rOut, u_rOut * 0.75, r);
    float innerGlow = smoothstep(u_rIn * 3.5, u_rIn, r) * 2.2;

    float radiance = (flux * 1.6 + innerGlow * 2.2) * pow(max(g, 0.0), 1.65) * (0.35 + 0.65 * rayPattern) * u_diskBrightness;
    vec3 emission = VolumetricCloudShading(r, g, rayPattern) * radiance;

    float radialFade = smoothstep(u_rIn, u_rIn * 1.02, r) * (1.0 - smoothstep(u_rOut * 0.94, u_rOut, r));
    
    // Physical Optical Depth across disk thickness
    float opticalDepth = u_diskOpacity * radialFade * (0.7 + 0.6 * rayPattern) * (slantPath / 0.12);
    float alpha = 1.0 - exp(-clamp(opticalDepth, 0.0, 4.5));

    return vec4(emission, alpha);
}

// Relativistic Geodesic Acceleration Field (Kerr Frame Dragging + Schwarzschild Lensing)
vec3 GetGeodesicAcc(vec3 p, vec3 v) {
    float r = length(p);
    float r2 = r * r;
    float r5 = r2 * r2 * r;

    vec3 h = cross(p, v);
    float h2 = dot(h, h);

    // Schwarzschild Gravitational Lensing Acceleration
    vec3 acc = -3.0 * u_lensing * h2 * p / max(r5, 1e-4);

    // Kerr Frame-Dragging Spin-Orbit Coupling
    if (u_kerrGeodesics > 0.5) {
        float hy = h.y * u_orbitSign;
        vec3 spinCoupling = 3.0 * hy * p + cross(h, vec3(0.0, u_orbitSign, 0.0)) * r;
        acc += u_lensing * (2.0 * u_spin / max(r5, 1e-4)) * spinCoupling;
    }
    return acc;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // Camera Ray Generation
    vec3 camPos = u_camPos + u_eyeOffset;
    vec3 camTarget = u_camTarget;
    vec3 forward = normalize(camTarget - u_camPos);
    vec3 right = normalize(cross(forward, u_camUp));
    vec3 up = cross(right, forward);

    float tanFov = tan(radians(u_fov * 0.5));
    vec3 localRayDir = normalize(forward + right * uv.x * tanFov + up * uv.y * tanFov);

    // Apply VR / Gyro rotation if active
    vec3 rayDir = (u_isVR > 0.5) ? normalize(u_vrOrientation * localRayDir) : localRayDir;

    // Initial ray state
    vec3 pos = camPos;
    vec3 vel = rayDir;

    vec3 col = vec3(0.0);
    float transmit = 1.0;
    bool captured = false;
    float minR = length(pos);
    float rHorizon = 1.0 + sqrt(max(0.0, 1.0 - u_spin * u_spin));
    float rPh = 2.0 * (1.0 + cos((2.0 / 3.0) * acos(-clamp(u_spin * u_orbitSign, -0.999, 0.999))));

    // Educational Overlays
    float minErgoDist = 9999.0;
    float minHorizonDist = 9999.0;
    float minIscoDist = 9999.0;

    for (int k = 0; k < MAX_STEPS; k++) {
        if (k >= u_maxSteps) break;

        float r = length(pos);
        minR = min(minR, r);

        // Kerr Horizon Capture Check
        if (r < rHorizon) {
            captured = true;
            break;
        }

        // Escape boundary check
        if (r > 60.0 && dot(pos, vel) > 0.0) {
            break;
        }

        // Smooth adaptive integration step size
        float dt = u_stepScale * clamp(0.042 * r + 0.010 * sqrt(r), 0.012, 3.2);

        // 2nd-Order Runge-Kutta (Midpoint) Symplectic Integration
        vec3 k1 = GetGeodesicAcc(pos, vel);
        vec3 posMid = pos + vel * (0.5 * dt);
        vec3 velMid = vel + k1 * (0.5 * dt);
        vec3 k2 = GetGeodesicAcc(posMid, velMid);

        vec3 pn = pos + velMid * dt;
        vec3 vn = normalize(vel + k2 * dt);

        // Exact Equatorial Plane Crossing (Accretion Disk Lensing Arch & Front Band)
        // Clean geometric intersection: zero false fogging, pristine black shadow gap
        if (pos.y * pn.y <= 0.0 && transmit > 0.005) {
            float tCross = clamp(-pos.y / (pn.y - pos.y + 1e-7), 0.0, 1.0);
            vec3 hitPlane = mix(pos, pn, tCross);
            float planeR = length(hitPlane.xz);
            
            if (planeR >= u_rIn && planeR <= u_rOut) {
                vec4 diskSample = SampleAccretionDiskCrossing(hitPlane, vn);
                if (diskSample.a > 0.0) {
                    col += transmit * diskSample.rgb * diskSample.a;
                    transmit *= (1.0 - diskSample.a);
                }
            }
        }

        // Proximity for overlays
        if (u_showErgosphere > 0.5) {
            float cosTh = pos.y / max(r, 0.001);
            float rErgo = 1.0 + sqrt(max(0.0, 1.0 - u_spin * u_spin * cosTh * cosTh));
            minErgoDist = min(minErgoDist, abs(r - rErgo));
        }
        if (u_showHorizon > 0.5) {
            minHorizonDist = min(minHorizonDist, abs(r - rHorizon));
        }
        if (u_showISCO > 0.5) {
            minIscoDist = min(minIscoDist, length(vec2(length(pos.xz) - u_rIn, pos.y)));
        }

        pos = pn;
        vel = vn;
    }

    if (!captured) {
        // Distant Cosmic Skybox with Gravitational Deflection
        col += transmit * CosmicSkybox(vel);

        // Multiple Concentric Razor-Sharp Photon Rings with Relativistic Dispersion
        if (u_photonGlow > 0.01) {
            float d1 = abs(minR - rPh);
            float d2 = abs(minR - (rPh * 1.032));
            float d3 = abs(minR - (rPh * 1.058));

            float ring1 = exp(-d1 * u_photonSharpness * 1.6) * u_photonIntensity * 3.2;
            float ring2 = exp(-d2 * (u_photonSharpness * 2.0)) * u_photonIntensity * 1.4;
            float ring3 = exp(-d3 * (u_photonSharpness * 2.5)) * u_photonIntensity * 0.7;

            // Chromatic dispersion (blue-shifted sharp inner lip, warm gold outer halo)
            vec3 ringCol1 = vec3(3.2, 2.7, 2.1) * ring1;
            vec3 ringCol2 = vec3(2.0, 1.45, 0.85) * ring2;
            vec3 ringCol3 = vec3(1.3, 0.80, 0.38) * ring3;

            col += transmit * (ringCol1 + ringCol2 + ringCol3);
        }
    }

    // Educational Wireframe Overlays
    if (u_showErgosphere > 0.5) {
        float ergoWire = smoothstep(0.08, 0.0, minErgoDist) * 0.45;
        col += vec3(0.85, 0.3, 1.0) * ergoWire;
    }
    if (u_showHorizon > 0.5) {
        float horizWire = smoothstep(0.06, 0.0, minHorizonDist) * 0.55;
        col += vec3(0.2, 0.85, 1.0) * horizWire;
    }
    if (u_showISCO > 0.5) {
        float iscoWire = smoothstep(0.12, 0.0, minIscoDist) * 0.5;
        col += vec3(0.3, 1.0, 0.4) * iscoWire;
    }

    // Cinematic Anamorphic Lens Flare & Atmospheric Horizon Glow
    float centerLum = clamp(length(col) * 0.22, 0.0, 3.0);
    // Subtle horizontal streak flare (characteristic of Interstellar 70mm anamorphic lenses)
    float horizStreak = exp(-abs(uv.y * 32.0)) * exp(-abs(uv.x * 0.45)) * centerLum * 0.28;
    vec3 streakColor = vec3(1.4, 1.15, 0.85) * horizStreak;
    
    // Soft golden core diffusion bloom
    float coreBloom = exp(-length(uv) * 2.2) * centerLum * 0.12;
    vec3 bloomColor = vec3(1.3, 0.95, 0.55) * coreBloom;
    col += streakColor + bloomColor;

    // Astronaut Space-Suit First-Person Eye View (Helmet Visor Glass & EVA Rim)
    if (u_helmetVisor > 0.5) {
        vec2 hUV = uv * vec2(1.0, 1.12);
        float visorDist = length(hUV);
        
        // Curved EVA Helmet Outer Rim & Bezel
        float rimMask = smoothstep(0.96, 0.72, visorDist);
        float innerBezel = smoothstep(0.92, 0.82, visorDist) * (1.0 - smoothstep(0.98, 0.88, visorDist));
        
        // Gold Anti-Radiation Thin Film Coating Reflection
        float goldGleam = pow(max(dot(normalize(vec3(uv, 1.0)), normalize(vec3(0.4, 0.6, 0.8))), 0.0), 4.0) * 0.12;
        vec3 goldCoating = vec3(1.1, 0.85, 0.35) * goldGleam;
        
        // Subtle optical breathing condensation & micro-glass texture near edges
        float edgeFog = smoothstep(0.55, 0.88, visorDist) * 0.08 * Noise2D(uv * 14.0);
        
        // Visor glass darkening tint & HUD frame color
        vec3 frameCol = vec3(0.015, 0.02, 0.03);
        col = mix(frameCol, col, rimMask);
        col += (goldCoating + vec3(0.8, 0.6, 0.3) * edgeFog) * rimMask;
        col += vec3(0.05, 0.07, 0.09) * innerBezel;
    }

    // ACES Filmic Tone Mapping + Dynamic Range Exposure
    col = ACESFilm(col * u_exposure);

    // Fine 35mm Organic Film Grain & Temporal Sub-pixel Dithering
    float grain = (Hash21(gl_FragCoord.xy * 1.5 + fract(u_time * 17.13)) - 0.5) * 0.015;
    col += grain;

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
