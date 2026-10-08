// Assets/Scripts/Interaction/ControllerInputController.cs
// PURPOSE: Handles Meta Quest Touch / Touch Pro controller buttons, triggers, thumbsticks, and input remapping.
using UnityEngine;
using Gargantua.BlackHole;
using Gargantua.Comfort;
using Gargantua.UI;

namespace Gargantua.Interaction
{
    public class ControllerInputController : MonoBehaviour
    {
        public BlackHolePhysicsConfig config;
        public ComfortSettings comfort;
        public ObserverController observer;
        public RecenterManager recenter;
        public ParameterPanelController parameterPanel;

        [Header("Button Mapping Customization")]
        public OVRInput.Button menuTogglePrimary = OVRInput.Button.Three;   // Left X
        public OVRInput.Button menuToggleSecondary = OVRInput.Button.One;   // Right A
        public OVRInput.Button recenterButton = OVRInput.Button.Two;         // Right B
        public OVRInput.Button returnToSafeButton = OVRInput.Button.Four;   // Left Y

        [Header("Locomotion Tuning")]
        public float stickDeadzone = 0.15f;
        public float orbitSpeed = 45f;       // deg/sec
        public float zoomSpeed = 8f;        // GM/sec
        public float snapTurnAngle = 45f;
        bool snapTurnReady = true;

        void Update()
        {
            HandleButtons();
            HandleThumbsticks();
        }

        void HandleButtons()
        {
            // Toggle Menu (X or A)
            if (OVRInput.GetDown(menuTogglePrimary) || OVRInput.GetDown(menuToggleSecondary))
            {
                if (parameterPanel != null)
                {
                    parameterPanel.TogglePanel();
                }
            }

            // Recenter Pose (B)
            if (OVRInput.GetDown(recenterButton))
            {
                if (recenter != null) recenter.Recenter();
            }

            // Return to Safe Distance (Y)
            if (OVRInput.GetDown(returnToSafeButton))
            {
                if (observer != null) observer.ReturnToSafeDistance();
            }

            // Thumbstick Click - Toggle Snap/Smooth Turn
            if (OVRInput.GetDown(OVRInput.Button.PrimaryThumbstick) || OVRInput.GetDown(OVRInput.Button.SecondaryThumbstick))
            {
                if (comfort != null)
                {
                    comfort.turnMode = (comfort.turnMode == TurnMode.Snap) ? TurnMode.Smooth : TurnMode.Snap;
                }
            }
        }

        void HandleThumbsticks()
        {
            if (config == null || observer == null) return;

            // Left Stick: Azimuth & Distance Zoom
            Vector2 leftStick = OVRInput.Get(OVRInput.Axis2D.PrimaryThumbstick);
            if (leftStick.magnitude > stickDeadzone)
            {
                // Vertical stick -> distance zoom
                float deltaDist = -leftStick.y * zoomSpeed * Time.deltaTime;
                config.observerDistanceGM = Mathf.Clamp(config.observerDistanceGM + deltaDist, config.minDistanceGM, 300f);

                // Horizontal stick -> azimuth or snap turn
                if (comfort != null && comfort.turnMode == TurnMode.Snap)
                {
                    if (Mathf.Abs(leftStick.x) > 0.65f && snapTurnReady)
                    {
                        float dir = Mathf.Sign(leftStick.x);
                        config.observerAzimuthDeg = Mathf.Repeat(config.observerAzimuthDeg + dir * snapTurnAngle, 360f);
                        snapTurnReady = false;
                    }
                    else if (Mathf.Abs(leftStick.x) < 0.25f)
                    {
                        snapTurnReady = true;
                    }
                }
                else
                {
                    config.observerAzimuthDeg = Mathf.Repeat(config.observerAzimuthDeg + leftStick.x * orbitSpeed * Time.deltaTime, 360f);
                }
            }

            // Right Stick: Polar Inclination
            Vector2 rightStick = OVRInput.Get(OVRInput.Axis2D.SecondaryThumbstick);
            if (rightStick.magnitude > stickDeadzone)
            {
                float deltaIncl = -rightStick.y * orbitSpeed * Time.deltaTime;
                config.observerInclinationDeg = Mathf.Clamp(config.observerInclinationDeg + deltaIncl, 2f, 178f);
            }
        }
    }
}
