Shader "Gargantua/XR Accretion Disk Slice"
{
    Properties
    {
        _InnerRadius ("Inner Radius", Float) = 4.0
        _OuterRadius ("Outer Radius", Float) = 24.0
        _SliceHeight ("Slice Height", Float) = 0.0
        _SlicePhase ("Slice Phase", Float) = 0.0
        _SliceOpacity ("Slice Opacity", Range(0, 1)) = 0.24
        _RotationSpeed ("Keplerian Rotation Speed", Float) = 8.0
        _Turbulence ("Turbulence", Range(0, 2)) = 1.0
        _StriationDensity ("Striation Density", Float) = 48.0
        _Emission ("HDR Inner Emission", Float) = 14.0
        _OuterEmission ("HDR Outer Emission", Float) = 2.5
        _HotColor ("Hot Core", Color) = (1, 0.98, 0.90, 1)
        _WarmColor ("Warm Plasma", Color) = (1, 0.38, 0.06, 1)
        _DustColor ("Outer Dust", Color) = (0.28, 0.035, 0.005, 1)
    }

    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" "Queue"="Transparent" "RenderType"="Transparent" }
        Pass
        {
            Name "AccretionDisk"
            Blend One OneMinusSrcAlpha
            ZWrite Off
            ZTest LEqual
            Cull Off

            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile_instancing
            #pragma multi_compile _ _STEREO_MULTIVIEW_ON _STEREO_INSTANCING_ON
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float _InnerRadius, _OuterRadius, _SliceHeight, _SlicePhase, _SliceOpacity;
                float _RotationSpeed, _Turbulence, _StriationDensity, _Emission, _OuterEmission;
                float4 _HotColor, _WarmColor, _DustColor;
            CBUFFER_END

            struct Attributes { float4 positionOS : POSITION; float3 normalOS : NORMAL; UNITY_VERTEX_INPUT_INSTANCE_ID };
            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float3 positionWS : TEXCOORD0;
                float3 normalWS : TEXCOORD1;
                float2 diskPosition : TEXCOORD2;
                UNITY_VERTEX_INPUT_INSTANCE_ID
                UNITY_VERTEX_OUTPUT_STEREO
            };

            float Hash21(float2 p)
            {
                p = frac(p * float2(123.34, 456.21));
                p += dot(p, p + 45.32);
                return frac(p.x * p.y);
            }

            float ValueNoise(float2 p)
            {
                float2 cell = floor(p), f = frac(p);
                float2 s = f * f * (3.0 - 2.0 * f);
                return lerp(lerp(Hash21(cell), Hash21(cell + float2(1, 0)), s.x),
                            lerp(Hash21(cell + float2(0, 1)), Hash21(cell + 1.0), s.x), s.y);
            }

            float FBM(float2 p)
            {
                float value = 0.0, amplitude = 0.5;
                [unroll] for (int octave = 0; octave < 4; octave++)
                {
                    value += amplitude * ValueNoise(p);
                    p = p * 2.03 + float2(17.1, 31.7);
                    amplitude *= 0.5;
                }
                return value;
            }

            // Crossfading discrete advection frames prevents high-speed inner bands from popping.
            float AdvectedFBM(float2 coordinate, float phase)
            {
                float frame = floor(phase);
                float blend = smoothstep(0.0, 1.0, frac(phase));
                float2 drift0 = float2(frame, frame * 0.61803399);
                float2 drift1 = float2(frame + 1.0, (frame + 1.0) * 0.61803399);
                return lerp(FBM(coordinate + drift0), FBM(coordinate + drift1), blend);
            }

            Varyings Vert(Attributes input)
            {
                Varyings output = (Varyings)0;
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_TRANSFER_INSTANCE_ID(input, output);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);
                float3 positionOS = input.positionOS.xyz;
                positionOS.y += _SliceHeight;
                output.positionWS = TransformObjectToWorld(positionOS);
                output.normalWS = TransformObjectToWorldNormal(input.normalOS);
                output.diskPosition = positionOS.xz;
                output.positionCS = TransformWorldToHClip(output.positionWS);
                return output;
            }

            half4 Frag(Varyings input) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(input);
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);

                float radius = length(input.diskPosition);
                float angle = atan2(input.diskPosition.y, input.diskPosition.x);
                float normalizedRadius = saturate((radius - _InnerRadius) / max(0.001, _OuterRadius - _InnerRadius));
                float angularVelocity = _RotationSpeed / max(radius, _InnerRadius * 0.72);
                float phase = _Time.y * angularVelocity + _SlicePhase * 19.73;
                float rotatingAngle = angle - phase;

                float2 polarA = float2(log2(max(radius, 0.001)) * _StriationDensity,
                                        rotatingAngle * (14.0 + radius * 4.0));
                float2 polarB = float2(radius * 8.0, rotatingAngle * (42.0 + radius * 3.0));
                float broadCloud = AdvectedFBM(polarA * 0.18, phase * 0.18);
                float fibers = AdvectedFBM(polarA * 0.75 + polarB * 0.30, phase);
                float microFibers = AdvectedFBM(polarB * 1.45, phase * 1.9);
                float turbulentDensity = broadCloud * 0.50 + fibers * 0.36 + microFibers * 0.22;
                float bandPhase = radius * _StriationDensity + turbulentDensity * (10.0 * _Turbulence)
                                  + sin(rotatingAngle * 13.0 + fibers * 8.0);
                float striations = pow(saturate(0.5 + 0.5 * sin(bandPhase)), 3.0);
                float plasma = saturate(striations * 0.72 + smoothstep(0.36, 0.78, turbulentDensity) * 0.65);

                float innerFade = smoothstep(_InnerRadius, _InnerRadius * 1.08, radius);
                float outerFade = 1.0 - smoothstep(_OuterRadius * 0.72, _OuterRadius, radius);
                float wisps = smoothstep(0.28, 0.82, broadCloud + microFibers * 0.45 - normalizedRadius * 0.22);
                float density = plasma * innerFade * outerFade * lerp(wisps, 1.0, 1.0 - normalizedRadius);

                float3 viewDirection = SafeNormalize(GetCameraPositionWS() - input.positionWS);
                float fresnel = pow(1.0 - saturate(abs(dot(viewDirection, normalize(input.normalWS)))), 1.8);
                density *= lerp(1.0, 0.65 + fresnel * 0.75, saturate(abs(_SliceHeight) * 1.8));

                float hotInner = exp(-normalizedRadius * 13.0) * (0.72 + striations * 0.55);
                float3 colour = lerp(_DustColor.rgb, _WarmColor.rgb, exp(-normalizedRadius * 3.2));
                colour = lerp(colour, _HotColor.rgb, saturate(hotInner * 1.55));
                float intensity = lerp(_OuterEmission, _Emission, hotInner) * (0.35 + plasma * 1.15);
                float alpha = saturate(density * _SliceOpacity);
                return half4(colour * intensity * alpha, alpha);
            }
            ENDHLSL
        }
    }
}
