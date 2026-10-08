// Assets/Scripts/Core/AppBootstrap.cs
// PURPOSE: Startup order: load settings -> configure camera/display -> tracking mode -> quality defaults.
// NOT YET DONE (Phase 2): safety/comfort notice and seated/standing choice screen (needs the UI panel).
using UnityEngine;
using Gargantua.BlackHole;
using Gargantua.Comfort;

namespace Gargantua.Core
{
    [DefaultExecutionOrder(-100)]
    public class AppBootstrap : MonoBehaviour
    {
        public BlackHolePhysicsConfig config; public ComfortSettings comfort;
        public SaveSettingsController save; public RecenterManager recenter; public PerformanceMonitor perf;
        public ObserverController observer;

        void Awake()
        {
            save.Load();
            QualitySettings.vSyncCount = 0;
            // Device heuristic (best effort, verify on device): Quest 2 gets lower defaults.
            string model = SystemInfo.deviceModel ?? "";
            bool quest2 = model.Contains("Quest 2") || model.Contains("Quest2") || model == "Oculus Quest";
            perf.targetHz = quest2 ? 72 : 90;
            perf.level = quest2 ? 1 : 2;
        }

        void Start()
        {
            var cam = observer.EyeCamera;
            if (cam != null)
            {
                cam.tag = "MainCamera"; cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = Color.black;
                cam.farClipPlane = 1000f; cam.nearClipPlane = 0.03f;
            }
            if (OVRManager.display != null)
            {
                try { OVRManager.display.displayFrequency = perf.targetHz; } catch { /* unsupported rate on this device */ }
            }
            recenter.ApplyTrackingMode();
        }
    }
}
