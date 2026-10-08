Shader "Gargantua/Procedural Starfield"
{
    Properties { _StarDensity ("Star Density", Range(0, 0.12)) = 0.03 _StarBrightness ("Star Brightness", Float) = 1.2 }
    SubShader
    {
        Tags { "RenderPipeline"="UniversalPipeline" "Queue"="Background" "RenderType"="Opaque" }
        Pass
        {
            Cull Front ZWrite Off ZTest Always
            HLSLPROGRAM
            #pragma vertex Vert
            #pragma fragment Frag
            #pragma multi_compile_instancing
            #pragma multi_compile _ _STEREO_MULTIVIEW_ON _STEREO_INSTANCING_ON
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            CBUFFER_START(UnityPerMaterial) float _StarDensity, _StarBrightness; CBUFFER_END
            struct Attributes { float4 positionOS : POSITION; UNITY_VERTEX_INPUT_INSTANCE_ID };
            struct Varyings { float4 positionCS : SV_POSITION; float3 positionWS : TEXCOORD0; UNITY_VERTEX_OUTPUT_STEREO };
            float3 Hash33(float3 p) { p = frac(p * float3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return frac((p.xxy + p.yxx) * p.zyx); }
            Varyings Vert(Attributes i) { Varyings o; UNITY_SETUP_INSTANCE_ID(i); UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o); o.positionWS = TransformObjectToWorld(i.positionOS.xyz); o.positionCS = TransformWorldToHClip(o.positionWS); return o; }
            half4 Frag(Varyings i) : SV_Target
            {
                UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(i);
                float3 p = normalize(i.positionWS - GetCameraPositionWS()) * 75.0;
                float3 cell = floor(p), local = frac(p), h = Hash33(cell);
                float active = step(1.0 - _StarDensity, h.x);
                float starDistance = length(local - (0.2 + 0.6 * Hash33(cell + 17.0)));
                float brightness = active * smoothstep(.14, 0.0, starDistance) * (0.3 + 3.0 * h.y * h.y);
                float3 tint = lerp(float3(1.0, .75, .55), float3(.65, .85, 1.0), h.z);
                return half4(tint * brightness * _StarBrightness, 1.0);
            }
            ENDHLSL
        }
    }
}
