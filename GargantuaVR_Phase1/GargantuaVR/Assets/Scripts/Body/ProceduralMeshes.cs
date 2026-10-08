// Assets/Scripts/Body/ProceduralMeshes.cs — original procedural geometry (no external assets).
using UnityEngine;

namespace Gargantua.Body
{
    public static class ProceduralMeshes
    {
        /// <summary>Torus lying in the local XY plane (axis = +Z). Used for the helmet/visor rim and neck ring.</summary>
        public static Mesh Torus(float majorR, float minorR, int seg = 32, int tube = 8)
        {
            var v = new Vector3[(seg + 1) * (tube + 1)]; var n = new Vector3[v.Length]; var t = new int[seg * tube * 6];
            for (int i = 0; i <= seg; i++)
            {
                float a = 2f * Mathf.PI * i / seg; Vector3 rad = new Vector3(Mathf.Cos(a), Mathf.Sin(a), 0f);
                for (int j = 0; j <= tube; j++)
                {
                    float b = 2f * Mathf.PI * j / tube; Vector3 nn = Mathf.Cos(b) * rad + Mathf.Sin(b) * Vector3.forward;
                    int k = i * (tube + 1) + j; v[k] = rad * majorR + nn * minorR; n[k] = nn;
                }
            }
            int q = 0;
            for (int i = 0; i < seg; i++)
                for (int j = 0; j < tube; j++)
                {
                    int a0 = i * (tube + 1) + j, a1 = (i + 1) * (tube + 1) + j, b0 = a0 + 1, b1 = a1 + 1;
                    t[q++] = a0; t[q++] = a1; t[q++] = b0; t[q++] = a1; t[q++] = b1; t[q++] = b0;
                }
            var m = new Mesh { name = "Torus" }; m.vertices = v; m.normals = n; m.triangles = t; m.RecalculateBounds(); return m;
        }
    }
}
