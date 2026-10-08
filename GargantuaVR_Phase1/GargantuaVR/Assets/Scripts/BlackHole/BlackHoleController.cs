// Assets/Scripts/BlackHole/BlackHoleController.cs
// PURPOSE: Owns the lensed-sky sphere, pushes BlackHolePhysicsConfig into the shader every frame,
// and defines the black hole's frame: this Transform = BH centre; local +Y = spin axis.
// (Merges the roles of KerrBlackHoleController, LensingEffectController, AccretionDiskController,
//  DopplerEffectController, GravitationalRedshiftController and StarfieldController: those effects are
//  computed inside GargantuaLensedSpace.shader and parameterised here. See Documentation/PHASE1_STATUS.md.)
using UnityEngine;
using Gargantua.Physics;

namespace Gargantua.BlackHole
{
    [DefaultExecutionOrder(100)]
    public class BlackHoleController : MonoBehaviour
    {
        public BlackHolePhysicsConfig config;
        [Tooltip("Material using shader Gargantua/Procedural Starfield (created by the scene builder).")] public Material skyMaterialAsset;
        [Tooltip("The same material assigned to GargantuaLensingFeature in the active URP Renderer Data.")]
        public Material lensMaterialAsset;
        public Camera eyeCamera;
        [Header("Quality (driven by PerformanceMonitor)")]
        [Range(16, 160)] public int raymarchSteps = 64;
        [Range(0.5f, 2f)] public float stepScale = 1f;
        public float exposure = 1.2f;
        public bool paused;

        public double SimTime { get; private set; }
        public Quaternion DiskRotation { get; private set; } = Quaternion.identity;

        Material mat; GameObject sky; Light suitLight;
        static readonly int P_BHPos = Shader.PropertyToID("_BHPos"), P_W2D = Shader.PropertyToID("_WorldToDisk"),
            P_Inv = Shader.PropertyToID("_InvGM"), P_RIn = Shader.PropertyToID("_RIn"), P_ROut = Shader.PropertyToID("_ROut"),
            P_Spin = Shader.PropertyToID("_SpinA"), P_Orb = Shader.PropertyToID("_OrbitSign"), P_Bri = Shader.PropertyToID("_Brightness"),
            P_T = Shader.PropertyToID("_TmaxK"), P_Lens = Shader.PropertyToID("_Lensing"), P_Rel = Shader.PropertyToID("_RelIntensity"),
            P_Dop = Shader.PropertyToID("_DopplerOn"), P_Red = Shader.PropertyToID("_RedshiftOn"), P_Time = Shader.PropertyToID("_SimTime"),
            P_StarD = Shader.PropertyToID("_StarDensity"), P_StarB = Shader.PropertyToID("_StarBrightness"), P_Glow = Shader.PropertyToID("_PhotonGlow"),
            P_Steps = Shader.PropertyToID("_MaxSteps"), P_StepS = Shader.PropertyToID("_StepScale"), P_Cap = Shader.PropertyToID("_CaptureR"),
            P_Esc = Shader.PropertyToID("_EscapeR"), P_Exp = Shader.PropertyToID("_Exposure"), P_Noise = Shader.PropertyToID("_NoiseScale"),
            P_Alpha = Shader.PropertyToID("_DiskAlpha"), P_Thickness = Shader.PropertyToID("_DiskThickness"),
            P_Kerr = Shader.PropertyToID("_KerrGeodesics"), P_PhotonInt = Shader.PropertyToID("_PhotonRingIntensity"),
            P_PhotonSharp = Shader.PropertyToID("_PhotonRingSharpness"),
            P_LensBHPos = Shader.PropertyToID("_BlackHoleWorldPos"), P_LensHorizon = Shader.PropertyToID("_EventHorizonRadius"),
            P_LensStrength = Shader.PropertyToID("_BendStrength");

        void Awake()
        {
            if (config == null || skyMaterialAsset == null) { Debug.LogError("BlackHoleController: assign config and skyMaterialAsset."); enabled = false; return; }
            mat = new Material(skyMaterialAsset);
            sky = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            sky.name = "LensedSky";
            Destroy(sky.GetComponent<Collider>());
            var r = sky.GetComponent<MeshRenderer>();
            r.sharedMaterial = mat; r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off; r.receiveShadows = false;
            sky.transform.localScale = Vector3.one * 500f;           // far clip must be >= 300 (AppBootstrap sets 1000)

            var lg = new GameObject("SuitKeyLight"); lg.transform.SetParent(transform, false);
            suitLight = lg.AddComponent<Light>(); suitLight.type = LightType.Directional; suitLight.shadows = LightShadows.None;
            suitLight.color = new Color(1f, 0.78f, 0.55f);
        }

        void OnDestroy() { if (mat != null) Destroy(mat); }

        void LateUpdate()
        {
            if (eyeCamera == null) { eyeCamera = Camera.main; if (eyeCamera == null) eyeCamera = FindFirstObjectByType<Camera>(); if (eyeCamera == null) return; }
            if (!paused) SimTime += Time.deltaTime * config.simulationRate;
            sky.transform.position = eyeCamera.transform.position;

            // Disk frame: spin frame (this transform) tilted about its local Z by diskTiltDeg.
            DiskRotation = transform.rotation * Quaternion.AngleAxis(config.diskTiltDeg, Vector3.forward);
            float sgn = config.diskPrograde ? 1f : -1f;
            float rIn = config.InnerRadiusResolvedGM, rOut = config.OuterRadiusResolvedGM;

            mat.SetVector(P_BHPos, transform.position);
            mat.SetMatrix(P_W2D, Matrix4x4.Rotate(Quaternion.Inverse(DiskRotation)));
            mat.SetFloat(P_Inv, 1f / config.unityUnitsPerGM);
            mat.SetFloat(P_RIn, rIn); mat.SetFloat(P_ROut, rOut);
            mat.SetFloat(P_Spin, config.spin); mat.SetFloat(P_Orb, sgn);
            mat.SetFloat(P_Bri, config.diskBrightness); mat.SetFloat(P_T, config.diskMaxTempK);
            mat.SetFloat(P_Lens, config.lensingStrength); mat.SetFloat(P_Rel, config.relativisticIntensity);
            mat.SetFloat(P_Dop, config.dopplerEnabled ? 1f : 0f); mat.SetFloat(P_Red, config.redshiftEnabled ? 1f : 0f);
            mat.SetFloat(P_Time, (float)(SimTime % 100000.0));
            mat.SetFloat(P_StarD, config.starDensity); mat.SetFloat(P_StarB, 1.2f);
            mat.SetFloat(P_Glow, config.photonRingGlow ? 1f : 0f);
            mat.SetFloat(P_PhotonInt, config.photonRingIntensity);
            mat.SetFloat(P_PhotonSharp, config.photonRingSharpness);
            mat.SetFloat(P_Kerr, config.kerrGeodesics ? 1f : 0f);
            mat.SetFloat(P_Thickness, config.diskThicknessGM);
            mat.SetFloat(P_Steps, raymarchSteps); mat.SetFloat(P_StepS, stepScale);
            mat.SetFloat(P_Cap, (float)config.EventHorizonGM);             // Kerr event horizon radius r+
            mat.SetFloat(P_Esc, Mathf.Max(60f, config.observerDistanceGM * 1.5f));
            mat.SetFloat(P_Exp, exposure); mat.SetFloat(P_Noise, 0.7f); mat.SetFloat(P_Alpha, config.diskOpacity);

            if (lensMaterialAsset != null)
            {
                lensMaterialAsset.SetVector(P_LensBHPos, transform.position);
                lensMaterialAsset.SetFloat(P_LensHorizon, (float)config.EventHorizonGM * config.unityUnitsPerGM);
                lensMaterialAsset.SetFloat(P_LensStrength, config.lensingStrength * 1.35f);
            }

            // warm key light on the suit, coming from the hole toward the observer
            Vector3 toObs = eyeCamera.transform.position - transform.position;
            if (toObs.sqrMagnitude > 1e-6f) suitLight.transform.rotation = Quaternion.LookRotation(toObs.normalized);
            suitLight.intensity = Mathf.Clamp(0.25f + 0.35f * config.diskBrightness, 0.2f, 1.6f);
        }
    }
}
