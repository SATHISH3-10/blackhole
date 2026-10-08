// Assets/Scripts/Audio/AudioNarrationController.cs
// PURPOSE: Voice narration playback manager, ambient cosmic drone control, and volume mixer.
using UnityEngine;

namespace Gargantua.Audio
{
    public class AudioNarrationController : MonoBehaviour
    {
        public AudioSource ambientAudioSource;
        public AudioSource voiceNarrationSource;
        public AudioClip[] lessonVoiceClips;

        [Range(0f, 1f)] public float masterVolume = 0.8f;
        [Range(0f, 1f)] public float ambientVolume = 0.5f;
        [Range(0f, 1f)] public float narrationVolume = 1.0f;
        public bool subtitlesEnabled = true;

        void Start()
        {
            ApplyVolumes();
            if (ambientAudioSource != null && !ambientAudioSource.isPlaying)
            {
                ambientAudioSource.loop = true;
                ambientAudioSource.Play();
            }
        }

        public void PlayLessonVoice(int lessonIndex)
        {
            if (voiceNarrationSource == null || lessonVoiceClips == null) return;
            if (lessonIndex >= 0 && lessonIndex < lessonVoiceClips.Length && lessonVoiceClips[lessonIndex] != null)
            {
                voiceNarrationSource.Stop();
                voiceNarrationSource.clip = lessonVoiceClips[lessonIndex];
                voiceNarrationSource.Play();
            }
        }

        public void StopNarration()
        {
            if (voiceNarrationSource != null) voiceNarrationSource.Stop();
        }

        public void SetMasterVolume(float vol)
        {
            masterVolume = Mathf.Clamp01(vol);
            ApplyVolumes();
        }

        void ApplyVolumes()
        {
            if (ambientAudioSource != null) ambientAudioSource.volume = ambientVolume * masterVolume;
            if (voiceNarrationSource != null) voiceNarrationSource.volume = narrationVolume * masterVolume;
        }
    }
}
