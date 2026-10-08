using System.Collections;
using System.Collections.Generic;
using UnityEngine;
namespace GargantuaEdu
{
    /// 18-lesson guided sequence (~10 min). Non-linear: teacher can jump, pause, replay.
    public class LessonSequencer : MonoBehaviour
    {
        public LabelManager Labels; public NarrationPlayer Narration; public SubtitleDisplay Subtitles;
        public QuizController Quiz; public bool Advanced; public bool AutoAdvance = true;
        public int Index { get; private set; } = -1; public bool Paused { get; private set; }
        List<LessonEntry> lessons; Coroutine run;
        public event System.Action<LessonEntry> OnLessonStarted;

        void Start() => lessons = LocalizationService.Instance.Lessons();
        public int Count => lessons.Count;
        public void StartSequence() => JumpTo(0);
        public void Next() => JumpTo(Index + 1);
        public void Back() => JumpTo(Index - 1);
        public void Replay() => JumpTo(Index);
        public void JumpTo(int i)
        {
            i = Mathf.Clamp(i, 0, lessons.Count - 1);
            if (run != null) StopCoroutine(run);
            Index = i; Paused = false; run = StartCoroutine(Play(lessons[i]));
        }
        public void Pause() { Paused = true; Narration.Pause(); }
        public void Resume() { Paused = false; Narration.Resume(); }
        public void ResetAll() { if (run != null) StopCoroutine(run); Index = -1; Paused = false; Labels.HideAll(); Subtitles.Hide(); Narration.Stop(); }

        IEnumerator Play(LessonEntry l)
        {
            Labels.ShowOnly(l.labels ?? new string[0]);
            Subtitles.Show(Advanced ? l.simple + "\n\n" + l.advanced : l.simple);
            Narration.Play(l.audioKey);
            OnLessonStarted?.Invoke(l);
            if (l.id == "L18_QUIZ") Quiz.Begin();
            float t = 0;
            while (t < l.durationSec) { if (!Paused) t += Time.deltaTime; yield return null; }
            if (AutoAdvance && Index < lessons.Count - 1) Next();
        }
    }
}
