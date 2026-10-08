// Assets/Scripts/BlackHole/FrameDraggingController.cs
// PURPOSE: Optional frame-dragging visualisation: small markers that stay at fixed (r, theta) and advance in phi at the
// local ZAMO angular velocity  omega = 2 a r / [(r^2+a^2)^2 - a^2 Delta sin^2 theta]  (PHYSICALLY CALCULATED).
// These represent zero-angular-momentum reference frames being "dragged" - NOT a fluid, NOT spacetime itself.
// The visual speed multiplier (gain) is ARTISTIC (omega is tiny in real time). A spin-axis line shows the rotation sense.
// Requires GPU instancing on the marker material.
using UnityEngine;
using Gargantua.Physics;

namespace Gargantua.BlackHole
{
    public class FrameDraggingController : MonoBehaviour
    {
        public BlackHolePhysicsConfig config;
        public BlackHoleController blackHole;
        public Material markerMaterialTemplate;
        public int count = 160;
        [Tooltip("ARTISTIC speed multiplier on the physical omega.")] public float visualGain = 25f;
        public float markerSizeGM = 0.25f;

        Mesh mesh; Material mat; float[] r, th, ph; Matrix4x4[] mats; LineRenderer axis;

        void Start()
        {
            var tmp = GameObject.CreatePrimitive(PrimitiveType.Sphere); mesh = tmp.GetComponent<MeshFilter>().sharedMesh; Destroy(tmp);
            mat = markerMaterialTemplate != null ? new Material(markerMaterialTemplate) : new Material(Shader.Find("Universal Render Pipeline/Unlit"));
            mat.SetColor("_BaseColor", new Color(0.5f, 0.9f, 1f)); mat.enableInstancing = true;
            r = new float[count]; th = new float[count]; ph = new float[count]; mats = new Matrix4x4[count];
            var rng = new System.Random(7);
            for (int i = 0; i < count; i++)
            {
                r[i] = 2.2f + (float)rng.NextDouble() * 9f;
                th[i] = Mathf.Acos(1f - 2f * (float)rng.NextDouble());
                ph[i] = (float)rng.NextDouble() * Mathf.PI * 2f;
            }
            var go = new GameObject("SpinAxisLine"); go.transform.SetParent(blackHole.transform, false);
            axis = go.AddComponent<LineRenderer>(); axis.useWorldSpace = false; axis.positionCount = 2; axis.widthMultiplier = 0.04f;
            var m = new Material(mat); m.SetColor("_BaseColor", new Color(1f, 0.9f, 0.3f)); axis.sharedMaterial = m;
        }

        void Update()
        {
            bool on = config.showFrameDragging && config.spin > 0.001f;
            axis.enabled = on;
            if (!on || blackHole == null) return;
            float s = config.unityUnitsPerGM; Transform bh = blackHole.transform;
            axis.SetPosition(0, Vector3.down * 14f * s); axis.SetPosition(1, Vector3.up * 14f * s);
            float dT = blackHole.paused ? 0f : Time.deltaTime * config.simulationRate;
            for (int i = 0; i < count; i++)
            {
                ph[i] += (float)KerrMath.ZamoAngularVelocity(r[i], th[i], config.spin) * dT * visualGain;
                Vector3 p = r[i] * s * new Vector3(Mathf.Sin(th[i]) * Mathf.Cos(ph[i]), Mathf.Cos(th[i]), Mathf.Sin(th[i]) * Mathf.Sin(ph[i]));
                mats[i] = Matrix4x4.TRS(bh.TransformPoint(p), Quaternion.identity, Vector3.one * markerSizeGM * s);
            }
            Graphics.DrawMeshInstanced(mesh, 0, mat, mats, count);
        }
    }
}
