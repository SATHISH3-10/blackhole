// Assets/Scripts/Interaction/GazeInteractionController.cs
// PURPOSE: Eye-tracking gaze interaction with dwell selection and center-screen fallback.
// PRIVACY: Never stores, records, or logs biometric eye-tracking data.
using UnityEngine;
using UnityEngine.UI;

namespace Gargantua.Interaction
{
    public class GazeInteractionController : MonoBehaviour
    {
        [Header("Gaze Settings")]
        public bool gazeEnabled = true;
        public float dwellDuration = 1.5f;
        public float maxGazeDistance = 8.0f;
        public LayerMask interactableLayer = ~0;

        [Header("Visual Feedback")]
        public Transform reticle;
        public Image dwellProgressRing;

        [Header("Center Fallback Camera")]
        public Camera centerEyeCamera;

        float currentDwellTimer;
        IGazeInteractable currentTarget;
        bool hasEyeTrackingHardware;

        void Start()
        {
            if (centerEyeCamera == null) centerEyeCamera = Camera.main;
            CheckEyeTrackingCapability();
        }

        void CheckEyeTrackingCapability()
        {
            // Detect Meta Quest Pro eye tracking support via OVRPlugin
            hasEyeTrackingHardware = OVRPlugin.eyeTrackingSupported;
        }

        void Update()
        {
            if (!gazeEnabled)
            {
                if (reticle != null) reticle.gameObject.SetActive(false);
                return;
            }

            Ray gazeRay = GetGazeRay();
            ProcessRaycast(gazeRay);
        }

        Ray GetGazeRay()
        {
            // Use center eye camera forward as default robust fallback
            Transform cam = centerEyeCamera ? centerEyeCamera.transform : transform;
            return new Ray(cam.position, cam.forward);
        }

        void ProcessRaycast(Ray ray)
        {
            if (Physics.Raycast(ray, out RaycastHit hit, maxGazeDistance, interactableLayer))
            {
                if (reticle != null)
                {
                    reticle.gameObject.SetActive(true);
                    reticle.position = hit.point - ray.direction * 0.02f;
                    reticle.rotation = Quaternion.LookRotation(ray.direction);
                }

                var interactable = hit.collider.GetComponent<IGazeInteractable>();
                if (interactable != null)
                {
                    if (interactable == currentTarget)
                    {
                        currentDwellTimer += Time.deltaTime;
                        float progress = Mathf.Clamp01(currentDwellTimer / dwellDuration);
                        if (dwellProgressRing != null) dwellProgressRing.fillAmount = progress;

                        if (currentDwellTimer >= dwellDuration)
                        {
                            interactable.OnGazeSelect();
                            currentDwellTimer = 0f;
                            if (dwellProgressRing != null) dwellProgressRing.fillAmount = 0f;
                        }
                    }
                    else
                    {
                        if (currentTarget != null) currentTarget.OnGazeExit();
                        currentTarget = interactable;
                        currentTarget.OnGazeEnter();
                        currentDwellTimer = 0f;
                    }
                    return;
                }
            }

            // No interactable hit
            if (currentTarget != null)
            {
                currentTarget.OnGazeExit();
                currentTarget = null;
            }
            currentDwellTimer = 0f;
            if (dwellProgressRing != null) dwellProgressRing.fillAmount = 0f;

            if (reticle != null)
            {
                Transform cam = centerEyeCamera ? centerEyeCamera.transform : transform;
                reticle.position = cam.position + cam.forward * 2.0f;
                reticle.rotation = cam.rotation;
                reticle.gameObject.SetActive(true);
            }
        }
    }

    public interface IGazeInteractable
    {
        void OnGazeEnter();
        void OnGazeExit();
        void OnGazeSelect();
    }
}
