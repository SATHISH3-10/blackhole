// Assets/Scripts/Core/PerformanceMonitor.cs
// PURPOSE: Keeps Quest frame time stable by adapting ray-march steps and eye-buffer resolution.
// Levels (steps / eye-texture scale): 0: 32/0.80  1: 48/0.90  2: 64/1.00  3: 96/1.00  4: 128/1.10
// Lower quality = coarser geodesic integration (less accurate photon ring / higher-order images).
// Frame time is measured with Time.unscaledDeltaTime (CPU-side wall time) - use OVR Metrics Tool for GPU truth.
using UnityEngine;
using UnityEngine.XR;
using Gargantua.BlackHole;

namespace Gargantua.Core
{
    public class PerformanceMonitor : MonoBehaviour
    {
        public BlackHoleController blackHole;
        public int targetHz = 72;
        [Range(0, 4)] public int level = 2;
        public bool adaptive = true;

        static readonly int[] Steps = { 32, 48, 64, 96, 128 };
        static readonly float[] Scale = { 0.8f, 0.9f, 1f, 1f, 1.1f };
        float acc; int frames; float goodTime;
        public float AverageFrameMs { get; private set; }

        void Start() { Apply(); }

        public void SetLevel(int l) { level = Mathf.Clamp(l, 0, 4); Apply(); }

        void Apply()
        {
            blackHole.raymarchSteps = Steps[level];
            XRSettings.eyeTextureResolutionScale = Scale[level];
        }

        void Update()
        {
            acc += Time.unscaledDeltaTime; frames++;
            if (acc < 1f) return;
            float avg = acc / frames; AverageFrameMs = avg * 1000f; acc = 0f; frames = 0;
            if (!adaptive) return;
            float budget = 1f / targetHz;
            if (avg > budget * 1.15f && level > 0) { level--; goodTime = 0f; Apply(); }
            else if (avg < budget * 0.85f) { goodTime += 1f; if (goodTime >= 8f && level < 3) { level++; goodTime = 0f; Apply(); } }
            else goodTime = 0f;
        }
    }
}
