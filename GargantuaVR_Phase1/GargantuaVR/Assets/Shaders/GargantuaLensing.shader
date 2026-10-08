Shader "Hidden/Gargantua/XR Gravitational Lensing"
{
    Properties
    {
        _BlackHoleWorldPos ("Black Hole World Position", Vector) = (0,0,0,1)
        _EventHorizonRadius ("Event Horizon Radius", Float) = 1.0
        _LensRadiusMultiplier ("Lens Radius Multiplier", Float) = 5.0
        _BendStrength ("Bend Strength", Range(0,4)) = 1.35
        _SecondaryImage ("Secondary Lensed Image", Range(0,1)) = 0.48
    }
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" }
        Pass
        {
            Name "GargantuaLens"
            ZTest Always ZWrite Off Cull Off
            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile _ _STEREO_MULTIVIEW_ON _STEREO_INSTANCING_ON
            #include "Packages/com.unity.render-pipelines.core/Runtime/Utilities/Blit.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            CBUFFER_START(UnityPerMaterial)
                float4 _BlackHoleWorldPos;
                float _EventHorizonRadius, _LensRadiusMultiplier, _BendStrength, _SecondaryImage;
            CBUFFER_END

            float2 ToUV(float2 clipPosition) { return clipPosition * 0.5 + 0.5; }

            half4 Frag(Varyings input) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);
                float2 uv = input.texcoord;
                float2 ndc = uv * 2.0 - 1.0;
                float4 centreClip = TransformWorldToHClip(_BlackHoleWorldPos.xyz);
                float3 cameraRight = normalize(float3(UNITY_MATRIX_I_V._m00, UNITY_MATRIX_I_V._m10, UNITY_MATRIX_I_V._m20));
                float4 edgeClip = TransformWorldToHClip(_BlackHoleWorldPos.xyz + cameraRight * _EventHorizonRadius);
                float2 centre = centreClip.xy / max(centreClip.w, 0.0001);
                float horizon = length(edgeClip.xy / max(edgeClip.w, 0.0001) - centre);
                float2 delta = ndc - centre;
                float radius = length(delta);
                float2 direction = delta / max(radius, 0.00001);
                float lensRadius = horizon * _LensRadiusMultiplier;
                float lensFade = 1.0 - smoothstep(lensRadius, lensRadius * 1.35, radius);
                float bend = _BendStrength * horizon * horizon / max(radius, horizon * 0.32);
                float2 primaryUV = ToUV(centre + direction * (radius + bend));
                float2 foldedUV = ToUV(centre - direction * abs(radius - bend * 0.92));
                half4 direct = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, uv);
                half4 primary = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, saturate(primaryUV));
                half4 folded = SAMPLE_TEXTURE2D_X(_BlitTexture, sampler_LinearClamp, saturate(foldedUV));
                float second = smoothstep(horizon * 1.02, horizon * 2.8, radius) * saturate(1.0 - radius / max(lensRadius, 0.0001)) * _SecondaryImage;
                half4 lensed = lerp(primary, folded, second);
                half4 result = lerp(direct, lensed, lensFade);
                float aa = max(fwidth(radius), 0.00001);
                return lerp(half4(0, 0, 0, 1), result, smoothstep(horizon - aa, horizon + aa, radius));
            }
            ENDHLSL
        }
    }
}
