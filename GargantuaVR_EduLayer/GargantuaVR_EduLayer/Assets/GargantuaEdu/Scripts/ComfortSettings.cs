using System.Collections;
using UnityEngine;
namespace GargantuaEdu
{
    /// Comfort policy. Hook Vignette/Fade/Locomotion to the existing Meta XR rig rather than adding a new one.
    public class ComfortSettings : MonoBehaviour
    {
        public bool ComfortMode = true, SmoothTurning = false;
        public float SnapAngle = 30f;
        public Transform Rig; public Transform SafeAnchor; public CanvasGroup FadeOverlay; public CanvasGroup Vignette;
        public IBlackHoleRendererAdapter Renderer;
        public void ApplyComfort()
        {
            if (Vignette) Vignette.alpha = ComfortMode ? 0.5f : 0f;
            // Comfort mode forces snap turning; smooth turning is opt-in only. No forced rotation or movement anywhere.
            if (ComfortMode) SmoothTurning = false;
        }
        public void ReturnToSafeDistance() => StartCoroutine(FadeMove(() => { Rig.position = SafeAnchor.position; Rig.rotation = SafeAnchor.rotation; Renderer?.FocusCamera(50f, 75f); }));
        IEnumerator FadeMove(System.Action move)
        {
            yield return Fade(0, 1, 0.35f); move(); yield return Fade(1, 0, 0.35f);   // gentle fade, no flashing
        }
        IEnumerator Fade(float a, float b, float d) { for (float t = 0; t < d; t += Time.deltaTime) { FadeOverlay.alpha = Mathf.Lerp(a, b, t / d); yield return null; } FadeOverlay.alpha = b; }
        public void Recenter() { OVRManager.display?.RecenterPose(); } // Meta XR Core SDK
    }
}
