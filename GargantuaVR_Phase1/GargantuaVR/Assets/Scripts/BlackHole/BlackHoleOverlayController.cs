// Assets/Scripts/BlackHole/BlackHoleOverlayController.cs
// PURPOSE: Educational wire overlays that keep four concepts visually SEPARATE:
//   Event horizon (Kerr r+)  |  Photon orbits (equatorial prograde/retrograde)  |  Ergosphere  |  Shadow outline.
// (Merges ShadowController + PhotonRegionController + event-horizon / ergosphere visualisation.)
//
// CLASSIFICATION
//  * Event horizon wire (r+ = M + sqrt(M^2-a^2), Boyer-Lindquist coordinate sphere) ..... PHYSICALLY CALCULATED location, conceptual
//    boundary (NOT a surface). NOTE: the ray tracer captures at the Schwarzschild r=2M, so for a>0 the overlay is smaller than
//    the traced dark region; that gap is a documented limitation of the Schwarzschild renderer.
//  * Photon orbits: two EQUATORIAL circular orbits only (a slice of the photon region, not a shell) ..... PHYSICALLY CALCULATED.
//    Label in UI: "equatorial photon orbits (prograde/retrograde) - slice of the photon region".
//  * Ergosphere r_E(theta) ..... PHYSICALLY CALCULATED, not a solid shell.
//  * Shadow outline (Schwarzschild angular radius exact for a static observer; Kerr squash/offset) ..... Kerr part is a
//    PHYSICALLY MOTIVATED APPROXIMATION and is NOT what the ray tracer renders ("Kerr shadow estimate").
using UnityEngine;
using Gargantua.Physics;

namespace Gargantua.BlackHole
{
    public class BlackHoleOverlayController : MonoBehaviour
    {
        public BlackHolePhysicsConfig config;
        public ObserverController observer;
        public Transform spinFrame;                       // the BlackHole transform (scale must stay 1)
        public Material lineMaterialTemplate;            // URP Unlit; falls back to Shader.Find
        public float shadowDrawDistance = 40f;

        LineRenderer[] horizon = new LineRenderer[3], ergo = new LineRenderer[5];
        LineRenderer photonPro, photonRetro, shadow;
        float lastSpin = -1f, lastScale = -1f; bool lastPro;
        const int N = 128;

        void Start()
        {
            for (int i = 0; i < 3; i++) horizon[i] = MakeLine("Horizon" + i, new Color(0.2f, 0.9f, 1f), 0.03f, true, spinFrame);
            for (int i = 0; i < 5; i++) ergo[i] = MakeLine("Ergo" + i, new Color(0.9f, 0.4f, 1f), 0.02f, true, spinFrame);
            photonPro = MakeLine("PhotonPrograde", new Color(0.4f, 1f, 0.4f), 0.03f, true, spinFrame);
            photonRetro = MakeLine("PhotonRetrograde", new Color(1f, 0.5f, 0.3f), 0.03f, true, spinFrame);
            shadow = MakeLine("ShadowOutline", new Color(1f, 1f, 1f), 0.06f, true, transform);
            shadow.useWorldSpace = true;
        }

        LineRenderer MakeLine(string n, Color c, float w, bool loop, Transform parent)
        {
            var go = new GameObject(n); go.transform.SetParent(parent, false);
            var lr = go.AddComponent<LineRenderer>();
            lr.loop = loop; lr.useWorldSpace = false; lr.widthMultiplier = w; lr.positionCount = N;
            lr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off; lr.receiveShadows = false;
            Material m = lineMaterialTemplate != null ? new Material(lineMaterialTemplate) : new Material(Shader.Find("Universal Render Pipeline/Unlit"));
            m.SetColor("_BaseColor", c); lr.sharedMaterial = m; lr.enabled = false; return lr;
        }

        void LateUpdate()
        {
            if (config == null || horizon[0] == null) return;
            bool dirty = !Mathf.Approximately(lastSpin, config.spin) || !Mathf.Approximately(lastScale, config.unityUnitsPerGM) || lastPro != config.diskPrograde;
            if (dirty) { Rebuild(); lastSpin = config.spin; lastScale = config.unityUnitsPerGM; lastPro = config.diskPrograde; }
            foreach (var l in horizon) l.enabled = config.showEventHorizon;
            foreach (var l in ergo) l.enabled = config.showErgosphere && config.spin > 0.001f;
            photonPro.enabled = photonRetro.enabled = config.showPhotonRegion;
            shadow.enabled = config.showShadowOutline;
            if (shadow.enabled) UpdateShadow();
        }

        void Rebuild()
        {
            float s = config.unityUnitsPerGM; double a = config.spin;
            float rp = (float)KerrMath.EventHorizonRadius(a) * s;
            for (int k = 0; k < 3; k++) horizon[k].SetPositions(Circle(rp, k));
            photonPro.SetPositions(Circle((float)KerrMath.EquatorialPhotonOrbitRadius(a, true) * s, 0));
            photonRetro.SetPositions(Circle((float)KerrMath.EquatorialPhotonOrbitRadius(a, false) * s, 0));
            ergo[0].SetPositions(Circle((float)KerrMath.ErgosphereRadius(a, Mathf.PI * 0.5f) * s, 0));
            for (int m = 0; m < 4; m++)
            {
                float phi = m * Mathf.PI * 0.25f; var pts = new Vector3[N];
                for (int i = 0; i < N; i++)
                {
                    float th = 2f * Mathf.PI * i / N; float re = (float)KerrMath.ErgosphereRadius(a, th) * s;
                    pts[i] = re * new Vector3(Mathf.Sin(th) * Mathf.Cos(phi), Mathf.Cos(th), Mathf.Sin(th) * Mathf.Sin(phi));
                }
                ergo[m + 1].SetPositions(pts);
            }
        }

        // plane 0: XZ (equatorial), 1: XY, 2: YZ
        static Vector3[] Circle(float r, int plane)
        {
            var p = new Vector3[N];
            for (int i = 0; i < N; i++)
            {
                float t = 2f * Mathf.PI * i / N, c = Mathf.Cos(t) * r, s = Mathf.Sin(t) * r;
                p[i] = plane == 0 ? new Vector3(c, 0, s) : plane == 1 ? new Vector3(c, s, 0) : new Vector3(0, c, s);
            }
            return p;
        }

        void UpdateShadow()
        {
            if (observer == null || observer.CenterEye == null) return;
            Vector3 cam = observer.CenterEye.position;
            Vector3 toBH = spinFrame.position - cam; float distWorld = toBH.magnitude;
            if (distWorld < 1e-3f) return;
            Vector3 c = toBH / distWorld;
            float rObs = distWorld / config.unityUnitsPerGM;
            float incl = Mathf.Deg2Rad * config.observerInclinationDeg;
            float psi = (float)KerrMath.SchwarzschildShadowAngularRadius(rObs);
            psi *= (float)KerrMath.ApproxKerrShadowRadiusScale(config.spin, incl);
            Vector3 spinAxis = spinFrame.up;
            Vector3 e1 = Vector3.Cross(c, spinAxis);                    // receding-side direction
            if (e1.sqrMagnitude < 1e-6f) e1 = Vector3.Cross(c, Vector3.right);
            e1.Normalize(); Vector3 e2 = Vector3.Cross(c, e1);
            float shift = (float)KerrMath.ApproxKerrShadowCenterOffset(config.spin, incl) / rObs;
            Vector3 c2 = (c + e1 * shift).normalized;
            Vector3 b1 = Vector3.Cross(c2, e2).normalized, b2 = Vector3.Cross(c2, b1);
            var pts = new Vector3[N];
            for (int i = 0; i < N; i++)
            {
                float t = 2f * Mathf.PI * i / N;
                Vector3 d = c2 * Mathf.Cos(psi) + (b1 * Mathf.Cos(t) + b2 * Mathf.Sin(t)) * Mathf.Sin(psi);
                pts[i] = cam + d * shadowDrawDistance;
            }
            shadow.widthMultiplier = 0.012f * shadowDrawDistance;
            shadow.SetPositions(pts);
        }
    }
}
