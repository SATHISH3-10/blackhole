using UnityEngine;
namespace GargantuaEdu
{
    /// Presenter controls. Wire each method to a world-space panel button.
    public class TeacherModeController : MonoBehaviour
    {
        public LessonSequencer Lessons; public LabelManager Labels; public ParameterPanelModel Params;
        public ComparisonModeController Compare; public QuizController Quiz; public ComfortSettings Comfort;
        public bool Active; bool labelsOn = true;
        public void Toggle() { Active = !Active; Lessons.AutoAdvance = !Active; }
        public void Pause() => Lessons.Pause();
        public void Resume() => Lessons.Resume();
        public void Reset() { Lessons.ResetAll(); Comfort.ReturnToSafeDistance(); }
        public void JumpTo(int lesson) => Lessons.JumpTo(lesson);
        public void Replay() => Lessons.Replay();
        public void ToggleLabels() { labelsOn = !labelsOn; if (!labelsOn) Labels.HideAll(); }
        public void ShowDefinition(string labelId) => Labels.Select(labelId);
        public void SetParameter(string id, float v) => Params.Set(id, v);
        public void CompareModel(int mode) => Compare.Show(mode);
        public void RunQuiz() => Quiz.Begin();
    }
}
