// Assets/Scripts/Input/XRInputRouter.cs
// PURPOSE: Touch-controller input (OVRInput). Hand tracking / eye gaze / menu are Phase 2.
// TEMPORARY MAPPING (no menu exists yet - these stand in until the control panel is built):
//   Move stick (left; right if left-handed): Y = observer distance (forward = closer), X = orbit azimuth
//   Turn stick (right; left if left-handed): X = snap/smooth turn, Y = observer inclination
//   Left thumbstick click  : toggle observer movement on/off (locomotion mode)
//   Right thumbstick click : toggle snap / smooth turning
//   A (right)              : toggle suit-body visibility
//   X (left)               : cycle overlays (horizon -> +photon orbits -> +shadow -> +ergosphere -> none)
//   Left grip + X          : toggle seated / standing
//   B or Y                 : recenter + smooth return to safe distance
// Nothing moves the user without stick input. Exit: press the Meta (Oculus) button -> system menu.
using UnityEngine;
using Gargantua.BlackHole;
using Gargantua.Body;
using Gargantua.Comfort;

namespace Gargantua.Input
{
    public class XRInputRouter : MonoBehaviour
    {
        public BlackHolePhysicsConfig config;
        public ComfortSettings comfort;
        public ObserverController observer;
        public RecenterManager recenter;
        public SpaceSuitBodyController body;

        const OVRInput.Controller L = OVRInput.Controller.LTouch, R = OVRInput.Controller.RTouch;
        float snapCooldown; int overlayStage = 1;   // matches config.showEventHorizon default

        void Update()
        {
            var moveC = comfort.leftHanded ? R : L; var turnC = comfort.leftHanded ? L : R;
            Vector2 mv = Dead(OVRInput.Get(OVRInput.Axis2D.PrimaryThumbstick, moveC));
            Vector2 tr = Dead(OVRInput.Get(OVRInput.Axis2D.PrimaryThumbstick, turnC));
            float dt = Time.unscaledDeltaTime;

            if (comfort.movementEnabled)
                observer.Nudge(-mv.y * comfort.maxDistanceSpeedGMPerSec * dt, tr.y * comfort.maxOrbitSpeedDegPerSec * dt, mv.x * comfort.maxOrbitSpeedDegPerSec * dt);

            snapCooldown -= dt;
            if (comfort.snapTurn)
            {
                if (Mathf.Abs(tr.x) > 0.7f && snapCooldown <= 0f) { observer.TurnYaw(Mathf.Sign(tr.x) * comfort.snapAngleDeg); snapCooldown = 0.35f; }
            }
            else if (Mathf.Abs(tr.x) > 0f) observer.TurnYaw(tr.x * comfort.smoothTurnDegPerSec * dt);

            if (OVRInput.GetDown(OVRInput.Button.PrimaryThumbstick, moveC)) comfort.movementEnabled = !comfort.movementEnabled;
            if (OVRInput.GetDown(OVRInput.Button.PrimaryThumbstick, turnC)) comfort.snapTurn = !comfort.snapTurn;
            if (OVRInput.GetDown(OVRInput.Button.One, R)) { comfort.bodyVisible = !comfort.bodyVisible; body.SetVisible(comfort.bodyVisible); }
            if (OVRInput.GetDown(OVRInput.Button.One, L))
            {
                if (OVRInput.Get(OVRInput.Button.PrimaryHandTrigger, L)) recenter.ToggleMode();
                else CycleOverlays();
            }
            if (OVRInput.GetDown(OVRInput.Button.Two, L) || OVRInput.GetDown(OVRInput.Button.Two, R)) recenter.RecenterAndReset();
        }

        Vector2 Dead(Vector2 v)
        {
            float m = v.magnitude; if (m < comfort.stickDeadzone) return Vector2.zero;
            return v / m * ((m - comfort.stickDeadzone) / (1f - comfort.stickDeadzone));
        }

        void CycleOverlays()
        {
            overlayStage = (overlayStage + 1) % 5;   // 0 none, 1 horizon, 2 +photon orbits, 3 +shadow, 4 +ergosphere
            config.showEventHorizon = overlayStage >= 1;
            config.showPhotonRegion = overlayStage >= 2;
            config.showShadowOutline = overlayStage >= 3;
            config.showErgosphere = overlayStage >= 4;
        }
    }
}
