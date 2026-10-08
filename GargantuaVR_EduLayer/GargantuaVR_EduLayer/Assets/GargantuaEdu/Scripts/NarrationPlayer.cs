using UnityEngine;
namespace GargantuaEdu
{
    /// Plays original/licensed narration clips from Resources/GargantuaEdu/Audio/<lang>/<audioKey>.
    /// Missing clip => subtitles only. No third-party film audio or music.
    public class NarrationPlayer : MonoBehaviour
    {
        [SerializeField] AudioSource source;
        public bool NarrationEnabled = true;
        [Range(0, 1)] public float Volume = 0.8f;
        public void Play(string audioKey, string lang = "en")
        {
            source.Stop();
            if (!NarrationEnabled) return;
            var clip = Resources.Load<AudioClip>($"GargantuaEdu/Audio/{lang}/{audioKey}");
            if (clip == null) return;
            source.volume = Volume; source.clip = clip; source.Play();
        }
        public void Pause() => source.Pause();
        public void Resume() => source.UnPause();
        public void Stop() => source.Stop();
        public void SetVolume(float v) { Volume = Mathf.Clamp01(v); source.volume = Volume; }
    }
}
