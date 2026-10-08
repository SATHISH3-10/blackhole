using UnityEngine;
namespace GargantuaEdu
{
    public enum PlayMode { Seated, Standing }
    /// Local-only preferences (PlayerPrefs). No eye-tracking data is collected or stored: gaze is used
    /// transiently for UI hover only and can be disabled.
    public class AccessibilitySettings : MonoBehaviour
    {
        public bool SubtitlesEnabled = true, HighContrast, GazeEnabled = true, LeftHanded, BodyVisible = true;
        [Range(0, 1)] public float TextScale01 = 0.4f, NarrationVolume = 0.8f, SfxVolume = 0.6f;
        public PlayMode Mode = PlayMode.Seated;
        public System.Action OnChanged;
        const string K = "gedu_";
        public void Save()
        {
            PlayerPrefs.SetInt(K + "sub", SubtitlesEnabled ? 1 : 0); PlayerPrefs.SetInt(K + "hc", HighContrast ? 1 : 0);
            PlayerPrefs.SetInt(K + "gaze", GazeEnabled ? 1 : 0); PlayerPrefs.SetInt(K + "left", LeftHanded ? 1 : 0);
            PlayerPrefs.SetInt(K + "body", BodyVisible ? 1 : 0); PlayerPrefs.SetFloat(K + "text", TextScale01);
            PlayerPrefs.SetFloat(K + "nv", NarrationVolume); PlayerPrefs.SetFloat(K + "sv", SfxVolume); PlayerPrefs.SetInt(K + "mode", (int)Mode);
            PlayerPrefs.Save(); OnChanged?.Invoke();
        }
        public void Load()
        {
            SubtitlesEnabled = PlayerPrefs.GetInt(K + "sub", 1) == 1; HighContrast = PlayerPrefs.GetInt(K + "hc", 0) == 1;
            GazeEnabled = PlayerPrefs.GetInt(K + "gaze", 1) == 1; LeftHanded = PlayerPrefs.GetInt(K + "left", 0) == 1;
            BodyVisible = PlayerPrefs.GetInt(K + "body", 1) == 1; TextScale01 = PlayerPrefs.GetFloat(K + "text", 0.4f);
            NarrationVolume = PlayerPrefs.GetFloat(K + "nv", 0.8f); SfxVolume = PlayerPrefs.GetFloat(K + "sv", 0.6f);
            Mode = (PlayMode)PlayerPrefs.GetInt(K + "mode", 0);
        }
        void Awake() => Load();
    }
}
