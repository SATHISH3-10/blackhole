using System.Collections.Generic;
using UnityEngine;
namespace GargantuaEdu
{
    public class QuizController : MonoBehaviour
    {
        List<QuizEntry> questions; int i; public int Score { get; private set; }
        public event System.Action<QuizEntry> OnQuestion; public event System.Action<bool, string> OnAnswered; public event System.Action<int, int> OnFinished;
        public void Begin() { questions = LocalizationService.Instance.Quiz(); i = 0; Score = 0; OnQuestion?.Invoke(questions[0]); }
        public void Answer(int option)
        {
            var q = questions[i]; bool ok = option == q.correct; if (ok) Score++;
            OnAnswered?.Invoke(ok, q.explanation);   // UI plays non-flashing feedback tone
            i++;
            if (i < questions.Count) OnQuestion?.Invoke(questions[i]); else OnFinished?.Invoke(Score, questions.Count);
        }
    }
}
