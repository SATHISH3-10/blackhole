// Assets/Scripts/Body/SpaceSuitBodyController.cs
// PURPOSE: Original low-poly space-suit body built from primitives at runtime (no external assets, no movie designs).
//  Parts: helmet/visor rim + neck ring, torso, pelvis, 2x (upper arm, forearm) with analytic 2-bone IK, gloves,
//  2x (thigh, shin), boots. Head-relative torso with yaw lag; hands follow the controller anchors.
// OPTIMISATION: ~20 low-poly draw calls, no colliders, no shadows, shared materials.
// LIMITS (Phase 1): hands follow OVRCameraRig hand anchors (controllers). Interaction-SDK hand-tracking skeleton
//  (finger poses) is NOT yet wired - gloves are rigid blobs. Legs are posed from the play mode, not tracked.
using UnityEngine;
using Gargantua.Comfort;

namespace Gargantua.Body
{
    public class SpaceSuitBodyController : MonoBehaviour
    {
        public ComfortSettings comfort;
        public Material suitMaterial;     // URP Simple Lit / Lit (assign; falls back to Shader.Find)
        public Material accentMaterial;
        [Range(1.4f, 2.0f)] public float playerHeight = 1.75f;
        public float rimRadius = 0.075f, rimDistance = 0.09f;

        Transform head, lHand, rHand, root;
        Transform torso, pelvis, neck, rim, glL, glR, bootL, bootR;
        Transform[] limb = new Transform[8]; // 0 uaL 1 faL 2 uaR 3 faR 4 thL 5 shL 6 thR 7 shR
        float bodyYaw; bool built;

        public void SetVisible(bool v) { if (root) root.gameObject.SetActive(v); }

        void Start()
        {
            var rig = FindFirstObjectByType<OVRCameraRig>();
            if (rig == null) { Debug.LogError("SpaceSuitBodyController: OVRCameraRig missing."); enabled = false; return; }
            head = rig.centerEyeAnchor; lHand = rig.leftHandAnchor; rHand = rig.rightHandAnchor;
            Build(); bodyYaw = head.eulerAngles.y; SetVisible(comfort == null || comfort.bodyVisible);
        }

        Transform Prim(PrimitiveType t, string n, Material m)
        {
            var g = GameObject.CreatePrimitive(t); g.name = n; Destroy(g.GetComponent<Collider>());
            var r = g.GetComponent<MeshRenderer>(); r.sharedMaterial = m;
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off; r.receiveShadows = false;
            g.transform.SetParent(root, false); return g.transform;
        }

        void Build()
        {
            root = new GameObject("SpaceSuitBody").transform; root.SetParent(transform, false);
            Material suit = suitMaterial != null ? suitMaterial : MakeMat(new Color(0.78f, 0.8f, 0.84f));
            Material acc = accentMaterial != null ? accentMaterial : MakeMat(new Color(0.12f, 0.13f, 0.16f));
            torso = Prim(PrimitiveType.Cylinder, "Torso", suit); pelvis = Prim(PrimitiveType.Cylinder, "Pelvis", suit);
            neck = Prim(PrimitiveType.Cylinder, "NeckRing", acc);
            var rimGo = new GameObject("HelmetRim"); rimGo.transform.SetParent(root, false); rim = rimGo.transform;
            rimGo.AddComponent<MeshFilter>().sharedMesh = ProceduralMeshes.Torus(rimRadius, 0.014f, 40, 8);
            var rr = rimGo.AddComponent<MeshRenderer>(); var rimMat = new Material(acc); rimMat.SetFloat("_Cull", 0f); rr.sharedMaterial = rimMat;
            rr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            for (int i = 0; i < 8; i++) limb[i] = Prim(PrimitiveType.Cylinder, "Limb" + i, i < 4 ? suit : suit);
            glL = Prim(PrimitiveType.Sphere, "GloveL", acc); glR = Prim(PrimitiveType.Sphere, "GloveR", acc);
            bootL = Prim(PrimitiveType.Cube, "BootL", acc); bootR = Prim(PrimitiveType.Cube, "BootR", acc);
            built = true;
        }

        static Material MakeMat(Color c)
        {
            var m = new Material(Shader.Find("Universal Render Pipeline/Simple Lit")); m.SetColor("_BaseColor", c); return m;
        }

        static void Place(Transform t, Vector3 a, Vector3 b, float radius)
        {
            Vector3 d = b - a; float len = Mathf.Max(d.magnitude, 1e-3f);
            t.position = (a + b) * 0.5f; t.rotation = Quaternion.FromToRotation(Vector3.up, d / len);
            t.localScale = new Vector3(radius * 2f, len * 0.5f, radius * 2f);   // Unity cylinder: height 2, diameter 1
        }

        static Vector3 Elbow(Vector3 sh, Vector3 hand, float l1, float l2, Vector3 pole)
        {
            Vector3 d = hand - sh; float dist = Mathf.Clamp(d.magnitude, 0.02f, (l1 + l2) * 0.999f); Vector3 dir = d.normalized;
            float a = (l1 * l1 - l2 * l2 + dist * dist) / (2f * dist), h = Mathf.Sqrt(Mathf.Max(l1 * l1 - a * a, 0f));
            Vector3 pd = Vector3.ProjectOnPlane(pole, dir); pd = pd.sqrMagnitude > 1e-6f ? pd.normalized : Vector3.down;
            return sh + dir * a + pd * h;
        }

        void LateUpdate()
        {
            if (!built || !root.gameObject.activeSelf) return;
            float sc = playerHeight / 1.75f;
            Vector3 hp = head.position; Quaternion hr = head.rotation;

            // yaw lag: torso follows head only after >25 deg twist
            float hy = hr.eulerAngles.y, dlt = Mathf.DeltaAngle(bodyYaw, hy);
            if (Mathf.Abs(dlt) > 25f) bodyYaw = Mathf.MoveTowardsAngle(bodyYaw, hy, 120f * Time.deltaTime);
            Quaternion yaw = Quaternion.Euler(0f, bodyYaw, 0f);

            Vector3 neckP = hp + yaw * new Vector3(0f, -0.14f * sc, -0.07f * sc);
            Vector3 torsoC = neckP + Vector3.down * 0.22f * sc;
            Vector3 pelvisC = neckP + Vector3.down * 0.52f * sc;
            torso.SetPositionAndRotation(torsoC, yaw); torso.localScale = new Vector3(0.36f * sc, 0.24f * sc, 0.22f * sc);
            pelvis.SetPositionAndRotation(pelvisC, yaw); pelvis.localScale = new Vector3(0.32f * sc, 0.09f * sc, 0.2f * sc);
            neck.SetPositionAndRotation(neckP + Vector3.up * 0.02f, yaw); neck.localScale = new Vector3(0.17f * sc, 0.03f * sc, 0.17f * sc);
            rim.SetPositionAndRotation(hp + hr * new Vector3(0f, 0f, rimDistance), hr);

            // arms (2-bone IK to controller/hand anchors)
            for (int side = 0; side < 2; side++)
            {
                float sx = side == 0 ? -1f : 1f; Transform hand = side == 0 ? lHand : rHand;
                Vector3 sh = neckP + yaw * new Vector3(0.19f * sx * sc, -0.06f * sc, 0f);
                Vector3 hpos = hand.position;
                Vector3 el = Elbow(sh, hpos, 0.30f * sc, 0.28f * sc, yaw * new Vector3(0.6f * sx, -1f, -0.4f));
                Place(limb[side * 2], sh, el, 0.045f * sc); Place(limb[side * 2 + 1], el, hpos, 0.04f * sc);
                Transform gl = side == 0 ? glL : glR; gl.SetPositionAndRotation(hpos, hand.rotation); gl.localScale = new Vector3(0.095f, 0.06f, 0.12f);
            }

            // legs posed from play mode
            bool seated = comfort == null || comfort.mode == PlayMode.Seated;
            for (int side = 0; side < 2; side++)
            {
                float sx = side == 0 ? -1f : 1f;
                Vector3 hip = pelvisC + yaw * new Vector3(0.09f * sx * sc, -0.04f * sc, 0f), knee, ankle;
                if (seated) { knee = hip + yaw * new Vector3(0.02f * sx, -0.05f, 0.42f * sc); ankle = knee + yaw * new Vector3(0f, -0.4f * sc, 0.06f * sc); }
                else { knee = hip + yaw * new Vector3(0.01f * sx, -0.43f * sc, 0.03f * sc); ankle = knee + yaw * new Vector3(0f, -0.42f * sc, -0.01f * sc); }
                Place(limb[4 + side * 2], hip, knee, 0.065f * sc); Place(limb[5 + side * 2], knee, ankle, 0.055f * sc);
                Transform b = side == 0 ? bootL : bootR;
                b.SetPositionAndRotation(ankle + yaw * new Vector3(0f, -0.04f * sc, 0.05f * sc), yaw); b.localScale = new Vector3(0.11f * sc, 0.09f * sc, 0.27f * sc);
            }
        }
    }
}
