using System.Collections.Generic;
using UnityEngine;

namespace Gargantua.BlackHole
{
    /// <summary>
    /// Builds the low-cost, alpha-masked accretion volume as independently sorted disk slices.
    /// The post-process lens pass folds the completed image, including the far-side slices.
    /// </summary>
    [DefaultExecutionOrder(90)]
    public sealed class SlicedAccretionDiskRenderer : MonoBehaviour
    {
        [Header("Inputs")]
        public BlackHolePhysicsConfig config;
        public Material diskMaterialAsset;

        [Header("Geometry")]
        [Range(4, 12)] public int sliceCount = 8;
        [Range(48, 192)] public int radialSegments = 96;
        [Tooltip("World-unit half-height of the mesh stack; normally follows diskThicknessGM.")]
        public float thicknessMultiplier = 1f;

        [Header("Art direction")]
        [Range(0.05f, 0.8f)] public float opacityPerSlice = 0.24f;
        public float keplerianSpeed = 8f;
        public float hdrInnerEmission = 14f;
        public float hdrOuterEmission = 2.5f;

        readonly List<Material> sliceMaterials = new List<Material>();
        readonly List<GameObject> slices = new List<GameObject>();
        Mesh diskMesh;

        static readonly int InnerRadius = Shader.PropertyToID("_InnerRadius");
        static readonly int OuterRadius = Shader.PropertyToID("_OuterRadius");
        static readonly int SliceHeight = Shader.PropertyToID("_SliceHeight");
        static readonly int SlicePhase = Shader.PropertyToID("_SlicePhase");
        static readonly int SliceOpacity = Shader.PropertyToID("_SliceOpacity");
        static readonly int RotationSpeed = Shader.PropertyToID("_RotationSpeed");
        static readonly int Emission = Shader.PropertyToID("_Emission");
        static readonly int OuterEmission = Shader.PropertyToID("_OuterEmission");

        void Awake() => Rebuild();

        void OnValidate()
        {
            sliceCount = Mathf.Clamp(sliceCount, 4, 12);
            radialSegments = Mathf.Clamp(radialSegments, 48, 192);
        }

        public void Rebuild()
        {
            ClearSlices();
            if (config == null || diskMaterialAsset == null) return;

            diskMesh = CreateAnnulus(radialSegments, config.OuterRadiusResolvedGM * config.unityUnitsPerGM * 1.08f);
            float height = Mathf.Max(0.01f, config.diskThicknessGM * config.unityUnitsPerGM * thicknessMultiplier);

            for (int index = 0; index < sliceCount; index++)
            {
                float t = sliceCount == 1 ? 0.5f : (float)index / (sliceCount - 1);
                var slice = new GameObject($"AccretionDiskSlice_{index:00}");
                slice.transform.SetParent(transform, false);
                slice.transform.localPosition = Vector3.up * Mathf.Lerp(-height, height, t);

                var filter = slice.AddComponent<MeshFilter>();
                filter.sharedMesh = diskMesh;
                var renderer = slice.AddComponent<MeshRenderer>();
                renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                renderer.receiveShadows = false;

                var material = new Material(diskMaterialAsset) { enableInstancing = true };
                material.SetFloat(SliceHeight, 0f); // Child transform supplies stack placement.
                material.SetFloat(SlicePhase, index * 0.173f + 0.071f);
                material.SetFloat(SliceOpacity, opacityPerSlice * Mathf.Lerp(0.72f, 1f, 1f - Mathf.Abs(t * 2f - 1f)));
                renderer.sharedMaterial = material;
                slices.Add(slice);
                sliceMaterials.Add(material);
            }

            ApplyParameters();
        }

        void LateUpdate() => ApplyParameters();

        void ApplyParameters()
        {
            if (config == null) return;
            float inner = config.InnerRadiusResolvedGM * config.unityUnitsPerGM;
            float outer = config.OuterRadiusResolvedGM * config.unityUnitsPerGM;
            float height = Mathf.Max(0.01f, config.diskThicknessGM * config.unityUnitsPerGM * thicknessMultiplier);

            // Disk-space local +Y is the spin axis. This carries the configured tilt.
            transform.localRotation = Quaternion.AngleAxis(config.diskTiltDeg, Vector3.forward);
            for (int index = 0; index < sliceMaterials.Count; index++)
            {
                float t = sliceCount == 1 ? 0.5f : (float)index / (sliceCount - 1);
                slices[index].transform.localPosition = Vector3.up * Mathf.Lerp(-height, height, t);
                Material material = sliceMaterials[index];
                material.SetFloat(InnerRadius, inner);
                material.SetFloat(OuterRadius, outer);
                material.SetFloat(SliceOpacity, opacityPerSlice * config.diskOpacity * Mathf.Lerp(0.72f, 1f, 1f - Mathf.Abs(t * 2f - 1f)));
                material.SetFloat(RotationSpeed, keplerianSpeed * config.simulationRate * (config.diskPrograde ? 1f : -1f));
                material.SetFloat(Emission, hdrInnerEmission * Mathf.Max(0.1f, config.diskBrightness));
                material.SetFloat(OuterEmission, hdrOuterEmission * Mathf.Max(0.1f, config.diskBrightness));
            }
        }

        void OnDestroy() => ClearSlices();

        void ClearSlices()
        {
            foreach (Material material in sliceMaterials)
                if (material != null) Destroy(material);
            sliceMaterials.Clear();
            foreach (GameObject slice in slices)
                if (slice != null) Destroy(slice);
            slices.Clear();
            if (diskMesh != null) Destroy(diskMesh);
            diskMesh = null;
        }

        static Mesh CreateAnnulus(int segments, float radius)
        {
            // Unit-radius disk: shader owns all radial masking, so one mesh services all configurations.
            var vertices = new Vector3[segments + 2];
            var normals = new Vector3[vertices.Length];
            var triangles = new int[segments * 3];
            vertices[0] = Vector3.zero;
            normals[0] = Vector3.up;
            for (int i = 0; i <= segments; i++)
            {
                float angle = i * Mathf.PI * 2f / segments;
                vertices[i + 1] = new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle)) * radius;
                normals[i + 1] = Vector3.up;
            }
            for (int i = 0; i < segments; i++)
            {
                int tri = i * 3;
                triangles[tri] = 0;
                triangles[tri + 1] = i + 1;
                triangles[tri + 2] = i + 2;
            }
            var mesh = new Mesh { name = "Procedural Accretion Disk" };
            mesh.vertices = vertices;
            mesh.normals = normals;
            mesh.triangles = triangles;
            mesh.RecalculateBounds();
            return mesh;
        }
    }
}
