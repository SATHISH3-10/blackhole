// Assets/Shaders/GargantuaLensedSpace.shader
// PURPOSE: Per-pixel null-geodesic ray-marching in Kerr/Schwarzschild spacetime with volumetric accretion disk,
// relativistic Doppler beaming, gravitational redshift, photon ring cascade, and distorted starfield.
Shader "Gargantua/LensedSpace"
{
    Properties
    {
        _Dummy ("unused", Float) = 0
    }
    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Background" "RenderPipeline"="UniversalPipeline" }
        Pass
        {
            Name "Lensed"
            Cull Front ZWrite Off ZTest Always
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma target 4.5
            #pragma multi_compile_instancing
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float4 _BHPos; float4x4 _WorldToDisk;
                float _InvGM, _RIn, _ROut, _SpinA, _OrbitSign, _Brightness, _TmaxK, _Lensing, _RelIntensity;
                float _DopplerOn, _RedshiftOn, _SimTime, _StarDensity, _StarBrightness, _PhotonGlow;
                float _MaxSteps, _StepScale, _CaptureR, _EscapeR, _Exposure, _NoiseScale, _DiskAlpha;
                float _DiskThickness, _KerrGeodesics, _PhotonRingIntensity, _PhotonRingSharpness;
                float _Dummy;
            CBUFFER_END

            struct Attributes
            {
                float4 posOS : POSITION;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct Varyings
            {
                float4 posCS : SV_POSITION;
                float3 posWS : TEXCOORD0;
                UNITY_VERTEX_OUTPUT_STEREO
            };

            Varyings vert(Attributes i)
            {
                Varyings o;
                UNITY_SETUP_INSTANCE_ID(i);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                o.posWS = TransformObjectToWorld(i.posOS.xyz);
                o.posCS = TransformWorldToHClip(o.posWS);
                return o;
            }

            // ---- Procedural Noise & Hash Functions ----------------------------------
            float Hash21(float2 p)
            {
                p = frac(p * float2(123.34, 456.21));
                p += dot(p, p + 45.32);
                return frac(p.x * p.y);
            }

            float3 Hash33(float3 p)
            {
                p = frac(p * float3(0.1031, 0.1030, 0.0973));
                p += dot(p, p.yxz + 33.33);
                return frac((p.xxy + p.yxx) * p.zyx);
            }

            float VNoise(float2 p)
            {
                float2 i = floor(p);
                float2 f = frac(p);
                f = f * f * (3.0 - 2.0 * f);
                return lerp(lerp(Hash21(i), Hash21(i + float2(1, 0)), f.x),
                            lerp(Hash21(i + float2(0, 1)), Hash21(i + float2(1, 1)), f.x), f.y);
            }

            float FBM(float2 p)
            {
                float val = 0.0;
                float amp = 0.5;
                float2 shift = float2(100.0, 100.0);
                for (int i = 0; i < 4; i++)
                {
                    val += amp * VNoise(p);
                    p = p * 2.1 + shift;
                    amp *= 0.5;
                }
                return val;
            }

            // ---- Blackbody Radiation & Color ---------------------------------------
            // Accurate Planckian locus approximation (Tanner Helland / Mitchell) -> linear RGB
            float3 Blackbody(float K)
            {
                float t = clamp(K, 1000.0, 45000.0) * 0.01;
                float r, g, b;
                if (t <= 66.0)
                {
                    r = 255.0;
                    g = 99.4708025861 * log(max(t, 1.0)) - 161.1195681661;
                }
                else
                {
                    r = 329.698727446 * pow(max(t - 60.0, 0.1), -0.1332047592);
                    g = 288.1221695283 * pow(max(t - 60.0, 0.1), -0.0755148492);
                }

                if (t >= 66.0)
                    b = 255.0;
                else if (t <= 19.0)
                    b = 0.0;
                else
                    b = 138.5177312231 * log(max(t - 10.0, 1.0)) - 305.0447927307;

                return pow(saturate(float3(r, g, b) / 255.0), 2.2);
            }

            // ---- ACES Filmic Tone Mapping -------------------------------------------
            float3 ACESFilm(float3 x)
            {
                float a = 2.51;
                float b = 0.03;
                float c = 2.43;
                float d = 0.59;
                float e = 0.14;
                return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
            }

            // ---- Procedural Lensed Starfield ----------------------------------------
            float3 Stars(float3 dir)
            {
                float3 p = dir * 75.0;
                float3 cell = floor(p);
                float3 f = frac(p);
                float3 h = Hash33(cell);
                float on = step(1.0 - _StarDensity, h.x);
                float3 ctr = 0.2 + 0.6 * Hash33(cell + 17.0);
                float d = length(f - ctr);
                float b = on * smoothstep(0.14, 0.0, d) * (0.3 + 3.0 * h.y * h.y);
                float3 tint = lerp(float3(1.0, 0.75, 0.55), float3(0.65, 0.85, 1.0), h.z);
                return b * tint * _StarBrightness;
            }

            float StreamlineTurbulence(float2 p)
            {
                float2 q = float2(FBM(p + float2(0.0, 0.0)), FBM(p + float2(5.2, 1.3)));
                float2 r = float2(FBM(p + 3.0 * q + float2(1.7, 9.2)), FBM(p + 3.0 * q + float2(8.3, 2.8)));
                return FBM(p + 2.5 * r);
            }

            // ---- Accretion Disk Physics & Volumetric Shading -------------------------
            // q = position in disk frame (GM units, Y = normal), rayDir = propagation direction
            float4 ShadeDiskPoint(float3 q, float3 rayDir, float stepLength)
            {
                float r = length(q.xz);
                if (r < _RIn || r > _ROut) return float4(0, 0, 0, 0);

                // Novikov-Thorne radiative flux profile F(r) ~ (r_in / r)^3 * (1 - sqrt(r_in / r))
                float x = _RIn / r;
                float flux = saturate(x * x * x * (1.0 - sqrt(x)) * 17.6);
                float T01 = pow(max(flux, 1e-4), 0.25);

                // Relativistic orbital motion in Kerr equatorial plane
                float3 phiVec = normalize(float3(q.z, 0.0, -q.x)) * _OrbitSign;
                float beta = min(0.985, rsqrt(max(r - 2.0 + _SpinA * 0.5, 0.06)));
                float gam = rsqrt(max(1.0 - beta * beta, 0.001));
                float3 n = -rayDir; // photon vector towards observer

                // Doppler factor D = 1 / [gamma * (1 - beta * cos(theta))]
                float D = 1.0 / (gam * max(1.0 - beta * dot(phiVec, n), 0.01));

                // Gravitational redshift sqrt(1 - 2M*r / Sigma)
                float cosTh = q.y / max(r, 0.001);
                float sigma = r * r + _SpinA * _SpinA * cosTh * cosTh;
                float gG = sqrt(max(1.0 - 2.0 * r / sigma, 0.0));

                // Combined shift factor
                float g = lerp(1.0, D, _DopplerOn) * lerp(1.0, gG, _RedshiftOn);
                g = lerp(1.0, g, _RelIntensity);

                // Longitudinal streamlines and fiery flame streaks
                float phi = atan2(q.z, q.x);
                float omega = 1.0 / (pow(r, 1.5) + _SpinA * _OrbitSign);
                float phiRot = phi - omega * _SimTime * _OrbitSign;

                float2 streakCoord = float2(phiRot * 24.0, r * 4.5);
                float streamlines = StreamlineTurbulence(streakCoord);
                float2 billowCoord = float2(phiRot * 6.0, r * 1.5);
                float billows = FBM(billowCoord);

                float rings = 0.8 + 0.2 * sin(r * 12.0) + 0.1 * sin(r * 32.0 + phiRot * 4.0);
                float gasStructure = pow(streamlines, 1.2) * (0.6 + 0.6 * billows) * rings * 1.8;

                // Vertical gaussian envelope for volumetric thickness
                float diskScaleHeight = max(0.02, _DiskThickness * sqrt(r / _RIn));
                float vertDensity = exp(-0.5 * (q.y * q.y) / (diskScaleHeight * diskScaleHeight));

                // Core incandescence & Relativistic temperature / intensity: I_obs = I_emit * g^4
                float Tobs = _TmaxK * T01 * g;
                float coreBoost = smoothstep(_RIn * 2.5, _RIn, r) * 2.2;
                float intensity = (flux + coreBoost * 0.4) * pow(max(g, 0.0), 3.8) * gasStructure * _Brightness;
                float3 emission = Blackbody(Tobs) * intensity;

                // Edge feathering
                float radialFade = smoothstep(_RIn, _RIn * 1.03, r) * (1.0 - smoothstep(_ROut * 0.88, _ROut, r));
                float pointAlpha = saturate(_DiskAlpha * vertDensity * radialFade * (stepLength / max(diskScaleHeight, 0.04)));

                return float4(emission, pointAlpha);
            }

            // ---- Main Fragment Shader -----------------------------------------------
            half4 frag(Varyings i) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(i);
                float3 camWS = GetCameraPositionWS();
                float3 rdWS = normalize(i.posWS - camWS);
                float3x3 W2D = (float3x3)_WorldToDisk;

                // Initial position & velocity in disk frame (GM units)
                float3 pos = mul(W2D, (camWS - _BHPos.xyz) * _InvGM);
                float3 vel = normalize(mul(W2D, rdWS));

                float3 col = float3(0, 0, 0);
                float transmit = 1.0;
                bool captured = false;
                float minR = length(pos);
                float totalBend = 0.0;
                int steps = (int)_MaxSteps;

                // Photon orbit radius for photon ring evaluation
                float rPh = 2.0 * (1.0 + cos((2.0 / 3.0) * acos(-clamp(_SpinA * _OrbitSign, -0.999f, 0.999f))));

                [loop]
                for (int k = 0; k < steps; k++)
                {
                    float r = length(pos);
                    minR = min(minR, r);

                    // Kerr Horizon capture condition: r < r+
                    float cosTheta = pos.y / max(r, 0.001);
                    float rHorizon = 1.0 + sqrt(max(0.0, 1.0 - _SpinA * _SpinA));
                    if (r < rHorizon)
                    {
                        captured = true;
                        break;
                    }

                    // Escape condition: heading away beyond escape boundary
                    if (r > _EscapeR && dot(pos, vel) > 0.0)
                        break;

                    // Adaptive step sizing based on gravitational gradient
                    float dt = _StepScale * clamp(0.08 * r, 0.03, 6.0);
                    float r2 = r * r;
                    float r5 = r2 * r2 * r;

                    // Angular momentum vector h = pos x vel
                    float3 h = cross(pos, vel);
                    float h2 = dot(h, h);

                    // 1. Schwarzschild geodesic acceleration: a_schw = -3 M h^2 * r / r^5
                    float3 acc = -3.0 * _Lensing * h2 * pos / max(r5, 1e-4);

                    // 2. Kerr frame-dragging & spin-orbit coupling:
                    if (_KerrGeodesics > 0.5)
                    {
                        float hy = h.y * _OrbitSign;
                        float3 spinCoupling = (3.0 * hy * pos + cross(h, float3(0.0, _OrbitSign, 0.0)) * r);
                        acc += _Lensing * (2.0 * _SpinA / max(r5, 1e-4)) * spinCoupling;
                    }

                    // Geodesic integration step
                    vel += acc * dt;
                    float3 pn = pos + vel * dt;
                    float stepDist = length(pn - pos);

                    // Volumetric & Thin-disk accretion disk accumulation
                    float diskH = max(0.04, _DiskThickness * 2.5 * sqrt(r / max(_RIn, 0.1)));
                    if (abs(pos.y) < diskH || (pos.y * pn.y < 0.0))
                    {
                        if (transmit > 0.01)
                        {
                            // Sample at mid-point or plane crossing
                            float3 samplePos = (pos.y * pn.y < 0.0) ? lerp(pos, pn, pos.y / (pos.y - pn.y + 1e-5)) : 0.5 * (pos + pn);
                            float4 diskSample = ShadeDiskPoint(samplePos, normalize(vel), max(stepDist, 0.05));
                            if (diskSample.a > 0.0)
                            {
                                col += transmit * diskSample.rgb * diskSample.a;
                                transmit *= (1.0 - diskSample.a);
                            }
                        }
                    }

                    pos = pn;
                }

                if (!captured)
                {
                    // Relativistically deflected background stars
                    float3 dirOut = normalize(mul(vel, W2D)); // W2D^T * vel -> world
                    col += transmit * Stars(dirOut);

                    // High-order photon ring cascade (photons that orbit near r_ph)
                    if (_PhotonGlow > 0.01)
                    {
                        float distToPhotonSphere = abs(minR - rPh);
                        float ringSharpness = _PhotonRingSharpness;
                        float photonRing = exp(-distToPhotonSphere * ringSharpness) * _PhotonRingIntensity;
                        
                        // Subtle relativistic chromatic dispersion around photon ring
                        float3 ringColor = float3(1.0, 0.88, 0.7) * photonRing;
                        col += transmit * ringColor;
                    }
                }

                // Cinematic ACES Filmic Tone Mapping + Exposure
                col = ACESFilm(col * _Exposure);

                return half4(col, 1.0);
            }
            ENDHLSL
        }
    }
    Fallback Off
}
