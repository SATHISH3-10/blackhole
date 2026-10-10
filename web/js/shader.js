// web/js/shader.js
// Ultra-High Quality Relativistic WebGL2 Kerr Raymarching Shader
// Butter-smooth RK2 Symplectic Geodesic Integration + True Cinematic Interstellar Accretion Disk
// Continuous Keplerian Plasma Streams, Rich Honey-Amber-Sepia Color Gradient, Zero Moiré

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
uniform vec4 u_viewport;
uniform float u_time;
uniform vec3 u_camPos;
uniform vec3 u_camTarget;
uniform vec3 u_camUp;
uniform float u_fov;
uniform vec3 u_eyeOffset;
uniform float u_isVR;
uniform mat3 u_vrOrientation;

// Universal 360° Desktop & WebXR Stereoscopic Ray System
uniform vec3 u_rayOrigin;
uniform mat3 u_rayBasis;
uniform vec2 u_tanHalfFov;
uniform vec2 u_fovOffset;

// Axiom AxEMU Spacesuit & WebXR 25-Joint Skinned Hand Tracking System
uniform vec3 u_jointsL[25];
uniform vec3 u_jointsR[25];
uniform vec4 u_gestureState; // x: left pinch, y: right pinch, z: two-hand span, w: hand tracking active
uniform vec3 u_handL;
uniform vec3 u_handR;
uniform vec3 u_handL_idx;
uniform vec3 u_handR_idx;
uniform vec3 u_handL_thumb;
uniform vec3 u_handR_thumb;
uniform vec4 u_handState; // x: left active, y: right active, z: left pinch, w: right pinch
uniform float u_heartRateBPM;
uniform float u_timeDilation;
uniform float u_horizonDist;

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
uniform float u_cinematicDisk;

// Astronaut Visor HUD & Overlays
uniform float u_showHorizon;
uniform float u_showErgosphere;
uniform float u_showISCO;
uniform float u_helmetVisor;

#define MAX_STEPS 200

// ---- High-Quality Hash & Continuous Smooth 2D/3D Noise -----------------------
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

// C2 Continuous quintic smooth noise (eliminates grid artifacts and moiré)
float SmoothNoise2D(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float a = Hash21(i);
    float b = Hash21(i + vec2(1.0, 0.0));
    float c = Hash21(i + vec2(0.0, 1.0));
    float d = Hash21(i + vec2(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float FBM2D(vec2 p) {
    float val = 0.0;
    float amp = 0.55;
    mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
    for (int i = 0; i < 3; i++) {
        val += amp * SmoothNoise2D(p);
        p = rot * p * 2.15 + vec2(1.7, 3.2);
        amp *= 0.46;
    }
    return val;
}

// 360° Deep Space Starfield
vec3 CosmicSkybox(vec3 dir) {
    vec3 p = dir * 180.0;
    vec3 cell = floor(p);
    vec3 f = fract(p);
    vec3 h = Hash33(cell);
    float starHit = step(0.976, h.x);
    vec3 ctr = 0.2 + 0.6 * Hash33(cell + 19.0);
    float d = length(f - ctr);
    float starBrightness = starHit * smoothstep(0.12, 0.0, d) * (0.3 + 4.0 * h.y * h.y);
    vec3 starTint = mix(vec3(1.0, 0.94, 0.85), vec3(0.80, 0.92, 1.0), h.z);
    
    float galacticBand = exp(-pow(abs(dir.y + 0.18 * sin(dir.x * 5.0)), 2.0) * 22.0);
    float bgDust = FBM2D(vec2(atan(dir.z, dir.x), dir.y) * vec2(3.4, 5.0)) * galacticBand;
    vec3 deepSpace = vec3(0.0008, 0.0015, 0.0035);
    vec3 dustColor = mix(vec3(0.010, 0.006, 0.018), vec3(0.015, 0.025, 0.050), bgDust);
    return deepSpace + dustColor * 0.42 + starBrightness * starTint * 1.2;
}

// Continuous Keplerian Plasma Streams (Fluid Flow Around the Black Hole)
float InterstellarPlasmaFlow(vec2 xz, float r) {
    float phi = atan(xz.y, xz.x);
    float omega = 1.6 / (pow(r, 1.5) + u_spin * u_orbitSign * 0.4);
    float phiRot = phi - omega * u_time * 0.65 * u_orbitSign;
    
    float logR = log(max(r, 0.5));
    vec2 spiralCoord = vec2(phiRot * 2.2 - logR * 3.8, logR * 2.5);

    float baseTurb = FBM2D(spiralCoord * 1.35 + vec2(u_time * 0.02, 0.0));
    float billows = 1.0 - abs(baseTurb - 0.5) * 2.0;
    float ribbon = 0.5 + 0.5 * sin(phiRot * 4.0 - logR * 5.5 + baseTurb * 2.2);
    
    float pattern = mix(billows, ribbon, 0.35);
    return smoothstep(0.18, 0.82, pattern);
}

// Authentic Interstellar Color Gradient:
vec3 InterstellarColorGrading(float r, float g, float flowPattern) {
    vec3 smokedSepia = vec3(0.18, 0.06, 0.015);
    vec3 bronzeAmber = vec3(0.70, 0.28, 0.06);
    vec3 honeyGold = vec3(1.45, 0.85, 0.28);
    vec3 peachCream = vec3(2.20, 1.65, 1.10);
    vec3 incandescentWhite = vec3(3.60, 3.20, 2.70);

    float rNorm = clamp((r - u_rIn) / max(u_rOut - u_rIn, 0.1), 0.0, 1.0);
    float rRel = max(r / max(u_rIn, 0.5), 1.001);
    float tProfile = pow(1.0 / rRel, 0.85) * pow(max(1.0 - sqrt(1.0 / rRel), 0.0), 0.25) * 2.8;
    float innerThermal = clamp(tProfile * 1.4 * pow(max(g, 0.0), 1.15), 0.0, 2.5);

    vec3 col = mix(smokedSepia, bronzeAmber, smoothstep(0.08, 0.40, flowPattern));
    col = mix(col, honeyGold, smoothstep(0.35, 0.72, flowPattern));
    col = mix(col, peachCream, smoothstep(0.68, 0.95, flowPattern));
    
    float whiteMix = clamp(innerThermal * 0.75 + smoothstep(0.85, 1.0, flowPattern) * exp(-rNorm * 4.0) * 0.8, 0.0, 1.0);
    col = mix(col, incandescentWhite, whiteMix);
    col *= (0.65 + 0.70 * flowPattern);
    return col;
}

vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

vec4 SampleAccretionDiskCrossing(vec3 hitPos, vec3 rayDir) {
    float r = length(hitPos.xz);
    if (r < u_rIn || r > u_rOut) return vec4(0.0);

    vec3 phiVec = normalize(vec3(hitPos.z, 0.0, -hitPos.x)) * u_orbitSign;
    float beta = min(0.985, inversesqrt(max(r - 2.0 + u_spin * 0.5, 0.06)));
    float gamma = inversesqrt(max(1.0 - beta * beta, 0.001));
    vec3 n = -rayDir;

    float D = 1.0 / (gamma * max(1.0 - beta * dot(phiVec, n), 0.01));
    float gGrav = sqrt(max(1.0 - 2.0 / r, 0.0));
    float g = mix(1.0, D, u_dopplerOn) * mix(1.0, gGrav, u_redshiftOn);

    float flowPattern = InterstellarPlasmaFlow(hitPos.xz, r);
    float scaleHeight = max(0.03, u_diskThickness * sqrt(r / u_rIn));
    float slantPath = (2.0 * scaleHeight) / max(abs(rayDir.y), 0.045);

    float rNorm = (r - u_rIn) / max(u_rOut - u_rIn, 0.1);
    float radialDecay = pow(max(1.0 - rNorm, 0.0), 1.6);
    float innerGlow = smoothstep(u_rIn * 2.8, u_rIn, r) * 1.5;

    float radiance = (radialDecay * 1.8 + innerGlow * 1.6) * pow(max(g, 0.0), 1.5) * (0.4 + 0.6 * flowPattern) * u_diskBrightness;
    vec3 emission = InterstellarColorGrading(r, g, flowPattern) * radiance;

    float innerFade = smoothstep(u_rIn, u_rIn * 1.03, r);
    float outerFade = smoothstep(u_rOut, u_rOut * 0.88, r);
    float radialMask = innerFade * outerFade;
    
    float opticalDepth = u_diskOpacity * radialMask * (0.6 + 0.6 * flowPattern) * (slantPath / 0.10);
    float alpha = 1.0 - exp(-clamp(opticalDepth, 0.0, 4.0));
    return vec4(emission, alpha);
}

vec3 GetGeodesicAcc(vec3 p, vec3 v) {
    float r = length(p);
    float r2 = r * r;
    float r5 = r2 * r2 * r;
    vec3 h = cross(p, v);
    float h2 = dot(h, h);

    vec3 acc = -3.0 * u_lensing * h2 * p / max(r5, 1e-4);
    if (u_kerrGeodesics > 0.5) {
        float hy = h.y * u_orbitSign;
        vec3 spinCoupling = 3.0 * hy * p + cross(h, vec3(0.0, u_orbitSign, 0.0)) * r;
        acc += u_lensing * (2.0 * u_spin / max(r5, 1e-4)) * spinCoupling;
    }
    return acc;
}

// ---- Full 3D Axiom AxEMU Space Suit & 25-Joint Articulated Hand SDF System ----
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
}

float sdRoundBox(vec3 p, vec3 b, float r) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdTorus(vec3 p, vec2 t) {
    vec2 q = vec2(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
}

float sdTaperedCapsule(vec3 p, vec3 a, vec3 b, float r1, float r2) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    float r = mix(r1, r2, h);
    return length(pa - ba * h) - r;
}

struct SuitHit {
    float d;
    float matId; 
    // 1: White Orthofabric, 2: Axiom Crimson Red Stripe, 3: Charcoal Convolute Pleat, 
    // 4: Dark Silicone Grip, 5: Brushed Aluminum DCM, 6: HUD Holographic Screen, 
    // 7: "AX" Decal, 8: Light Ice-Blue Boot Sole
    vec3 localPos;
};

SuitHit opUnion(SuitHit m1, SuitHit m2) {
    if (m1.d < m2.d) return m1;
    return m2;
}

// Polynomial Smooth Minimum for Organic Spacewalk Glove & Body Contouring
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}

// Evaluates 25-Joint WebXR Articulated Spacewalk Glove (Axiom AxEMU Extravehicular Glove)
SuitHit EvaluateSkinnedHand(vec3 p, vec3 j[25], bool isLeft) {
    SuitHit res = SuitHit(1e5, 0.0, p);
    vec3 wrist = j[0];

    // 1. Titanium Wrist Disconnect Locking Collar Ring
    float dRing = sdTorus(p - (wrist - vec3(0.0, 0.0, 0.010)), vec2(0.024, 0.0035));
    res = opUnion(res, SuitHit(dRing, 5.0, p));

    // 2. Anatomical Metacarpal Palm & Dorsal Glove Body
    // Metacarpal bones radiating from wrist ring to each knuckle base
    float dMeta0 = sdTaperedCapsule(p, wrist, j[1], 0.019, 0.0090);  // Thumb base
    float dMeta1 = sdTaperedCapsule(p, wrist, j[5], 0.019, 0.0080);  // Index MCP
    float dMeta2 = sdTaperedCapsule(p, wrist, j[10], 0.019, 0.0080); // Middle MCP
    float dMeta3 = sdTaperedCapsule(p, wrist, j[15], 0.018, 0.0075); // Ring MCP
    float dMeta4 = sdTaperedCapsule(p, wrist, j[20], 0.017, 0.0070); // Pinky MCP

    // Smooth blend metacarpal rays into an organic tapered palm
    float dPalmBody = smin(dMeta0, dMeta1, 0.007);
    dPalmBody = smin(dPalmBody, dMeta2, 0.007);
    dPalmBody = smin(dPalmBody, dMeta3, 0.007);
    dPalmBody = smin(dPalmBody, dMeta4, 0.007);

    // Dorsal Knuckle Guard Bridge across MCP joints (Index to Pinky)
    float dKnuckleBridge = sdCapsule(p, j[5], j[20], 0.0075);
    dPalmBody = smin(dPalmBody, dKnuckleBridge, 0.006);

    res = opUnion(res, SuitHit(dPalmBody, 1.0, p));

    // 3. Articulated Finger Chains with Knuckle Rings & Tapered Tips
    // Thumb Chain (Metacarpal 1 -> Proximal 2 -> Distal 3 -> Tip 4)
    float bT1 = sdTaperedCapsule(p, j[1], j[2], 0.0080, 0.0068);
    float bT2 = sdTaperedCapsule(p, j[2], j[3], 0.0068, 0.0058);
    float bT3 = sdTaperedCapsule(p, j[3], j[4], 0.0058, 0.0048);
    float kThumb = sdSphere(p - j[2], 0.0072);
    float dThumb = smin(smin(bT1, bT2, 0.003), bT3, 0.003);
    dThumb = min(dThumb, kThumb);
    res = opUnion(res, SuitHit(dThumb, 1.0, p));

    // Index Chain (MCP 5 -> Proximal 6 -> Intermediate 7 -> Distal 8 -> Tip 9)
    float bI1 = sdTaperedCapsule(p, j[5], j[6], 0.0072, 0.0060);
    float bI2 = sdTaperedCapsule(p, j[6], j[7], 0.0060, 0.0052);
    float bI3 = sdTaperedCapsule(p, j[7], j[8], 0.0052, 0.0045);
    float bI4 = sdTaperedCapsule(p, j[8], j[9], 0.0045, 0.0038);
    float kI1 = sdSphere(p - j[6], 0.0064);
    float kI2 = sdSphere(p - j[7], 0.0056);
    float dIndex = smin(smin(bI1, bI2, 0.0025), smin(bI3, bI4, 0.0025), 0.0025);
    dIndex = min(dIndex, min(kI1, kI2));
    res = opUnion(res, SuitHit(dIndex, 1.0, p));

    // Middle Chain (MCP 10 -> Proximal 11 -> Intermediate 12 -> Distal 13 -> Tip 14)
    float bM1 = sdTaperedCapsule(p, j[10], j[11], 0.0074, 0.0062);
    float bM2 = sdTaperedCapsule(p, j[11], j[12], 0.0062, 0.0054);
    float bM3 = sdTaperedCapsule(p, j[12], j[13], 0.0054, 0.0046);
    float bM4 = sdTaperedCapsule(p, j[13], j[14], 0.0046, 0.0038);
    float kM1 = sdSphere(p - j[11], 0.0066);
    float kM2 = sdSphere(p - j[12], 0.0058);
    float dMid = smin(smin(bM1, bM2, 0.0025), smin(bM3, bM4, 0.0025), 0.0025);
    dMid = min(dMid, min(kM1, kM2));
    res = opUnion(res, SuitHit(dMid, 1.0, p));

    // Ring Chain (MCP 15 -> Proximal 16 -> Intermediate 17 -> Distal 18 -> Tip 19)
    float bR1 = sdTaperedCapsule(p, j[15], j[16], 0.0070, 0.0058);
    float bR2 = sdTaperedCapsule(p, j[16], j[17], 0.0058, 0.0050);
    float bR3 = sdTaperedCapsule(p, j[17], j[18], 0.0050, 0.0042);
    float bR4 = sdTaperedCapsule(p, j[18], j[19], 0.0042, 0.0035);
    float kR1 = sdSphere(p - j[16], 0.0062);
    float kR2 = sdSphere(p - j[17], 0.0054);
    float dRingF = smin(smin(bR1, bR2, 0.0025), smin(bR3, bR4, 0.0025), 0.0025);
    dRingF = min(dRingF, min(kR1, kR2));
    res = opUnion(res, SuitHit(dRingF, 1.0, p));

    // Pinky Chain (MCP 20 -> Proximal 21 -> Intermediate 22 -> Distal 23 -> Tip 24)
    float bP1 = sdTaperedCapsule(p, j[20], j[21], 0.0064, 0.0052);
    float bP2 = sdTaperedCapsule(p, j[21], j[22], 0.0052, 0.0044);
    float bP3 = sdTaperedCapsule(p, j[22], j[23], 0.0044, 0.0036);
    float bP4 = sdTaperedCapsule(p, j[23], j[24], 0.0036, 0.0030);
    float kP1 = sdSphere(p - j[21], 0.0056);
    float kP2 = sdSphere(p - j[22], 0.0048);
    float dPinky = smin(smin(bP1, bP2, 0.0025), smin(bP3, bP4, 0.0025), 0.0025);
    dPinky = min(dPinky, min(kP1, kP2));
    res = opUnion(res, SuitHit(dPinky, 1.0, p));

    // 4. Dark Silicone High-Friction Grip Pads (Inner Palm & Finger Pads)
    vec3 palmGripCenter = mix(wrist, (j[5] + j[10] + j[15] + j[20]) * 0.25, 0.45);
    float dPalmGrip = sdTaperedCapsule(p, wrist + vec3(0.0, 0.004, 0.0), palmGripCenter + vec3(0.0, 0.004, 0.0), 0.013, 0.015);
    
    // Finger pad grip segments
    float dPadThumb = sdCapsule(p, j[2], j[4], 0.0040);
    float dPadIndex = sdCapsule(p, j[6], j[9], 0.0034);
    float dPadMid   = sdCapsule(p, j[11], j[14], 0.0036);
    float dPadRing  = sdCapsule(p, j[16], j[19], 0.0032);
    float dPadPinky = sdCapsule(p, j[21], j[24], 0.0026);
    float dGrips = min(dPalmGrip, min(min(dPadThumb, dPadIndex), min(dPadMid, min(dPadRing, dPadPinky))));
    res = opUnion(res, SuitHit(dGrips, 4.0, p));

    // 5. Axiom Crimson Red Accent Seam along outer Index knuckle to wrist
    float dRedSeam = sdCapsule(p, wrist + (isLeft ? vec3(-0.012, 0.0, 0.0) : vec3(0.012, 0.0, 0.0)), j[5], 0.0022);
    res = opUnion(res, SuitHit(dRedSeam, 2.0, p));

    // 6. Left Wrist Holographic HUD Computer Display
    if (isLeft) {
        vec3 hudP = p - (wrist + vec3(-0.005, 0.024, -0.004));
        float dHudBezel = sdRoundBox(hudP, vec3(0.022, 0.003, 0.018), 0.002);
        res = opUnion(res, SuitHit(dHudBezel, 5.0, hudP));
        
        float dHudScreen = sdRoundBox(hudP - vec3(0.0, 0.0020, 0.0), vec3(0.018, 0.0012, 0.014), 0.001);
        res = opUnion(res, SuitHit(dHudScreen, 6.0, hudP));
    }

    return res;
}

// Evaluates the full Axiom AxEMU Spacesuit embodiment in 3D
SuitHit AstronautSuitSDF(vec3 p) {
    SuitHit res = SuitHit(1e5, 0.0, p);

    // 1. Torso & Upper Chest Unit (Exact Bounding Sphere: center at (0, -0.45, 0.10))
    vec3 torsoCenter = vec3(0.0, -0.45, 0.10);
    float dTorsoBound = length(p - torsoCenter) - 0.28;
    if (dTorsoBound < 0.04) {
        vec3 torsoP = p - vec3(0.0, -0.48, 0.08);
        float dChest = sdRoundBox(torsoP, vec3(0.18, 0.14, 0.08), 0.06);
        float dCollar = sdTorus(p - vec3(0.0, -0.28, 0.10), vec2(0.12, 0.016));
        float dShoulderL = sdSphere(p - vec3(-0.25, -0.32, 0.06), 0.08);
        float dShoulderR = sdSphere(p - vec3(0.25, -0.32, 0.06), 0.08);
        float dTorso = min(min(dChest, dCollar), min(dShoulderL, dShoulderR));
        res = opUnion(res, SuitHit(dTorso, 1.0, p));

        // Axiom Red Accent Seam Stripe
        vec3 redStripeP = p - vec3(0.065, -0.44, 0.162);
        float dRedStripe = sdRoundBox(redStripeP, vec3(0.035, 0.008, 0.003), 0.001);
        res = opUnion(res, SuitHit(dRedStripe, 2.0, p));

        // "AX" Axiom Decal
        vec3 axP = p - vec3(-0.065, -0.44, 0.162);
        float dAxDecal = sdRoundBox(axP, vec3(0.030, 0.016, 0.002), 0.001);
        res = opUnion(res, SuitHit(dAxDecal, 7.0, axP));

        // Central Aluminum Chest Control Module (DCM)
        vec3 dcmP = p - vec3(0.0, -0.36, 0.170);
        float dDCM = sdRoundBox(dcmP, vec3(0.055, 0.035, 0.012), 0.003);
        res = opUnion(res, SuitHit(dDCM, 5.0, dcmP));

        // Gold Neck Ring Coupler
        float dNeckRing = sdTorus(p - vec3(0.0, -0.26, 0.10), vec2(0.125, 0.007));
        res = opUnion(res, SuitHit(dNeckRing, 5.0, p));
    } else {
        res = opUnion(res, SuitHit(dTorsoBound, 1.0, p));
    }

    // 2. Forearm Sleeves with Charcoal Convolute Elbow Pleats & Red Racing Seams
    vec3 lWrist = u_jointsL[0];
    vec3 rWrist = u_jointsR[0];
    vec3 lElbow = vec3(-0.28, -0.34, 0.10);
    vec3 rElbow = vec3(0.28, -0.34, 0.10);

    // Left Forearm Sleeve
    float dSleeveL = sdTaperedCapsule(p, lElbow, lWrist, 0.032, 0.024);
    res = opUnion(res, SuitHit(dSleeveL, 1.0, p));
    float dRedArmL = sdCapsule(p, lElbow + vec3(-0.022, 0.0, 0.0), lWrist + vec3(-0.018, 0.0, 0.0), 0.003);
    res = opUnion(res, SuitHit(dRedArmL, 2.0, p));

    // Right Forearm Sleeve
    float dSleeveR = sdTaperedCapsule(p, rElbow, rWrist, 0.032, 0.024);
    res = opUnion(res, SuitHit(dSleeveR, 1.0, p));
    float dRedArmR = sdCapsule(p, rElbow + vec3(0.022, 0.0, 0.0), rWrist + vec3(0.018, 0.0, 0.0), 0.003);
    res = opUnion(res, SuitHit(dRedArmR, 2.0, p));

    // 3. 25-Joint Skinned AxEMU Gloves (Exact Bounding Spheres)
    // Left Hand Bounding Sphere
    vec3 lHandCtr = mix(lWrist, u_jointsL[12], 0.45);
    float dHandLBound = length(p - lHandCtr) - 0.095;
    if (dHandLBound < 0.02) {
        SuitHit handLHit = EvaluateSkinnedHand(p, u_jointsL, true);
        res = opUnion(res, handLHit);
    } else {
        res = opUnion(res, SuitHit(dHandLBound, 1.0, p));
    }

    // Right Hand Bounding Sphere
    vec3 rHandCtr = mix(rWrist, u_jointsR[12], 0.45);
    float dHandRBound = length(p - rHandCtr) - 0.095;
    if (dHandRBound < 0.02) {
        SuitHit handRHit = EvaluateSkinnedHand(p, u_jointsR, false);
        res = opUnion(res, handRHit);
    } else {
        res = opUnion(res, SuitHit(dHandRBound, 1.0, p));
    }

    return res;
}

vec3 CalcSuitNormal(vec3 p) {
    float eps = 0.002;
    vec2 e = vec2(1.0, -1.0) * eps;
    return normalize(
        e.xyy * AstronautSuitSDF(p + e.xyy).d +
        e.yyx * AstronautSuitSDF(p + e.yyx).d +
        e.yxy * AstronautSuitSDF(p + e.yxy).d +
        e.xxx * AstronautSuitSDF(p + e.xxx).d
    );
}

// Render Astronaut Space Suit Shading, Materials, Dual Helmet LED Worklights & Wrist HUD
vec3 RenderSuitShading(SuitHit hit, vec3 rayDirLocal) {
    vec3 p = hit.localPos;
    vec3 n = CalcSuitNormal(p);
    vec3 v = -rayDirLocal;

    // Dual In-Helmet High-Intensity LED Worklights
    vec3 ledLightL = normalize(vec3(-0.25, 0.40, 0.75));
    vec3 ledLightR = normalize(vec3(0.25, 0.40, 0.75));
    float nDotL1 = max(dot(n, ledLightL), 0.0);
    float nDotL2 = max(dot(n, ledLightR), 0.0);
    vec3 directLED = vec3(1.0, 0.98, 0.95) * (nDotL1 * 0.85 + nDotL2 * 0.85);

    // Accretion Disk Warm Honey-Amber Underlighting Bounce
    float underGlow = clamp(-n.y * 0.65 + 0.35, 0.0, 1.0);
    vec3 diskBounce = vec3(1.4, 0.95, 0.45) * (underGlow * u_diskBrightness * 0.40);
    vec3 spaceAmbient = vec3(0.12, 0.16, 0.22) * clamp(n.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 totalLighting = directLED + spaceAmbient + diskBounce;

    // Material 1: White Axiom Orthofabric
    vec3 baseCol = vec3(0.96, 0.97, 0.99);
    float specPower = 24.0;
    float specIntensity = 0.25;

    // Fast Orthofabric Micro-Weave Pattern (No noise function calls!)
    float weave = (sin(p.x * 240.0) * sin(p.y * 240.0)) * 0.025;
    baseCol -= weave;

    if (hit.matId > 1.5 && hit.matId < 2.5) {
        // Material 2: Axiom Crimson Red Accent Seam Lines
        baseCol = vec3(0.86, 0.08, 0.24);
        specPower = 36.0;
        specIntensity = 0.45;
    } else if (hit.matId > 2.5 && hit.matId < 3.5) {
        // Material 3: Charcoal Accordion Convolute Pleats (Elbows, Knees)
        float pleatRib = sin(p.y * 180.0) * 0.08;
        baseCol = vec3(0.28, 0.31, 0.36) + pleatRib;
        specPower = 16.0;
        specIntensity = 0.18;
    } else if (hit.matId > 3.5 && hit.matId < 4.5) {
        // Material 4: Dark Silicone Grip Pads on Palm & Fingers
        baseCol = vec3(0.14, 0.16, 0.19);
        specPower = 12.0;
        specIntensity = 0.08;
    } else if (hit.matId > 4.5 && hit.matId < 5.5) {
        // Material 5: Brushed Aluminum DCM & Titanium Ring Couplers
        baseCol = vec3(0.82, 0.85, 0.90);
        specPower = 64.0;
        specIntensity = 0.95;
    } else if (hit.matId > 5.5 && hit.matId < 6.5) {
        // Material 6: Left Wrist Holographic Mission Telemetry Screen
        vec2 hudUV = p.xz * 45.0;
        
        // Live Heart Rate Pulse Waveform (ECG spike synced to biometric synthesizer)
        float pulse = exp(-pow(fract(u_time * (u_heartRateBPM / 60.0)) * 4.0 - 0.8, 2.0) * 12.0);
        float ecgWave = exp(-abs(hudUV.y - sin(hudUV.x * 3.5 + u_time * 8.0) * 0.35 * pulse) * 28.0);
        
        float scanline = sin(hudUV.y * 90.0 + u_time * 12.0) * 0.15 + 0.85;
        vec3 hudGlow = vec3(0.05, 0.88, 1.0) * (0.65 + 3.2 * ecgWave + 1.2 * pulse) * scanline;
        
        float border = step(0.85, max(abs(hudUV.x * 0.06), abs(hudUV.y * 0.07)));
        hudGlow += vec3(0.2, 0.9, 1.2) * border;
        return hudGlow;
    } else if (hit.matId > 6.5 && hit.matId < 7.5) {
        // Material 7: Axiom "AX" Brand Logo Decal
        baseCol = vec3(0.22, 0.25, 0.30);
        specPower = 20.0;
        specIntensity = 0.30;
    } else if (hit.matId > 7.5) {
        // Material 8: Light Ice-Blue / Powder-Blue Lunar Boot Soles
        baseCol = vec3(0.75, 0.86, 0.99);
        specPower = 28.0;
        specIntensity = 0.25;
    }

    // Specular Highlights (Dual Helmet Lights + Blinn-Phong)
    vec3 h1 = normalize(ledLightL + v);
    vec3 h2 = normalize(ledLightR + v);
    float spec1 = pow(max(dot(n, h1), 0.0), specPower);
    float spec2 = pow(max(dot(n, h2), 0.0), specPower);
    vec3 specular = vec3(1.0, 0.98, 0.95) * (spec1 * specIntensity + spec2 * specIntensity);

    // Fresnel Rim Glow
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.20;

    return baseCol * totalLighting + specular + vec3(1.0) * fresnel;
}

void main() {
    // Exact Viewport-relative Pixel & NDC Coordinate calculation (Fixes dual-eye VR stereoscopic convergence!)
    vec2 pixelPos = gl_FragCoord.xy - u_viewport.xy;
    vec2 ndc = (pixelPos / u_viewport.zw) * 2.0 - 1.0;
    vec2 rayTan = ndc * u_tanHalfFov + u_fovOffset;
    vec3 rayDir = normalize(u_rayBasis[0] * rayTan.x + u_rayBasis[1] * rayTan.y + u_rayBasis[2]);

    // Initial ray state
    vec3 pos = u_rayOrigin;
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

    // 1. First-Person Astronaut Space Suit & Hand Scanning Raymarch in Local Headset Space
    vec3 rayDirLocal = normalize(vec3(rayTan.x, rayTan.y, 1.0));
    vec3 localRayOrigin = vec3(0.0, 0.0, 0.0);
    
    float tSuit = 0.08;
    SuitHit suitHitResult = SuitHit(1e5, 0.0, vec3(0.0));
    bool hitSuit = false;

    // Early exit: suit & hands only exist in the lower viewing frustum (y < 0.18)
    if (rayDirLocal.y < 0.18) {
        for (int s = 0; s < 22; s++) {
            vec3 pSuit = localRayOrigin + rayDirLocal * tSuit;
            SuitHit h = AstronautSuitSDF(pSuit);
            if (h.d < 0.0045) {
                suitHitResult = h;
                suitHitResult.localPos = pSuit;
                hitSuit = true;
                break;
            }
            tSuit += max(h.d * 0.82, 0.004);
            if (tSuit > 0.95) break;
        }

        if (hitSuit) {
            col = RenderSuitShading(suitHitResult, rayDirLocal);
            transmit = 0.0;
        }
    }

    // 2. Relativistic Kerr Geodesic Raymarch (Only for cosmic rays not blocked by astronaut suit)
    if (transmit > 0.0) {
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

            // Smooth adaptive integration step size
            float dt = u_stepScale * clamp(0.040 * r + 0.010 * sqrt(r), 0.012, 3.2);

            // 2nd-Order Runge-Kutta (Midpoint) Symplectic Integration
            vec3 k1 = GetGeodesicAcc(pos, vel);
            vec3 posMid = pos + vel * (0.5 * dt);
            vec3 velMid = vel + k1 * (0.5 * dt);
            vec3 k2 = GetGeodesicAcc(posMid, velMid);

            vec3 pn = pos + velMid * dt;
            vec3 vn = normalize(vel + k2 * dt);

            // Exact Equatorial Plane Crossing (Accretion Disk Lensing Arch & Front Band)
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

            // Multiple Concentric Razor-Sharp Golden Photon Rings
            if (u_photonGlow > 0.01) {
                float d1 = abs(minR - rPh);
                float d2 = abs(minR - (rPh * 1.032));
                float d3 = abs(minR - (rPh * 1.058));

                float ring1 = exp(-d1 * u_photonSharpness * 1.5) * u_photonIntensity * 2.8;
                float ring2 = exp(-d2 * (u_photonSharpness * 1.9)) * u_photonIntensity * 1.2;
                float ring3 = exp(-d3 * (u_photonSharpness * 2.4)) * u_photonIntensity * 0.6;

                // Chromatic dispersion
                vec3 ringCol1 = vec3(2.8, 2.3, 1.8) * ring1;
                vec3 ringCol2 = vec3(1.8, 1.3, 0.7) * ring2;
                vec3 ringCol3 = vec3(1.2, 0.7, 0.3) * ring3;

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
    }

    // Viewport-centered UV coordinates for post-processing effects
    vec2 uv = (pixelPos - 0.5 * u_viewport.zw) / u_viewport.w;

    // Atmospheric Horizon Ambient & Glow
    float ambientHalo = exp(-length(uv) * 1.55) * 0.018;
    col += vec3(0.15, 0.34, 0.62) * ambientHalo;

    // Cinematic Anamorphic Lens Flare & Bloom
    float centerLum = clamp(length(col) * 0.20, 0.0, 3.0);
    float horizStreak = exp(-abs(uv.y * 42.0)) * exp(-abs(uv.x * 0.30)) * centerLum * 0.15;
    vec3 streakColor = vec3(1.3, 1.0, 0.7) * horizStreak;
    
    float coreBloom = exp(-length(uv) * 2.4) * centerLum * 0.10;
    vec3 bloomColor = vec3(1.2, 0.85, 0.45) * coreBloom;
    col += streakColor + bloomColor;

    // Astronaut Space-Suit Helmet Visor (Desktop / Mobile only)
    if (u_helmetVisor > 0.5 && u_isVR < 0.5) {
        vec2 hUV = uv * vec2(1.0, 1.12);
        float visorDist = length(hUV);
        
        float rimMask = smoothstep(0.96, 0.72, visorDist);
        float innerBezel = smoothstep(0.92, 0.82, visorDist) * (1.0 - smoothstep(0.98, 0.88, visorDist));
        
        float goldGleam = pow(max(dot(normalize(vec3(uv, 1.0)), normalize(vec3(0.4, 0.6, 0.8))), 0.0), 4.0) * 0.12;
        vec3 goldCoating = vec3(1.1, 0.85, 0.35) * goldGleam;
        
        float edgeFog = smoothstep(0.55, 0.88, visorDist) * 0.08 * SmoothNoise2D(uv * 14.0);
        
        vec3 frameCol = vec3(0.015, 0.02, 0.03);
        col = mix(frameCol, col, rimMask);
        col += (goldCoating + vec3(0.8, 0.6, 0.3) * edgeFog) * rimMask;
        col += vec3(0.05, 0.07, 0.09) * innerBezel;
    }

    // ACES Filmic Tone Mapping + Dynamic Range Exposure
    col = ACESFilm(col * u_exposure);

    // Fine 35mm Organic Film Grain & Temporal Sub-pixel Dithering
    float grain = (Hash21(gl_FragCoord.xy * 1.5 + fract(u_time * 17.13)) - 0.5) * 0.014;
    col += grain;

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
