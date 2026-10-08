// Assets/Scripts/BlackHole/ObserverController.cs
// PURPOSE: Places the black hole relative to the user (distance / inclination / azimuth) while the user's
// rig stays upright (stable horizon). The BH is a fixed world anchor; snap/smooth turning rotates the rig
// around the head, so turning never moves the hole. The observer is modelled as a STATIC (hovering) observer.
// NOTE: Rotating the hole around the user produces visual flow; speeds are slow and optional (ComfortSettings).
using System.Collections;
using UnityEngine;
using Gargantua.Physics;
using Gargantua.Comfort;

namespace Gargantua.BlackHole
{
    public class ObserverController : MonoBehaviour
    {
        public BlackHolePhysicsConfig config;
        public ComfortSettings comfort;
        public Transform blackHole;

        public OVRCameraRig Rig { get; private set; }
        public Transform CenterEye { get; private set; }
        public Camera EyeCamera { get; private set; }

        Vector3 pivot, forwardFlat = Vector3.forward;
        float targetDistance; Coroutine safeRoutine;

        /// <summary>Gravitational clock rate d(tau)/dt of a hovering observer at the current distance and inclination (PHYSICALLY CALCULATED, 0 inside ergosphere).</summary>
        public double ObserverClockRate => KerrMath.StaticObserverClockRate(config.observerDistanceGM, config.observerInclinationDeg * Mathf.Deg2Rad, config.spin);

        void Awake()
        {
            Rig = FindFirstObjectByType<OVRCameraRig>();
            if (Rig == null) { Debug.LogError("ObserverController: no OVRCameraRig in scene (Meta XR Core SDK)."); enabled = false; return; }
            CenterEye = Rig.centerEyeAnchor;
            EyeCamera = CenterEye.GetComponent<Camera>();
        }

        void Start() { targetDistance = config.observerDistanceGM; Recenter(); }

        /// <summary>Re-anchors the hole straight ahead of the current head pose, level with the eyes.</summary>
        public void Recenter()
        {
            pivot = CenterEye.position;
            Vector3 f = Vector3.ProjectOnPlane(CenterEye.forward, Vector3.up);
            forwardFlat = f.sqrMagnitude > 1e-4f ? f.normalized : Vector3.forward;
            Apply();
        }

        public void Nudge(float distanceDelta, float inclinationDeltaDeg, float azimuthDeltaDeg)
        {
            targetDistance = Mathf.Clamp(targetDistance + distanceDelta, config.minDistanceGM, 500f);
            config.observerDistanceGM = targetDistance;
            config.observerInclinationDeg = Mathf.Clamp(config.observerInclinationDeg + inclinationDeltaDeg, 0f, 180f);
            config.observerAzimuthDeg = Mathf.Repeat(config.observerAzimuthDeg + azimuthDeltaDeg, 360f);
        }

        /// <summary>Smoothly (no teleport) returns to config.safeDistanceGM over ~2.5 s.</summary>
        public void ReturnToSafeDistance()
        {
            if (safeRoutine != null) StopCoroutine(safeRoutine);
            safeRoutine = StartCoroutine(SafeRoutine());
        }

        IEnumerator SafeRoutine()
        {
            float v = 0f;
            while (Mathf.Abs(config.observerDistanceGM - config.safeDistanceGM) > 0.05f)
            {
                targetDistance = Mathf.SmoothDamp(config.observerDistanceGM, config.safeDistanceGM, ref v, 1.0f, 8f);
                config.observerDistanceGM = targetDistance;
                yield return null;
            }
            config.observerDistanceGM = targetDistance = config.safeDistanceGM;
        }

        /// <summary>Rotate the rig about the user's head (yaw only).</summary>
        public void TurnYaw(float degrees) => Rig.transform.RotateAround(CenterEye.position, Vector3.up, degrees);

        void Update() { Apply(); }

        void Apply()
        {
            if (blackHole == null || config == null) return;
            targetDistance = config.observerDistanceGM;
            blackHole.position = pivot + forwardFlat * (config.observerDistanceGM * config.unityUnitsPerGM);
            // R maps the BH frame so that (spin axis . line-of-sight) = cos(i), spin axis projects "up" on screen.
            Quaternion view = Quaternion.LookRotation(forwardFlat, Vector3.up);
            blackHole.rotation = view * Quaternion.AngleAxis(config.observerInclinationDeg - 90f, Vector3.right)
                                      * Quaternion.AngleAxis(config.observerAzimuthDeg, Vector3.up);
        }
    }
}
