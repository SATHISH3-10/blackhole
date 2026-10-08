// Assets/Scripts/Comfort/RecenterManager.cs
// PURPOSE: Seated (eye-level origin) / standing (floor-level origin) switching and recenter/reset.
using System.Collections;
using UnityEngine;
using Gargantua.BlackHole;

namespace Gargantua.Comfort
{
    public class RecenterManager : MonoBehaviour
    {
        public ComfortSettings comfort;
        public ObserverController observer;

        public void ApplyTrackingMode()
        {
            if (OVRManager.instance == null) return;
            OVRManager.instance.trackingOriginType = comfort.mode == PlayMode.Standing
                ? OVRManager.TrackingOrigin.FloorLevel : OVRManager.TrackingOrigin.EyeLevel;
            StartCoroutine(After());
        }

        public void ToggleMode() { comfort.mode = comfort.mode == PlayMode.Seated ? PlayMode.Standing : PlayMode.Seated; ApplyTrackingMode(); }

        /// <summary>Recenter pose + put the hole straight ahead + smoothly return to safe distance.</summary>
        public void RecenterAndReset()
        {
            if (OVRManager.display != null) OVRManager.display.RecenterPose();
            StartCoroutine(After());
            observer.ReturnToSafeDistance();
        }

        IEnumerator After() { yield return null; yield return null; observer.Recenter(); }
    }
}
