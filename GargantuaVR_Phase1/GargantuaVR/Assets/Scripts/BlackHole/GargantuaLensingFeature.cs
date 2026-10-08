using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace Gargantua.BlackHole
{
    /// <summary>Add to the active URP Renderer Data. Run after transparents so far-side disk pixels are lensed too.</summary>
    public sealed class GargantuaLensingFeature : ScriptableRendererFeature
    {
        [System.Serializable]
        public class Settings
        {
            public Material lensMaterial;
            public RenderPassEvent injectionPoint = RenderPassEvent.AfterRenderingTransparents;
        }

        public Settings settings = new Settings();
        LensPass pass;

        public override void Create()
        {
            pass = new LensPass(settings.lensMaterial) { renderPassEvent = settings.injectionPoint };
        }

        public override void AddRenderPasses(ScriptableRenderer renderer, ref RenderingData renderingData)
        {
            if (settings.lensMaterial == null || renderingData.cameraData.cameraType == CameraType.Preview) return;
            pass.Setup(renderer.cameraColorTargetHandle);
            renderer.EnqueuePass(pass);
        }

        protected override void Dispose(bool disposing) => pass?.Dispose();

        sealed class LensPass : ScriptableRenderPass
        {
            readonly Material material;
            RTHandle source;
            RTHandle temporaryColour;

            public LensPass(Material lensMaterial) => material = lensMaterial;
            public void Setup(RTHandle colourTarget) => source = colourTarget;

            public override void OnCameraSetup(CommandBuffer cmd, ref RenderingData renderingData)
            {
                var descriptor = renderingData.cameraData.cameraTargetDescriptor;
                descriptor.depthBufferBits = 0;
                RenderingUtils.ReAllocateIfNeeded(ref temporaryColour, descriptor, FilterMode.Bilinear, TextureWrapMode.Clamp, name: "_GargantuaLensedColour");
            }

            public override void Execute(ScriptableRenderContext context, ref RenderingData renderingData)
            {
                if (source == null || material == null) return;
                CommandBuffer cmd = CommandBufferPool.Get("Gargantua Gravitational Lensing");
                Blitter.BlitCameraTexture(cmd, source, temporaryColour, material, 0);
                Blitter.BlitCameraTexture(cmd, temporaryColour, source);
                context.ExecuteCommandBuffer(cmd);
                CommandBufferPool.Release(cmd);
            }

            public void Dispose() => temporaryColour?.Release();
        }
    }
}
