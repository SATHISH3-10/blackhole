// Assets/Scripts/UI/ParameterPanelController.cs
// PURPOSE: Floating in-VR holographic control panel with physics sliders, toggles, and 6 educational presets.
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Gargantua.BlackHole;
using Gargantua.Comfort;
using Gargantua.Body;

namespace Gargantua.UI
{
    public class ParameterPanelController : MonoBehaviour
    {
        public BlackHolePhysicsConfig config;
        public ComfortSettings comfort;
        public SpaceSuitBodyController bodyController;
        public Canvas panelCanvas;

        [Header("Sliders")]
        public Slider distanceSlider;
        public Slider spinSlider;
        public Slider inclinationSlider;
        public Slider brightnessSlider;
        public Slider lensingSlider;
        public Slider starDensitySlider;

        [Header("Readout Labels")]
        public TextMeshProUGUI timeDilationText;
        public TextMeshProUGUI distanceText;
        public TextMeshProUGUI spinText;

        [Header("Toggles")]
        public Toggle seatedStandingToggle;
        public Toggle bodyVisibilityToggle;
        public Toggle audioNarrationToggle;
        public Toggle subtitlesToggle;

        public bool IsOpen => panelCanvas != null && panelCanvas.gameObject.activeSelf;

        void Start()
        {
            InitializeControls();
        }

        void InitializeControls()
        {
            if (config != null)
            {
                if (distanceSlider) { distanceSlider.value = config.observerDistanceGM; distanceSlider.onValueChanged.AddListener(v => config.observerDistanceGM = v); }
                if (spinSlider) { spinSlider.value = config.spin; spinSlider.onValueChanged.AddListener(v => config.spin = v); }
                if (inclinationSlider) { inclinationSlider.value = config.observerInclinationDeg; inclinationSlider.onValueChanged.AddListener(v => config.observerInclinationDeg = v); }
                if (brightnessSlider) { brightnessSlider.value = config.diskBrightness; brightnessSlider.onValueChanged.AddListener(v => config.diskBrightness = v); }
                if (lensingSlider) { lensingSlider.value = config.lensingStrength; lensingSlider.onValueChanged.AddListener(v => config.lensingStrength = v); }
                if (starDensitySlider) { starDensitySlider.value = config.starDensity; starDensitySlider.onValueChanged.AddListener(v => config.starDensity = v); }
            }

            if (bodyVisibilityToggle && bodyController != null)
            {
                bodyVisibilityToggle.isOn = bodyController.bodyVisible;
                bodyVisibilityToggle.onValueChanged.AddListener(v => bodyController.SetBodyVisible(v));
            }
        }

        void Update()
        {
            if (!IsOpen || config == null) return;

            // Live Time Dilation & Telemetry Updates
            double rate = Gargantua.Physics.KerrMath.StaticObserverClockRate(config.observerDistanceGM, config.observerInclinationDeg * Mathf.Deg2Rad, config.spin);
            if (timeDilationText != null)
            {
                if (rate > 0.0001)
                {
                    double earthYearsPerLocalHour = (3600.0 / rate) / (365.25 * 86400.0);
                    timeDilationText.text = earthYearsPerLocalHour >= 1.0 
                        ? $"1 hr here = {earthYearsPerLocalHour:F1} Earth Yrs"
                        : $"1 hr here = {(3600.0 / rate) / 86400.0:F1} Earth Days";
                }
                else
                {
                    timeDilationText.text = "Infinite Dilation (Ergosphere)";
                }
            }

            if (distanceText != null) distanceText.text = $"{config.observerDistanceGM:F1} rg";
            if (spinText != null) spinText.text = $"{config.spin:F3}";
        }

        public void TogglePanel()
        {
            if (panelCanvas == null) return;
            bool newState = !panelCanvas.gameObject.activeSelf;
            if (newState) OpenPanelInFrontOfUser();
            else panelCanvas.gameObject.SetActive(false);
        }

        public void OpenPanelInFrontOfUser()
        {
            Transform cam = Camera.main ? Camera.main.transform : transform;
            transform.position = cam.position + cam.forward * 1.2f - cam.up * 0.15f;
            transform.rotation = Quaternion.LookRotation(cam.forward, Vector3.up);
            if (panelCanvas != null) panelCanvas.gameObject.SetActive(true);
        }

        public void OpenPanelNearHand(Vector3 handPos)
        {
            transform.position = handPos;
            Transform cam = Camera.main ? Camera.main.transform : transform;
            transform.rotation = Quaternion.LookRotation((transform.position - cam.position).normalized, Vector3.up);
            if (panelCanvas != null) panelCanvas.gameObject.SetActive(true);
        }

        // ---- 6 Presets ------------------------------------------------------
        public void ApplyPresetDistantObservation()
        {
            if (config == null) return;
            config.observerDistanceGM = 45f;
            config.observerInclinationDeg = 84f;
            config.spin = 0.9f;
            config.lensingStrength = 1.0f;
            SyncSliders();
        }

        public void ApplyPresetAccretionDiskCloseup()
        {
            if (config == null) return;
            config.observerDistanceGM = 12f;
            config.observerInclinationDeg = 88f;
            config.diskBrightness = 2.0f;
            SyncSliders();
        }

        public void ApplyPresetLensingDemo()
        {
            if (config == null) return;
            config.observerDistanceGM = 25f;
            config.observerInclinationDeg = 90f; // Perfect edge-on for dual arcs
            config.lensingStrength = 1.0f;
            SyncSliders();
        }

        public void ApplyPresetPhotonOrbits()
        {
            if (config == null) return;
            config.observerDistanceGM = 18f;
            config.showPhotonRegion = true;
            config.showShadowOutline = true;
            SyncSliders();
        }

        public void ApplyPresetEventHorizon()
        {
            if (config == null) return;
            config.observerDistanceGM = 15f;
            config.showEventHorizon = true;
            config.showErgosphere = true;
            SyncSliders();
        }

        public void ApplyPresetScientificVsArtistic()
        {
            if (config == null) return;
            // Toggle between physically calculated Doppler shift vs unshifted
            config.dopplerEnabled = !config.dopplerEnabled;
            config.redshiftEnabled = !config.redshiftEnabled;
            SyncSliders();
        }

        void SyncSliders()
        {
            if (distanceSlider) distanceSlider.value = config.observerDistanceGM;
            if (spinSlider) spinSlider.value = config.spin;
            if (inclinationSlider) inclinationSlider.value = config.observerInclinationDeg;
            if (brightnessSlider) brightnessSlider.value = config.diskBrightness;
            if (lensingSlider) lensingSlider.value = config.lensingStrength;
            if (starDensitySlider) starDensitySlider.value = config.starDensity;
        }
    }
}
