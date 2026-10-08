// web/js/shader.js
// Ultra-High Quality Relativistic WebGL2 Kerr Raymarching Shader
// Butter-smooth RK2 Symplectic Geodesic Integration + Multi-Angle High-Detail Volumetric Plasma Simulation
// Seamless 3D Continuous Hydrodynamic Fluid Turbulence - Zero Radial Moiré, Zero Seams, Zero Stepping Grid

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

// ---- 3D Continuous Hash & Quintic Smooth Noise -------------------------------
float Hash31(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
}

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

// 3D Quintic-smoothed noise (C2 continuous in all directions - no grid or banding)
float Noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float n000 = Hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = Hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = Hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = Hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = Hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = Hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = Hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = Hash31(i + vec3(1.0, 1.0, 1.0));

    float x00 = mix(n000, n100, u.x);
    float x10 = mix(n010, n110, u.x);
    float x01 = mix(n001, n101, u.x);
    float x11 = mix(n011, n111, u.x);

    float y0 = mix(x00, x10, u.y);
    float y1 = mix(x01, x11, u.y);

    return mix(y0, y1, u.z);
}

// Multi-octave continuous 3D fractal noise with domain rotation
float FBM3D(vec3 p) {
    float val = 0.0;
    float amp = 0.52;
    mat3 rot = mat3(
        0.00,  0.80,  0.60,
       -0.80,  0.36, -0.48,
       -0.60, -0.48,  0.64
    );
    for (int i = 0; i < 4; i++) {
        val += amp * Noise3D(p);
        p = rot * p * 2.02 + vec3(1.7, 3.2, 0.9);
        amp *= 0.48;
    }
    return val;
}

// 360° Cosmic Starfield
vec3 CosmicSkybox(vec3 dir) {
    vec3 p = dir * 140.0;
    vec3 cell = floor(p);
    vec3 f = fract(p);
    vec3 h = Hash33(cell);
    float starHit = step(0.972, h.x);
    vec3 ctr = 0.2 + 0.6 * Hash33(cell + 19.0);
    float d = length(f - ctr);
    float starBrightness = starHit * smoothstep(0.14, 0.0, d) * (0.2 + 3.5 * h.y * h.y);
    vec3 starTint = mix(vec3(1.0, 0.9, 0.8), vec3(0.75, 0.88, 1.0), h.z);
    return starBrightness * starTint * 1.1;
}

// 100% Seamless 3D Multi-Scale Fluid Flow (High Detailing from ALL 360° Angles)
float VolumetricCloudBillows(vec3 q, float r, float phiRot) {
    vec2 circ = vec2(cos(phiRot), sin(phiRot));
    float logR = log(max(r, 0.5));
    
    // Scale-invariant logarithmic spiral coordinates
    vec3 pCoord = vec3(circ * (1.3 + 0.35 * logR), logR * 1.15 + q.y * 1.8);

    // Multi-tier domain warping for fluid vortices and filamentary wisps
    vec3 warp1 = vec3(
        FBM3D(pCoord),
        FBM3D(pCoord + vec3(4.3, 1.7, 2.9)),
        FBM3D(pCoord + vec3(1.8, 5.2, 3.4))
    );
    
    vec3 pWarped = pCoord + 1.25 * warp1;
    float baseFBM = FBM3D(pWarped);
    
    // Billowy cloud crests & smoky fluid wisps
    float billows = 1.0 - abs(baseFBM - 0.5) * 2.0;
    float fineWisps = FBM3D(pWarped * 2.2 + vec3(0.0, 0.0, u_time * 0.06));
    
    float cloud = mix(billows, fineWisps, 0.32);
    return smoothstep(0.12, 0.88, cloud) * 1.35;
}

// Rich Warm Interstellar Palette: Glowing Honey Gold, Peach Cream, Volcanic Copper
vec3 VolumetricCloudShading(float r, float g, float cloudPattern, float vertH) {
    vec3 deepAmber = vec3(0.38, 0.14, 0.03);      // Deep shadowed cloud crevices
    vec3 volcanicCopper = vec3(0.85, 0.40, 0.12);  // Warm mid-tone cloud body
    vec3 honeyGold = vec3(1.35, 0.88, 0.38);       // Sunlit golden cloud billows
    vec3 incandescentCream = vec3(2.3, 1.95, 1.55); // Radiant throat core

    float rNorm = (r - u_rIn) / max(u_rOut - u_rIn, 0.1);
    float coreLight = exp(-rNorm * 2.0) * pow(max(g, 0.0), 1.1);

    // Smooth gradient color mixing
    vec3 col = mix(deepAmber, volcanicCopper, smoothstep(0.1, 0.45, cloudPattern));
    col = mix(col, honeyGold, smoothstep(0.4, 0.8, cloudPattern));
    col = mix(col, incandescentCream, clamp(coreLight * 1.3, 0.0, 1.0));

    col *= (0.8 + 0.45 * cloudPattern);
    return col;
}

// ACES Filmic Tone Mapping
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Volumetric Accretion Disk Sampling
vec4 SampleAccretionDisk(vec3 q, vec3 rayDir, float stepLen) {
    float r = length(q.xz);
    if (r < u_rIn || r > u_rOut) return vec4(0.0);

    // Relativistic orbital velocity in Kerr equatorial plane
    vec3 phiVec = normalize(vec3(q.z, 0.0, -q.x)) * u_orbitSign;
    float beta = min(0.985, inversesqrt(max(r - 2.0 + u_spin * 0.5, 0.06)));
    float gamma = inversesqrt(max(1.0 - beta * beta, 0.001));
    vec3 n = -rayDir;

    // Doppler factor D
    float D = 1.0 / (gamma * max(1.0 - beta * dot(phiVec, n), 0.01));

    // Gravitational Redshift g_grav
    float cosTheta = q.y / max(r, 0.001);
    float sigma = r * r + u_spin * u_spin * cosTheta * cosTheta;
    float gGrav = sqrt(max(1.0 - 2.0 * r / sigma, 0.0));

    float g = mix(1.0, D, u_dopplerOn) * mix(1.0, gGrav, u_redshiftOn);

    // Differential Keplerian orbital shear
    float phi = atan(q.z, q.x);
    float omega = 1.0 / (pow(r, 1.5) + u_spin * u_orbitSign);
    float phiRot = phi - omega * u_time * 0.35 * u_orbitSign;

    float cloudPattern = VolumetricCloudBillows(q, r, phiRot);

    // Smooth Gaussian scale-height envelope
    float scaleHeight = max(0.06, u_diskThickness * sqrt(r / u_rIn));
    float vertFalloff = exp(-0.5 * (q.y * q.y) / (scaleHeight * scaleHeight));

    // Continuous radial emission profile
    float rNorm = r / u_rIn;
    float flux = pow(1.0 / max(rNorm, 1.0), 1.05) * smoothstep(u_rOut, u_rOut * 0.75, r);
    float innerGlow = smoothstep(u_rIn * 3.5, u_rIn, r) * 1.6;

    float radiance = (flux * 1.5 + innerGlow * 1.8) * pow(max(g, 0.0), 1.7) * (0.4 + 0.6 * cloudPattern) * u_diskBrightness;
    vec3 emission = VolumetricCloudShading(r, g, cloudPattern, abs(q.y)) * radiance;

    float radialFade = smoothstep(u_rIn, u_rIn * 1.03, r) * (1.0 - smoothstep(u_rOut * 0.95, u_rOut, r));
    
    // Beer-Lambert continuous optical thickness
    float opticalDensity = u_diskOpacity * vertFalloff * radialFade * (stepLen / max(scaleHeight, 0.05));
    float pointAlpha = 1.0 - exp(-clamp(opticalDensity, 0.0, 4.0));

    return vec4(emission, pointAlpha);
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
        if (r > 65.0 && dot(pos, vel) > 0.0) {
            break;
        }

        // Smooth adaptive integration step size (ensures full upper & lower Einstein arch coverage)
        float dt = u_stepScale * clamp(0.048 * r + 0.012 * sqrt(r), 0.014, 3.5);

        // 2nd-Order Runge-Kutta (Midpoint) Symplectic Integration for Butter-Smooth Curved Rays
        vec3 k1 = GetGeodesicAcc(pos, vel);
        vec3 posMid = pos + vel * (0.5 * dt);
        vec3 velMid = vel + k1 * (0.5 * dt);
        vec3 k2 = GetGeodesicAcc(posMid, velMid);

        vec3 pn = pos + velMid * dt;
        vec3 vn = normalize(vel + k2 * dt);
        float stepDist = length(pn - pos);

        // Continuous Volumetric & Exact Equatorial Plane Sampling
        float diskH = max(0.08, u_diskThickness * 3.0 * sqrt(r / max(u_rIn, 0.1)));
        
        // Exact equatorial plane crossing (zero stepping artifacts across all angles)
        if (pos.y * pn.y < 0.0) {
            float tCross = clamp(-pos.y / (pn.y - pos.y + 1e-7), 0.0, 1.0);
            vec3 hitPlane = mix(pos, pn, tCross);
            float planeR = length(hitPlane.xz);
            if (planeR >= u_rIn && planeR <= u_rOut && transmit > 0.008) {
                vec4 diskSample = SampleAccretionDisk(hitPlane, vn, max(stepDist, 0.04));
                if (diskSample.a > 0.0) {
                    col += transmit * diskSample.rgb * diskSample.a;
                    transmit *= (1.0 - diskSample.a);
                }
            }
        } 
        else if (abs(pos.y) < diskH && transmit > 0.008) {
            vec3 midPos = 0.5 * (pos + pn);
            vec4 diskSample = SampleAccretionDisk(midPos, vn, stepDist);
            if (diskSample.a > 0.0) {
                col += transmit * diskSample.rgb * diskSample.a;
                transmit *= (1.0 - diskSample.a);
            }
        }

        // Track overlay proximity
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

        // Multiple Concentric Golden Photon Rings
        if (u_photonGlow > 0.01) {
            float d1 = abs(minR - rPh);
            float d2 = abs(minR - (rPh * 1.038));
            float d3 = abs(minR - (rPh * 1.068));

            float ring1 = exp(-d1 * u_photonSharpness) * u_photonIntensity * 2.0;
            float ring2 = exp(-d2 * (u_photonSharpness * 1.3)) * u_photonIntensity * 1.0;
            float ring3 = exp(-d3 * (u_photonSharpness * 1.7)) * u_photonIntensity * 0.5;

            vec3 ringCol1 = vec3(2.0, 1.75, 1.35) * ring1;
            vec3 ringCol2 = vec3(1.5, 1.2, 0.75) * ring2;
            vec3 ringCol3 = vec3(1.1, 0.75, 0.4) * ring3;

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

    // Soft Golden Atmospheric Horizon Bloom
    float horizBloom = exp(-abs(uv.y + 0.18) * 10.0) * 0.32 * smoothstep(0.1, 1.0, length(col));
    col += vec3(1.4, 1.05, 0.65) * horizBloom;

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
        float edgeFog = smoothstep(0.55, 0.88, visorDist) * 0.08 * Noise3D(vec3(uv * 14.0, u_time * 0.02));
        
        // Visor glass darkening tint & HUD frame color
        vec3 frameCol = vec3(0.015, 0.02, 0.03);
        col = mix(frameCol, col, rimMask);
        col += (goldCoating + vec3(0.8, 0.6, 0.3) * edgeFog) * rimMask;
        col += vec3(0.05, 0.07, 0.09) * innerBezel;
    }

    // ACES Filmic Tone Mapping + Exposure
    col = ACESFilm(col * u_exposure);

    // Temporal Sub-pixel Dithering (Eliminates 8-bit banding)
    float dither = (Hash21(gl_FragCoord.xy + fract(u_time)) - 0.5) / 255.0;
    col += dither;

    fragColor = vec4(col, 1.0);
}
`;
